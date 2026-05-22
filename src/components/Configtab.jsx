import { useState, useRef } from "react";

// Chip input component — type and press Enter to add
function TagInput({ items, onAdd, onRemove, placeholder }) {
  const [val, setVal] = useState("");
  const inputRef = useRef(null);

  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && val.trim()) {
      e.preventDefault();
      const v = val.trim().replace(/,$/, "");
      if (v && !items.includes(v)) onAdd(v);
      setVal("");
    }
    if (e.key === "Backspace" && !val && items.length > 0) {
      onRemove(items.length - 1);
    }
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 items-center border border-gray-200 rounded-lg px-3 py-2 min-h-[42px] cursor-text focus-within:border-gray-400 transition-colors bg-white"
      onClick={() => inputRef.current?.focus()}
    >
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-0.5 text-sm text-gray-700"
        >
          {item}
          <button
            onClick={() => onRemove(i)}
            className="text-gray-400 hover:text-red-500 text-base leading-none ml-0.5"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKey}
        placeholder={items.length === 0 ? placeholder : ""}
        className="text-sm outline-none flex-1 min-w-[120px] bg-transparent placeholder-gray-400"
      />
    </div>
  );
}

// Row for a single mapping entry
function MappingRow({ schemaKey, aliases, onAliasAdd, onAliasRemove, onDelete }) {
  return (
    <div className="flex gap-3 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex-shrink-0 w-40">
        <p className="text-xs font-medium text-gray-500 mb-1">Nama standar</p>
        <span className="inline-block bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 w-full truncate">
          {schemaKey}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 mb-1">Variasi nama di dokumen</p>
        <TagInput
          items={aliases}
          onAdd={(v) => onAliasAdd(schemaKey, v)}
          onRemove={(i) => onAliasRemove(schemaKey, i)}
          placeholder="Ketik lalu Enter..."
        />
      </div>
      <button
        onClick={() => onDelete(schemaKey)}
        className="mt-6 text-gray-300 hover:text-red-500 transition-colors text-xl leading-none flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}

export default function ConfigTab({ config, setConfig }) {
  const [newKey, setNewKey] = useState("");
  const [newAliases, setNewAliases] = useState("");
  const [keyError, setKeyError] = useState("");

  const updateConfig = (patch) => setConfig((prev) => ({ ...prev, ...patch }));

  // Expected headers
  const addExpHeader = (v) =>
    updateConfig({ expectedHeaders: [...config.expectedHeaders, v] });
  const removeExpHeader = (i) =>
    updateConfig({ expectedHeaders: config.expectedHeaders.filter((_, idx) => idx !== i) });

  // Mapping
  const addAliasToKey = (key, alias) => {
    setConfig((prev) => ({
      ...prev,
      mapping: {
        ...prev.mapping,
        [key]: [...prev.mapping[key], alias],
      },
    }));
  };
  const removeAliasFromKey = (key, idx) => {
    setConfig((prev) => ({
      ...prev,
      mapping: {
        ...prev.mapping,
        [key]: prev.mapping[key].filter((_, i) => i !== idx),
      },
    }));
  };
  const deleteMapping = (key) => {
    setConfig((prev) => {
      const m = { ...prev.mapping };
      delete m[key];
      return { ...prev, mapping: m };
    });
  };
  const addNewMapping = () => {
    const k = newKey.trim().replace(/\s+/g, "_").toLowerCase();
    if (!k) { setKeyError("Nama standar tidak boleh kosong."); return; }
    if (config.mapping[k]) { setKeyError("Nama ini sudah ada."); return; }
    const aliases = newAliases
      ? newAliases.split(",").map((a) => a.trim()).filter(Boolean)
      : [];
    setConfig((prev) => ({
      ...prev,
      mapping: { ...prev.mapping, [k]: aliases },
    }));
    setNewKey("");
    setNewAliases("");
    setKeyError("");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Expected headers */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Header yang Dicari</h2>
        <p className="text-sm text-gray-500 mb-5">
          Tuliskan nama kolom yang kemungkinan ada di dokumen. Sistem akan
          mendeteksinya secara otomatis, bahkan jika penulisannya sedikit berbeda.
          <br />
          <span className="text-xs text-gray-400 mt-1 block">
            Ketik lalu tekan <kbd className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-mono">Enter</kbd> untuk menambah.
          </span>
        </p>
        <TagInput
          items={config.expectedHeaders}
          onAdd={addExpHeader}
          onRemove={removeExpHeader}
          placeholder="mis. customer, qty, price, date..."
        />
      </div>

      {/* Header mapping */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Pemetaan Nama Kolom</h2>
        <p className="text-sm text-gray-500 mb-5">
          Tentukan nama standar yang akan dipakai di hasil, lalu tambahkan semua
          variasi nama kolom yang mungkin muncul di dokumen dari berbagai sumber.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {Object.entries(config.mapping).map(([key, aliases]) => (
            <MappingRow
              key={key}
              schemaKey={key}
              aliases={aliases}
              onAliasAdd={addAliasToKey}
              onAliasRemove={removeAliasFromKey}
              onDelete={deleteMapping}
            />
          ))}
          {Object.keys(config.mapping).length === 0 && (
            <div className="text-sm text-gray-400 italic text-center py-6">
              Belum ada pemetaan kolom. Tambahkan di bawah.
            </div>
          )}
        </div>

        {/* Add new mapping */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Tambah Kolom Baru</p>
          <div className="flex gap-3 flex-wrap">
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label className="text-xs text-gray-500">Nama standar</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => { setNewKey(e.target.value); setKeyError(""); }}
                onKeyDown={(e) => e.key === "Enter" && addNewMapping()}
                placeholder="mis. customer_name"
                className={`border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
                  keyError ? "border-red-400" : "border-gray-200 focus:border-gray-400"
                }`}
              />
              {keyError && <p className="text-xs text-red-500">{keyError}</p>}
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-xs text-gray-500">Variasi (pisah koma)</label>
              <input
                type="text"
                value={newAliases}
                onChange={(e) => setNewAliases(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNewMapping()}
                placeholder="mis. customer, client, buyer"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={addNewMapping}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                + Tambah
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex gap-3">
        <span className="text-blue-500 flex-shrink-0 mt-0.5">ℹ️</span>
        <div className="text-sm text-blue-700">
          <strong>Fuzzy Matching aktif.</strong> Sistem otomatis mencocokkan header
          meski penulisannya berbeda — contoh: <em>"Customer Name"</em> akan dikenali
          sebagai <em>"customer"</em>, dan <em>"Tanggal Order"</em> sebagai <em>"date"</em>.
        </div>
      </div>
    </div>
  );
}