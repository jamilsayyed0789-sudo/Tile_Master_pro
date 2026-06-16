"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Eye, Edit3, Copy, Trash2, FileText, Download,
  Printer, Share2, Mail, ChevronRight, AlertTriangle, X, Check,
  FileDown, Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuotationListItem {
  id: number;
  quotation_number: string;
  customer_name: string;
  mobile_number: string;
  project_name: string | null;
  date: string;
  status: string;
  total_area: number;
  total_boxes: number;
  grand_total: number;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  final: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function QuotationList() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "200");
      const res = await fetch(`/api/quotation?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      setQuotations(await res.json());
    } catch {
      setError("Could not load quotations. Check server connection.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/quotation/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setQuotations((prev) => prev.filter((q) => q.id !== id));
    } catch {
      setError("Failed to delete quotation");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const res = await fetch(`/api/quotation/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Duplicate failed");
      const q = await res.json();
      router.push(`/quotation/${q.id}`);
    } catch {
      setError("Failed to duplicate quotation");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/quotation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      fetchQuotations();
    } catch {
      setError("Failed to update status");
    }
  };

  const getToken = () => {
    try {
      const data = JSON.parse(sessionStorage.getItem("better-auth-session") || "{}");
      return data?.token || "";
    } catch { return ""; }
  };

  const handleWhatsApp = async (q: QuotationListItem) => {
    const phone = q.mobile_number.replace(/\D/g, "");
    const text = `Quotation ${q.quotation_number} for ${q.customer_name} - Total: ₹${q.grand_total}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEmail = (q: QuotationListItem) => {
    const sub = `Quotation ${q.quotation_number} - TileMasterPro`;
    const body = `Dear ${q.customer_name},\n\nPlease find your quotation ${q.quotation_number} attached.\n\nTotal Amount: ₹${q.grand_total}\n\nRegards,\nTileMasterPro`;
    window.open(`mailto:?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Quotations</h1>
            <p className="text-neutral-400 text-sm mt-1">Manage project quotations</p>
          </div>
          <button
            onClick={() => router.push("/quotation/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, number, mobile, or project..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-neutral-500 hover:text-white" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="final">Final</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Quotation List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-900 rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-neutral-800 rounded w-1/3 mb-3" />
                <div className="h-4 bg-neutral-800 rounded w-1/2 mb-2" />
                <div className="h-4 bg-neutral-800 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-300 mb-2">No quotations yet</h3>
            <p className="text-neutral-500 text-sm mb-6">Create your first quotation to get started</p>
            <button
              onClick={() => router.push("/quotation/new")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Create Quotation
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {quotations.map((q) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-neutral-900/80 border border-neutral-800/50 rounded-2xl p-5 hover:border-neutral-700/50 transition group"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-amber-400 font-bold text-sm font-mono">{q.quotation_number}</span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${STATUS_STYLES[q.status] || STATUS_STYLES.draft}`}>
                          {q.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white truncate">{q.customer_name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-neutral-400">
                        <span>{q.mobile_number}</span>
                        {q.project_name && <span className="truncate">{q.project_name}</span>}
                        <span>{q.date}</span>
                        <span>{q.total_boxes} boxes</span>
                        <span className="text-amber-400 font-semibold">₹{Number(q.grand_total).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleStatusChange(q.id, q.status === "draft" ? "final" : q.status === "final" ? "completed" : "draft")}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                        title="Cycle status"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/quotation/${q.id}`)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/quotation/${q.id}?edit=true`)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(q.id)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleWhatsApp(q)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                        title="Share WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEmail(q)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                        title="Share Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(q.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/quotation/${q.id}`)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                        title="Open"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Delete Quotation?</h3>
              </div>
              <p className="text-neutral-400 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition text-sm disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
