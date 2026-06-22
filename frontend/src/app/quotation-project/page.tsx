"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Printer, Share2, Mail, Trash2, Plus, Minus, FileText,
  AlertTriangle, Check, X, ChevronDown, ChevronUp, ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useProjectStore, ProjectItem } from "@/store/projectStore";

const ROOM_ICONS: Record<string, string> = {
  hall: "🛋️",
  kitchen: "🍳",
  bathroom: "🛁",
  elevation: "🧱",
};

const ROOM_LABELS: Record<string, string> = {
  hall: "Hall",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  elevation: "Wall Elevation",
};

function formatCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

type DiscountType = "percentage" | "fixed";

export default function QuotationProjectPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const { items, removeItem, clearAll } = useProjectStore();

  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [projectName, setProjectName] = useState("");

  // Discount
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState(0);

  // Charges
  const [transportCharge, setTransportCharge] = useState(0);
  const [installationCharge, setInstallationCharge] = useState(0);
  const [loadingCharge, setLoadingCharge] = useState(0);
  const [otherCharge, setOtherCharge] = useState(0);
  const [otherChargeLabel, setOtherChargeLabel] = useState("");

  // GST
  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstPercent, setGstPercent] = useState(18);

  // PDF state
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Toggle room expand
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set(items.map((i) => i.id)));

  const toggleRoom = (id: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Calculations ────────────────────────────────────────────────────────

  const totals = useMemo(() => {
    let totalArea = 0, totalBoxes = 0, totalTiles = 0, subtotal = 0;
    const areas: Record<string, number> = { hall: 0, kitchen: 0, bathroom: 0, elevation: 0 };

    for (const item of items) {
      totalArea += item.area;
      totalBoxes += item.boxesRequired;
      totalTiles += item.tilesRequired;
      subtotal += item.price;
      areas[item.type] = (areas[item.type] || 0) + item.area;
    }

    // Discount
    let discountAmt = 0;
    if (discountType === "percentage") {
      discountAmt = subtotal * (discountValue / 100);
    } else {
      discountAmt = Math.min(discountValue, subtotal);
    }

    // Charges
    const totalCharges = transportCharge + installationCharge + loadingCharge + otherCharge;

    // GST
    const afterDiscount = subtotal - discountAmt + totalCharges;
    const gstAmt = gstEnabled ? afterDiscount * (gstPercent / 100) : 0;
    const grandTotal = afterDiscount + gstAmt;

    return {
      totalArea, totalBoxes, totalTiles, subtotal, discountAmt,
      totalCharges, gstAmt, grandTotal, areas,
    };
  }, [items, discountType, discountValue, transportCharge, installationCharge, loadingCharge, otherCharge, gstEnabled, gstPercent]);

  const areaTotals = useMemo(() => {
    const areas: Record<string, number> = { hall: 0, kitchen: 0, bathroom: 0, elevation: 0, wall: 0 };
    for (const item of items) areas[item.type] = (areas[item.type] || 0) + item.area;
    return areas;
  }, [items]);

  // ─── PDF Generation ───────────────────────────────────────────────────────

  const generatePDF = useCallback(async () => {
    if (!printRef.current) return;
    setGeneratingPdf(true);
    setError("");
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pageH = pdf.internal.pageSize.getHeight();

      if (pdfH <= pageH) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      } else {
        const totalPages = Math.ceil(pdfH / pageH);
        for (let i = 0; i < totalPages; i++) {
          pdf.addImage(imgData, "PNG", 0, -i * pageH, pdfW, pdfH);
          if (i < totalPages - 1) pdf.addPage();
        }
      }

      const qNum = `QTN-${Date.now()}`;
      pdf.save(`Quotation_${qNum}.pdf`);
      setSuccess("PDF downloaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError("Failed to generate PDF: " + (err.message || ""));
    } finally {
      setGeneratingPdf(false);
    }
  }, []);

  // ─── Print ────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    window.print();
  };

  // ─── WhatsApp ─────────────────────────────────────────────────────────────

  const handleWhatsApp = () => {
    const phone = mobileNumber.replace(/\D/g, "");
    if (!phone) { setError("Enter mobile number first"); return; }
    const text = [
      `*Quotation Summary*`,
      `Customer: ${customerName}`,
      `Rooms: ${items.length}`,
      `Total Area: ${totals.totalArea.toFixed(1)} sq.ft`,
      `Total Boxes: ${totals.totalBoxes}`,
      `Grand Total: ${formatCurrency(totals.grandTotal)}`,
      ``,
      `*Room-wise Details:*`,
      ...items.map((item) => `• ${item.name}: ${item.area.toFixed(1)} sq.ft - ${item.boxesRequired} boxes - ${formatCurrency(item.price)}`),
      ``,
      `*TileMasterPro*`,
    ].join("\n");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  // ─── Email ────────────────────────────────────────────────────────────────

  const handleEmail = () => {
    const sub = `Quotation - ${projectName || customerName || "Tile Project"}`;
    const body = [
      `Dear ${customerName},`,
      ``,
      `Please find your quotation details below:`,
      ``,
      `Rooms: ${items.length}`,
      `Total Area: ${totals.totalArea.toFixed(1)} sq.ft`,
      `Total Boxes: ${totals.totalBoxes}`,
      `Grand Total: ${formatCurrency(totals.grandTotal)}`,
      ``,
      `Regards,`,
      `TileMasterPro`,
    ].join("\n");
    window.open(`mailto:${email || ""}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  // ─── Save Quotation ───────────────────────────────────────────────────────

  const handleSaveQuotation = async () => {
    if (!customerName.trim() || !mobileNumber.trim()) {
      setError("Customer name and mobile are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const rooms = items.map((item, i) => ({
        room_name: item.name,
        room_type: item.type.charAt(0).toUpperCase() + item.type.slice(1),
        floor_length: item.length || 0,
        floor_width: item.width || 0,
        wall_height: item.height || 0,
        total_area: item.area,
        sort_order: i,
        items: [{
          tile_number: item.tileNumber,
          tile_name: item.tileName,
          tile_size: item.tileSize,
          tile_finish: item.finish,
          tile_image_filename: item.tileImageFilename,
          tiles_per_box: item.boxesRequired > 0 ? Math.ceil(item.tilesRequired / item.boxesRequired) : 1,
          wastage_percentage: 10,
          quantity: item.boxesRequired,
          tiles_required: item.tilesRequired,
          boxes_required: item.boxesRequired,
          area_covered: item.area,
          rate: item.rate,
          amount: item.price,
          tile_area: parseFloat(item.tileSize?.split("x").map(s => parseFloat(s) / 1000).reduce((a, b) => a * b, 0).toFixed(4)) || 0,
        }],
      }));

      const payload = {
        customer_name: customerName,
        mobile_number: mobileNumber,
        email: email || null,
        address: address || null,
        project_name: projectName || null,
        date: getToday(),
        salesperson_name: salesperson || null,
        notes: "",
        discount: totals.discountAmt,
        gst_percentage: gstEnabled ? gstPercent : 0,
        status: "draft",
        rooms,
      };

      const res = await fetch("/api/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errDetail = await res.text();
        throw new Error(`Save failed: ${errDetail}`);
      }
      const data = await res.json();
      clearAll();
      setSuccess(`Quotation #${data.quotation_number} saved!`);
      setTimeout(() => router.push("/quotation"), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Print-only styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 no-print">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Quotation Preview</h1>
            <p className="text-neutral-400 text-sm">{items.length} room{items.length !== 1 ? "s" : ""} collected</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6 no-print">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-6 no-print">
            <Check className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* ===== CUSTOMER DETAILS ===== */}
        <div className="bg-neutral-900/80 border border-neutral-800/50 rounded-2xl p-5 mb-4 no-print">
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Customer Name *</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Mobile *</label>
              <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Project Name</label>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Salesperson</label>
              <input value={salesperson} onChange={(e) => setSalesperson(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition" />
            </div>
          </div>
        </div>

        {/* ===== ROOM CARDS ===== */}
        {items.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-300 mb-2">No rooms calculated yet</h3>
            <p className="text-neutral-500 text-sm">Use the calculators to add rooms, then come back here.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                className="bg-neutral-900/80 border border-neutral-800/50 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleRoom(item.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-neutral-800/30 transition"
                >
                  <span className="text-xl">{ROOM_ICONS[item.type] || "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white">{item.name}</h3>
                    <p className="text-xs text-neutral-400">{ROOM_LABELS[item.type] || item.type} · {item.area.toFixed(1)} sq.ft</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-blue-400 font-bold text-sm">{formatCurrency(item.price)}</p>
                    <p className="text-xs text-neutral-500">{item.boxesRequired} boxes</p>
                  </div>
                  {expandedRooms.has(item.id) ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                </button>

                {expandedRooms.has(item.id) && (
                  <div className="px-5 pb-4 border-t border-neutral-800/50 pt-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="md:col-span-2">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Tile</div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <ImageIcon className="w-5 h-5 text-neutral-600" />
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm">{item.tileName || item.tileNumber || "—"}</div>
                            <div className="text-neutral-400 text-xs">{item.tileNumber} {item.tileSize && `· ${item.tileSize}`}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Dimensions</div>
                        <div className="text-white">{item.length} × {item.width} ft</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Tiles Needed</div>
                        <div className="text-white font-mono">{item.tilesRequired}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Boxes</div>
                        <div className="text-white font-mono">{item.boxesRequired}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Rate</div>
                        <div className="text-blue-400 font-semibold">{formatCurrency(item.rate)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Amount</div>
                        <div className="text-blue-400 font-semibold">{formatCurrency(item.price)}</div>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* ===== FINANCIAL SECTION ===== */}
        {items.length > 0 && (
          <>
            {/* Discount */}
            <div className="bg-neutral-900/80 border border-neutral-800/50 rounded-2xl p-5 mb-4 no-print">
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Discount</h2>
              <div className="flex flex-wrap gap-3 mb-3">
                {(["percentage", "fixed"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setDiscountType(t); setDiscountValue(0); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                      discountType === t
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                        : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    {t === "percentage" ? "Percentage (%)" : "Fixed Amount (₹)"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="0" max={discountType === "percentage" ? 100 : 9999999} step="1"
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === "percentage" ? "10" : "5000"}
                  className="w-40 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition"
                />
                <span className="text-sm text-neutral-400">
                  {discountType === "percentage" ? "% off subtotal" : "₹ off subtotal"}
                </span>
                {totals.discountAmt > 0 && (
                  <span className="text-sm text-green-400 font-semibold">(-{formatCurrency(totals.discountAmt)})</span>
                )}
              </div>
            </div>

            {/* Additional Charges */}
            <div className="bg-neutral-900/80 border border-neutral-800/50 rounded-2xl p-5 mb-4 no-print">
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Additional Charges</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Transport (₹)</label>
                  <input type="number" min="0" step="1" value={transportCharge || ""} onChange={(e) => setTransportCharge(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Installation (₹)</label>
                  <input type="number" min="0" step="1" value={installationCharge || ""} onChange={(e) => setInstallationCharge(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Loading (₹)</label>
                  <input type="number" min="0" step="1" value={loadingCharge || ""} onChange={(e) => setLoadingCharge(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">{otherChargeLabel || "Other"} (₹)</label>
                  <div className="flex gap-1">
                    <input type="number" min="0" step="1" value={otherCharge || ""} onChange={(e) => setOtherCharge(parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition" />
                    <input value={otherChargeLabel} onChange={(e) => setOtherChargeLabel(e.target.value)} placeholder="Label"
                      className="w-20 bg-neutral-800 border border-neutral-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition" />
                  </div>
                </div>
              </div>
            </div>

            {/* GST Toggle */}
            <div className="bg-neutral-900/80 border border-neutral-800/50 rounded-2xl p-5 mb-4 no-print">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider">GST</h2>
                  <button
                    onClick={() => setGstEnabled(!gstEnabled)}
                    className={`relative w-10 h-5 rounded-full transition ${gstEnabled ? "bg-blue-500" : "bg-neutral-700"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition ${gstEnabled ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
                {gstEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">Rate:</span>
                    <select value={gstPercent} onChange={(e) => setGstPercent(parseInt(e.target.value))}
                      className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition">
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ===== SUMMARY TOTALS ===== */}
        {items.length > 0 && (
          <div className="bg-neutral-900/80 border border-neutral-800/50 rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Summary</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-neutral-800/50 rounded-xl p-3">
                <div className="text-[10px] text-neutral-500 uppercase font-bold">Hall Area</div>
                <div className="text-lg font-bold text-white">{areaTotals.hall.toFixed(1)} <span className="text-xs text-neutral-400">sq.ft</span></div>
              </div>
              <div className="bg-neutral-800/50 rounded-xl p-3">
                <div className="text-[10px] text-neutral-500 uppercase font-bold">Kitchen Area</div>
                <div className="text-lg font-bold text-white">{areaTotals.kitchen.toFixed(1)} <span className="text-xs text-neutral-400">sq.ft</span></div>
              </div>
              <div className="bg-neutral-800/50 rounded-xl p-3">
                <div className="text-[10px] text-neutral-500 uppercase font-bold">Bathroom Area</div>
                <div className="text-lg font-bold text-white">{areaTotals.bathroom.toFixed(1)} <span className="text-xs text-neutral-400">sq.ft</span></div>
              </div>
              <div className="bg-neutral-800/50 rounded-xl p-3">
                <div className="text-[10px] text-neutral-500 uppercase font-bold">Elevation Area</div>
                <div className="text-lg font-bold text-white">{areaTotals.elevation.toFixed(1)} <span className="text-xs text-neutral-400">sq.ft</span></div>
              </div>
            </div>

            <div className="space-y-2 border-t border-neutral-800 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Total Project Area</span>
                <span className="text-white font-semibold">{totals.totalArea.toFixed(1)} sq.ft</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Total Tile Boxes</span>
                <span className="text-white font-semibold">{totals.totalBoxes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Total Tiles</span>
                <span className="text-white font-semibold">{totals.totalTiles}</span>
              </div>
              <div className="border-t border-neutral-800 pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Subtotal</span>
                  <span className="text-white font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discountAmt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Discount</span>
                    <span className="text-red-400 font-semibold">-{formatCurrency(totals.discountAmt)}</span>
                  </div>
                )}
                {totals.totalCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Additional Charges</span>
                    <span className="text-white font-semibold">+{formatCurrency(totals.totalCharges)}</span>
                  </div>
                )}
                {gstEnabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">GST ({gstPercent}%)</span>
                    <span className="text-white font-semibold">{formatCurrency(totals.gstAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base pt-2 border-t-2 border-blue-500/50">
                  <span className="text-white font-black">Grand Total</span>
                  <span className="text-blue-400 font-black text-lg">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== ACTION BUTTONS ===== */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-3 no-print">
            <button
              onClick={handleSaveQuotation}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-black font-bold rounded-xl transition disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {saving ? "Saving..." : "Save Quotation"}
            </button>
            <button
              onClick={generatePDF}
              disabled={generatingPdf}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {generatingPdf ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl border border-red-500/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        )}

        {/* ===== PRINT / PDF CONTENT (hidden) ===== */}
        <div className="print-only">
          <div ref={printRef} style={{ width: "210mm", padding: "10mm", background: "#ffffff", color: "#111", fontFamily: "Arial, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "15px", borderBottom: "3px solid #d4a017" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#1a1a1a", margin: 0 }}>TileMasterPro</h1>
                <p style={{ fontSize: "10px", color: "#666", margin: "2px 0" }}>Premium Tile Solutions</p>
                <p style={{ fontSize: "9px", color: "#888", margin: "2px 0" }}>GST: 00XXXXX | Phone: +91 XXXXXXXXXX</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ fontSize: "18px", color: "#d4a017", fontWeight: "900", margin: 0 }}>Quotation</h2>
                <p style={{ fontSize: "11px", color: "#444", margin: "2px 0" }}>#{`QTN-${Date.now()}`}</p>
                <p style={{ fontSize: "11px", color: "#444", margin: "2px 0" }}>Date: {getToday()}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "11px" }}>
              <div>
                <p style={{ margin: "1px 0", fontWeight: 700 }}>Customer Details</p>
                <p style={{ margin: "1px 0" }}>{customerName || "_______________"}</p>
                <p style={{ margin: "1px 0" }}>{mobileNumber || "_______________"}</p>
                {email && <p style={{ margin: "1px 0" }}>{email}</p>}
                {address && <p style={{ margin: "1px 0" }}>{address}</p>}
              </div>
              <div style={{ textAlign: "right" }}>
                {projectName && <p style={{ margin: "1px 0" }}><strong>Project:</strong> {projectName}</p>}
                {salesperson && <p style={{ margin: "1px 0" }}><strong>Salesperson:</strong> {salesperson}</p>}
              </div>
            </div>

            {/* Rooms */}
            {items.map((item, ri) => (
              <div key={ri} style={{ marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ background: "#f5f0e8", padding: "5px 8px", fontSize: "11px", fontWeight: "700", color: "#1a1a1a", borderBottom: "1px solid #ddd" }}>
                  {ROOM_LABELS[item.type] || item.type}: {item.name} — {item.area.toFixed(1)} sq.ft
                </div>
                <div style={{ padding: "5px 8px", fontSize: "10px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#fafafa" }}>
                        <th style={{ padding: "3px 6px", textAlign: "left", borderBottom: "1px solid #ddd" }}>Tile</th>
                        <th style={{ padding: "3px 6px", textAlign: "center", borderBottom: "1px solid #ddd" }}>Size</th>
                        <th style={{ padding: "3px 6px", textAlign: "center", borderBottom: "1px solid #ddd" }}>Boxes</th>
                        <th style={{ padding: "3px 6px", textAlign: "center", borderBottom: "1px solid #ddd" }}>Qty</th>
                        <th style={{ padding: "3px 6px", textAlign: "center", borderBottom: "1px solid #ddd" }}>Rate</th>
                        <th style={{ padding: "3px 6px", textAlign: "right", borderBottom: "1px solid #ddd" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: "3px 6px", borderBottom: "1px solid #eee" }}>
                          <div style={{ fontWeight: 600 }}>{item.tileName || item.tileNumber || "—"}</div>
                          <div style={{ color: "#888", fontSize: "9px" }}>{item.tileNumber} · {item.finish || ""}</div>
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "center", borderBottom: "1px solid #eee" }}>{item.tileSize || "—"}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", borderBottom: "1px solid #eee" }}>{item.boxesRequired}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", borderBottom: "1px solid #eee" }}>{item.tilesRequired}</td>
                        <td style={{ padding: "3px 6px", textAlign: "center", borderBottom: "1px solid #eee" }}>{formatCurrency(item.rate)}</td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: "1px solid #eee", fontWeight: 600 }}>{formatCurrency(item.price)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div style={{ marginTop: "10px", borderTop: "2px solid #d4a017", paddingTop: "8px", fontSize: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
                <span>Total Rooms: <strong>{items.length}</strong></span>
                <span>Total Area: <strong>{totals.totalArea.toFixed(1)} sq.ft</strong></span>
                <span>Total Boxes: <strong>{totals.totalBoxes}</strong></span>
                <span>Total Tiles: <strong>{totals.totalTiles}</strong></span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "220px", marginBottom: "2px" }}>
                  <span>Subtotal:</span><span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discountAmt > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", width: "220px", marginBottom: "2px" }}>
                    <span>Discount:</span><span style={{ color: "#c00" }}>-{formatCurrency(totals.discountAmt)}</span>
                  </div>
                )}
                {totals.totalCharges > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", width: "220px", marginBottom: "2px" }}>
                    <span>Charges:</span><span>+{formatCurrency(totals.totalCharges)}</span>
                  </div>
                )}
                {gstEnabled && (
                  <div style={{ display: "flex", justifyContent: "space-between", width: "220px", marginBottom: "2px" }}>
                    <span>GST ({gstPercent}%):</span><span>{formatCurrency(totals.gstAmt)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", width: "220px", fontSize: "13px", fontWeight: 900, borderTop: "2px solid #111", paddingTop: "3px", marginTop: "3px" }}>
                  <span>Grand Total:</span><span style={{ color: "#d4a017" }}>{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Terms & Signatures */}
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
              <div>
                <p style={{ fontWeight: 700, marginBottom: "3px" }}>Terms & Conditions</p>
                <p style={{ margin: "1px 0", color: "#666" }}>1. Quotation valid for 15 days</p>
                <p style={{ margin: "1px 0", color: "#666" }}>2. Prices subject to change without notice</p>
                <p style={{ margin: "1px 0", color: "#666" }}>3. Delivery charges extra</p>
                <p style={{ margin: "1px 0", color: "#666" }}>4. GST will be charged as applicable</p>
                <p style={{ margin: "1px 0", color: "#666" }}>5. Payment terms: 50% advance, 50% on delivery</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 700 }}>Authorized Signature</p>
                <div style={{ width: "100px", height: "1px", background: "#ccc", margin: "24px auto 3px" }} />
                <p style={{ color: "#888", fontSize: "9px" }}>Authorized Signatory</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 700 }}>Customer Signature</p>
                <div style={{ width: "100px", height: "1px", background: "#ccc", margin: "24px auto 3px" }} />
                <p style={{ color: "#888", fontSize: "9px" }}>{customerName || "Customer"}</p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: "12px", paddingTop: "6px", borderTop: "1px solid #ddd", fontSize: "8px", color: "#999", textAlign: "center" }}>
              TileMasterPro — Premium Tile Solutions | www.tilemasterpro.in
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
