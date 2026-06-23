"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Save, X, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buildTileUrl } from "@/utils/textureBridge";

interface Tile {
  id: number;
  tile_name: string;
  tile_number: string;
  tile_size: string | null;
  image_url: string | null;
  catalog_name: string | null;
  page_number: number | null;
}

export default function ReviewPage() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFlagged, setTotalFlagged] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ tile_name: "", tile_number: "", tile_size: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const baseUrl = "/api";

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/catalog/review`);
      const data = await res.json();
      setTiles(data.needs_review || []);
      setTotalFlagged(data.total_flagged || 0);
    } catch {
      setTiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const startEdit = (tile: Tile) => {
    setEditingId(tile.id);
    setEditForm({
      tile_name: tile.tile_name || "",
      tile_number: tile.tile_number || "",
      tile_size: tile.tile_size || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("tile_name", editForm.tile_name);
      fd.append("tile_number", editForm.tile_number);
      fd.append("tile_size", editForm.tile_size);
      const res = await fetch(`${baseUrl}/catalog/tiles/${editingId}`, {
        method: "PATCH",
        body: fd,
      });
      if (res.ok) {
        setMessage("Tile updated!");
        setEditingId(null);
        fetchReviews();
      } else {
        const err = await res.text();
        setMessage(`Error: ${err}`);
      }
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <AlertTriangle className="text-blue-400" size={28} />
              Tiles Needing Review
            </h1>
            <p className="text-gray-400 mt-1">
              These tiles had uncertain extraction — review and correct the metadata below.
            </p>
          </div>
          <Link href="/catalog/search" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Catalog
          </Link>
        </div>

        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.startsWith("Error") ? "bg-red-900/50 border border-red-700" : "bg-emerald-900/50 border border-emerald-700"
            }`}
          >
            {message.startsWith("Error") ? <X size={20} className="text-red-400" /> : <CheckCircle size={20} className="text-emerald-400" />}
            <p className={`text-sm ${message.startsWith("Error") ? "text-red-200" : "text-emerald-200"}`}>{message}</p>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : totalFlagged === 0 ? (
          <div className="text-center py-20">
            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">All tiles have complete metadata!</p>
            <p className="text-gray-500 text-sm mt-2">No tiles need manual review.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-400 mb-4">{totalFlagged} tile(s) flagged for review</div>
            <div className="space-y-4">
              {tiles.map((tile) => (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex gap-4"
                >
                  <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-700">
                    {tile.image_url ? (
                      <img src={buildTileUrl(tile.image_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No img</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingId === tile.id ? (
                      <div className="space-y-2">
                        <input
                          value={editForm.tile_name}
                          onChange={e => setEditForm(f => ({ ...f, tile_name: e.target.value }))}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
                          placeholder="Tile Name"
                        />
                        <div className="flex gap-2">
                          <input
                            value={editForm.tile_number}
                            onChange={e => setEditForm(f => ({ ...f, tile_number: e.target.value }))}
                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
                            placeholder="Tile Number / SKU"
                          />
                          <input
                            value={editForm.tile_size}
                            onChange={e => setEditForm(f => ({ ...f, tile_size: e.target.value }))}
                            className="w-28 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
                            placeholder="Size"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={saveEdit} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Save size={12} /> {saving ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{tile.tile_name || <span className="text-gray-500 italic">No name</span>}</p>
                            <p className="text-xs text-gray-400 mt-0.5">SKU: {tile.tile_number}</p>
                            <p className="text-xs text-gray-500">
                              {tile.tile_size || "No size"} &middot; {tile.catalog_name} p.{tile.page_number}
                            </p>
                          </div>
                          <button onClick={() => startEdit(tile)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
