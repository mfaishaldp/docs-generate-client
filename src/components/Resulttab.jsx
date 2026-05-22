import { useState } from "react";

export default function ResultTab({ resultData, file }) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const rows = resultData?.data || [];
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];

  const filtered = rows.filter((row) =>
    Object.values(row).some((v) =>
      String(v ?? "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleExportCSV = () => {
    const header = keys.join(",");
    const csv = [
      header,
      ...rows.map((r) =>
        keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `hasil_parsing${file ? "_" + file.name.replace(/\.[^.]+$/, "") : ""}.csv`;
    a.click();
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(rows, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!resultData) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
        <span className="text-5xl mb-4">📂</span>
        <h2 className="text-base font-semibold text-gray-700 mb-2">Belum ada data</h2>
        <p className="text-sm text-gray-400">
          Upload dan parse dokumen terlebih dahulu untuk melihat hasilnya di sini.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
        <span className="text-5xl mb-4">🔍</span>
        <h2 className="text-base font-semibold text-gray-700 mb-2">Tidak ada data yang ditemukan</h2>
        <p className="text-sm text-gray-400 max-w-sm">
          Parser tidak menemukan baris data. Coba periksa kembali konfigurasi header
          atau pastikan dokumen mengandung tabel.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Baris", value: rows.length, color: "text-gray-900" },
          { label: "Jumlah Kolom", value: keys.length, color: "text-gray-900" },
          { label: "Format File", value: file?.name.split(".").pop().toUpperCase() || "—", color: "text-blue-700" },
          { label: "Kolom Terdeteksi", value: keys.join(", ") || "—", small: true, color: "text-gray-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`font-semibold ${s.color} ${s.small ? "text-xs leading-relaxed" : "text-xl"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari di semua kolom..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <button
          onClick={handleCopyJSON}
          className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          {copied ? "✓ Tersalin" : "Salin JSON"}
        </button>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide w-12">
                  No
                </th>
                {keys.map((k) => (
                  <th
                    key={k}
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={keys.length + 1} className="text-center py-10 text-gray-400 text-sm">
                    Tidak ada baris yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-300 text-xs text-right">{i + 1}</td>
                    {keys.map((k) => (
                      <td key={k} className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                        {row[k] !== null && row[k] !== undefined && row[k] !== "" ? (
                          String(row[k])
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-right">
          Menampilkan {filtered.length} dari {rows.length} baris
        </div>
      </div>
    </div>
  );
}