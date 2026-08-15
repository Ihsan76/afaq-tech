"use client";

import { useState, useMemo } from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface CompactTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T;
  searchPlaceholder?: string;
}

export default function CompactTable<T extends { id: number | string }>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search...",
}: CompactTableProps<T>) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!search || !searchKey) return data;
    return data.filter((item) => {
      const val = String(item[searchKey] || "").toLowerCase();
      return val.includes(search.toLowerCase());
    });
  }, [data, search, searchKey]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {searchKey && (
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full sm:w-72 px-4 py-2 rounded-xl border text-sm"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
          />
        )}
        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border text-xs"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border shadow-sm" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wider" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)", background: "var(--color-surface-alt)" }}>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 font-semibold ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y text-sm" style={{ borderColor: "var(--color-border)" }}>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>
                  No results found
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-2.5 truncate max-w-xs ${col.className || ""}`}>
                      {typeof col.accessor === "function"
                        ? col.accessor(item)
                        : String(item[col.accessor] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-xs" style={{ color: "var(--color-text-muted)" }}>
        <span>
          Showing {paginatedData.length ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            Previous
          </button>
          <span className="px-3 py-1.5 font-bold">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
