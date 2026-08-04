import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function Table({ columns, data, onRowClick, emptyMessage = "No garment records found" }) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    if (sortColumn === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'string' && valA.match(/^\d{4}-\d{2}-\d{2}/)) {
        return sortDirection === 'asc'
          ? new Date(valA) - new Date(valB)
          : new Date(valB) - new Date(valA);
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [data, sortColumn, sortDirection]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-amber-500/20 bg-obsidian-900 shadow-2xl">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-obsidian-950 border-b border-amber-500/20 text-[11px] font-black text-amber-300 uppercase tracking-widest">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                onClick={() => handleSort(col.accessor, col.sortable !== false)}
                className={`py-4 px-5 select-none ${
                  col.sortable !== false ? 'cursor-pointer hover:bg-obsidian-900 transition-colors' : ''
                } ${col.className || ''}`}
              >
                <div className="flex items-center gap-2">
                  <span>{col.header}</span>
                  {col.sortable !== false && (
                    <span className="text-amber-400">
                      {sortColumn === col.accessor ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-amber-400/40 hover:text-amber-400" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-500/10 text-amber-100 font-semibold tracking-wide">
          {sortedData && sortedData.length > 0 ? (
            sortedData.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={(e) => {
                  if (e.target.closest('button') || e.target.closest('a')) return;
                  if (onRowClick) onRowClick(row);
                }}
                className={`transition-all duration-200 ${
                  onRowClick ? 'cursor-pointer hover:bg-amber-500/10 hover:border-l-4 hover:border-amber-400' : ''
                } ${rowIdx % 2 === 0 ? 'bg-obsidian-900' : 'bg-obsidian-950/60'}`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`py-4 px-5 ${col.className || ''}`}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center text-amber-400/50 font-bold uppercase tracking-widest">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
