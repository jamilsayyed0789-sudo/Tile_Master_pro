"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { motion } from "framer-motion";
import { Ruler, Calculator, Phone, Mail, User, Send, Maximize2, RotateCw, ZoomIn } from "lucide-react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useParams } from "next/navigation";

function fallbackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 32, 0);
    ctx.lineTo(i * 32, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * 32);
    ctx.lineTo(256, i * 32);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function Room3D({ length, width, tileImageUrl }: { length: number; width: number; tileImageUrl: string | null }) {
  const roomLength = Math.max(3, length * 0.3048);
  const roomWidth = Math.max(3, width * 0.3048);
  const wallHeight = 2.7;

  const mats = useMemo(() => {
    let tex: THREE.Texture;
    if (tileImageUrl) {
      try {
        const loader = new THREE.TextureLoader();
        tex = loader.load(tileImageUrl);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.anisotropy = 16;
        tex.repeat.set(Math.ceil(length * 3), Math.ceil(width * 3));
      } catch {
        tex = fallbackTexture();
      }
    } else {
      tex = fallbackTexture();
    }

    const wallTex = tex.clone();
    wallTex.repeat.set(Math.ceil(length * 3), 8);

    return {
      floor: new THREE.MeshPhysicalMaterial({ 
        map: tex, 
        roughness: 0.15, 
        metalness: 0.05,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5
      }),
      wall: new THREE.MeshPhysicalMaterial({ 
        map: wallTex, 
        roughness: 0.12, 
        metalness: 0.05,
        clearcoat: 0.8,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.5
      }),
    };
  }, [tileImageUrl, length, width]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[roomLength, roomWidth]} />
        <primitive object={mats.floor} attach="material" />
      </mesh>

      <mesh position={[0, wallHeight / 2, -roomWidth / 2]} receiveShadow castShadow>
        <boxGeometry args={[roomLength, wallHeight, 0.05]} />
        <primitive object={mats.wall.clone()} attach="material" />
      </mesh>

      <mesh position={[-roomLength / 2, wallHeight / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.05, wallHeight, roomWidth]} />
        <primitive object={mats.wall.clone()} attach="material" />
      </mesh>

      <mesh position={[roomLength / 2, wallHeight / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.05, wallHeight, roomWidth]} />
        <primitive object={mats.wall.clone()} attach="material" />
      </mesh>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={Math.max(roomLength, roomWidth) * 1.5} blur={2} />
    </group>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-3, 4, -3]} intensity={0.3} />
    </>
  );
}

function SceneControls() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(4, 3, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

export default function PublicTilePage() {
  const params = useParams();
  const tileId = params.id as string;

  const [tile, setTile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [show3D, setShow3D] = useState(false);

  const [length, setLength] = useState(12);
  const [width, setWidth] = useState(10);
  const [unit, setUnit] = useState<"feet" | "meters">("feet");
  const [roomType, setRoomType] = useState("hall");
  const [quantity, setQuantity] = useState(0);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  const [quoteName, setQuoteName] = useState("");
  const [quotePhone, setQuotePhone] = useState("");
  const [quoteEmail, setQuoteEmail] = useState("");
  const [quoteSent, setQuoteSent] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteError, setQuoteError] = useState("");

  const apiBase = "/api";

  useEffect(() => {
    if (!tileId) return;
    fetch(`${apiBase}/tile/${tileId}`)
      .then(r => r.json())
      .then(d => { setTile(d); setLoading(false); })
      .catch(() => { setError("Tile not found"); setLoading(false); });
  }, [tileId]);

  const calculateQuantity = async () => {
    try {
      const res = await fetch(`${apiBase}/tile/${tileId}/visualize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ length, width, unit, room_type: roomType }),
      });
      const data = await res.json();
      setQuantity(data.tile_quantity);
      return data;
    } catch {
      const l = length * (unit === "meters" ? 3.28084 : 1);
      const w = width * (unit === "meters" ? 3.28084 : 1);
      setQuantity(Math.ceil(l * w * 1.1));
    }
  };

  const handleSee3D = async () => {
    const data = await calculateQuantity();
    setShow3D(true);
  };

  const sendQuote = async () => {
    if (!quoteName.trim() || !quotePhone.trim()) {
      setQuoteError("Name and phone number are required");
      return;
    }
    setQuoteSending(true);
    setQuoteError("");
    try {
      const res = await fetch(`${apiBase}/tile/${tileId}/request-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: quoteName,
          customer_phone: quotePhone,
          customer_email: quoteEmail || undefined,
          length: length,
          width: width,
          room_type: roomType,
          quantity: quantity || Math.ceil(length * width * 1.1),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setQuoteSent(true);
    } catch {
      setQuoteError("Failed to send. Please try again.");
    } finally {
      setQuoteSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
      <div className="text-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p>Loading...</p></div>
    </div>
  );

  if (error || !tile) return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
      <div className="text-center"><p className="text-4xl mb-4">🔍</p><p className="text-xl font-bold mb-2">Tile Not Found</p><p className="text-neutral-400">This tile may have been removed or the link is invalid.</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto p-6 pt-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-neutral-900/60 border border-white/5 rounded-2xl overflow-hidden mb-6">
            {tile.tile_image_url && (
              <div className="aspect-video bg-neutral-800 relative">
                <img src={tile.tile_image_url} alt={tile.tile_name}
                  className="w-full h-full object-contain" />
              </div>
            )}
            <div className="p-6">
              <h1 className="text-2xl font-bold">{tile.tile_name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-400">
                <span>SKU: {tile.tile_number}</span>
                <span>Size: {tile.tile_size}</span>
                {tile.finish && <span>Finish: {tile.finish}</span>}
              </div>
              {tile.price_per_sqft != null && (
                <div className="mt-3 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
                  <span className="text-emerald-400 font-bold text-lg">&#8377;{tile.price_per_sqft.toFixed(0)}</span>
                  <span className="text-emerald-300/70 text-sm">/ sq.ft</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6 mb-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Ruler className="w-5 h-5 text-indigo-400" /> Your Room Dimensions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Length</label>
                <input type="number" value={length} onChange={e => setLength(parseFloat(e.target.value) || 0)}
                  min={1} max={100} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5" />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Width</label>
                <input type="number" value={width} onChange={e => setWidth(parseFloat(e.target.value) || 0)}
                  min={1} max={100} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5" />
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm text-neutral-400 mb-1">Unit</label>
                <div className="flex bg-neutral-800 rounded-lg overflow-hidden">
                  <button onClick={() => setUnit("feet")}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${unit === "feet" ? "bg-indigo-600 text-white" : "text-neutral-400"}`}>Feet</button>
                  <button onClick={() => setUnit("meters")}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${unit === "meters" ? "bg-indigo-600 text-white" : "text-neutral-400"}`}>Meters</button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-neutral-400 mb-1">Room Type</label>
                <select value={roomType} onChange={e => setRoomType(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5">
                  {["Hall", "Kitchen", "Bedroom", "Bathroom", "Wall"].map(t => (
                    <option key={t} value={t.toLowerCase()}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSee3D}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                <Maximize2 className="w-4 h-4" /> See in 3D
              </button>
              <button onClick={calculateQuantity}
                className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-medium transition-colors flex items-center gap-2">
                <Calculator className="w-4 h-4" /> Calculate
              </button>
            </div>

            {quantity > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-1">
                <p className="text-sm text-indigo-300">Tiles needed: <span className="font-bold text-lg">{quantity}</span> <span className="text-indigo-400/60">(incl. 10% waste)</span></p>
                <p className="text-xs text-neutral-500">For a {length}{unit} × {width}{unit} {roomType}</p>
                {tile.price_per_sqft != null && (() => {
                  const areaInSqft = unit === "meters"
                    ? length * width * 10.764
                    : length * width;
                  const estimatedCost = Math.ceil(areaInSqft * tile.price_per_sqft * 1.1);
                  return (
                    <div className="mt-2 pt-2 border-t border-indigo-500/20">
                      <p className="text-sm text-emerald-300">Estimated Cost: <span className="font-bold text-lg">&#8377;{estimatedCost.toLocaleString('en-IN')}</span></p>
                      <p className="text-xs text-neutral-500">Based on &#8377;{tile.price_per_sqft}/sq.ft &times; {areaInSqft.toFixed(1)} sq.ft (incl. 10% waste)</p>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </div>

          {show3D && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="bg-neutral-900/60 border border-white/5 rounded-2xl overflow-hidden mb-6">
              <div className="h-[400px] md:h-[500px] w-full">
                <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [4, 3, 5], fov: 50 }}>
                  <Suspense fallback={null}>
                    <SceneLighting />
                    <SceneControls />
                    <OrbitControls enablePan={true} enableZoom={true}
                      minDistance={2} maxDistance={15}
                      target={[0, 0.5, 0]} />
                    <Environment preset="apartment" />
                    <Room3D length={length} width={width}
                      tileImageUrl={tile.tile_image_url || ""} />
                  </Suspense>
                </Canvas>
              </div>
              <div className="p-3 flex justify-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><RotateCw className="w-3 h-3" /> Drag to rotate</span>
                <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Scroll to zoom</span>
              </div>
            </motion.div>
          )}

          {!quoteSent ? (
            <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Phone className="w-5 h-5 text-emerald-400" /> Request a Quote</h2>
              {quoteError && <p className="text-red-400 text-sm mb-3">{quoteError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1"><User className="w-3 h-3 inline mr-1" /> Name *</label>
                  <input value={quoteName} onChange={e => setQuoteName(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1"><Phone className="w-3 h-3 inline mr-1" /> Phone *</label>
                  <input value={quotePhone} onChange={e => setQuotePhone(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5" placeholder="Your phone number" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-neutral-400 mb-1"><Mail className="w-3 h-3 inline mr-1" /> Email (optional)</label>
                <input value={quoteEmail} onChange={e => setQuoteEmail(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5" placeholder="your@email.com" />
              </div>
              <button onClick={sendQuote} disabled={quoteSending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {quoteSending ? "Sending..." : <><Send className="w-4 h-4" /> Request Quote</>}
              </button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-900/20 border border-emerald-800/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Quote Request Sent!</h2>
              <p className="text-neutral-400">The dealer will contact you shortly with a personalized quote for {tile.tile_name}.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
