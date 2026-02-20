import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  query
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
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Activity,
  Cloud,
  Wind,
  Upload,
  File,
  FileCheck
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
const MAP_CENTER_DEFAULT = { lat: 43.4028, lng: 3.696 }; // Sète

// --- CONSTANTES ---
const INITIAL_USERS = [
  { username: "admin", password: "aerothau2024", role: "admin", name: "Aerothau Admin", id: 0 },
];

const MOCK_CLIENTS = [
  { id: 1, name: "Mairie de Sète", type: "Collectivité", address: "12 Rue de l'Hôtel de Ville, 34200 Sète", contact: "Jean Dupont", phone: "04 67 00 00 00", email: "contact@sete.fr", username: "mairie", password: "123" },
];

// --- UTILITAIRES ---
const loadSheetJS = () => {
  return new Promise((resolve) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement("script");
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    document.body.appendChild(script);
  });
};

const generatePDF = (type, data, extraData = {}) => {
    const loadScript = (src) => new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        document.body.appendChild(script);
    });

    Promise.all([
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js")
    ]).then(() => {
        if (!window.jspdf) return;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString('fr-FR');
        
        doc.setFillColor(15, 23, 42); 
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("AEROTHAU", 20, 25);
        doc.setFontSize(10);
        doc.text(`Document généré le : ${today}`, 190, 25, { align: 'right' });

        if (type === 'nest_detail') {
            const nest = data;
            const clientName = extraData.clientName || "Inconnu";
            doc.text("FICHE D'IDENTIFICATION NID", 20, 50);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            
            let y = 65;
            doc.text(`Titre : ${nest.title || "Nid #" + nest.id}`, 20, y); y += 7;
            doc.text(`Client : ${clientName}`, 20, y); y += 7;
            doc.text(`Adresse : ${nest.address}`, 20, y); y += 7;
            doc.text(`Coordonnées GPS : ${nest.lat?.toFixed(6)}, ${nest.lng?.toFixed(6)}`, 20, y); y += 7;
            doc.text(`Statut : ${nest.status}`, 20, y); y += 7;
            doc.text(`Œufs : ${nest.eggs}`, 20, y); y += 7;
            
            if(nest.lieux) { doc.text(`Lieux : ${nest.lieux}`, 20, y); y += 7; }
            if(nest.dateVisite) { doc.text(`Date visite : ${nest.dateVisite}`, 20, y); y += 7; }
            if(nest.nbAdultes) { doc.text(`Nb Adultes : ${nest.nbAdultes}`, 20, y); y += 7; }
            if(nest.nbPoussins) { doc.text(`Nb Poussins : ${nest.nbPoussins}`, 20, y); y += 7; }
            
            const notesLines = doc.splitTextToSize(`Notes : ${nest.comments || "Aucune"}`, 170);
            doc.text(notesLines, 20, y);
            y += (notesLines.length * 7);

            if (nest.photo) { try { doc.addImage(nest.photo, 'JPEG', 20, y + 5, 100, 75); } catch(e) {} }
            doc.save(`Fiche_Nid_${nest.id}.pdf`);
        } else if (type === 'complete_report') {
            const client = extraData.client || { name: "Client Inconnu" };
            const markers = extraData.markers || [];
            const interventions = extraData.interventions || [];
            doc.text("RAPPORT D'ACTIVITÉ COMPLET", 20, 50);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.text(`Client : ${client.name}`, 20, 65);
            doc.setFontSize(10);
            doc.text(client.address || "", 20, 72);
            const totalEggs = markers.reduce((acc, curr) => acc + (curr.eggs || 0), 0);
            const treated = markers.filter(m => m.status && m.status.includes('sterilized')).length;
            doc.setFillColor(240, 240, 240);
            doc.rect(20, 80, 170, 20, 'F');
            doc.text(`Total Nids : ${markers.length}`, 30, 92);
            doc.text(`Traités : ${treated}`, 80, 92);
            doc.text(`Œufs stérilisés : ${totalEggs}`, 130, 92);
            const nestRows = markers.map(m => [m.title || "Nid", m.address, m.status, m.eggs]);
            doc.autoTable({ startY: 120, head: [['Référence', 'Localisation', 'Statut', 'Oeufs']], body: nestRows, theme: 'grid', headStyles: { fillColor: [14, 165, 233] }, });
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.text("Historique Interventions", 20, finalY);
            const intRows = interventions.map(i => [i.date, i.status, i.technician || "-", i.notes || ""]);
            doc.autoTable({ startY: finalY + 5, head: [['Date', 'Statut', 'Agent', 'Notes']], body: intRows, theme: 'grid', headStyles: { fillColor: [15, 23, 42] }, });
            doc.save(`Rapport_Complet_${client.name.replace(/\s+/g, '_')}.pdf`);
        }
    }).catch(e => console.error("PDF Error", e));
};

// --- COMPOSANTS UI DE BASE ---

const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const baseStyle = "px-4 py-2 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 justify-center disabled:opacity-50";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-md",
    secondary: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 shadow-md",
    outline: "border border-slate-300 text-slate-600 hover:bg-slate-50",
    sky: "bg-sky-600 text-white hover:bg-sky-700 shadow-lg shadow-sky-200",
    ghost: "text-slate-500 hover:bg-slate-100",
  };
  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>{children}</div>
);

const Badge = ({ status }) => {
  const styles = {
    Terminé: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    Planifié: "bg-sky-100 text-sky-700 border border-sky-200",
    "En attente": "bg-orange-100 text-orange-700 border border-orange-200",
    Annulé: "bg-red-100 text-red-700 border border-red-200",
    present: "bg-red-100 text-red-700 border border-red-200",
    present_high: "bg-red-100 text-red-700 border border-red-200",
    present_medium: "bg-orange-100 text-orange-700 border border-orange-200",
    present_low: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    non_present: "bg-slate-100 text-slate-500 border border-slate-200",
    sterilized_1: "bg-lime-100 text-lime-700 border border-lime-200",
    sterilized_2: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    reported_by_client: "bg-purple-100 text-purple-700 border border-purple-200",
    temp: "bg-slate-500 text-white animate-pulse border-2 border-dashed border-white",
  };
  
  const labels = {
    present: "Présent (Actif)",
    present_high: "Priorité Haute",
    present_medium: "Priorité Moyenne",
    present_low: "Priorité Faible",
    non_present: "Non présent",
    sterilized_1: "1er Passage",
    sterilized_2: "2ème Passage",
    reported_by_client: "Signalement",
    temp: "À valider"
  };

  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || "bg-gray-100 text-gray-600"}`}>{labels[status] || status}</span>;
};

const Toast = ({ message, type, onClose }) => {
    useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
    const bg = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';
    const icon = type === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>;
    return <div className={`fixed bottom-4 right-4 ${bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 z-[2000]`}>{icon} <span className="font-bold">{message}</span></div>;
};

// --- COMPOSANT LOGIN ---

const LoginForm = ({ onLogin, users, logoUrl }) => {
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
      <Card className="p-10 w-full max-w-md shadow-2xl border-0 ring-1 ring-slate-100">
        <div className="flex justify-center mb-8"><img src={logoUrl} alt="Logo" className="h-20 w-auto" /></div>
        <h1 className="text-3xl font-black text-center text-slate-900 mb-2 uppercase tracking-tighter">Aerothau</h1>
        <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Espace Sécurisé</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-500 text-sm font-medium transition-all" placeholder="Identifiant" />
          </div>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-500 text-sm font-medium transition-all" placeholder="Mot de passe" />
          </div>
          {error && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg text-center">{error}</p>}
          <Button type="submit" variant="sky" className="w-full py-4 uppercase tracking-widest text-xs">Connexion</Button>
        </form>
      </Card>
    </div>
  );
};

// --- COMPOSANTS DE FORMULAIRES ET ÉDITION ---

const ClientEditForm = ({ client, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ ...client });
    return (
      <div className="space-y-4 text-slate-800">
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nom</label><input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
              <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="Privé">Privé</option><option value="Collectivité">Collectivité</option><option value="Syndic">Syndic</option>
              </select>
          </div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</label><input type="text" className="w-full p-2 border rounded-lg text-sm" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
        </div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Adresse</label><input type="text" className="w-full p-2 border rounded-lg text-sm" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
        <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 text-center">Accès Espace Client</h4>
          <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Identifiant" className="p-2 border rounded-lg bg-white text-xs" value={formData.username || ""} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              <input type="text" placeholder="Pass" className="p-2 border rounded-lg bg-white text-xs" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Annuler</Button>
          <Button variant="success" className="flex-1" onClick={() => onSave(formData)}>Enregistrer</Button>
        </div>
      </div>
    );
};

const NestEditForm = ({ nest, clients = [], onSave, onCancel, onDelete, readOnly = false, onGeneratePDF }) => {
  const [formData, setFormData] = useState({ 
      title: "", comments: "", eggs: 0, status: "present_high", clientId: "", 
      lieux: "", dateVisite: "", nbAdultes: "", nbPoussins: "", comportement: "", remarques: "", info: "",
      ...nest 
  });
  
  const handlePhotoUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData({ ...formData, photo: reader.result }); reader.readAsDataURL(file); } };
  const openRoute = () => { if (nest.lat && nest.lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${nest.lat},${nest.lng}`, '_blank'); else alert("Coordonnées GPS manquantes."); };
  
  const hasExtraData = formData.lieux || formData.dateVisite || formData.nbAdultes || formData.nbPoussins || formData.comportement || formData.remarques || formData.info;

  if (readOnly) return (
      <div className="space-y-6 text-slate-800">
          {nest.photo && (
              <div className="rounded-2xl overflow-hidden shadow-md border border-slate-100 h-48">
                  <img src={nest.photo} alt="Nid" className="w-full h-full object-cover" />
              </div>
          )}
          <div className="flex justify-between items-start">
             <div>
                <h4 className="font-black text-xl text-slate-900">{nest.title || "Nid sans nom"}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1"><MapIcon size={12} className="inline mr-1"/>{nest.address}</p>
             </div>
             <Badge status={nest.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenu</p>
                  <p className="text-2xl font-black text-slate-800">{nest.eggs} <span className="text-sm font-normal text-slate-500">œufs</span></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center flex flex-col justify-center items-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Coordonnées</p>
                   <p className="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">{nest.lat?.toFixed(5)}</p>
                   <p className="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 mt-1">{nest.lng?.toFixed(5)}</p>
              </div>
          </div>
          
          {hasExtraData && (
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Layers size={14}/> Données Complémentaires</p>
                 {nest.lieux && <p><strong className="text-slate-600">Lieux:</strong> {nest.lieux}</p>}
                 {nest.dateVisite && <p><strong className="text-slate-600">Date visite:</strong> {nest.dateVisite}</p>}
                 {nest.nbAdultes && <p><strong className="text-slate-600">Adultes:</strong> {nest.nbAdultes}</p>}
                 {nest.nbPoussins && <p><strong className="text-slate-600">Poussins:</strong> {nest.nbPoussins}</p>}
                 {nest.comportement && <p><strong className="text-slate-600">Comportement:</strong> {nest.comportement}</p>}
                 {nest.remarques && <p><strong className="text-slate-600">Remarques:</strong> {nest.remarques}</p>}
                 {nest.info && <p><strong className="text-slate-600">Info:</strong> {nest.info}</p>}
             </div>
          )}

          {nest.comments && (
              <div className="bg-sky-50 p-4 rounded-xl border border-sky-100">
                <p className="text-[10px] font-black text-sky-600 uppercase mb-1 flex items-center gap-2"><Info size={12}/> Observations</p>
                <p className="text-sm text-sky-900 italic leading-relaxed">"{nest.comments}"</p>
              </div>
          )}
          <Button variant="sky" className="w-full py-3" onClick={onCancel}>Fermer la fiche</Button>
      </div>
  );
  
  return (
    <div className="space-y-6 text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                 <div className="relative group">
                    {formData.photo ? (
                        <div className="relative h-40 rounded-2xl overflow-hidden shadow-md">
                            <img src={formData.photo} className="w-full h-full object-cover" alt="Nid"/>
                            <button onClick={() => setFormData({...formData, photo: null})} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-700 transition-colors"><Trash2 size={14}/></button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 h-40 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all group-hover:border-sky-400">
                            <Camera size={32} className="text-slate-300 group-hover:text-sky-400 mb-2"/>
                            <span className="text-xs font-black uppercase text-slate-400 group-hover:text-sky-500">Ajouter Photo</span>
                            <input type="file" className="hidden" onChange={handlePhotoUpload}/>
                        </label>
                    )}
                 </div>
                 
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">État du nid</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-none" value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                        <option value="reported_by_client">🟣 Signalement Client</option>
                        <option value="present_high">🔴 Priorité Haute (Rouge)</option>
                        <option value="present_medium">🟠 Priorité Moyenne (Orange)</option>
                        <option value="present_low">🟡 Priorité Faible (Jaune)</option>
                        <option value="present" className="text-slate-400">🔴 Présent (Ancien statut)</option>
                        <option value="sterilized_1">🟢 1er Passage (Traité)</option>
                        <option value="sterilized_2">🟢 2ème Passage (Confirmé)</option>
                        <option value="non_present">⚪ Non présent / Inactif</option>
                    </select>
                    {formData.status === 'present_high' && <p className="text-[9px] mt-1.5 text-red-600 leading-tight font-medium bg-red-50 p-2 rounded-lg">Notoirement installé, poussins présents, public à proximité / conflits d’usage (écoles, ...).</p>}
                    {formData.status === 'present_medium' && <p className="text-[9px] mt-1.5 text-orange-600 leading-tight font-medium bg-orange-50 p-2 rounded-lg">Installé (avec ou sans poussin), signalements de nuisance, risques modérés.</p>}
                    {formData.status === 'present_low' && <p className="text-[9px] mt-1.5 text-yellow-600 leading-tight font-medium bg-yellow-50 p-2 rounded-lg">Observé, sans risque imminent de conflit avec la population.</p>}
                 </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Identification</label>
                    <input className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="Titre / Référence"/>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Client</label>
                    <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.clientId} onChange={e=>setFormData({...formData, clientId: parseInt(e.target.value)})}>
                        <option value="">-- Sélectionner --</option>
                        {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Œufs</label>
                        <input type="number" className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-sky-500 outline-none" value={formData.eggs} onChange={e=>setFormData({...formData, eggs: parseInt(e.target.value)})} placeholder="0"/>
                    </div>
                     <div className="flex-1 flex items-end">
                         <button type="button" onClick={openRoute} className="w-full p-3 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-sky-100 transition-colors flex items-center justify-center gap-2"><Locate size={14}/> GPS</button>
                     </div>
                </div>
            </div>
        </div>
        
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Adresse précise</label>
            <textarea className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none" rows="2" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}/>
            <div className="flex justify-end mt-1"><span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">GPS: {formData.lat?.toFixed(6)}, {formData.lng?.toFixed(6)}</span></div>
        </div>

        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Observations Techniques</label>
            <textarea className="w-full p-3 border border-slate-200 rounded-xl text-sm h-16 focus:ring-2 focus:ring-sky-500 outline-none resize-none" placeholder="Accès difficile, hauteur, matériel nécessaire..." value={formData.comments} onChange={(e) => setFormData({...formData, comments: e.target.value})}/>
        </div>

        {/* SECTION DONNÉES COMPLÉMENTAIRES (IMPORT XSLX) */}
        <div className="pt-4 mt-4 border-t border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={14}/> Données Complémentaires (Importées)</label>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Lieux</label>
                    <input className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formData.lieux || ""} onChange={e=>setFormData({...formData, lieux: e.target.value})} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Date visite</label>
                    <input className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formData.dateVisite || ""} onChange={e=>setFormData({...formData, dateVisite: e.target.value})} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nb Adultes</label>
                    <input className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formData.nbAdultes || ""} onChange={e=>setFormData({...formData, nbAdultes: e.target.value})} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nb Poussins</label>
                    <input className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formData.nbPoussins || ""} onChange={e=>setFormData({...formData, nbPoussins: e.target.value})} />
                </div>
            </div>
            <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Comportement</label>
                <input className="w-full p-2 border border-slate-200 rounded-lg text-sm" value={formData.comportement || ""} onChange={e=>setFormData({...formData, comportement: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Remarques (Fichier)</label>
                    <textarea className="w-full p-2 border border-slate-200 rounded-lg text-sm h-16 resize-none" value={formData.remarques || ""} onChange={e=>setFormData({...formData, remarques: e.target.value})} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Infos Diverses</label>
                    <textarea className="w-full p-2 border border-slate-200 rounded-lg text-sm h-16 resize-none" value={formData.info || ""} onChange={e=>setFormData({...formData, info: e.target.value})} />
                </div>
            </div>
        </div>
        
        {onGeneratePDF && <Button variant="secondary" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50" onClick={()=>onGeneratePDF(nest)}><Download size={16}/> Télécharger la fiche PDF</Button>}
        
        <div className="flex gap-3 pt-2 border-t border-slate-100">
             {onDelete && <button onClick={() => onDelete(formData)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20}/></button>}
             <Button variant="outline" className="flex-1 py-3" onClick={onCancel}>Annuler</Button>
             <Button variant="success" className="flex-1 py-3" onClick={()=>onSave(formData)}>Enregistrer</Button>
        </div>
    </div>
  );
};

const InterventionEditForm = ({ intervention, clients, onSave, onCancel, onDelete }) => {
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], status: "Planifié", clientId: "", notes: "", technician: "", ...intervention });
    return (
        <div className="space-y-4 text-slate-800">
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Date</label><input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Client</label>
                <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.clientId} onChange={e => setFormData({...formData, clientId: parseInt(e.target.value)})}>
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Statut</label>
                <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Planifié">Planifié</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                </select>
            </div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Technicien / Pilote</label><input type="text" className="w-full p-2 border rounded-lg text-sm" value={formData.technician} onChange={e => setFormData({...formData, technician: e.target.value})} placeholder="Nom du télépilote / agent" /></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Notes</label><textarea className="w-full p-2 border rounded-lg text-sm h-20 resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            <div className="flex gap-2 pt-4 border-t border-slate-100">
                {onDelete && intervention?.clientId && <button onClick={() => onDelete(formData)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>}
                <Button variant="outline" className="flex-1" onClick={onCancel}>Annuler</Button>
                <Button variant="success" className="flex-1" onClick={() => onSave(formData)}>Enregistrer</Button>
            </div>
        </div>
    );
};

const ReportEditForm = ({ report, clients, markers, interventions, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ title: "", type: "Rapport Complet", date: new Date().toLocaleDateString('fr-FR'), clientId: "", nestId: "", author: "admin", ...report });
    const clientNests = markers.filter(m => m.clientId === formData.clientId);
    return (
        <div className="space-y-4 text-slate-800">
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Titre du document</label><input type="text" className="w-full p-2 border rounded-lg text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
                <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Rapport Complet">Rapport Complet (Bilan)</option>
                    <option value="Fiche Nid">Fiche Nid Détaillée</option>
                    <option value="Devis / Facture">Devis / Facture</option>
                    <option value="Autre">Autre</option>
                </select>
            </div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase">Client Associé</label>
                <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.clientId} onChange={e => setFormData({...formData, clientId: parseInt(e.target.value)})}>
                    <option value="">-- Sélectionner --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            {formData.type === "Fiche Nid" && (
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nid Spécifique</label>
                    <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.nestId} onChange={e => setFormData({...formData, nestId: parseInt(e.target.value)})}>
                        <option value="">-- Sélectionner un nid --</option>
                        {clientNests.map(n => <option key={n.id} value={n.id}>{n.title || "Nid " + n.id}</option>)}
                    </select>
                </div>
            )}
            <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" className="flex-1" onClick={onCancel}>Annuler</Button>
                <Button variant="success" className="flex-1" onClick={() => onSave(formData)}>Enregistrer</Button>
            </div>
        </div>
    );
};

// --- VUES DU TABLEAU DE BORD ET INTERFACES ---

const AdminDashboard = ({ interventions, clients, markers }) => {
    // Calcul des statistiques globales pour Aerothau
    const activeNests = markers.filter(m => m.status.startsWith('present')).length;
    const sterilizedNests = markers.filter(m => m.status.startsWith('sterilized')).length;
    const totalEggs = markers.reduce((sum, m) => sum + (m.eggs || 0), 0);
    const pendingInterventions = interventions.filter(i => i.status !== 'Terminé').length;

    return (
        <div className="space-y-8 animate-in fade-in duration-300 text-slate-800">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">TABLEAU DE BORD</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-white border-0 shadow-lg rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Bird size={24}/></div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nids Actifs</h3>
                    </div>
                    <p className="text-4xl font-black text-slate-800">{activeNests}</p>
                </Card>

                <Card className="p-6 bg-white border-0 shadow-lg rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={24}/></div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nids Traités</h3>
                    </div>
                    <p className="text-4xl font-black text-slate-800">{sterilizedNests}</p>
                </Card>

                <Card className="p-6 bg-white border-0 shadow-lg rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Layers size={24}/></div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Œufs Stérilisés</h3>
                    </div>
                    <p className="text-4xl font-black text-slate-800">{totalEggs}</p>
                </Card>

                <Card className="p-6 bg-white border-0 shadow-lg rounded-3xl flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><Calendar size={24}/></div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Missions Prévues</h3>
                    </div>
                    <p className="text-4xl font-black text-slate-800">{pendingInterventions}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6 bg-white border-0 shadow-lg rounded-3xl">
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-2"><Activity size={20} className="text-sky-500"/> Activité Récente</h3>
                    <div className="space-y-4">
                        {interventions.slice(-5).reverse().map(i => (
                            <div key={i.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="font-bold text-sm text-slate-800">{clients.find(c => c.id === i.clientId)?.name || "Client Inconnu"}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{i.date} {i.technician && `- Pilote: ${i.technician}`}</p>
                                </div>
                                <Badge status={i.status} />
                            </div>
                        ))}
                        {interventions.length === 0 && <p className="text-sm text-slate-400 italic">Aucune activité planifiée ou terminée récemment.</p>}
                    </div>
                </Card>

                <Card className="p-6 bg-white border-0 shadow-lg rounded-3xl">
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-2"><Users size={20} className="text-sky-500"/> Répartition Clients (Top 5)</h3>
                    <div className="space-y-4">
                        {clients.slice(0, 5).map(c => {
                            const clientNests = markers.filter(m => m.clientId === c.id).length;
                            return (
                                <div key={c.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-white hover:bg-slate-50 transition-colors">
                                    <span className="font-bold text-sm text-slate-700">{c.name}</span>
                                    <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-full uppercase tracking-widest">{clientNests} nids</span>
                                </div>
                            )
                        })}
                        {clients.length === 0 && <p className="text-sm text-slate-400 italic">Aucun client enregistré.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};


// --- CARTE (LEAFLET) ---

const LeafletMap = ({ markers, isAddingMode, onMapClick, onMarkerClick, center, routePath }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [mapType, setMapType] = useState("satellite");

  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

  const tileUrls = {
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      plan: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const initMap = () => {
        if (!mapContainerRef.current) return;
        try {
            const L = window.L;
            if (!L || typeof L.map !== 'function') return;

            const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([43.4028, 3.696], 15);
            mapInstanceRef.current = map;

            L.control.zoom({ position: 'bottomright' }).addTo(map);
            tileLayerRef.current = L.tileLayer(tileUrls['satellite'], { attribution: 'Esri' }).addTo(map);
            markersLayerRef.current = L.layerGroup().addTo(map);
            routeLayerRef.current = L.layerGroup().addTo(map);

            map.on('click', (e) => {
                if(onMapClickRef.current) onMapClickRef.current(e.latlng);
            });
            
            setTimeout(() => map.invalidateSize(), 100);
        } catch (e) { console.error("Map Error", e); }
    };

    if (!window.L) {
        if(!document.getElementById('leaflet-script')) {
            const link = document.createElement("link"); link.id = 'leaflet-css'; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
            const script = document.createElement("script"); script.id = 'leaflet-script'; script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.async = true; script.onload = initMap; document.head.appendChild(script);
        } else {
            const script = document.getElementById('leaflet-script');
            script.addEventListener('load', initMap);
            setTimeout(() => { if(window.L && !mapInstanceRef.current) initMap(); }, 500);
        }
    } else { initMap(); }

    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  useEffect(() => {
     if (mapInstanceRef.current) {
         setTimeout(() => { mapInstanceRef.current.invalidateSize(); }, 200);
     }
  });

  useEffect(() => {
      if (!mapInstanceRef.current || !window.L || !markersLayerRef.current) return;
      const L = window.L;
      markersLayerRef.current.clearLayers();
      markers.forEach(m => {
          let color = "#64748b"; 
          if (m.status === "present" || m.status === "present_high") color = "#ef4444"; // Rouge
          else if (m.status === "present_medium") color = "#f97316"; // Orange
          else if (m.status === "present_low") color = "#eab308"; // Jaune
          else if (m.status === "temp") color = "#94a3b8"; 
          else if (m.status === "sterilized_1") color = "#84cc16"; 
          else if (m.status === "sterilized_2") color = "#22c55e"; 
          else if (m.status === "reported_by_client") color = "#a855f7"; 

          const icon = L.divIcon({ className: "custom-icon", html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white;"></div>` });
          const marker = L.marker([m.lat, m.lng], { icon });
          marker.on('click', (e) => { L.DomEvent.stopPropagation(e); if(onMarkerClickRef.current) onMarkerClickRef.current(m); });
          marker.addTo(markersLayerRef.current);
      });
  }, [markers]);

  useEffect(() => {
      if (mapInstanceRef.current && tileLayerRef.current) tileLayerRef.current.setUrl(tileUrls[mapType]);
  }, [mapType]);

  useEffect(() => {
      if (mapInstanceRef.current && center) mapInstanceRef.current.setView([center.lat, center.lng], 18);
  }, [center]);

  return (
      <div className="relative w-full h-full">
          <div ref={mapContainerRef} className="w-full h-full bg-slate-200 rounded-2xl overflow-hidden" style={{ minHeight: '100%', zIndex: 0 }} />
          <div className="absolute top-4 right-4 z-[400] bg-white p-1 rounded-lg shadow-md flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); setMapType('satellite'); }} className={`px-3 py-1.5 text-xs font-bold rounded-md ${mapType === 'satellite' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Sat</button>
              <button onClick={(e) => { e.stopPropagation(); setMapType('plan'); }} className={`px-3 py-1.5 text-xs font-bold rounded-md ${mapType === 'plan' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Plan</button>
          </div>
      </div>
  );
};

// --- COMPOSANT MAP INTERFACE ---

const MapInterface = ({ markers, clients, onUpdateNest, onDeleteNest }) => {
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [mapCenter, setMapCenter] = useState(null);
    const [tempMarker, setTempMarker] = useState(null);

    const handleSearch = useCallback(async (e) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            let lat, lng, addr;
            const coords = searchQuery.replace(/,/g, " ").split(/\s+/).filter(Boolean).map(parseFloat);
            if (coords.length === 2 && !coords.some(isNaN) && Math.abs(coords[0]) <= 90) {
                lat = coords[0]; lng = coords[1]; addr = `GPS: ${lat}, ${lng}`;
            } else {
                try {
                    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=fr`);
                    const d = await r.json();
                    if (d?.[0]) { lat = parseFloat(d[0].lat); lng = parseFloat(d[0].lon); addr = d[0].display_name.split(',')[0]; }
                    else { alert("Lieu non trouvé."); return; }
                } catch (err) { console.error(err); return; }
            }
            if (lat && lng) {
                setMapCenter({ lat, lng });
                setTempMarker({ id: "temp", lat, lng, address: addr, status: "temp", eggs: 0 });
            }
        }
    }, [searchQuery]);

    const handleMarkerClick = (marker) => {
        if (marker.id === "temp") {
            const newNest = { id: Date.now(), lat: marker.lat, lng: marker.lng, address: marker.address, status: "present_high", eggs: 0, clientId: clients[0]?.id || "" };
            onUpdateNest(newNest); setTempMarker(null); setSelectedMarker(newNest);
        } else {
            setSelectedMarker(marker);
        }
    };

    const displayMarkers = useMemo(() => tempMarker ? [...markers, tempMarker] : markers, [markers, tempMarker]);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6 text-slate-800">
            <Card className="p-4 flex flex-col md:flex-row gap-4 items-center z-20 shadow-xl border-0 rounded-2xl bg-white">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input type="text" placeholder="Recherche GPS ou adresse..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearch} />
                </div>
                <div className="flex gap-2">
                    <Button variant={isAdding ? "danger" : "sky"} className="h-12" onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? <><X size={16}/> Annuler</> : <><Plus size={16}/> Pointer un nid</>}
                    </Button>
                </div>
            </Card>
            
            <div className={`flex-1 relative shadow-2xl rounded-3xl overflow-hidden bg-white transition-all duration-300 ${isAdding ? 'border-8 border-sky-500' : 'border-8 border-white'}`}>
                {isAdding && (
                    <div className="absolute inset-x-0 top-4 z-[1000] flex justify-center pointer-events-none">
                        <div className="bg-sky-600 text-white px-6 py-2 rounded-full font-bold shadow-2xl animate-bounce">📍 Cliquez sur la carte pour placer le nid</div>
                    </div>
                )}
                
                {tempMarker && !isAdding && (<div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold animate-bounce pointer-events-none">📍 Cliquez sur le point gris pour valider</div>)}

                <LeafletMap markers={displayMarkers} isAddingMode={isAdding} center={mapCenter} onMarkerClick={handleMarkerClick} onMapClick={async (ll) => {
                    if(!isAdding) return;
                    const newM = { id: Date.now(), lat: ll.lat, lng: ll.lng, address: "Localisation enregistrée", status: "present_high", eggs: 0, clientId: clients[0]?.id || "" };
                    await onUpdateNest(newM); setSelectedMarker(newM); setIsAdding(false);
                }}/>
                
                {selectedMarker && selectedMarker.id !== "temp" && (
                    <div className="absolute top-6 left-6 z-[500] w-72 md:w-80 max-h-[90%] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-left-6">
                        <Card className="border-0 flex flex-col overflow-hidden bg-white">
                            <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                                <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Crosshair size={16}/> Fiche Nid</span>
                                <button onClick={() => setSelectedMarker(null)} className="hover:bg-white/20 p-1.5 rounded-full"><X size={18}/></button>
                            </div>
                            <div className="p-6 overflow-y-auto shrink custom-scrollbar bg-white">
                                <NestEditForm nest={selectedMarker} clients={clients} onSave={async(u) => { await onUpdateNest(u); setSelectedMarker(null); }} onCancel={() => setSelectedMarker(null)} onDelete={async(u) => { if(window.confirm("Supprimer ?")) { await onDeleteNest(u); setSelectedMarker(null); } }} onGeneratePDF={(n, cb) => generatePDF('nest_detail', n, { clientName: clients.find(c => c.id === n.clientId)?.name }, () => {}, cb)} />
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- COMPOSANT CLIENT DETAIL ---

const ClientDetail = ({ selectedClient, setView, interventions, reports, markers, onUpdateClient, onDeleteClient }) => {
    const [isEditing, setIsEditing] = useState(false);
    const cInt = useMemo(() => interventions.filter(i => i.clientId === selectedClient.id), [interventions, selectedClient]);
    const cNests = useMemo(() => markers.filter(m => m.clientId === selectedClient.id), [markers, selectedClient]);
    return (
        <div className="space-y-8 text-slate-800">
            <Button variant="secondary" onClick={() => setView("clients")} className="rounded-2xl px-6 border-0 shadow-md h-10">&larr; Retour</Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-8">
                    <Card className="p-8 border-0 shadow-xl rounded-3xl bg-white">
                        {isEditing ? <ClientEditForm client={selectedClient} onSave={(d) => {onUpdateClient(d); setIsEditing(false);}} onCancel={() => setIsEditing(false)}/> : (
                            <>
                                <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter text-slate-900">{selectedClient.name}</h2>
                                <div className="space-y-6 text-sm font-bold text-slate-600 uppercase">
                                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"><MapPin size={20} className="text-sky-500 shrink-0"/><p className="leading-tight text-xs">{selectedClient.address}</p></div>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100"><Phone size={20} className="text-sky-500 shrink-0"/><p className="text-xs">{selectedClient.phone}</p></div>
                                    <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg">
                                        <p className="text-[10px] font-black opacity-50 tracking-widest text-center mb-4">ACCÈS ESPACE CLIENT</p>
                                        <p className="text-xs tracking-widest mb-2"><span className="opacity-50">ID:</span> {selectedClient.username}</p>
                                        <p className="text-xs tracking-widest"><span className="opacity-50">PASS:</span> {selectedClient.password}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 mt-8">
                                    <Button variant="sky" className="w-full py-3 rounded-2xl uppercase tracking-widest text-xs font-black h-12" onClick={() => setIsEditing(true)}>Modifier</Button>
                                    <Button variant="danger" className="w-full py-3 rounded-2xl uppercase tracking-widest text-xs font-black h-12" onClick={() => {if(window.confirm("Supprimer ce client ?")){onDeleteClient(selectedClient); setView("clients");}}}>Supprimer</Button>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 shadow-lg border-0 rounded-3xl bg-slate-900 text-white"><p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 text-center">Nids recensés</p><p className="text-5xl font-black text-sky-400 text-center">{cNests.length}</p></Card>
                        <Card className="p-6 shadow-lg border-0 rounded-3xl bg-sky-600 text-white"><p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 text-center">Missions effectuées</p><p className="text-5xl font-black text-white text-center">{cInt.filter(i => i.status === "Terminé").length}</p></Card>
                    </div>
                    <Card className="p-8 border-0 shadow-xl rounded-3xl bg-white"><h3 className="text-xl font-black uppercase tracking-tighter mb-6 text-slate-900">HISTORIQUE DES PASSAGES</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 text-slate-500"><tr><th className="p-4">Date</th><th className="p-4">Statut</th><th className="p-4">Notes</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {cInt.length === 0 ? <tr><td colSpan="3" className="p-8 text-center text-slate-400 font-bold uppercase text-xs italic">Aucune intervention</td></tr> : cInt.map(i => <tr key={i.id} className="hover:bg-slate-50 transition-colors"><td className="p-4 font-black text-slate-700">{i.date}</td><td className="p-4"><Badge status={i.status}/></td><td className="p-4 text-xs font-bold text-slate-500 italic truncate max-w-[200px]">{i.notes}</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// --- VUES ADMIN ---

const NestManagement = ({ markers, onUpdateNest, onDeleteNest, onDeleteAllNests, clients }) => {
  const [selectedNest, setSelectedNest] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const XLSX = await loadSheetJS();
    const data = markers.map(m => ({
      "Noms Client": clients.find(c => c.id === m.clientId)?.name || "Non assigné",
      "ID": m.id,
      "Etat du nids": m.status,
      "nbr d'œuf": m.eggs,
      "adresse precis": m.address,
      "observation": m.comments || "",
      "Latitude": m.lat,
      "Longitude": m.lng,
      // Nouvelles colonnes exportées pour éviter la perte
      "Lieux": m.lieux || "",
      "Date de la visite": m.dateVisite || "",
      "N° point": m.numPoint || "",
      "Gps": m.gpsOriginal || "",
      "Nb adulte": m.nbAdultes || "",
      "Nd de Poussins (P=Poussin + S= semaine de développement)": m.nbPoussins || "",
      "Comportement (Guetteur, Couve, Défend, Autres)": m.comportement || "",
      "Remarques": m.remarques || "",
      "info": m.info || ""
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gestion Nids");
    XLSX.writeFile(workbook, `Aerothau_Nids_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExporting(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const XLSX = await loadSheetJS();
    const reader = new FileReader();
    reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        let count = 0;
        for (const row of jsonData) {
            
            // Traitement sécurisé des coordonnées GPS "43.16700300555649, 3.1758802259489407"
            let lat = MAP_CENTER_DEFAULT.lat;
            let lng = MAP_CENTER_DEFAULT.lng;
            if (row["Gps"]) {
                const parts = row["Gps"].toString().split(",");
                if (parts.length === 2) {
                    const pLat = parseFloat(parts[0].trim());
                    const pLng = parseFloat(parts[1].trim());
                    if(!isNaN(pLat) && !isNaN(pLng)) {
                        lat = pLat;
                        lng = pLng;
                    }
                }
            } else if (row["Latitude"] && row["Longitude"]) {
                lat = parseFloat(row["Latitude"]) || lat;
                lng = parseFloat(row["Longitude"]) || lng;
            }

            // RECONNAISSANCE INTELLIGENTE DU CLIENT
            const rawLocation = (row["Noms Client"] || row["Lieux"] || "").toString().toLowerCase();
            let matchedClient = clients.find(c => c.name.toLowerCase() === rawLocation); // Match exact en premier
            
            if (!matchedClient) {
                // Recherche par mots-clés spécifiques demandés par l'utilisateur
                if (rawLocation.includes("narbonne")) {
                    matchedClient = clients.find(c => c.name.toLowerCase().includes("narbonne"));
                } else if (rawLocation.includes("meze") || rawLocation.includes("mèze")) {
                    matchedClient = clients.find(c => c.name.toLowerCase().includes("meze") || c.name.toLowerCase().includes("mèze"));
                } else if (rawLocation.includes("sete") || rawLocation.includes("sète")) {
                    matchedClient = clients.find(c => c.name.toLowerCase().includes("sete") || c.name.toLowerCase().includes("sète"));
                }
                
                // Si toujours pas trouvé, recherche partielle générique de secours
                if(!matchedClient && rawLocation.length > 3) {
                     matchedClient = clients.find(c => rawLocation.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(rawLocation));
                }
            }
            
            const client = matchedClient || clients[0]; // Fallback au premier client par défaut si rien n'est trouvé
            
            const newNest = {
                id: row["ID"] || (row["N° point"] ? parseInt(row["N° point"]) + Date.now() : Date.now() + count),
                clientId: client ? client.id : "",
                status: row["Etat du nids"] || "present_high",
                eggs: parseInt(row["nbr d'œuf"]) || 0,
                address: row["Adresse"] || row["adresse precis"] || "Adresse importée",
                lat: lat,
                lng: lng,
                title: `N°${row["N° point"] || count} - ${row["Lieux"] || "Nid importé"}`,
                comments: row["observation"] || "Import depuis fichier Excel.",
                
                // --- AJOUT DE TOUTES LES COLONNES DU FICHIER NARBONNE ---
                lieux: row["Lieux"] || "",
                dateVisite: row["Date de la visite"] || "",
                info: row["info"] || "",
                numPoint: row["N° point"] || "",
                gpsOriginal: row["Gps"] || "",
                nbAdultes: row["Nb adulte"] || "",
                nbPoussins: row["Nd de Poussins (P=Poussin + S= semaine de développement)"] || "",
                comportement: row["Comportement (Guetteur, Couve, Défend, Autres)"] || "",
                remarques: row["Remarques"] || ""
            };
            await onUpdateNest(newNest);
            count++;
        }
        alert(`${count} nids importés ou mis à jour avec succès.`);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // reset input
  };

  return (
    <div className="space-y-8 text-slate-800">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-800">GESTION DES NIDS</h2>
        <div className="flex gap-3 flex-wrap">
            <Button variant="danger" onClick={onDeleteAllNests}><Trash2 size={18}/> Supprimer TOUS les nids</Button>
            <Button variant="secondary" onClick={handleExport} disabled={isExporting}><Download size={18}/> Exporter Excel</Button>
            <div className="relative">
                <input type="file" accept=".xlsx, .csv" onChange={handleImport} className="hidden" id="import-excel-file" />
                <label htmlFor="import-excel-file" className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-sky-700 shadow-lg h-full">
                    <Upload size={18}/> Importer Fichier (XLSX/CSV)
                </label>
            </div>
        </div>
      </div>

      {clients.map(client => {
          const clientNests = markers.filter(m => m.clientId === client.id);
          if (clientNests.length === 0) return null;
          return (
              <Card key={client.id} className="overflow-hidden border-0 shadow-lg rounded-3xl mb-8">
                  <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/10 rounded-xl"><Users size={20} className="text-sky-400"/></div>
                          <h3 className="font-black uppercase tracking-wide text-lg">{client.name}</h3>
                      </div>
                      <span className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">{clientNests.length} Nids</span>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b">
                              <tr><th className="p-4 pl-8">Réf / Adresse</th><th className="p-4">Statut</th><th className="p-4 text-center">Contenu</th><th className="p-4 text-right pr-8">Actions</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {clientNests.map(m => (
                                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="p-4 pl-8">
                                          <div className="font-bold text-slate-900 text-base">{m.title || "Nid"}</div>
                                          <div className="text-xs text-slate-400 truncate max-w-[300px] flex items-center gap-1 mt-1"><MapPin size={10}/> {m.address}</div>
                                      </td>
                                      <td className="p-4"><Badge status={m.status}/></td>
                                      <td className="p-4 text-center font-black text-slate-700">{m.eggs} <span className="font-normal opacity-50">œuf(s)</span></td>
                                      <td className="p-4 flex justify-end gap-2 pr-8">
                                          <button onClick={() => setSelectedNest(m)} className="p-2.5 text-sky-600 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors"><Edit size={18}/></button>
                                          <button onClick={() => { if(window.confirm("Supprimer ce nid ?")) onDeleteNest(m); }} className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={18}/></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </Card>
          );
      })}

      {selectedNest && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <Card className="bg-white rounded-[32px] p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 text-slate-800">
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                  <h3 className="font-black text-3xl uppercase tracking-tighter text-slate-900 flex items-center gap-3"><Edit size={28} className="text-sky-500"/> Édition Nid</h3>
                  <button onClick={() => setSelectedNest(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={32} className="text-slate-400"/></button>
              </div>
              <NestEditForm nest={selectedNest} clients={clients} onSave={async (d) => { await onUpdateNest(d); setSelectedNest(null); }} onCancel={() => setSelectedNest(null)} onGeneratePDF={(n, cb) => generatePDF('nest_detail', n, { clientName: clients.find(c => c.id === n.clientId)?.name }, () => {}, cb)} />
          </Card>
        </div>
      )}
    </div>
  );
};

const ClientManagement = ({ clients, setSelectedClient, setView, onCreateClient, onDeleteClient }) => {
  const [isCreating, setIsCreating] = useState(false);
  return (
    <div className="space-y-8 text-slate-800">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-black uppercase tracking-tighter">CLIENTS</h2><Button variant="sky" className="rounded-2xl px-6 py-3 uppercase tracking-widest text-xs h-12" onClick={() => setIsCreating(true)}><Plus size={18} /> Nouveau Client</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-slate-800">{clients.map((c) => (<Card key={c.id} className="p-8 cursor-pointer hover:shadow-2xl transition-all group border-0 shadow-lg ring-1 ring-slate-100 rounded-3xl bg-white" onClick={() => { setSelectedClient(c); setView("client-detail"); }}><div className="flex justify-between items-start mb-6"><div className="p-3 bg-sky-50 text-sky-600 rounded-2xl group-hover:bg-sky-600 group-hover:text-white transition-colors duration-500 shadow-sm"><Users size={24} /></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{c.type}</span></div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">{c.name}</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-wide truncate mt-4"><MapPin size={12} className="inline mr-2 text-sky-500" /> {c.address}</p></Card>))}</div>
      {isCreating && (<div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"><Card className="p-8 w-full max-w-lg shadow-2xl border-0 rounded-3xl text-slate-800"><h3 className="font-black text-2xl mb-6 uppercase tracking-tighter text-slate-900">Créer une fiche</h3><ClientEditForm client={{ id: Date.now(), name: "", type: "Privé", address: "", contact: "", phone: "", email: "" }} onSave={(d) => { onCreateClient(d); setIsCreating(false); }} onCancel={() => setIsCreating(false)} /></Card></div>)}
    </div>
  );
};

const ScheduleView = ({ interventions, clients, onUpdateIntervention, onDeleteIntervention }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingInt, setEditingInt] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
    const renderCalendar = () => {
        const y = currentDate.getFullYear(), m = currentDate.getMonth();
        const days = [], dInM = daysInMonth(y, m);
        const startOffset = (firstDayOfMonth(y, m) + 6) % 7;
        for (let i = 0; i < startOffset; i++) days.push(<div key={`empty-${i}`} className="h-28 bg-slate-50 border-slate-100 border" />);
        for (let d = 1; d <= dInM; d++) {
            const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const dayInts = interventions.filter(i => i.date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            days.push(<div key={d} className={`h-28 border border-slate-100 p-2 hover:bg-sky-50 transition-all cursor-pointer relative group ${isToday ? 'bg-sky-50/50' : 'bg-white'}`} onClick={() => { setEditingInt({ id: Date.now(), date: dateStr }); setIsCreating(true); }}><div className="flex justify-between items-center mb-1"><span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-600 text-white' : 'text-slate-400 group-hover:text-sky-600 transition-colors'}`}>{d}</span></div><div className="space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar pr-1">{dayInts.map(i => (<div key={i.id} className="text-[9px] bg-slate-900 text-white px-2 py-1 rounded-lg truncate font-black uppercase tracking-tighter border-l-4 border-sky-400">{clients.find(c => c.id === i.clientId)?.name || "Agent Aerothau"}</div>))}</div></div>);
        }
        return days;
    };
    return (
        <div className="space-y-8 text-slate-800">
            <div className="flex justify-between items-center flex-wrap gap-4"><h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">PLANNING</h2><Button variant="sky" className="rounded-2xl px-6 py-3 uppercase tracking-widest text-xs h-12" onClick={() => setIsCreating(true)}><Plus size={16}/> Programmer</Button></div>
            <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl bg-white"><div className="bg-slate-900 p-6 text-white flex justify-between items-center"><button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24}/></button><h3 className="text-xl font-black uppercase tracking-widest">{currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h3><button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={24}/></button></div><div className="grid grid-cols-7 bg-slate-100 border-b">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => <div key={d} className="py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{d}</div>)}</div><div className="grid grid-cols-7 border-collapse">{renderCalendar()}</div></Card>
            {(isCreating || editingInt) && (<div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"><Card className="p-8 w-full max-w-md shadow-2xl border-0 rounded-3xl bg-white text-slate-800"><div className="flex justify-between items-center mb-8"><h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter">{isCreating && !editingInt?.clientId ? "Nouvelle Mission" : "Détails Mission"}</h3><button onClick={() => {setEditingInt(null); setIsCreating(false);}} className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-100 rounded-full transition-colors"><X size={20}/></button></div><InterventionEditForm intervention={editingInt} clients={clients} onSave={async (d) => { await onUpdateIntervention(d); setEditingInt(null); setIsCreating(false); }} onDelete={onDeleteIntervention} onCancel={() => {setEditingInt(null); setIsCreating(false);}} /></Card></div>)}
        </div>
    );
};

const ReportsView = ({ reports, clients, markers, interventions, onUpdateReport, onDeleteReport }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingRep, setEditingRep] = useState(null);
    const filteredReports = useMemo(() => reports, [reports]);
    return (
        <div className="space-y-8 animate-in fade-in duration-300 text-slate-800">
            <div className="flex justify-between items-center flex-wrap gap-4"><h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">DOCUMENTS</h2><Button variant="sky" className="rounded-2xl px-6 py-3 uppercase tracking-widest text-xs h-12" onClick={() => setIsCreating(true)}><Plus size={16}/> Ajouter</Button></div>
            <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest"><tr><th className="p-6">Document</th><th className="p-6">Client / Source</th><th className="p-6">Date</th><th className="p-6">Type</th><th className="p-6 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredReports.length === 0 ? <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold uppercase italic tracking-widest">Aucun document trouvé</td></tr> : filteredReports.map(r => (<tr key={r.id} className="hover:bg-slate-50 transition-colors"><td className="p-6 font-black flex items-center gap-4 text-slate-700 tracking-tight"><div className={`p-2.5 rounded-xl ${r.author === 'client' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>{r.author === 'client' ? <FileCheck size={20}/> : <File size={20}/>}</div> {r.title}</td><td className="p-6"><span className="text-xs font-black uppercase text-slate-700">{clients.find(c => c.id === r.clientId)?.name || "Client supprimé"}</span></td><td className="p-6 text-xs font-bold text-slate-500">{r.date}</td><td className="p-6"><Badge status={r.type === 'Fiche Nid' ? 'reported_by_client' : (r.type === 'Rapport Complet' ? 'sterilized_2' : 'Planifié')}/></td><td className="p-6 flex justify-end gap-3"><button onClick={() => generatePDF(r.type === 'Fiche Nid' ? 'nest_detail' : (r.type === 'Rapport Complet' ? 'complete_report' : 'file'), r.type === 'Fiche Nid' ? markers.find(m => m.id === r.nestId) : r, { client: clients.find(c => c.id === r.clientId), markers: markers.filter(m => m.clientId === r.clientId), interventions: interventions.filter(i => i.clientId === r.clientId) })} className="p-2.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all shadow-sm" title="Télécharger / Imprimer"><Printer size={18}/></button><button onClick={() => setEditingRep(r)} className="p-2.5 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all shadow-sm"><Edit size={18}/></button><button onClick={() => {if(window.confirm("Supprimer ce document ?")) onDeleteReport(r);}} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div></Card>
            {(isCreating || editingRep) && (<div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"><Card className="p-8 w-full max-w-md shadow-2xl border-0 rounded-3xl bg-white text-slate-800"><div className="flex justify-between items-center mb-8"><h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter">{isCreating ? "Nouveau Document" : "Modifier"}</h3><button onClick={() => {setEditingRep(null); setIsCreating(false);}} className="text-slate-400 p-1.5 bg-slate-100 rounded-full"><X size={20}/></button></div><ReportEditForm report={editingRep || {id: Date.now()}} clients={clients} markers={markers} interventions={interventions} onSave={async (d) => { await onUpdateReport(d); setEditingRep(null); setIsCreating(false); }} onCancel={() => {setEditingRep(null); setIsCreating(false);}} /></Card></div>)}
        </div>
    );
};

// --- COMPOSANT APP PRINCIPAL ---

export default function AerothauApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => { setToast({ message, type }); };

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (e) { console.error("Auth error", e); } };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => { if (u) setIsFirebaseReady(true); });
    return () => unsub();
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

  const availableUsers = useMemo(() => [
    ...INITIAL_USERS,
    ...clients.filter(c => c.username && c.password).map(c => ({ id: c.id, username: c.username, password: c.password, role: "client", name: c.name, clientId: c.id }))
  ], [clients]);

  const updateFirebase = async (collectionName, data) => {
      if (!isFirebaseReady) return;
      try {
          await setDoc(doc(db, "artifacts", appId, "public", "data", collectionName, data.id.toString()), data);
          showToast("Enregistrement réussi !", "success");
      } catch (error) { showToast("Erreur d'enregistrement", "error"); }
  };
  
  const deleteFromFirebase = async (collectionName, id) => {
      if (!isFirebaseReady) return;
      try {
          await deleteDoc(doc(db, "artifacts", appId, "public", "data", collectionName, id.toString()));
          showToast("Suppression réussie", "success");
      } catch (error) { showToast("Erreur de suppression", "error"); }
  };

  const handleDeleteAllNests = async () => {
      if (window.confirm("⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer TOUS les nids recensés ? Cette action est IRRÉVERSIBLE.")) {
          try {
              for (const marker of markers) {
                  await deleteFromFirebase("markers", marker.id);
              }
              showToast("Tous les nids ont été supprimés avec succès.", "success");
          } catch (error) {
              showToast("Erreur lors de la suppression massive.", "error");
          }
      }
  };

  if (!user) return <LoginForm onLogin={setUser} users={availableUsers} logoUrl={LOGO_URL} />;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {user.role === 'admin' && (
      <aside className={`fixed lg:static inset-y-0 left-0 z-[1000] w-72 bg-slate-900 text-white transform transition-transform duration-500 ease-in-out shadow-2xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-4 mb-12"><div className="p-2 bg-white rounded-xl shadow-lg shadow-white/5"><img src={LOGO_URL} alt="Logo" className="h-10 w-auto" /></div><span className="text-xl font-black uppercase tracking-tighter">Aerothau</span></div>
          <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-2">
            {[
                { id: "dashboard", label: "Dashboard", icon: Home, roles: ["admin"] },
                { id: "map", label: "Carte Interactive", icon: MapIcon, roles: ["admin", "client"] },
                { id: "nests", label: "Gestion des Nids", icon: Bird, roles: ["admin"] },
                { id: "clients", label: "Fiches Clients", icon: Users, roles: ["admin"] },
                { id: "schedule", label: "Planning", icon: Calendar, roles: ["admin"] },
                { id: "reports", label: "Documents", icon: FileText, roles: ["admin", "client"] },
            ].filter(i => i.roles.includes(user.role)).map(item => (
              <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest ${view === item.id || (item.id === "clients" && view === "client-detail") ? "bg-sky-600 text-white shadow-xl shadow-sky-900/50 scale-[1.02]" : "text-slate-500 hover:bg-slate-800 hover:text-white"}`}>
                <item.icon size={20} className={view === item.id ? "text-white" : "text-slate-600 group-hover:text-white"} /> <span className="opacity-90">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-8 border-t border-slate-800 space-y-6">
              <div className="flex items-center gap-3 px-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-black text-sky-400 border border-slate-700 shadow-inner uppercase">{user.name.charAt(0)}</div>
                  <div className="overflow-hidden"><p className="text-xs font-black uppercase tracking-tighter truncate text-white">{user.name}</p><p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{user.role}</p></div>
              </div>
              <button onClick={() => setUser(null)} className="w-full flex items-center gap-4 text-red-500 hover:bg-red-500 hover:text-white p-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest group shadow-sm"><LogOut size={18}/> Déconnexion</button>
          </div>
        </div>
      </aside>
      )}

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b p-4 flex lg:hidden items-center justify-between sticky top-0 z-[110] shadow-sm text-slate-900">
            {user.role === 'admin' && <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu size={24} /></button>}
            <span className="font-black uppercase tracking-tighter">Aerothau</span>
            {user.role !== 'admin' && <button onClick={() => setUser(null)} className="text-red-500 flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-red-50 px-4 py-2 rounded-xl"><LogOut size={16}/> Déconnexion</button>}
        </header>
        <div className="flex-1 p-6 lg:p-12 overflow-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {user.role === "admin" ? (
              <>
                {view === "dashboard" && <AdminDashboard interventions={interventions} clients={clients} markers={markers} />}
                {view === "map" && <MapInterface markers={markers} clients={clients} onUpdateNest={async (n) => updateFirebase("markers", n)} onDeleteNest={async (n) => deleteFromFirebase("markers", n.id)} />}
                {view === "nests" && <NestManagement markers={markers} clients={clients} onUpdateNest={async (n) => updateFirebase("markers", n)} onDeleteNest={async (n) => deleteFromFirebase("markers", n.id)} onDeleteAllNests={handleDeleteAllNests} />}
                {view === "clients" && <ClientManagement clients={clients} setSelectedClient={setSelectedClient} setView={setView} onCreateClient={async (c) => updateFirebase("clients", c)} onDeleteClient={async (c) => deleteFromFirebase("clients", c.id)} />}
                {view === "client-detail" && <ClientDetail selectedClient={selectedClient} setView={setView} interventions={interventions} reports={reports} markers={markers} onUpdateClient={async (c) => updateFirebase("clients", c)} onDeleteClient={async (c) => { await deleteFromFirebase("clients", c.id); setView("clients"); }} />}
                {view === "schedule" && <ScheduleView interventions={interventions} clients={clients} onUpdateIntervention={async (i) => updateFirebase("interventions", i)} onDeleteIntervention={async (i) => deleteFromFirebase("interventions", i.id)} />}
                {view === "reports" && <ReportsView reports={reports} clients={clients} markers={markers} interventions={interventions} onUpdateReport={async (r) => updateFirebase("reports", r)} onDeleteReport={async (r) => deleteFromFirebase("reports", r.id)} />}
              </>
            ) : (
                <MapInterface markers={markers} clients={clients} onUpdateNest={async (n) => updateFirebase("markers", n)} />
            )}
          </div>
        </div>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .custom-icon { display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
}