import { useState } from "react";
import UploadTab from "./components/UploadTab";
import ConfigTab from "./components/ConfigTab";
import ResultTab from "./components/ResultTab";
//ee

const DEFAULT_STATE = {
  expectedHeaders: ["customer", "qty", "price", "date"],
  mapping: {
    customer_name: ["customer", "client", "buyer"],
    quantity: ["qty", "quantity", "pcs"],
    total_price: ["price", "amount", "total", "grand total"],
    order_date: ["date", "tanggal", "order date"],
  },
};

export default function App() {
  const [tab, setTab] = useState("upload");
  const [file, setFile] = useState(null);
  const [config, setConfig] = useState(DEFAULT_STATE);
  const [resultData, setResultData] = useState(null);

  const tabs = [
    { id: "upload", label: "Upload", icon: "📂" },
    { id: "config", label: "Konfigurasi", icon: "⚙️" },
    { id: "result", label: "Hasil", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📄</span>
          <span className="font-semibold text-gray-800 text-base">DocParser</span>
        </div>
        <div className="flex gap-1 ml-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {resultData && (
          <span className="ml-auto text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ✓ {resultData.data?.length || 0} baris berhasil diparse
          </span>
        )}
      </header>

      {/* Tab content */}
      <main className="max-w-4xl mx-auto py-8 px-6">
        {tab === "upload" && (
          <UploadTab
            file={file}
            setFile={setFile}
            config={config}
            setResultData={setResultData}
            onSuccess={() => setTab("result")}
          />
        )}
        {tab === "config" && (
          <ConfigTab config={config} setConfig={setConfig} />
        )}
        {tab === "result" && (
          <ResultTab resultData={resultData} file={file} />
        )}
      </main>
    </div>
  );
}