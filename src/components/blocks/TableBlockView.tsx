'use client'
import { TableBlock } from '@/lib/blocks/types'
import { cn } from '@/lib/utils'
import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Upload } from 'lucide-react'

interface TableBlockViewProps {
  block: TableBlock
  editMode?: boolean
  reportId?: string
  isSelected?: boolean
  onSelect?: () => void
  onBlockDelete?: (blockId: string) => void
  onBlockReorder?: (draggedBlockId: string, targetBlockId: string, position: 'before' | 'after') => void
}

// Helper functions for column type detection and formatting
const detectColumnType = (values: any[]): 'text' | 'number' | 'currency' | 'percentage' => {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonEmptyValues.length === 0) return 'text'
  
  let allNumbers = true
  let hasCurrency = false
  let hasPercentage = false
  
  for (const value of nonEmptyValues) {
    const strValue = String(value).trim()
    
    // Check for percentage
    if (strValue.endsWith('%')) {
      hasPercentage = true
      const numPart = strValue.slice(0, -1)
      if (isNaN(parseFloat(numPart))) {
        allNumbers = false
        break
      }
    }
    // Check for currency
    else if (strValue.match(/^[\$€£¥]\s?[\d,]+\.?\d*$/) || strValue.match(/^[\d,]+\.?\d*\s?[\$€£¥]$/)) {
      hasCurrency = true
    }
    // Check if it's a number
    else if (isNaN(parseFloat(strValue.replace(/,/g, '')))) {
      allNumbers = false
      break
    }
  }
  
  if (!allNumbers) return 'text'
  if (hasPercentage) return 'percentage'
  if (hasCurrency) return 'currency'
  return 'number'
}

const formatCellValue = (value: any, type: 'text' | 'number' | 'currency' | 'percentage'): string => {
  if (value === null || value === undefined || value === '') return ''
  
  const strValue = String(value).trim()
  
  switch (type) {
    case 'number':
      const num = parseFloat(strValue.replace(/,/g, ''))
      return isNaN(num) ? strValue : num.toLocaleString('en-US', { maximumFractionDigits: 2 })
      
    case 'currency':
      // Extract number from currency string
      const cleanedValue = strValue.replace(/[\$€£¥,]/g, '').trim()
      const currencyNum = parseFloat(cleanedValue)
      return isNaN(currencyNum) ? strValue : `$${currencyNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      
    case 'percentage':
      const percentValue = strValue.endsWith('%') ? strValue.slice(0, -1) : strValue
      const percentNum = parseFloat(percentValue)
      return isNaN(percentNum) ? strValue : `${percentNum}%`
      
    default:
      return strValue
  }
}

const parseInputValue = (value: string, type: 'text' | 'number' | 'currency' | 'percentage'): string | number => {
  if (!value) return ''
  
  switch (type) {
    case 'number':
      const num = parseFloat(value.replace(/,/g, ''))
      return isNaN(num) ? value : num
      
    case 'currency':
      const currencyValue = value.replace(/[\$€£¥,]/g, '').trim()
      const currencyNum = parseFloat(currencyValue)
      return isNaN(currencyNum) ? value : currencyNum
      
    case 'percentage':
      const percentValue = value.endsWith('%') ? value.slice(0, -1) : value
      const percentNum = parseFloat(percentValue)
      return isNaN(percentNum) ? value : percentNum
      
    default:
      return value
  }
}

export function TableBlockView({ block, editMode, reportId, isSelected, onSelect, onBlockDelete, onBlockReorder }: TableBlockViewProps) {
  const { headers, rows, formatting } = block.content
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null)
  const [tableData, setTableData] = useState({ headers, rows, formatting })
  const [columnTypes, setColumnTypes] = useState<('text' | 'number' | 'currency' | 'percentage')[]>(
    formatting?.columnTypes || new Array(headers.length).fill('text')
  )
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  // Auto-detect column types when data changes
  useEffect(() => {
    if (!editMode) return
    
    const newColumnTypes = tableData.headers.map((_, colIndex) => {
      const columnValues = tableData.rows.map(row => row[colIndex])
      return detectColumnType(columnValues)
    })
    
    setColumnTypes(newColumnTypes)
  }, [tableData.rows, tableData.headers, editMode])

  const updateTable = async (newHeaders: string[], newRows: any[][], newColumnTypes?: ('text' | 'number' | 'currency' | 'percentage')[]) => {
    if (!reportId) return

    const typesToSave = newColumnTypes || columnTypes
    
    const { error } = await supabase
      .from('blocks')
      .update({
        content: {
          headers: newHeaders,
          rows: newRows,
          formatting: {
            columnTypes: typesToSave
          }
        }
      })
      .eq('id', block.id)

    if (!error) {
      block.content.headers = newHeaders
      block.content.rows = newRows
      block.content.formatting = { columnTypes: typesToSave }
    }
  }

  const handleCellEdit = (row: number, col: number, value: string) => {
    if (row === -1) {
      // Header edit
      const newHeaders = [...tableData.headers]
      newHeaders[col] = value
      setTableData({ ...tableData, headers: newHeaders })
      updateTable(newHeaders, tableData.rows)
    } else {
      // Cell edit
      const newRows = [...tableData.rows]
      const parsedValue = parseInputValue(value, columnTypes[col])
      newRows[row][col] = parsedValue
      setTableData({ ...tableData, rows: newRows })
      updateTable(tableData.headers, newRows)
    }
  }

  const toggleColumnType = (colIndex: number) => {
    const types: ('text' | 'number' | 'currency' | 'percentage')[] = ['text', 'number', 'currency', 'percentage']
    const currentTypeIndex = types.indexOf(columnTypes[colIndex])
    const nextType = types[(currentTypeIndex + 1) % types.length]
    
    const newColumnTypes = [...columnTypes]
    newColumnTypes[colIndex] = nextType
    setColumnTypes(newColumnTypes)
    
    // Update the formatting in the database
    updateTable(tableData.headers, tableData.rows, newColumnTypes)
  }

  const parseCSV = (text: string): { headers: string[], rows: any[][] } => {
    const lines = text.trim().split('\n')
    if (lines.length === 0) return { headers: [], rows: [] }
    
    // Simple CSV parser - handles basic cases
    const parseRow = (row: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      result.push(current.trim())
      return result
    }
    
    // Detect if first row is headers (contains non-numeric values)
    const firstRow = parseRow(lines[0])
    const hasHeaders = firstRow.some(cell => isNaN(parseFloat(cell.replace(/[\$,%]/g, ''))))
    
    let headers: string[]
    let dataRows: string[][]
    
    if (hasHeaders) {
      headers = firstRow
      dataRows = lines.slice(1).map(parseRow)
    } else {
      headers = firstRow.map((_, i) => `Column ${i + 1}`)
      dataRows = lines.map(parseRow)
    }
    
    // Ensure all rows have the same number of columns
    const columnCount = headers.length
    const normalizedRows = dataRows.map(row => {
      const normalized = [...row]
      while (normalized.length < columnCount) {
        normalized.push('')
      }
      return normalized.slice(0, columnCount)
    })
    
    return { headers, rows: normalizedRows }
  }

  const handleFileImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers: newHeaders, rows: newRows } = parseCSV(text)
      
      if (newHeaders.length > 0 && newRows.length > 0) {
        // Detect column types for the imported data
        const newColumnTypes = newHeaders.map((_, colIndex) => {
          const columnValues = newRows.map(row => row[colIndex])
          return detectColumnType(columnValues)
        })
        
        setTableData({ headers: newHeaders, rows: newRows, formatting: { columnTypes: newColumnTypes } })
        setColumnTypes(newColumnTypes)
        updateTable(newHeaders, newRows, newColumnTypes)
      }
    }
    reader.readAsText(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'))
    
    if (csvFile) {
      handleFileImport(csvFile)
    }
  }


  const addRow = () => {
    const newRow = new Array(tableData.headers.length).fill('')
    const newRows = [...tableData.rows, newRow]
    setTableData({ ...tableData, rows: newRows })
    updateTable(tableData.headers, newRows)
  }

  const addColumn = () => {
    const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`]
    const newRows = tableData.rows.map(row => [...row, ''])
    const newColumnTypes = [...columnTypes, 'text']
    setTableData({ headers: newHeaders, rows: newRows, formatting: tableData.formatting })
    setColumnTypes(newColumnTypes)
    updateTable(newHeaders, newRows, newColumnTypes)
  }

  if (editMode) {
    return (
      <div
        className={cn(
          "relative group mb-2 px-3 py-2 -mx-2 rounded transition-all",
          isSelected && "bg-blue-50/40",
          !isSelected && "hover:bg-gray-50/50",
          isDragging && "ring-2 ring-blue-400 bg-blue-50"
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.()
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Handle */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-4 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* CSV Import UI */}
        {tableData.headers.length === 0 || (tableData.headers.length === 1 && tableData.headers[0] === 'Column 1' && tableData.rows.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-2">Drop a CSV file here or click to import</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileImport(file)
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Choose CSV File
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
            <thead>
              <tr>
                {tableData.headers.map((header: string, i: number) => (
                  <th key={i} className="border border-gray-200 px-2 py-1 bg-gray-50 relative group">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => handleCellEdit(-1, i, e.target.value)}
                        className="flex-1 bg-transparent text-sm font-medium text-gray-700 outline-none"
                        placeholder={`Column ${i + 1}`}
                      />
                      <button
                        onClick={() => toggleColumnType(i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1 py-0.5 bg-gray-200 hover:bg-gray-300 rounded"
                        title="Toggle column type"
                      >
                        {columnTypes[i].charAt(0).toUpperCase()}
                      </button>
                    </div>
                  </th>
                ))}
                <th className="border border-gray-200 px-2 py-1">
                  <button
                    onClick={addColumn}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                    title="Add column"
                  >
                    +
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row: any[], i: number) => (
                <tr key={i}>
                  {row.map((cell, j) => {
                    const type = columnTypes[j]
                    const displayValue = editingCell?.row === i && editingCell?.col === j 
                      ? cell 
                      : formatCellValue(cell, type)
                    
                    return (
                      <td key={j} className="border border-gray-200 px-2 py-1">
                        <input
                          type={type === 'number' || type === 'currency' || type === 'percentage' ? 'text' : 'text'}
                          value={displayValue}
                          onChange={(e) => handleCellEdit(i, j, e.target.value)}
                          onFocus={() => setEditingCell({row: i, col: j})}
                          onBlur={() => setEditingCell(null)}
                          className={cn(
                            "w-full bg-transparent text-sm outline-none",
                            type === 'number' || type === 'currency' || type === 'percentage' 
                              ? "text-right text-gray-700 font-mono" 
                              : "text-gray-600"
                          )}
                          placeholder={type === 'currency' ? '$0.00' : type === 'percentage' ? '0%' : 'Cell content'}
                        />
                      </td>
                    )
                  })}
                  <td className="border border-gray-200 px-2 py-1"></td>
                </tr>
              ))}
              <tr>
                <td colSpan={tableData.headers.length + 1} className="border border-gray-200 px-2 py-1">
                  <button
                    onClick={addRow}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    + Add row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          {/* Import CSV button for non-empty tables */}
          <div className="mt-2 flex justify-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileImport(file)
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              Import CSV
            </button>
          </div>
        </div>
        )}
      </div>
    )
  }

  // View mode - static display
  return (
    <div
      className={cn(
        "relative group mb-2 px-3 py-2 -mx-2 rounded transition-all cursor-pointer",
        isSelected && "bg-blue-50/40",
        !isSelected && "hover:bg-gray-50/50"
      )}
      onClick={onSelect}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {headers.map((header: string, i: number) => (
                <th key={i} className="border border-slate-200 px-4 py-2 bg-slate-50 text-left text-sm font-medium text-slate-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any[], i: number) => (
              <tr key={i}>
                {row.map((cell, j) => {
                  const type = formatting?.columnTypes?.[j] || 'text'
                  const formattedValue = formatCellValue(cell, type)
                  
                  return (
                    <td key={j} className={cn(
                      "border border-slate-200 px-4 py-2 text-sm",
                      type === 'number' || type === 'currency' || type === 'percentage' 
                        ? "text-right text-slate-700 font-mono" 
                        : "text-slate-600"
                    )}>
                      {formattedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 