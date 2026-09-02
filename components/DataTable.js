import EmptyState from './EmptyState';

export default function DataTable({ columns = [], rows = [], emptyTitle = 'No data yet', emptyDescription }) {
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
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-polar-border/60 last:border-0">
              {columns.map((col) => (
                <td key={col.key} className="py-3 pr-4 text-[#c3d3dd] font-mono text-[13px] whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
