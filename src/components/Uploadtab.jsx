import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { url } from "../constants/url";

export default function UploadTab({ file, setFile, config, setResultData, onSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState("");
  const [selectedSheet, setSelectedSheet] = useState("");
  const inputRef = useRef(null);

  const MAX_MB = 15;
  const MAX_BYTES = MAX_MB * 1024 * 1024;

  const ACCEPTED = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const validateAndSet = (f) => {
    if (!ACCEPTED.includes(f.type)) {
      setError("Format tidak didukung. Hanya PDF dan Excel (.xlsx) yang diizinkan.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`Ukuran file terlalu besar. Maksimum ${MAX_MB} MB.`);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) validateAndSet(e.dataTransfer.files[0]);
  };

  const handleParse = async () => {
    if (!file) return;
    if (isExcel && !selectedSheet) {
      setError("Pilih sheet Excel terlebih dahulu sebelum parsing.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("config", JSON.stringify({
        expected_headers: config.expectedHeaders,
        header_mapping: config.mapping,
        sheet_name: isExcel ? selectedSheet : null,
      }));

      const endpoint =
        file.type === "application/pdf"
          ? `${url}/pdf/upload`
          : `${url}/excel/upload`;

      const res = await fetch(endpoint, { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.detail || json.message || "Parsing gagal.");
      }

      setResultData(json);
      onSuccess();
    } catch (e) {
      let msg = e.message || "Terjadi kesalahan.";
      if (msg.includes("fetch") || msg.includes("Failed") || msg.includes("NetworkError")) {
        msg = "Tidak dapat terhubung ke server. Pastikan backend sudah berjalan di http://127.0.0.1:8000";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fileSizeLabel = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const isExcel = file?.type?.includes("spreadsheetml");

  useEffect(() => {
    let alive = true;
    setSheetNames([]);
    setSelectedSheet("");
    setSheetError("");

    if (!file || !isExcel) return () => {};

    setSheetLoading(true);
    file
      .arrayBuffer()
      .then((buf) => {
        if (!alive) return;
        const wb = XLSX.read(buf, { type: "array" });
        setSheetNames(wb.SheetNames || []);
      })
      .catch(() => {
        if (!alive) return;
        setSheetError("Gagal membaca daftar sheet dari file Excel.");
      })
      .finally(() => {
        if (!alive) return;
        setSheetLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [file, isExcel]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Upload Dokumen</h2>
            <p className="text-sm text-gray-500">
              Pilih atau seret file PDF / Excel yang ingin kamu parse.
            </p>
          </div>
          <span className="text-xs text-gray-400">Langkah 1 dari 3</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xlsx"
          className="hidden"
          onChange={(e) => e.target.files[0] && validateAndSet(e.target.files[0])}
        />

        {!file ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,260px]">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current.click()}
              className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-14 px-4 cursor-pointer transition-all ${
                dragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="text-4xl mb-3">☁️</span>
              <p className="text-sm text-gray-600 text-center">
                Seret file ke sini, atau{" "}
                <span className="text-blue-600 font-medium">klik untuk pilih</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">PDF · XLSX</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Tips cepat</p>
              <div className="flex flex-col gap-2 text-xs text-gray-500">
                <div className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Pastikan tabel memiliki header yang jelas.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>File PDF yang rapi mempercepat parsing.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Gunakan Excel (.xlsx) untuk hasil paling stabil.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Maksimum ukuran file {MAX_MB} MB.</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <div
              className={`flex items-center gap-4 p-4 rounded-xl border ${
                isExcel
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <span className="text-3xl">{isExcel ? "📊" : "📄"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {fileSizeLabel(file.size)} · {isExcel ? "Excel (.xlsx)" : "PDF"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError(null);
                  setSheetNames([]);
                  setSelectedSheet("");
                  setSheetError("");
                }}
                className="text-gray-400 hover:text-red-500 transition-colors text-xl leading-none px-2"
              >
                ×
              </button>
            </div>
            {isExcel && (
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-xs text-gray-500">Sheet untuk parsing</label>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  disabled={sheetLoading || sheetNames.length === 0}
                  className={`text-xs border rounded-lg px-2 py-1 ${
                    sheetLoading || sheetNames.length === 0
                      ? "border-gray-100 text-gray-300"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  <option value="">Pilih sheet</option>
                  {sheetNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {sheetLoading && <span className="text-xs text-gray-400">Memuat daftar sheet...</span>}
                {!sheetLoading && !selectedSheet && (
                  <span className="text-xs text-amber-500">Wajib pilih sebelum parsing.</span>
                )}
              </div>
            )}
            {sheetError && (
              <div className="text-xs text-red-500">{sheetError}</div>
            )}
            <div className="text-xs text-gray-400">
              Jika file sudah benar, lanjutkan ke konfigurasi atau langsung parse.
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex gap-2 items-start bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Config summary preview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Ringkasan Konfigurasi</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Pastikan konfigurasi sudah sesuai sebelum parsing.
            </p>
          </div>
          <span className="text-xs text-gray-400">Langkah 2 dari 3</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Header yang dicari
            </p>
            <div className="flex flex-wrap gap-1.5">
              {config.expectedHeaders.length > 0
                ? config.expectedHeaders.map((h) => (
                    <span
                      key={h}
                      className="bg-white border border-gray-200 rounded-full px-3 py-0.5 text-xs text-gray-700"
                    >
                      {h}
                    </span>
                  ))
                : <span className="text-xs text-gray-400 italic">Belum ada header</span>
              }
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Pemetaan kolom
            </p>
            <div className="flex flex-col gap-1">
              {Object.keys(config.mapping).length > 0
                ? Object.entries(config.mapping).map(([key, aliases]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-gray-800 bg-white border border-gray-200 rounded px-2 py-0.5">
                        {key}
                      </span>
                      <span className="text-gray-400">←</span>
                      <span className="text-gray-500 truncate">{aliases.join(", ")}</span>
                    </div>
                  ))
                : <span className="text-xs text-gray-400 italic">Belum ada pemetaan</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Parse button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs text-gray-400">Langkah 3 dari 3</div>
        <button
          onClick={handleParse}
          disabled={!file || loading || (isExcel && !selectedSheet)}
          className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
            !file || loading || (isExcel && !selectedSheet)
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.99] shadow-sm"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sedang memproses...
            </span>
          ) : (
            "Parse Dokumen →"
          )}
        </button>
      </div>
    </div>
  );
}