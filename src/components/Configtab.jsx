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
            type="button"
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
function MappingRow({ schemaKey, aliases, onAliasAdd, onAliasRemove, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(schemaKey);
  const [error, setError] = useState("");

  const normalizedDraft = draft.trim().replace(/\s+/g, "_").toLowerCase();

  const startEdit = () => {
    setDraft(schemaKey);
    setError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(schemaKey);
    setError("");
    setEditing(false);
  };

  const saveEdit = () => {
    const msg = onRename(schemaKey, normalizedDraft);
    if (msg) {
      setError(msg);
      return;
    }
    setEditing(false);
  };

  return (
    <div className="grid gap-3 items-start p-4 bg-gray-50 rounded-xl border border-gray-100 sm:grid-cols-[160px,1fr,auto]">
      <div className="sm:pr-2">
        <p className="text-xs font-medium text-gray-500 mb-1">Nama standar</p>
        {editing ? (
          <div className="flex flex-col gap-1">
            <input
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              className={`w-full bg-white border rounded-lg px-3 py-1.5 text-sm outline-none transition-colors ${
                error ? "border-red-400" : "border-gray-200 focus:border-gray-400"
              }`}
            />
            <span className="text-[11px] text-gray-400">
              Disimpan sebagai <span className="font-mono">{normalizedDraft || "-"}</span>
            </span>
            {error && <span className="text-xs text-red-500">{error}</span>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                className="text-xs px-2 py-1 rounded-md bg-gray-900 text-white"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-500"
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-block bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-800 w-full truncate">
              {schemaKey}
            </span>
            <button
              type="button"
              onClick={startEdit}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Edit
            </button>
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 mb-1">Variasi nama di dokumen</p>
        <TagInput
          items={aliases}
          onAdd={(v) => onAliasAdd(schemaKey, v)}
          onRemove={(i) => onAliasRemove(schemaKey, i)}
          placeholder="Ketik lalu Enter..."
        />
        <p className="text-[11px] text-gray-400 mt-1">Contoh: "Customer Name", "Nama Pelanggan"</p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(schemaKey)}
        className="sm:mt-6 text-gray-300 hover:text-red-500 transition-colors text-xl leading-none"
      >
        ×
      </button>
    </div>
  );
}

export default function ConfigTab({ config, setConfig }) {
  const [newKey, setNewKey] = useState("");
  const [newAliases, setNewAliases] = useState([]);
  const [keyError, setKeyError] = useState("");
  const normalizedKey = newKey.trim().replace(/\s+/g, "_").toLowerCase();
  const suggestedHeaders = ["customer", "qty", "price", "date", "invoice", "sku"];

  const updateConfig = (patch) => setConfig((prev) => ({ ...prev, ...patch }));

  // Expected headers
  const addExpHeader = (v) => {
    const key = v.trim().replace(/\s+/g, "_").toLowerCase();
    setConfig((prev) => {
      if (prev.expectedHeaders.includes(v)) return prev;
      const nextMapping = { ...prev.mapping };
      const aliasMatch = Object.values(nextMapping).some((aliases) =>
        aliases.some((a) => a.trim().toLowerCase() === v.trim().toLowerCase())
      );
      if (key && !nextMapping[key] && !aliasMatch) nextMapping[key] = [v];
      return {
        ...prev,
        expectedHeaders: [...prev.expectedHeaders, v],
        mapping: nextMapping,
      };
    });
  };
  const removeExpHeader = (i) => {
    setConfig((prev) => {
      const header = prev.expectedHeaders[i];
      const key = header?.trim().replace(/\s+/g, "_").toLowerCase();
      const headerLower = header?.trim().toLowerCase();
      const nextHeaders = prev.expectedHeaders.filter((_, idx) => idx !== i);
      const nextMapping = { ...prev.mapping };
      Object.entries(nextMapping).forEach(([k, aliases]) => {
        const hasAlias = aliases.some((a) => a.trim().toLowerCase() === headerLower);
        if ((key && k === key) || hasAlias) delete nextMapping[k];
      });
      return { ...prev, expectedHeaders: nextHeaders, mapping: nextMapping };
    });
  };

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
      const aliases = m[key] || [];
      delete m[key];
      const aliasSet = new Set(aliases.map((a) => a.trim().toLowerCase()));
      const nextHeaders = prev.expectedHeaders.filter((h) => {
        const hNorm = h.trim().toLowerCase();
        return hNorm !== key && !aliasSet.has(hNorm);
      });
      return { ...prev, mapping: m, expectedHeaders: nextHeaders };
    });
  };
  const renameMapping = (oldKey, newKey) => {
    if (!newKey) return "Nama standar tidak boleh kosong.";
    if (oldKey === newKey) return null;
    if (config.mapping[newKey]) return "Nama ini sudah ada.";
    setConfig((prev) => {
      const next = { ...prev.mapping };
      const aliases = next[oldKey] || [];
      delete next[oldKey];
      next[newKey] = aliases;
      return { ...prev, mapping: next };
    });
    return null;
  };
  const addNewMapping = () => {
    const k = normalizedKey;
    if (!k) { setKeyError("Nama standar tidak boleh kosong."); return; }
    if (config.mapping[k]) { setKeyError("Nama ini sudah ada."); return; }
    const aliases = newAliases;
    setConfig((prev) => ({
      ...prev,
      mapping: { ...prev.mapping, [k]: aliases },
    }));
    setNewKey("");
    setNewAliases([]);
    setKeyError("");
  };

  const addNewAlias = (v) =>
    setNewAliases((prev) => (prev.includes(v) ? prev : [...prev, v]));
  const removeNewAlias = (i) =>
    setNewAliases((prev) => prev.filter((_, idx) => idx !== i));

  const addSuggestedHeader = (h) => {
    if (!config.expectedHeaders.includes(h)) addExpHeader(h);
  };


  return (
    <div className="flex flex-col gap-6">
      {/* Expected headers */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-gray-800">Header yang Dicari</h2>
          <span className="text-xs text-gray-400">Langkah 1 dari 2</span>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Tuliskan nama kolom yang kemungkinan ada di dokumen. Sistem akan
          mendeteksinya secara otomatis, bahkan jika penulisannya sedikit berbeda.
          <br />
          <span className="text-xs text-gray-400 mt-1 block">
            Ketik lalu tekan <kbd className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-mono">Enter</kbd> untuk menambah.
          </span>
        </p>
        <div className="grid gap-4 lg:grid-cols-[1fr,240px]">
          <div>
            <TagInput
              items={config.expectedHeaders}
              onAdd={addExpHeader}
              onRemove={removeExpHeader}
              placeholder="mis. customer, qty, price, date..."
            />
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Tambah cepat</p>
            <div className="flex flex-wrap gap-2">
              {suggestedHeaders.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => addSuggestedHeader(h)}
                  disabled={config.expectedHeaders.includes(h)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    config.expectedHeaders.includes(h)
                      ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  + {h}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Header mapping */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-semibold text-gray-800">Pemetaan Nama Kolom</h2>
          <span className="text-xs text-gray-400">Langkah 2 dari 2</span>
        </div>
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
              onRename={renameMapping}
            />
          ))}
          {Object.keys(config.mapping).length === 0 && (
            <div className="text-sm text-gray-400 italic text-center py-6">
              Belum ada pemetaan kolom. Tambahkan di bawah.
            </div>
          )}
        </div>

        {/* Add new mapping */}
        {/* <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Tambah Kolom Baru</p>
          <div className="grid gap-3 lg:grid-cols-[220px,1fr,auto]">
            <div className="flex flex-col gap-1">
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
              <p className="text-[11px] text-gray-400">
                Disimpan sebagai <span className="font-mono">{normalizedKey || "-"}</span>
              </p>
              {keyError && <p className="text-xs text-red-500">{keyError}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Variasi nama di dokumen</label>
              <TagInput
                items={newAliases}
                onAdd={addNewAlias}
                onRemove={removeNewAlias}
                placeholder="mis. customer, client, buyer"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                onClick={addNewMapping}
                type="button"
                disabled={!normalizedKey}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  !normalizedKey
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                + Tambah
              </button>
            </div>
          </div>
        </div> */}
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