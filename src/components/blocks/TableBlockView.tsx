'use client'
import { TableBlock } from '@/lib/blocks/types'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface TableBlockViewProps {
  block: TableBlock
  editMode?: boolean
  reportId?: string
  isSelected?: boolean
  onSelect?: () => void
  onBlockDelete?: (blockId: string) => void
  onBlockReorder?: (draggedBlockId: string, targetBlockId: string, position: 'before' | 'after') => void
}

export function TableBlockView({ block, editMode, reportId, isSelected, onSelect, onBlockDelete, onBlockReorder }: TableBlockViewProps) {
  const { headers, rows } = block.content
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null)
  const [tableData, setTableData] = useState({ headers, rows })
  const supabase = createClientComponentClient()

  const updateTable = async (newHeaders: string[], newRows: any[][]) => {
    if (!reportId) return

    const { error } = await supabase
      .from('blocks')
      .update({
        content: {
          headers: newHeaders,
          rows: newRows
        }
      })
      .eq('id', block.id)

    if (!error) {
      block.content.headers = newHeaders
      block.content.rows = newRows
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
      newRows[row][col] = value
      setTableData({ ...tableData, rows: newRows })
      updateTable(tableData.headers, newRows)
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
    setTableData({ headers: newHeaders, rows: newRows })
    updateTable(newHeaders, newRows)
  }

  if (editMode) {
    return (
      <div
        className={cn(
          "relative group mb-2 px-3 py-2 -mx-2 rounded transition-all",
          isSelected && "bg-blue-50/40",
          !isSelected && "hover:bg-gray-50/50"
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.()
        }}
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

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {tableData.headers.map((header: string, i: number) => (
                  <th key={i} className="border border-gray-200 px-2 py-1 bg-gray-50">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => handleCellEdit(-1, i, e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none"
                      placeholder={`Column ${i + 1}`}
                    />
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
                  {row.map((cell, j) => (
                    <td key={j} className="border border-gray-200 px-2 py-1">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellEdit(i, j, e.target.value)}
                        className="w-full bg-transparent text-sm text-gray-600 outline-none"
                        placeholder="Cell content"
                      />
                    </td>
                  ))}
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
        </div>
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
                {row.map((cell, j) => (
                  <td key={j} className="border border-slate-200 px-4 py-2 text-sm text-slate-600">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 