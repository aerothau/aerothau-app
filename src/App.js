import React, { useState, useEffect, useRef } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import {
  Users,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Bird,
  Plane,
  ChevronRight,
  ChevronLeft,
  Phone,
  Home,
  Map as MapIcon,
  Crosshair,
  Edit,
  Save,
  Trash2,
  Key,
  User,
  Clock,
  Send,
  Bell,
  Info,
  Printer,
  Grid,
  List as ListIcon,
  Locate,
  Layers,
  Camera,
  MessageSquare,
  Eye,
} from "lucide-react";

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBsSKSniPQ_2tfDsM1_lQPcEcsmMzACA8E",
  authDomain: "aerothau-goelands.firebaseapp.com",
  projectId: "aerothau-goelands",
  storageBucket: "aerothau-goelands.firebasestorage.app",
  messagingSenderId: "820757382798",
  appId: "1:820757382798:web:0908978d1f595a5767ebdf",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "aerothau-goelands";

const MAIN_WEBSITE_URL = "https://www.aerothau.fr";
const LOGO_URL = "https://aerothau.fr/wp-content/uploads/2025/10/New-Logo-Aerothau.png";

// --- DONNÉES DE DÉMONSTRATION ---
const INITIAL_USERS = [
  { username: "admin", password: "aerothau2024", role: "admin", name: "Aerothau Admin", id: 0 },
];

const MOCK_CLIENTS = [
  { id: 1, name: "Mairie de Sète", type: "Collectivité", address: "12 Rue de l'Hôtel de Ville, 34200 Sète", contact: "Jean Dupont", phone: "04 67 00 00 00", email: "contact@sete.fr", username: "mairie", password: "123" },
  { id: 2, name: "Camping Les Flots Bleus", type: "Privé", address: "Route de la Corniche, 34200 Sète", contact: "Marie Martin", phone: "06 12 34 56 78", email: "info@flotsbleus.com", username: "camping", password: "123" },
];

// --- COMPOSANTS UI ---

function Button({ children, variant = "primary", className = "", ...props }) {
  const baseStyle = "px-4 py-2 rounded-lg font-bold transition-all active:scale-95 flex items-center gap-2 justify-center";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700",
    outline: "border border-slate-300 text-slate-600 hover:bg-slate-50",
    purple: "bg-purple-600 text-white hover:bg-purple-700",
    ghost: "text-slate-500 hover:bg-slate-100 border-transparent",
  };
  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

function Card({ children, className = "", onClick }) {
  return <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>{children}</div>;
}

function Badge({ status }) {
  const styles = {
    Terminé: "bg-green-100 text-green-700",
    Planifié: "bg-blue-100 text-blue-700",
    "En attente": "bg-orange-100 text-orange-700",
    Annulé: "bg-red-100 text-red-700",
    non_present: "bg-slate-100 text-slate-600",
    present: "bg-red-100 text-red-700",
    sterilized_1: "bg-lime-100 text-lime-700",
    sterilized_2: "bg-green-100 text-green-700",
    sterilized: "bg-green-100 text-green-700",
    reported_by_client: "bg-purple-100 text-purple-700 border border-purple-200",
    Envoyé: "bg-green-100 text-green-700",
    Brouillon: "bg-slate-200 text-slate-700",
    temp: "bg-slate-400 text-white",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

// --- FORMULAIRES ---

function LoginForm({ onLogin, users, logoUrl }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    const userFound = users.find(u => u.username === username && u.password === password);
    if (userFound) onLogin(userFound);
    else setError("Identifiants invalides.");
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-8"><img src={logoUrl} alt="Logo" className="h-20 w-auto" /></div>
        <h1 className="text-2xl font-black text-center text-slate-900 mb-8 uppercase tracking-tighter">Aerothau<span className="text-sky-600">.</span></h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-sky-500" placeholder="Identifiant" />
          </div>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-sky-500" placeholder="Mot de passe" />
          </div>
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          <Button type="submit" className="w-full py-4">Se connecter</Button>
        </form>
        <div className="mt-8 pt-6 border-t text-center">
            <a href={MAIN_WEBSITE_URL} className="text-xs font-bold text-slate-400 hover:text-sky-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                <ChevronLeft size={14} /> Retour au site Aerothau.fr
            </a>
        </div>
      </div>
    </div>
  );
}

function ReportEditForm({ report, clients, onSave, onCancel }) {
  const [formData, setFormData] = useState({ title: "Rapport", date: new Date().toISOString().split("T")[0], type: "Intervention", status: "Brouillon", clientId: "", ...report });
  return (
    <div className="space-y-4">
      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Titre</label><input type="text" className="w-full p-2 border rounded-lg" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Client</label>
        <select className="w-full p-2 border rounded-lg bg-white" value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: parseInt(e.target.value) })}>
          <option value="">-- Choisir --</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Date</label><input type="date" className="w-full p-2 border rounded-lg" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
            <select className="w-full p-2 border rounded-lg bg-white" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <option value="Intervention">Intervention</option>
                <option value="Bilan">Bilan</option>
            </select>
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Annuler</Button>
        <Button variant="success" className="flex-1" onClick={() => onSave(formData)}>Enregistrer</Button>
      </div>
    </div>
  );
}

function NestEditForm({ nest, clients = [], onSave, onCancel, readOnly = false }) {
  const [formData, setFormData] = useState({ title: "", comments: "", eggs: 0, status: "present", ...nest });
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };
  if (readOnly) return (
    <div className="space-y-3">
      {nest.photo && <img src={nest.photo} alt="Nid" className="w-full h-40 object-cover rounded-lg" />}
      <h4 className="font-bold text-slate-800">{nest.address}</h4>
      <div className="flex gap-2"><Badge status={nest.status} /><span className="text-xs text-slate-500">{nest.eggs} œufs</span></div>
      {nest.comments && <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{nest.comments}</p>}
    </div>
  );
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase">Photo</label>
        {formData.photo ? (
            <div className="relative"><img src={formData.photo} className="w-full h-32 object-cover rounded-lg" /><button onClick={() => setFormData({...formData, photo: null})} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"><X size={14}/></button></div>
        ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed h-32 rounded-lg cursor-pointer hover:bg-slate-50"><Camera size={24} className="text-slate-400"/><span className="text-xs text-slate-400 mt-2">Ajouter photo</span><input type="file" className="hidden" onChange={handlePhotoUpload}/></label>
        )}
      </div>
      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Adresse</label><textarea className="w-full p-2 border rounded-lg text-sm" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}/></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Statut</label>
            <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="present">Présent</option>
                <option value="sterilized_1">1er Passage</option>
                <option value="sterilized_2">2ème Passage</option>
            </select>
        </div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Œufs</label><input type="number" className="w-full p-2 border rounded-lg text-sm" value={formData.eggs} onChange={(e) => setFormData({...formData, eggs: parseInt(e.target.value)})}/></div>
      </div>
      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Observations</label><textarea className="w-full p-2 border rounded-lg text-sm" value={formData.comments} onChange={(e) => setFormData({...formData, comments: e.target.value})}/></div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Fermer</Button>
        <Button variant="success" className="flex-1" onClick={() => onSave(formData)}>Sauver</Button>
      </div>
    </div>
  );
}

// --- CARTOGRAPHIE ---

function LeafletMap({ markers, isAddingMode, onMapClick = () => {}, onMarkerClick = () => {}, center, zoom }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current || !mapContainerRef.current) return;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.async = true;
    script.onload = () => {
      const L = window.L;
      const map = L.map(mapContainerRef.current).setView([43.4028, 3.696], 16);
      mapInstanceRef.current = map;
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      updateMarkers();
    };
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) mapInstanceRef.current.remove(); };
  }, []);

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !window.L) return;
    const L = window.L; markersLayerRef.current.clearLayers();
    markers.forEach(m => {
      let color = m.status === "present" ? "#ef4444" : (m.status === "temp" ? "#94a3b8" : "#22c55e");
      const icon = L.divIcon({
        className: "custom-icon",
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); ${m.status === 'temp' ? 'animation: pulse 1s infinite;' : ''}"></div>`,
        iconSize: [24, 24], iconAnchor: [12, 12]
      });
      const marker = L.marker([m.lat, m.lng], { icon }).on('click', (e) => { L.DomEvent.stopPropagation(e); onMarkerClick(m); });
      marker.addTo(markersLayerRef.current);
    });
  };

  useEffect(() => { if (mapInstanceRef.current && window.L) {
      const map = mapInstanceRef.current;
      map.off('click');
      map.on('click', (e) => onMapClick(e.latlng));
  }}, [onMapClick]);

  useEffect(() => { updateMarkers(); }, [markers]);
  useEffect(() => { if (mapInstanceRef.current && center) mapInstanceRef.current.setView([center.lat, center.lng], zoom || 18); }, [center]);

  return <div className={`w-full h-full ${isAddingMode ? 'cursor-crosshair' : ''}`} ref={mapContainerRef}><style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style></div>;
}

// --- VIEWS ---

function AdminDashboard({ interventions, clients, markers }) {
  const stats = {
    total: markers.length,
    neutralized: markers.filter(m => m.status.includes("sterilized")).length,
    pending: interventions.filter(i => i.status === "Planifié").length
  };
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Tableau de Bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-sky-600 text-white"><p className="text-sm opacity-80 uppercase font-bold">Total Nids</p><p className="text-4xl font-black">{stats.total}</p></Card>
        <Card className="p-6 bg-emerald-600 text-white"><p className="text-sm opacity-80 uppercase font-bold">Neutralisés</p><p className="text-4xl font-black">{stats.neutralized}</p></Card>
        <Card className="p-6 bg-orange-600 text-white"><p className="text-sm opacity-80 uppercase font-bold">Interventions</p><p className="text-4xl font-black">{stats.pending}</p></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
              <h3 className="font-bold mb-4">Progression par Client</h3>
              <div className="space-y-4">
                  {clients.map(c => {
                      const cMarkers = markers.filter(m => m.clientId === c.id);
                      const neut = cMarkers.filter(m => m.status.includes("sterilized")).length;
                      const perc = cMarkers.length > 0 ? (neut / cMarkers.length) * 100 : 0;
                      return (
                          <div key={c.id} className="space-y-1">
                              <div className="flex justify-between text-sm font-medium"><span>{c.name}</span><span>{Math.round(perc)}%</span></div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all" style={{width: `${perc}%`}}/></div>
                          </div>
                      );
                  })}
              </div>
          </Card>
      </div>
    </div>
  );
}

function MapInterface({ markers, onUpdateNest, clients }) {
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempMarker, setTempMarker] = useState(null);

  const handleSearch = async (e) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      const coords = searchQuery.replace(/,/g, " ").split(/\s+/).filter(Boolean);
      if (coords.length === 2) {
        const lat = parseFloat(coords[0]); const lng = parseFloat(coords[1]);
        if (!isNaN(lat) && !isNaN(lng)) { setMapCenter({ lat, lng }); setTempMarker({ id: "temp", lat, lng, address: `GPS : ${lat.toFixed(5)}, ${lng.toFixed(5)}`, status: "temp", eggs: 0 }); return; }
      }
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=fr`);
        const d = await r.json();
        if (d && d.length > 0) {
          const lat = parseFloat(d[0].lat); const lng = parseFloat(d[0].lon);
          setMapCenter({ lat, lng }); setTempMarker({ id: "temp", lat, lng, address: d[0].display_name.split(",").slice(0, 3).join(","), status: "temp", eggs: 0 });
        } else { alert("Adresse introuvable."); }
      } catch (err) { alert("Erreur de recherche."); }
    }
  };

  const handleMarkerClick = async (m) => {
    if (m.id === "temp") {
      const newM = { id: Date.now(), clientId: clients[0]?.id || 0, lat: m.lat, lng: m.lng, address: m.address, status: "present", eggs: 0 };
      setTempMarker(null); await onUpdateNest(newM); setSelectedMarker(newM);
    } else { setSelectedMarker(m); }
  };

  let allMarkers = [...markers]; if (tempMarker) allMarkers.push(tempMarker);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      <div className="bg-white p-3 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4 z-10">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Adresse ou GPS (ex: 43.40, 3.69)..." className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch} />
        </div>
        <Button variant={isAddingMode ? "danger" : "primary"} onClick={() => { setIsAddingMode(!isAddingMode); if (isAddingMode) setTempMarker(null); }}>{isAddingMode ? "Annuler" : "Ajouter un nid"}</Button>
      </div>
      <div className="flex-1 relative rounded-xl overflow-hidden border">
        {tempMarker && !isAddingMode && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-white px-4 py-2 rounded-full shadow-xl text-sm font-bold animate-bounce">Cliquez sur le point gris pour l'ajouter</div>}
        <LeafletMap markers={allMarkers} isAddingMode={isAddingMode} onMarkerClick={handleMarkerClick} onMapClick={async (ll) => {
            if (!isAddingMode) return;
            const newM = { id: Date.now(), clientId: clients[0]?.id || 0, lat: ll.lat, lng: ll.lng, address: "Nouveau nid", status: "present", eggs: 0 };
            await onUpdateNest(newM); setSelectedMarker(newM); setIsAddingMode(false);
        }} center={mapCenter} />
        {selectedMarker && selectedMarker.id !== "temp" && (
          <div className="absolute top-4 left-4 z-[500] w-72 md:w-80 max-h-[calc(100%-2rem)] flex flex-col overflow-hidden">
            <Card className="shadow-2xl border-0 flex flex-col max-h-full overflow-hidden">
              <div className="bg-slate-800 p-3 text-white flex justify-between items-center rounded-t-xl shrink-0"><span className="font-bold flex items-center gap-2"><MapIcon size={16} /> Détails Nid</span><button onClick={() => setSelectedMarker(null)} className="hover:bg-white/20 p-1 rounded"><X size={16} /></button></div>
              <div className="p-4 overflow-y-auto shrink"><NestEditForm nest={selectedMarker} clients={clients} onSave={async (u) => { await onUpdateNest(u); setSelectedMarker(null); }} onCancel={() => setSelectedMarker(null)} /></div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function NestManagement({ markers, onUpdateNest, onDeleteNest, clients }) {
  const [selectedNest, setSelectedNest] = useState(null);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestion des Nids</h2>
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500"><tr><th className="p-4">Adresse</th><th className="p-4">Status</th><th className="p-4">Œufs</th><th className="p-4">Actions</th></tr></thead>
          <tbody className="divide-y">
            {markers.map((m) => (
              <tr key={m.id}><td className="p-4 font-medium">{m.address}</td><td className="p-4"><Badge status={m.status} /></td><td className="p-4 font-bold">{m.eggs}</td><td className="p-4 flex gap-2"><button onClick={() => setSelectedNest(m)} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Edit size={16} /></button><button onClick={() => { if (window.confirm("Supprimer ce nid ?")) onDeleteNest(m); }} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button></td></tr>
            ))}
          </tbody>
        </table>
      </Card>
      {selectedNest && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"><h3 className="font-bold text-lg mb-4">Modifier Nid</h3><NestEditForm nest={selectedNest} clients={clients} onSave={async (d) => { await onUpdateNest(d); setSelectedNest(null); }} onCancel={() => setSelectedNest(null)} /></div>
        </div>
      )}
    </div>
  );
}

function ClientManagement({ clients, setSelectedClient, setView, onCreateClient, onDeleteClient }) {
  const [isCreating, setIsCreating] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Fiches Clients</h2><Button onClick={() => setIsCreating(true)}><Plus size={18} /> Nouveau Client</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((c) => (
          <Card key={c.id} className="p-6 cursor-pointer hover:shadow-md transition-all group" onClick={() => { setSelectedClient(c); setView("client-detail"); }}>
            <div className="flex justify-between items-start mb-4"><div className="p-2 bg-sky-50 text-sky-600 rounded-lg"><Users size={20} /></div><span className="text-[10px] font-bold uppercase text-slate-400">{c.type}</span></div>
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-sky-600">{c.name}</h3>
            <p className="text-sm text-slate-500 mt-2 truncate"><MapPin size={14} className="inline mr-1" /> {c.address}</p>
          </Card>
        ))}
      </div>
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="font-bold text-lg mb-4">Nouveau Client</h3><ClientEditForm client={{ id: Date.now(), name: "", type: "Privé", address: "", contact: "", phone: "", email: "" }} onSave={(d) => { onCreateClient(d); setIsCreating(false); }} onCancel={() => setIsCreating(false)} /></div>
        </div>
      )}
    </div>
  );
}

function ClientDetail({ selectedClient, setView, interventions, reports, markers, onUpdateClient, onDeleteClient }) {
    const [isEditing, setIsEditing] = useState(false);
    const cInt = interventions.filter(i => i.clientId === selectedClient.id);
    const cRep = reports.filter(r => r.clientId === selectedClient.id);
    return (
        <div className="space-y-6">
            <Button variant="secondary" onClick={() => setView("clients")}>&larr; Retour</Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card className="p-6">
                        {isEditing ? <ClientEditForm client={selectedClient} onSave={(d) => {onUpdateClient(d); setIsEditing(false);}} onCancel={() => setIsEditing(false)}/> : (
                            <>
                                <h2 className="text-xl font-bold mb-4">{selectedClient.name}</h2>
                                <div className="space-y-4 text-sm text-slate-600">
                                    <p><MapPin size={14} className="inline mr-2"/> {selectedClient.address}</p>
                                    <p><Phone size={14} className="inline mr-2"/> {selectedClient.phone}</p>
                                    <div className="bg-slate-50 p-3 rounded-lg border">
                                        <p className="text-[10px] font-bold uppercase text-slate-400">Identifiant : {selectedClient.username}</p>
                                        <p className="text-[10px] font-bold uppercase text-slate-400">Mot de passe : {selectedClient.password}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 mt-6">
                                    <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>Modifier</Button>
                                    <Button variant="danger" className="w-full" onClick={() => {if(window.confirm("Supprimer ce client ?")){onDeleteClient(selectedClient); setView("clients");}}}>Supprimer</Button>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6"><h3 className="font-bold mb-4">Interventions</h3><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[10px] font-bold uppercase"><tr><th className="p-4">Date</th><th className="p-4">Statut</th><th className="p-4">Notes</th></tr></thead><tbody className="divide-y">{cInt.map(i => <tr key={i.id}><td className="p-4">{i.date}</td><td className="p-4"><Badge status={i.status}/></td><td className="p-4 italic text-slate-500">{i.notes}</td></tr>)}</tbody></table></Card>
                </div>
            </div>
        </div>
    );
}

function ScheduleView({ interventions, clients, onUpdateIntervention, onDeleteIntervention }) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingInt, setEditingInt] = useState(null);
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Planning</h2><Button onClick={() => setIsCreating(true)}><Plus size={16}/> Nouvelle</Button></div>
            <Card className="overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase"><tr><th className="p-4">Date</th><th className="p-4">Client</th><th className="p-4">Statut</th><th className="p-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y">
                        {interventions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(i => (
                            <tr key={i.id}>
                                <td className="p-4 font-bold">{i.date}</td>
                                <td className="p-4">{clients.find(c => c.id === i.clientId)?.name}</td>
                                <td className="p-4"><Badge status={i.status}/></td>
                                <td className="p-4 flex justify-end gap-2"><button onClick={() => setEditingInt(i)} className="p-2 text-blue-600"><Edit size={16}/></button><button onClick={() => {if(window.confirm("Supprimer ?")) onDeleteIntervention(i);}} className="p-2 text-red-600"><Trash2 size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            {(isCreating || editingInt) && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="font-bold text-lg mb-4">{isCreating ? "Nouvelle Intervention" : "Modifier"}</h3><InterventionEditForm intervention={editingInt || {id: Date.now()}} clients={clients} onSave={async (d) => { await onUpdateIntervention(d); setEditingInt(null); setIsCreating(false); }} onCancel={() => {setEditingInt(null); setIsCreating(false);}} /></div>
                </div>
            )}
        </div>
    );
}

function ReportsView({ reports, clients, onUpdateReport, onDeleteReport }) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingRep, setEditingRep] = useState(null);
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Rapports</h2><Button onClick={() => setIsCreating(true)}><Plus size={16}/> Nouveau Rapport</Button></div>
            <Card className="overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase"><tr><th className="p-4">Nom</th><th className="p-4">Client</th><th className="p-4">Statut</th><th className="p-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y">
                        {reports.map(r => (
                            <tr key={r.id}>
                                <td className="p-4 font-medium flex items-center gap-2"><FileText size={16} className="text-slate-400"/> {r.title}</td>
                                <td className="p-4">{clients.find(c => c.id === r.clientId)?.name}</td>
                                <td className="p-4"><Badge status={r.status}/></td>
                                <td className="p-4 flex justify-end gap-2"><button onClick={() => setEditingRep(r)} className="p-2 text-blue-600"><Edit size={16}/></button><button onClick={() => {if(window.confirm("Supprimer ?")) onDeleteReport(r);}} className="p-2 text-red-600"><Trash2 size={16}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            {(isCreating || editingRep) && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md"><h3 className="font-bold text-lg mb-4">{isCreating ? "Nouveau Document" : "Modifier"}</h3><ReportEditForm report={editingRep || {id: Date.now()}} clients={clients} onSave={async (d) => { await onUpdateReport(d); setEditingRep(null); setIsCreating(false); }} onCancel={() => {setEditingRep(null); setIsCreating(false);}} /></div>
                </div>
            )}
        </div>
    );
}

function ClientSpace({ user, markers }) {
    const myMarkers = markers.filter(m => m.clientId === user.clientId);
    const neut = myMarkers.filter(m => m.status.includes("sterilized")).length;
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10"><h2 className="text-3xl font-bold mb-2">Bonjour, {user.name}</h2><p className="text-purple-100">Espace de suivi de votre parc de goélands.</p></div>
                <Bell className="absolute -right-8 -bottom-8 h-48 w-48 text-white/10 rotate-12" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="p-4 h-[500px] flex flex-col"><h3 className="font-bold mb-4 flex items-center gap-2"><MapIcon size={20}/> Votre Carte</h3><div className="flex-1 overflow-hidden rounded-xl border"><LeafletMap markers={myMarkers} isAddingMode={false}/></div></Card>
                </div>
                <div className="space-y-6">
                    <Card className="p-4 border-l-4 border-emerald-500"><p className="text-xs font-bold text-slate-500 uppercase">Neutralisés</p><p className="text-2xl font-black">{neut} / {myMarkers.length}</p></Card>
                    <Card className="p-6 max-h-[350px] flex flex-col"><h3 className="text-sm font-bold uppercase mb-4">Liste des Nids</h3><div className="space-y-2 overflow-y-auto pr-2">{myMarkers.map(m => <div key={m.id} className="p-2 bg-slate-50 rounded flex justify-between items-center text-sm"><span className="truncate flex-1">{m.address}</span><Badge status={m.status}/></div>)}</div></Card>
                </div>
            </div>
        </div>
    );
}

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) {} };
    initAuth();
    onAuthStateChanged(auth, (u) => { if (u) setIsFirebaseReady(true); });
  }, []);

  useEffect(() => {
    if (!isFirebaseReady) return;
    const unsub = [
      onSnapshot(collection(db, "artifacts", appId, "public", "data", "clients"), (snap) => {
        if (!snap.empty) setClients(snap.docs.map(doc => ({ ...doc.data(), id: parseInt(doc.id) })));
        else MOCK_CLIENTS.forEach(c => setDoc(doc(db, "artifacts", appId, "public", "data", "clients", c.id.toString()), c));
      }),
      onSnapshot(collection(db, "artifacts", appId, "public", "data", "interventions"), (snap) => {
        setInterventions(snap.docs.map(doc => ({ ...doc.data(), id: parseInt(doc.id) })));
      }),
      onSnapshot(collection(db, "artifacts", appId, "public", "data", "markers"), (snap) => {
        setMarkers(snap.docs.map(doc => ({ ...doc.data(), id: parseInt(doc.id) })));
      }),
      onSnapshot(collection(db, "artifacts", appId, "public", "data", "reports"), (snap) => {
        setReports(snap.docs.map(doc => ({ ...doc.data(), id: parseInt(doc.id) })));
      })
    ];
    return () => unsub.forEach(fn => fn());
  }, [isFirebaseReady]);

  const availableUsers = [
    ...INITIAL_USERS,
    ...clients.filter(c => c.username && c.password).map(c => ({ id: c.id, username: c.username, password: c.password, role: "client", name: c.name, clientId: c.id }))
  ];

  if (!user) return <LoginForm onLogin={setUser} users={availableUsers} logoUrl={LOGO_URL} />;

  const menu = user.role === "admin" ? [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "map", label: "Carte", icon: MapIcon },
    { id: "nests", label: "Gestion Nids", icon: Bird },
    { id: "clients", label: "Fiches Clients", icon: Users },
    { id: "schedule", label: "Planning", icon: Calendar },
    { id: "reports", label: "Rapports", icon: FileText },
  ] : [{ id: "dashboard", label: "Mon Espace", icon: Home }];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8"><img src={LOGO_URL} alt="Logo" className="h-10 w-auto" /><span className="text-xl font-bold">Aerothau</span></div>
          <nav className="flex-1 space-y-2">
            {menu.map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === item.id || (item.id === "clients" && view === "client-detail") ? "bg-sky-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                <item.icon size={20} /> <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={() => setUser(null)} className="flex items-center gap-3 text-red-400 hover:bg-slate-800 p-4 rounded-lg mt-auto transition-colors font-bold"><LogOut size={20} /> Déconnexion</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b p-4 flex lg:hidden items-center justify-between sticky top-0 z-20"><button onClick={() => setIsSidebarOpen(true)} className="text-slate-600"><Menu size={24} /></button><span className="font-bold">Aerothau</span><div className="w-8"></div></header>
        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {user.role === "admin" ? (
              <>
                {view === "dashboard" && <AdminDashboard interventions={interventions} clients={clients} markers={markers} />}
                {view === "map" && <MapInterface markers={markers} clients={clients} onUpdateNest={async (n) => await setDoc(doc(db, "artifacts", appId, "public", "data", "markers", n.id.toString()), n)} />}
                {view === "nests" && <NestManagement markers={markers} clients={clients} onUpdateNest={async (n) => await setDoc(doc(db, "artifacts", appId, "public", "data", "markers", n.id.toString()), n)} onDeleteNest={async (n) => await deleteDoc(doc(db, "artifacts", appId, "public", "data", "markers", n.id.toString()))} />}
                {view === "clients" && <ClientManagement clients={clients} setSelectedClient={setSelectedClient} setView={setView} onCreateClient={async (c) => await setDoc(doc(db, "artifacts", appId, "public", "data", "clients", c.id.toString()), c)} onDeleteClient={async (c) => await deleteDoc(doc(db, "artifacts", appId, "public", "data", "clients", c.id.toString()))} />}
                {view === "client-detail" && <ClientDetail selectedClient={selectedClient} setView={setView} interventions={interventions} reports={reports} markers={markers} onUpdateClient={async (c) => await setDoc(doc(db, "artifacts", appId, "public", "data", "clients", c.id.toString()), c)} onDeleteClient={async (c) => await deleteDoc(doc(db, "artifacts", appId, "public", "data", "clients", c.id.toString()))} />}
                {view === "schedule" && <ScheduleView interventions={interventions} clients={clients} onUpdateIntervention={async (i) => await setDoc(doc(db, "artifacts", appId, "public", "data", "interventions", i.id.toString()), i)} onDeleteIntervention={async (i) => await deleteDoc(doc(db, "artifacts", appId, "public", "data", "interventions", i.id.toString()))} />}
                {view === "reports" && <ReportsView reports={reports} clients={clients} onUpdateReport={async (r) => await setDoc(doc(db, "artifacts", appId, "public", "data", "reports", r.id.toString()), r)} onDeleteReport={async (r) => await deleteDoc(doc(db, "artifacts", appId, "public", "data", "reports", r.id.toString()))} />}
              </>
            ) : <ClientSpace user={user} markers={markers} />}
          </div>
        </div>
      </main>
    </div>
  );
}