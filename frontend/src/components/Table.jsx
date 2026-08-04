import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function Table({ columns, data, onRowClick, emptyMessage = "No records found" }) {
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-slate-100/90 border-b border-slate-200 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                onClick={() => handleSort(col.accessor, col.sortable !== false)}
                className={`py-3.5 px-4 select-none ${
                  col.sortable !== false ? 'cursor-pointer hover:bg-slate-200/60 transition-colors' : ''
                } ${col.className || ''}`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{col.header}</span>
                  {col.sortable !== false && (
                    <span className="text-slate-500">
                      {sortColumn === col.accessor ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 hover:text-slate-800" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-900 font-bold">
          {sortedData && sortedData.length > 0 ? (
            sortedData.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={(e) => {
                  if (e.target.closest('button') || e.target.closest('a')) return;
                  if (onRowClick) onRowClick(row);
                }}
                className={`${
                  onRowClick ? 'cursor-pointer hover:bg-blue-50/60 transition-colors' : ''
                } ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`py-3.5 px-4 ${col.className || ''}`}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-500 font-extrabold uppercase tracking-wider">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
