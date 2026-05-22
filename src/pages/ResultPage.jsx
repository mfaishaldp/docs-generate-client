import { useState } from "react";

export default function ResultPage({ data, onBack }) {
  const { file, config, result } = data;
  const rows = result?.data || [];
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const header = keys.join(",");
    const csvRows = rows.map((r) =>
      keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parsed_${file.name.replace(/\.[^.]+$/, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileTypeLabel = () => {
    if (file.type === "application/pdf") return "PDF";
    return "XLSX";
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      {/* Top bar */}
      <header className="border-b border-[#1f1f1f] px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#555] hover:text-white transition-colors text-xs tracking-widest uppercase group"
          >
            <svg
              className="w-3 h-3 transition-transform group-hover:-translate-x-0.5"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          <div className="w-px h-4 bg-[#2a2a2a]" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#39ff14]" />
            <span className="text-[#39ff14] text-xs tracking-[0.3em] uppercase">
              Parse Complete
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyJSON}
            className="px-4 py-2 rounded border border-[#2a2a2a] hover:border-[#444] text-[#888] hover:text-white text-xs tracking-wider transition-all"
          >
            {copied ? "✓ Copied" : "Copy JSON"}
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 rounded bg-[#39ff14] text-black text-xs font-bold tracking-wider hover:bg-[#4fff2a] transition-colors"
          >
            ↓ Export CSV
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b border-[#1f1f1f] px-6 py-4 flex gap-8 overflow-x-auto">
        {[
          { label: "File", value: file.name, mono: true },
          { label: "Type", value: getFileTypeLabel(), mono: true },
          { label: "Rows Extracted", value: rows.length, accent: true },
          { label: "Columns", value: keys.length },
          { label: "Schema Keys", value: Object.keys(config.header_mapping || {}).length },
        ].map((stat) => (
          <div key={stat.label} className="flex-shrink-0">
            <p className="text-[#444] text-xs tracking-[0.2em] uppercase mb-1">
              {stat.label}
            </p>
            <p
              className={`text-sm font-bold truncate max-w-[200px] ${
                stat.accent ? "text-[#39ff14]" : stat.mono ? "text-[#888]" : "text-white"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search + Table area */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Search */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            <input
              type="text"
              placeholder="Search rows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#111] border border-[#1f1f1f] rounded text-white text-xs placeholder-[#444] focus:outline-none focus:border-[#39ff14]/50 transition-colors"
            />
          </div>
          <span className="text-[#444] text-xs">
            {filteredRows.length} / {rows.length} rows
          </span>
        </div>

        {/* Table */}
        {rows.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full border border-[#2a2a2a] flex items-center justify-center mb-4 text-[#333]">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-6c0-1.094.625-2.028 1.5-2.5M3.375 7.5h1.5m0 0C5.496 7.5 6 8.004 6 8.625V10.5M3.375 7.5V5.625m0 0A1.875 1.875 0 015.25 3.75h13.5A1.875 1.875 0 0120.625 5.625v.375" />
              </svg>
            </div>
            <p className="text-[#555] text-sm">No data extracted from document.</p>
            <p className="text-[#333] text-xs mt-2">
              Check your expected_headers config and try again.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto rounded-lg border border-[#1f1f1f]">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#0f0f0f] sticky top-0">
                  <th className="px-4 py-3 text-left text-[#444] font-medium tracking-widest uppercase w-12">
                    #
                  </th>
                  {keys.map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left tracking-[0.15em] uppercase whitespace-nowrap"
                    >
                      <span className="text-[#39ff14] font-bold">{key}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#141414] hover:bg-[#111] transition-colors group"
                  >
                    <td className="px-4 py-3 text-[#333] group-hover:text-[#555] transition-colors">
                      {i + 1}
                    </td>
                    {keys.map((key) => (
                      <td key={key} className="px-4 py-3 text-[#aaa] group-hover:text-white transition-colors whitespace-nowrap">
                        {row[key] !== null && row[key] !== undefined && row[key] !== ""
                          ? String(row[key])
                          : <span className="text-[#333]">—</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}