"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2, ArrowLeft, FileText, Phone, Mail, MapPin, User, Hash, Calendar, Percent, DollarSign, ClipboardList } from "lucide-react";

interface RoomData {
  id: number;
  room_name: string;
  length: number;
  width: number;
  tile_size: string;
  tile_name: string;
  items: { id: number; description: string; quantity: number; price: number }[];
}

interface QuotationData {
  id: number;
  quotation_number: string;
  customer_name: string;
  mobile_number: string;
  email: string | null;
  address: string | null;
  project_name: string | null;
  date: string;
  salesperson_name: string | null;
  notes: string | null;
  discount: number;
  gst_percentage: number;
  status: string;
  rooms: RoomData[];
}

export default function QuotationDetailPage() {
  const params = useParams();
  const [data, setData] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await fetch(`/api/quotation/${params.id}`);
        if (!res.ok) throw new Error("Quotation not found");
        const q = await res.json();
        setData({ ...q, date: q.date?.split("T")[0] || q.date });
      } catch (err: any) {
        setError(err.message || "Failed to load quotation");
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-neutral-400 text-sm mb-4">{error || "Quotation not found"}</p>
          <a href="/quotation" className="text-blue-400 hover:text-blue-300 underline text-sm">Back to Quotations</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <a href="/quotation" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </a>

        <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-2">
                <FileText className="w-3.5 h-3.5" /> {data.quotation_number}
              </span>
              <h1 className="text-2xl font-black">{data.customer_name}</h1>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              data.status === "draft" ? "bg-neutral-600 text-neutral-300" :
              data.status === "sent" ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" :
              data.status === "approved" ? "bg-green-500/10 text-green-400 border border-green-500/30" :
              "bg-gray-500/10 text-gray-400"
            }`}>{data.status}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {data.mobile_number && (
              <div className="flex items-center gap-2 text-neutral-300"><Phone className="w-4 h-4 text-blue-400" />{data.mobile_number}</div>
            )}
            {data.email && (
              <div className="flex items-center gap-2 text-neutral-300"><Mail className="w-4 h-4 text-blue-400" />{data.email}</div>
            )}
            {data.address && (
              <div className="flex items-center gap-2 text-neutral-300"><MapPin className="w-4 h-4 text-blue-400" />{data.address}</div>
            )}
            {data.project_name && (
              <div className="flex items-center gap-2 text-neutral-300"><ClipboardList className="w-4 h-4 text-blue-400" />{data.project_name}</div>
            )}
            <div className="flex items-center gap-2 text-neutral-300"><Calendar className="w-4 h-4 text-blue-400" />{data.date}</div>
            {data.salesperson_name && (
              <div className="flex items-center gap-2 text-neutral-300"><User className="w-4 h-4 text-blue-400" />{data.salesperson_name}</div>
            )}
          </div>

          {data.rooms?.map((room) => (
            <div key={room.id} className="bg-neutral-900 rounded-xl p-4 border border-neutral-700">
              <h3 className="font-bold text-blue-400 mb-2">{room.room_name}</h3>
              <div className="grid grid-cols-3 gap-2 text-xs text-neutral-400 mb-3">
                <span>Length: {room.length} ft</span>
                <span>Width: {room.width} ft</span>
                <span>Tile: {room.tile_size}</span>
              </div>
              {room.items?.length > 0 && (
                <div className="border-t border-neutral-700 pt-2 space-y-1">
                  {room.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs text-neutral-300">
                      <span>{item.description} x{item.quantity}</span>
                      <span>₹{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="border-t border-neutral-700 pt-4 space-y-2 text-sm">
            {data.discount > 0 && (
              <div className="flex justify-between text-neutral-300"><span>Discount</span><span className="text-red-400">-{data.discount}%</span></div>
            )}
            {data.gst_percentage > 0 && (
              <div className="flex justify-between text-neutral-300"><span>GST</span><span>{data.gst_percentage}%</span></div>
            )}
          </div>

          {data.notes && (
            <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-700">
              <p className="text-xs text-neutral-400">{data.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
