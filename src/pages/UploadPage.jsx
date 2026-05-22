import { useState, useRef, useCallback } from "react";
import ConfigEditor from "../components/ConfigEditor";
import StatusBadge from "../components/StatusBadge";
import { url } from "../constants/url";

const DEFAULT_CONFIG = {
  expected_headers: ["customer", "qty", "price", "date"],
  header_mapping: {
    customer_name: ["customer", "client", "buyer"],
    quantity: ["qty", "quantity", "pcs"],
    total_price: ["price", "amount", "total", "grand total"],
    order_date: ["date", "tanggal", "order date"],
  },
};

export default function UploadPage({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [config, setConfig] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [configError, setConfigError] = useState(null);
  const fileInputRef = useRef(null);

  const acceptedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const validateFile = (f) => {
    if (!acceptedTypes.includes(f.type)) {
      setError("Only PDF and Excel (.xlsx) files are supported.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && validateFile(f)) setFile(f);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e) => {
    const f = e.target.files[0];
    if (f && validateFile(f)) setFile(f);
  };

  const handleConfigChange = (val) => {
    setConfig(val);
    try {
      JSON.parse(val);
      setConfigError(null);
    } catch {
      setConfigError("Invalid JSON");
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    if (file.type === "application/pdf") return "PDF";
    return "XLS";
  };

  const getFileExt = () => {
    if (!file) return "";
    if (file.type === "application/pdf") return ".pdf";
    return ".xlsx";
  };

  const handleSubmit = async () => {
    if (!file) return setError("Please upload a file first.");
    if (configError) return setError("Fix JSON config before submitting.");

    setLoading(true);
    setError(null);

    try {
      const parsedConfig = JSON.parse(config);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("config", JSON.stringify(parsedConfig));

      const endpoint =
        file.type === "application/pdf"
          ? `${url}/pdf/upload`
          : `${url}/excel/upload`;

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.detail || json.message || "Parse failed.");
      }

      onSuccess({ file, config: parsedConfig, result: json });
    } catch (err) {
      setError(err.message || "Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      {/* Top bar */}
      <header className="border-b border-[#1f1f1f] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse" />
          <span className="text-[#39ff14] text-xs tracking-[0.3em] uppercase">
            DocParser v1.0
          </span>
        </div>
        <div className="flex gap-2">
          <StatusBadge label="PDF" />
          <StatusBadge label="XLSX" />
          <StatusBadge label="Fuzzy Match" />
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* LEFT — Upload zone */}
        <section className="flex-1 p-8 lg:p-12 flex flex-col justify-center border-r border-[#1f1f1f]">
          <div className="max-w-lg mx-auto w-full">
            {/* Heading */}
            <div className="mb-10">
              <p className="text-[#555] text-xs tracking-[0.25em] uppercase mb-3">
                01 / Upload Document
              </p>
              <h1
                className="text-4xl lg:text-5xl font-bold leading-tight text-white"
                style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}
              >
                Drop your
                <br />
                <span className="text-[#39ff14]">document.</span>
              </h1>
              <p className="mt-4 text-[#555] text-sm leading-relaxed">
                Supports messy PDFs & multi-format Excel files.
                <br />
                Fuzzy header detection handles any layout.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !file && fileInputRef.current.click()}
              className={`
                relative rounded-lg border-2 border-dashed cursor-pointer transition-all duration-300
                flex flex-col items-center justify-center text-center
                ${file ? "min-h-[160px] border-[#39ff14]/60 bg-[#39ff14]/5" : "min-h-[220px]"}
                ${dragging
                  ? "border-[#39ff14] bg-[#39ff14]/10 scale-[1.01]"
                  : file
                  ? ""
                  : "border-[#2a2a2a] hover:border-[#444] bg-[#111] hover:bg-[#131313]"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx"
                className="hidden"
                onChange={handleFileInput}
              />

              {file ? (
                <div className="flex items-center gap-4 px-6 py-4 w-full">
                  {/* File badge */}
                  <div
                    className={`
                      w-14 h-16 rounded flex items-center justify-center text-xs font-bold tracking-widest
                      ${file.type === "application/pdf"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }
                    `}
                  >
                    {getFileIcon()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-medium truncate max-w-[260px]">
                      {file.name}
                    </p>
                    <p className="text-[#555] text-xs mt-1">
                      {(file.size / 1024).toFixed(1)} KB · {getFileExt()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setError(null);
                    }}
                    className="text-[#555] hover:text-red-400 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="px-8 py-10">
                  <div className="w-12 h-12 rounded-full border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4 text-[#444]">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-[#666] text-sm">
                    Drag & drop here, or{" "}
                    <span className="text-[#39ff14] underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-[#3a3a3a] text-xs mt-2">PDF · XLSX</p>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 px-4 py-3 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs leading-relaxed">
                ⚠ {error}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!file || loading || !!configError}
              className={`
                mt-6 w-full py-4 rounded text-sm font-bold tracking-[0.15em] uppercase transition-all duration-200
                ${!file || loading || configError
                  ? "bg-[#1a1a1a] text-[#444] cursor-not-allowed border border-[#2a2a2a]"
                  : "bg-[#39ff14] text-black hover:bg-[#4fff2a] active:scale-[0.99] shadow-[0_0_24px_#39ff1440]"
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                  Parsing...
                </span>
              ) : (
                "Parse Document →"
              )}
            </button>
          </div>
        </section>

        {/* RIGHT — Config editor */}
        <section className="flex-1 p-8 lg:p-12 flex flex-col">
          <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
            <div className="mb-6">
              <p className="text-[#555] text-xs tracking-[0.25em] uppercase mb-3">
                02 / Schema Config
              </p>
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Header Mapping
              </h2>
              <p className="mt-2 text-[#555] text-sm">
                Define expected headers and normalize column names across different document formats.
              </p>
            </div>

            <ConfigEditor
              value={config}
              onChange={handleConfigChange}
              error={configError}
            />

            {/* Field guide */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                {
                  label: "expected_headers",
                  desc: "Helps locate the table row in messy documents",
                  color: "text-blue-400",
                },
                {
                  label: "header_mapping",
                  desc: "Normalizes column names to your internal schema",
                  color: "text-purple-400",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded border border-[#1f1f1f] bg-[#0f0f0f]"
                >
                  <p className={`text-xs font-bold mb-1 ${item.color}`}>
                    {item.label}
                  </p>
                  <p className="text-[#555] text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}