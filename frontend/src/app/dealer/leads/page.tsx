"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, User, Calendar, Ruler, Layers, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Lead {
  id: number;
  tile_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  room_length: number;
  room_width: number;
  room_type: string | null;
  tiles_required: number | null;
  created_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = "/api";

  useEffect(() => {
    fetch(`${baseUrl}/tile/leads/list`)
      .then(r => r.json())
      .then(d => { setLeads(d.leads || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-4xl mx-auto pt-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Phone className="w-7 h-7 text-emerald-400" />
              Customer Leads
            </h1>
            <p className="text-neutral-400 text-sm mt-1">Quote requests from customers who scanned your QR codes</p>
          </div>
          <Link href="/catalog/search" className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-neutral-500">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-neutral-600" />
            </div>
            <p className="text-lg font-medium">No leads yet</p>
            <p className="text-neutral-500 text-sm mt-1">Leads will appear when customers scan your QR codes and request quotes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <motion.div key={lead.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/50 border border-white/5 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{lead.customer_name}</p>
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-neutral-800 px-2.5 py-1 rounded-full text-neutral-400 capitalize">{lead.room_type || "room"}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-neutral-800/50 rounded-lg p-2.5">
                    <p className="text-xs text-neutral-500">Phone</p>
                    <a href={`tel:${lead.customer_phone}`} className="text-emerald-400 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {lead.customer_phone}
                    </a>
                  </div>
                  {lead.customer_email && (
                    <div className="bg-neutral-800/50 rounded-lg p-2.5">
                      <p className="text-xs text-neutral-500">Email</p>
                      <a href={`mailto:${lead.customer_email}`} className="text-indigo-400 hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {lead.customer_email}
                      </a>
                    </div>
                  )}
                  <div className="bg-neutral-800/50 rounded-lg p-2.5">
                    <p className="text-xs text-neutral-500">Room Size</p>
                    <p className="flex items-center gap-1"><Ruler className="w-3 h-3 text-neutral-400" /> {lead.room_length}×{lead.room_width} ft</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-2.5">
                    <p className="text-xs text-neutral-500">Tiles Needed</p>
                    <p className="flex items-center gap-1"><Layers className="w-3 h-3 text-neutral-400" /> {lead.tiles_required || "—"}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
