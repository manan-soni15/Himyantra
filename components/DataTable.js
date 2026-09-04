import EmptyState from './EmptyState';

export default function DataTable({ columns = [], rows = [], emptyTitle = 'No data yet', emptyDescription, onRowClick, selectedRowId }) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-polar-border text-left">
            {columns.map((col) => (
              <th key={col.key} className="py-2.5 pr-4 text-xs font-medium text-[#6b7f8f] whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isSelected = selectedRowId && (row.rawId === selectedRowId || row.id === selectedRowId || row.rawId === String(selectedRowId));
            return (
              <tr
                key={row.id ?? i}
                onClick={() => onRowClick && onRowClick(row)}
                className={`border-b border-polar-border/60 last:border-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-polar-raised/80' : ''} ${isSelected ? 'bg-polar-accent/15 border-l-2 border-l-polar-accent' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-3 pr-4 text-[#c3d3dd] font-mono text-[13px] whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
