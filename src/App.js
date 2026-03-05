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

const exportToCSV = (data, filename) => {
  const csvContent = "data:text/csv;charset=utf-8," + 
    data.map(e => Object.values(e).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
        } else {
            const report = data;
            doc.text("DOCUMENT", 20, 50);
            doc.setTextColor(0, 0, 0);
            doc.text(`Titre : ${report.title}`, 20, 65);
            doc.save(`${report.title}.pdf`);
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

// --- FORMULAIRES ---

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

const ClientReportForm = ({ nest, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ title: "", ...nest, ownerContact: "", description: "", status: "reported_by_client" });
  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-purple-800 text-sm flex gap-3 items-center">
        <div className="p-2 bg-white rounded-full shadow-sm"><Info size={16} className="text-purple-600"/></div>
        <div>
            <p className="font-bold">Signalement en cours</p>
            <p className="text-xs opacity-80">Merci de préciser la localisation pour nos équipes.</p>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase">Titre du signalement</label>
        <input type="text" className="w-full mt-1 p-3 bg-slate-50 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Toiture Garage..." />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase">Adresse</label>
        <div className="bg-white border border-slate-100 p-3 mt-1 rounded-xl text-sm text-slate-600 flex items-center gap-2">
          <MapPin size={16} className="text-purple-500" /> {formData.address}
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase">Contact sur place</label>
        <input type="text" placeholder="Nom ou téléphone..." className="w-full mt-1 p-3 bg-slate-50 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" value={formData.ownerContact} onChange={(e) => setFormData({ ...formData, ownerContact: e.target.value })} />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase">Détails supplémentaires</label>
        <textarea placeholder="Accès, digicode, particularités..." className="w-full mt-1 p-3 bg-slate-50 border-0 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-purple-500" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 justify-center">Annuler</Button>
        <Button variant="sky" className="bg-purple-600 hover:bg-purple-700 flex-1 justify-center" onClick={() => onSave(formData)}><Send size={16} /> Envoyer</Button>
      </div>
    </div>
  );
};

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

const InterventionEditForm = ({ intervention, clients, onSave, onDelete, onCancel }) => {
    const [formData, setFormData] = useState({ clientId: clients[0]?.id || "", status: "Planifié", technician: "", notes: "", date: new Date().toISOString().split("T")[0], ...intervention });
    return (
      <div className="space-y-4 text-slate-800">
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Client</label>
          <select className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-sky-500 text-sm" value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: parseInt(e.target.value) })}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Date</label><input type="date" className="w-full p-2 border rounded-lg text-sm" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Agent</label><input type="text" className="w-full p-2 border rounded-lg text-sm" value={formData.technician} onChange={(e) => setFormData({ ...formData, technician: e.target.value })} /></div>
        </div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Statut</label>
          <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
            <option value="Planifié">Planifié</option><option value="En attente">En attente</option><option value="Terminé">Terminé</option><option value="Annulé">Annulé</option>
          </select>
        </div>
        <textarea placeholder="Observations..." className="w-full p-3 border rounded-lg h-24 text-sm" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        <div className="flex gap-2 pt-2">
          {onDelete && formData.id && <Button variant="danger" onClick={() => onDelete(formData)}><Trash2 size={16}/></Button>}
          <Button variant="outline" className="flex-1" onClick={onCancel}>Annuler</Button>
          <Button variant="success" className="flex-1" onClick={() => onSave(formData)}>Sauver</Button>
        </div>
      </div>
    );
};

const ReportEditForm = ({ report, clients, markers, interventions, onSave, onCancel, userRole = "admin" }) => {
    const [formData, setFormData] = useState({ 
        title: "", date: new Date().toISOString().split("T")[0], type: "Fichier", status: userRole === 'admin' ? "Envoyé" : "En attente", 
        clientId: userRole === 'admin' ? (clients.length > 0 ? clients[0].id : "") : report.clientId, 
        author: userRole === 'admin' ? "admin" : "client", nestId: "", ...report 
    });

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) setFormData({ ...formData, title: file.name, type: "Fichier", status: "Envoyé" });
    };

    return (
      <div className="space-y-4 text-slate-800">
        {userRole === 'admin' && (
            <div className="grid grid-cols-3 gap-2 mb-2">
                <button className={`p-2 rounded text-xs font-bold border ${formData.type === 'Fichier' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`} onClick={() => setFormData({...formData, type: 'Fichier', title: ""})}>Upload</button>
                <button className={`p-2 rounded text-xs font-bold border ${formData.type === 'Rapport Complet' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`} onClick={() => setFormData({...formData, type: 'Rapport Complet', title: "Rapport Complet - " + (clients.find(c => c.id === formData.clientId)?.name || "")})}>Rapport</button>
                <button className={`p-2 rounded text-xs font-bold border ${formData.type === 'Fiche Nid' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`} onClick={() => setFormData({...formData, type: 'Fiche Nid', title: "Fiche Nid"})}>Fiche Nid</button>
            </div>
        )}

        {formData.type === 'Fichier' && (
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Fichier</label>
                <div className="relative mt-1">
                    <input type="file" className="hidden" id="doc-upload" onChange={handleFileUpload}/>
                    <label htmlFor="doc-upload" className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 text-slate-500 transition-colors"><Upload size={24}/> <span className="text-xs font-bold uppercase">{formData.title ? "Fichier: " + formData.title : "Cliquez pour déposer"}</span></label>
                </div>
            </div>
        )}

        <div><label className="text-[10px] font-bold text-slate-400 uppercase">{userRole === 'admin' ? "Destinataire" : "Concerne"}</label>
          <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.clientId} onChange={(e) => {
              const cid = parseInt(e.target.value);
              const clientName = clients.find(c => c.id === cid)?.name || "";
              let newTitle = formData.title;
              if (formData.type === 'Rapport Complet') newTitle = "Rapport Complet - " + clientName;
              setFormData({ ...formData, clientId: cid, title: newTitle });
          }}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {formData.type === 'Fiche Nid' && (
             <div><label className="text-[10px] font-bold text-slate-400 uppercase">Sélectionner le Nid</label>
                <select className="w-full p-2 border rounded-lg bg-white text-sm" value={formData.nestId || ""} onChange={(e) => {
                     const nid = parseInt(e.target.value);
                     const nestTitle = markers.find(m => m.id === nid)?.title || ("Nid #" + nid);
                     setFormData({ ...formData, nestId: nid, title: "Fiche - " + nestTitle });
                }}>
                    <option value="">-- Choisir un nid --</option>
                    {markers.filter(m => m.clientId === formData.clientId).map(m => <option key={m.id} value={m.id}>{m.title || m.address}</option>)}
                </select>
            </div>
        )}

        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nom du document</label><input type="text" className="w-full p-2 border rounded-lg text-sm" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
        
        {userRole === 'admin' && (
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold text-slate-400 uppercase">Date</label><input type="date" className="w-full p-2 border rounded-lg text-sm" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
            </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Annuler</Button>
          <Button variant="success" className="flex-1" onClick={() => onSave(formData)}>{userRole === 'admin' ? "Enregistrer" : "Transmettre"}</Button>
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
                    {formData.status === 'present_high' && <p className="text-[9px] mt-1.5 text-red-600 leading-tight font-medium bg-red-50 p-2 rounded-lg">Notoirement installé, poussins présents, public à proximité / conflits d’usage.</p>}
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
            map.on('click', (e) => { if(onMapClickRef.current) onMapClickRef.current(e.latlng); });
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
  }, [isAddingMode]);

  useEffect(() => {
      if (!mapInstanceRef.current || !window.L || !markersLayerRef.current) return;
      const L = window.L;
      markersLayerRef.current.clearLayers();
      markers.forEach(m => {
          let color = "#64748b"; 
          if (m.status === "present" || m.status === "present_high") color = "#ef4444"; 
          else if (m.status === "present_medium") color = "#f97316"; 
          else if (m.status === "present_low") color = "#eab308"; 
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
      if (!mapInstanceRef.current || !window.L || !routeLayerRef.current) return;
      routeLayerRef.current.clearLayers();
      if (routePath && routePath.length > 1) {
          const pointList = routePath.map(m => [m.lat, m.lng]);
          const polyline = window.L.polyline(pointList, { color: '#3b82f6', weight: 4, dashArray: '10, 10' }).addTo(routeLayerRef.current);
          mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }
  }, [routePath]);

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
    const [routePath, setRoutePath] = useState(null); 

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

    const optimizeRoute = () => {
        if (markers.length < 2) return alert("Il faut au moins 2 nids pour créer un trajet.");
        let unvisited = [...markers], current = unvisited.shift(), path = [current];
        while (unvisited.length > 0) {
            let nearest = null, minDetails = Infinity, nearestIndex = -1;
            unvisited.forEach((m, idx) => {
                const dist = Math.sqrt(Math.pow(m.lat - current.lat, 2) + Math.pow(m.lng - current.lng, 2));
                if (dist < minDetails) { minDetails = dist; nearest = m; nearestIndex = idx; }
            });
            if (nearest) { path.push(nearest); current = nearest; unvisited.splice(nearestIndex, 1); }
        }
        setRoutePath(path);
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
                    <Button variant="outline" className="h-12" onClick={optimizeRoute}><Activity size={16}/> Trajet</Button>
                    <Button variant={isAdding ? "danger" : "sky"} className="h-12" onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? <><X size={16}/> Annuler</> : <><Plus size={16}/> Pointer</>}
                    </Button>
                </div>
            </Card>
            
            <div className={`flex-1 relative shadow-2xl rounded-3xl overflow-hidden bg-white transition-all duration-300 ${isAdding ? 'border-[6px] border-sky-500' : 'border-[6px] border-white'}`}>
                {isAdding && (
                    <div className="absolute inset-x-0 top-4 z-[1000] flex justify-center pointer-events-none">
                        <div className="bg-sky-600 text-white px-6 py-2 rounded-full font-bold shadow-2xl animate-bounce">📍 Cliquez sur la carte pour placer le nid</div>
                    </div>
                )}
                
                {tempMarker && !isAdding && (<div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold animate-bounce pointer-events-none">📍 Cliquez sur le point gris pour valider</div>)}
                {routePath && (<div className="absolute top-4 left-4 z-[500] bg-white text-slate-800 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"><Activity size={14}/> Trajet affiché <button onClick={() => setRoutePath(null)}><X size={14}/></button></div>)}

                <LeafletMap markers={displayMarkers} isAddingMode={isAdding} center={mapCenter} onMarkerClick={handleMarkerClick} routePath={routePath} onMapClick={async (ll) => {
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

// --- VUES ADMIN ---

const AdminDashboard = ({ interventions, clients, markers }) => {
  const stats = useMemo(() => ({
    total: markers.length,
    reported: markers.filter(m => m.status === "reported_by_client").length,
    nonPresent: markers.filter(m => m.status === "non_present").length,
    sterilized: markers.filter(m => m.status === "sterilized_2").length,
  }), [markers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800">
      <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">TABLEAU DE BORD</h2>
      </div>
      
      {/* 1. KPIs GLOBAUX - Plus compacts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg border-0 text-center relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10 flex items-center justify-center gap-3">
                <Cloud size={32} className="opacity-80"/>
                <div className="text-left">
                    <div className="text-2xl font-black leading-none">18°C</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest mt-1">✅ Vol OK</div>
                </div>
            </div>
            <Wind className="absolute -right-4 -bottom-4 w-20 h-20 text-white/10" />
        </Card>
        
        <Card className={`p-4 border-0 shadow-md flex items-center justify-between ${stats.reported > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-white'}`}>
            <div>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${stats.reported > 0 ? 'text-red-200' : 'text-purple-500'}`}>Signalements</span>
                <span className={`text-3xl font-black leading-none ${stats.reported > 0 ? 'text-white' : 'text-slate-800'}`}>{stats.reported}</span>
            </div>
            <AlertTriangle size={32} className={stats.reported > 0 ? 'text-red-300' : 'text-purple-100'}/>
        </Card>
        
        <Card className="p-4 bg-white shadow-md border-0 flex items-center justify-between">
            <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Non Présents</span>
                <span className="text-3xl font-black leading-none text-slate-800">{stats.nonPresent}</span>
            </div>
            <Bird size={32} className="text-slate-100"/>
        </Card>
        
        <Card className="p-4 bg-white shadow-md border-0 flex items-center justify-between">
            <div>
                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest block mb-1">Stérilisés</span>
                <span className="text-3xl font-black leading-none text-emerald-600">{stats.sterilized}</span>
            </div>
            <CheckCircle size={32} className="text-emerald-100"/>
        </Card>
      </div>

      {/* 2. LAYOUT OPTIMISÉ : 2/3 Clients, 1/3 Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLONNE GAUCHE : État des sites (Tableau compact) */}
          <div className="lg:col-span-2">
              <Card className="p-0 border-0 shadow-lg rounded-3xl overflow-hidden bg-white flex flex-col h-full">
                  <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Users size={16} className="text-sky-400"/> État par client</h3>
                  </div>
                  <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10 shadow-sm">
                              <tr>
                                  <th className="p-4 pl-6">Client / Site</th>
                                  <th className="p-4 text-center">Total Nids</th>
                                  <th className="p-4 text-center">Urgences</th>
                                  <th className="p-4 text-center">Stérilisés</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {clients.map(client => {
                                  const cNests = markers.filter(m => m.clientId === client.id);
                                  if (cNests.length === 0) return null;
                                  
                                  const cReported = cNests.filter(m => m.status === "reported_by_client" || m.status === "present_high").length;
                                  const cDone = cNests.filter(m => m.status === "sterilized_2").length;
                                  
                                  return (
                                      <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="p-4 pl-6 font-bold text-slate-800">{client.name}</td>
                                          <td className="p-4 text-center font-black text-slate-600">{cNests.length}</td>
                                          <td className="p-4 text-center">
                                              {cReported > 0 ? (
                                                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">{cReported}</span>
                                              ) : <span className="text-slate-300">-</span>}
                                          </td>
                                          <td className="p-4 text-center">
                                              {cDone > 0 ? (
                                                  <span className="text-emerald-600 font-black">{cDone}</span>
                                              ) : <span className="text-slate-300">0</span>}
                                          </td>
                                      </tr>
                                  );
                              })}
                              {clients.filter(c => markers.some(m => m.clientId === c.id)).length === 0 && (
                                  <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic text-xs">Aucune donnée client disponible.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
          
          {/* COLONNE DROITE : Agenda compact */}
          <div className="lg:col-span-1">
               <Card className="p-0 border-0 shadow-lg rounded-3xl overflow-hidden bg-white flex flex-col h-full max-h-[460px]">
                  <div className="p-5 bg-sky-600 text-white flex justify-between items-center">
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Calendar size={16} className="text-sky-200"/> Interventions</h3>
                  </div>
                  <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                       {interventions.filter(i => i.status === 'Planifié' || i.status === 'En attente')
                           .sort((a,b) => new Date(a.date) - new Date(b.date))
                           .slice(0, 5)
                           .map(i => (
                           <div key={i.id} className="border-l-2 border-sky-500 pl-4 py-1">
                               <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-0.5">{i.date}</p>
                               <p className="font-bold text-slate-800 text-sm leading-tight truncate">{clients.find(c => c.id === i.clientId)?.name || "Client"}</p>
                               <div className="mt-2"><Badge status={i.status}/></div>
                           </div>
                       ))}
                       {interventions.filter(i => i.status === 'Planifié' || i.status === 'En attente').length === 0 && (
                           <div className="text-center text-slate-400 py-8">
                               <Calendar size={32} className="mx-auto mb-2 opacity-50"/>
                               <p className="text-xs font-medium uppercase tracking-widest">Rien de prévu</p>
                           </div>
                       )}
                  </div>
              </Card>
          </div>

      </div>
    </div>
  );
};

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

            const rawLocation = (row["Noms Client"] || row["Lieux"] || "").toString().toLowerCase();
            let matchedClient = clients.find(c => c.name.toLowerCase() === rawLocation);
            
            if (!matchedClient) {
                if (rawLocation.includes("narbonne")) matchedClient = clients.find(c => c.name.toLowerCase().includes("narbonne"));
                else if (rawLocation.includes("meze") || rawLocation.includes("mèze")) matchedClient = clients.find(c => c.name.toLowerCase().includes("meze") || c.name.toLowerCase().includes("mèze"));
                else if (rawLocation.includes("sete") || rawLocation.includes("sète")) matchedClient = clients.find(c => c.name.toLowerCase().includes("sete") || c.name.toLowerCase().includes("sète"));
                
                if(!matchedClient && rawLocation.length > 3) {
                     matchedClient = clients.find(c => rawLocation.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(rawLocation));
                }
            }
            
            const client = matchedClient || clients[0];
            
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
    e.target.value = "";
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
                    <Upload size={18}/> Importer Fichier
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
                          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                              <tr><th className="p-4 pl-8">Réf / Adresse</th><th className="p-4">Statut</th><th className="p-4 text-center">Contenu</th><th className="p-4 text-right pr-8">Actions</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {clientNests.map((m) => (
                                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="p-4 pl-8">
                                          <div className="font-bold text-slate-900 text-base">{m.title || "Nid"}</div>
                                          <div className="text-xs text-slate-400 truncate max-w-[300px] flex items-center gap-1 mt-1"><MapPin size={10}/> {m.address}</div>
                                      </td>
                                      <td className="p-4"><Badge status={m.status}/></td>
                                      <td className="p-4 text-center font-black text-slate-700">{m.eggs} <span className="font-normal opacity-50">œuf(s)</span></td>
                                      <td className="p-4 flex justify-end gap-2 pr-8">
                                          <button onClick={() => setSelectedNest(m)} className="p-2 text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100"><Edit size={16}/></button>
                                          <button onClick={() => { if (window.confirm("Supprimer ce nid ?")) onDeleteNest(m); }} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
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
        <div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-900">Édition du Nid</h3>
                  <button onClick={() => setSelectedNest(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
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
};

const ScheduleView = ({ interventions, clients, onUpdateIntervention, onDeleteIntervention }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingInt, setEditingInt] = useState(null);
    const [viewMode, setViewMode] = useState("calendar");
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
            days.push(
                <div key={d} className={`h-28 border border-slate-100 p-2 hover:bg-sky-50 transition-all cursor-pointer relative group ${isToday ? 'bg-sky-50/50' : 'bg-white'}`} onClick={() => { setEditingInt({ id: Date.now(), date: dateStr }); setIsCreating(true); }}>
                    <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-sky-600 text-white' : 'text-slate-400 group-hover:text-sky-600 transition-colors'}`}>{d}</span>
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar pr-1">
                        {dayInts.map(i => (
                            <div key={i.id} className="text-[9px] bg-slate-900 text-white px-2 py-1 rounded-lg truncate font-black uppercase tracking-tighter border-l-4 border-sky-400">
                                {clients.find(c => c.id === i.clientId)?.name || "Agent Aerothau"}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="space-y-8 text-slate-800">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">PLANNING</h2>
                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-lg border border-slate-100">
                    <button onClick={() => setViewMode("calendar")} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === "calendar" ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Calendrier</button>
                    <button onClick={() => setViewMode("list")} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === "list" ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Liste</button>
                </div>
                <Button variant="sky" className="rounded-2xl px-6 py-3 uppercase tracking-widest text-xs h-12" onClick={() => setIsCreating(true)}><Plus size={16}/> Programmer</Button>
            </div>

            {viewMode === "calendar" ? (
                <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl bg-white">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24}/></button>
                        <h3 className="text-xl font-black uppercase tracking-widest">{currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={24}/></button>
                    </div>
                    <div className="grid grid-cols-7 bg-slate-100 border-b">
                        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => <div key={d} className="py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 border-collapse">{renderCalendar()}</div>
                </Card>
            ) : (
                <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl bg-white">
                    <div className="overflow-x-auto text-slate-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest">
                                <tr><th className="p-6">Date</th><th className="p-6">Client bénéficiaire</th><th className="p-6">Statut mission</th><th className="p-6 text-right">Actions</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {interventions.length === 0 ? <tr><td colSpan="4" className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Aucune intervention programmée</td></tr> : interventions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(i => (
                                    <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-6 font-black text-sky-600">{i.date}</td>
                                        <td className="p-6 font-bold uppercase text-slate-700 tracking-tight">{clients.find(c => c.id === i.clientId)?.name || "N/A"}</td>
                                        <td className="p-6"><Badge status={i.status}/></td>
                                        <td className="p-6 flex justify-end gap-3">
                                            <button onClick={() => setEditingInt(i)} className="p-2.5 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all shadow-sm"><Edit size={18}/></button>
                                            <button onClick={() => {if(window.confirm("Supprimer cette mission ?")) onDeleteIntervention(i);}} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {(isCreating || editingInt) && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
                    <Card className="p-8 w-full max-w-md shadow-2xl border-0 rounded-3xl bg-white">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter">{isCreating && !editingInt?.clientId ? "Nouvelle Mission" : "Détails Mission"}</h3>
                            <button onClick={() => {setEditingInt(null); setIsCreating(false);}} className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <InterventionEditForm intervention={editingInt} clients={clients} onSave={async (d) => { await onUpdateIntervention(d); setEditingInt(null); setIsCreating(false); }} onDelete={onDeleteIntervention} onCancel={() => {setEditingInt(null); setIsCreating(false);}} />
                    </Card>
                </div>
            )}
        </div>
    );
};

const ReportsView = ({ reports, clients, markers, interventions, onUpdateReport, onDeleteReport }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingRep, setEditingRep] = useState(null);

    // Fonction de filtrage pour n'afficher que les documents de l'admin ou du client
    const [filter, setFilter] = useState('all'); // 'all', 'admin', 'client'

    const filteredReports = useMemo(() => {
        if (filter === 'admin') return reports.filter(r => r.author === 'admin');
        if (filter === 'client') return reports.filter(r => r.author === 'client');
        return reports;
    }, [reports, filter]);

    return (
        <div className="space-y-8 animate-in fade-in duration-300 text-slate-800">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">DOCUMENTS</h2>
                <div className="flex gap-2">
                     <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Tous</button>
                        <button onClick={() => setFilter('client')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'client' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Reçus Client</button>
                    </div>
                     <Button variant="sky" className="rounded-2xl px-6 py-3 uppercase tracking-widest text-xs h-12" onClick={() => setIsCreating(true)}><Plus size={16}/> Ajouter</Button>
                </div>
            </div>
            
            <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest">
                            <tr><th className="p-6">Document</th><th className="p-6">Client / Source</th><th className="p-6">Date</th><th className="p-6">Type</th><th className="p-6 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredReports.length === 0 ? <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold uppercase italic tracking-widest">Aucun document trouvé</td></tr> : filteredReports.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-6 font-black flex items-center gap-4 text-slate-700 tracking-tight">
                                        <div className={`p-2.5 rounded-xl ${r.author === 'client' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {r.author === 'client' ? <FileCheck size={20}/> : <File size={20}/>}
                                        </div> 
                                        {r.title}
                                    </td>
                                    <td className="p-6">
                                        <span className="text-xs font-black uppercase text-slate-700">{clients.find(c => c.id === r.clientId)?.name || "Client supprimé"}</span>
                                        <div className="text-[10px] text-slate-400">{r.author === 'client' ? "Envoyé par le client" : "Généré par Aerothau"}</div>
                                    </td>
                                    <td className="p-6 text-xs font-bold text-slate-500">{r.date}</td>
                                    <td className="p-6"><Badge status={r.type === 'Fiche Nid' ? 'reported_by_client' : (r.type === 'Rapport Complet' ? 'sterilized_2' : 'Planifié')}/></td>
                                    <td className="p-6 flex justify-end gap-3">
                                        <button 
                                            onClick={() => generatePDF(r.type === 'Fiche Nid' ? 'nest_detail' : (r.type === 'Rapport Complet' ? 'complete_report' : 'file'), r.type === 'Fiche Nid' ? markers.find(m => m.id === r.nestId) : r, { client: clients.find(c => c.id === r.clientId), markers: markers.filter(m => m.clientId === r.clientId), interventions: interventions.filter(i => i.clientId === r.clientId) })} 
                                            className="p-2.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all shadow-sm" 
                                            title="Télécharger / Imprimer"
                                        >
                                            <Printer size={18}/>
                                        </button>
                                        <button onClick={() => setEditingRep(r)} className="p-2.5 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all shadow-sm"><Edit size={18}/></button>
                                        <button onClick={() => {if(window.confirm("Supprimer ce document ?")) onDeleteReport(r);}} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {(isCreating || editingRep) && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
                    <Card className="p-8 w-full max-w-md shadow-2xl border-0 rounded-3xl bg-white text-slate-800">
                        <div className="flex justify-between items-center mb-8"><h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter">{isCreating ? "Nouveau Document" : "Modifier"}</h3><button onClick={() => {setEditingRep(null); setIsCreating(false);}} className="text-slate-400 p-1.5 bg-slate-100 rounded-full"><X size={20}/></button></div>
                        <ReportEditForm report={editingRep || {id: Date.now()}} clients={clients} markers={markers} interventions={interventions} onSave={async (d) => { await onUpdateReport(d); setEditingRep(null); setIsCreating(false); }} onCancel={() => {setEditingRep(null); setIsCreating(false);}} />
                    </Card>
                </div>
            )}
        </div>
    );
};

// --- COMPOSANT ESPACE CLIENT ---

const ClientSpace = ({ user, markers, interventions, clients, reports, onUpdateNest, onUpdateReport }) => {
    const myMarkers = useMemo(() => markers.filter(m => m.clientId === user.clientId), [markers, user.clientId]);
    const myReports = useMemo(() => reports.filter(r => r.clientId === user.clientId), [reports, user.clientId]);
    const neut = useMemo(() => myMarkers.filter(m => m.status && m.status.includes("sterilized")).length, [myMarkers]);
    
    const [pendingReport, setPendingReport] = useState(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [selectedNestDetail, setSelectedNestDetail] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'map', 'list', 'documents'

    const requestIntervention = async () => {
        if(window.confirm("Confirmer la demande d'intervention urgente ?")) {
            alert("Votre demande a été transmise à nos équipes. Nous vous contacterons sous 24h.");
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* WIDGET METEO & STATS - Alignés et compacts */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-900">
                            <Card className="p-6 border-0 shadow-lg rounded-3xl flex flex-col justify-between bg-gradient-to-br from-sky-400 to-blue-600 text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold uppercase tracking-widest text-[10px] opacity-80">Météo de vol</span>
                                        <Cloud size={20} />
                                    </div>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-3xl font-black leading-none">18°C</span>
                                        <span className="text-xs font-bold opacity-90 mb-1">Vent: 12 km/h</span>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded-md inline-block">✅ Conditions optimales</p>
                                </div>
                                <Wind className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" />
                            </Card>

                            <Card className="p-6 border-0 shadow-lg rounded-3xl flex items-center justify-between bg-white relative overflow-hidden group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setActiveTab('map')}>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nids surveillés</p>
                                    <p className="text-4xl font-black text-slate-800 tracking-tighter">{myMarkers.length}</p>
                                    <p className="text-[10px] font-bold text-sky-600 uppercase mt-2 flex items-center gap-1 group-hover:underline">Voir la carte <ChevronRight size={12}/></p>
                                </div>
                                <Bird size={64} className="text-slate-50 absolute -right-2 -bottom-2 transform -scale-x-100 group-hover:text-slate-100 transition-colors" />
                            </Card>

                            <Card className="p-6 border-0 shadow-lg rounded-3xl flex items-center justify-between bg-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stérilisations</p>
                                    <p className="text-4xl font-black text-emerald-600 tracking-tighter">{neut}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Passage 2 confirmé</p>
                                </div>
                                <CheckCircle size={64} className="text-emerald-50 absolute -right-2 -bottom-2" />
                            </Card>
                        </div>

                        {/* ACTIONS RAPIDES & DOCS RECENTS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* DEMANDE INTERVENTION (1/3) */}
                            <Card className="p-6 border-0 shadow-xl rounded-3xl bg-slate-900 text-white flex flex-col justify-center items-center text-center relative overflow-hidden lg:col-span-1">
                                <div className="relative z-10 w-full">
                                    <AlertTriangle size={32} className="text-orange-400 mb-4 mx-auto animate-pulse"/>
                                    <h3 className="font-black text-lg uppercase tracking-tighter mb-2">Un problème ?</h3>
                                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">Nid agressif ou nouvelle installation suspecte ?</p>
                                    <Button variant="sky" className="w-full rounded-xl text-[10px] uppercase font-black tracking-widest py-3" onClick={() => {setIsAddingMode(true); setActiveTab('map');}}>
                                        Signaler un nid
                                    </Button>
                                    <button onClick={requestIntervention} className="w-full mt-3 text-[10px] uppercase font-bold text-slate-400 hover:text-white tracking-widest transition-colors">Demande de passage</button>
                                </div>
                            </Card>

                            {/* DOCUMENTS RECENTS (2/3) */}
                            <Card className="p-0 border-0 shadow-xl rounded-3xl bg-white flex flex-col h-full lg:col-span-2 overflow-hidden">
                                <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-widest flex items-center gap-2"><FileText size={16} className="text-sky-500"/> Documents Récents</h3>
                                    <button onClick={() => setActiveTab('documents')} className="text-[10px] font-bold text-sky-600 uppercase hover:underline">Voir tout</button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
                                     {myReports && myReports.length > 0 ? myReports.slice(0, 4).map(r => (
                                         <div key={r.id} className="p-3 border border-slate-100 rounded-xl flex justify-between items-center group hover:border-sky-200 hover:shadow-sm transition-all cursor-pointer" onClick={() => generatePDF('file', r)}>
                                             <div className="flex items-center gap-3">
                                                 <div className={`p-2 rounded-lg ${r.author === 'client' ? 'bg-purple-50 text-purple-600' : 'bg-sky-50 text-sky-600'}`}>
                                                    {r.author === 'client' ? <Upload size={14}/> : <Download size={14}/>}
                                                 </div>
                                                 <div>
                                                     <p className="font-bold text-xs text-slate-800 leading-tight">{r.title}</p>
                                                     <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{r.date} • {r.author === 'client' ? 'Envoyé' : 'Reçu'}</p>
                                                 </div>
                                             </div>
                                             <span className="text-slate-300 group-hover:text-sky-600 transition-colors"><Printer size={14}/></span>
                                         </div>
                                     )) : (
                                         <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                                             <File size={32} className="mb-2 opacity-20"/>
                                             <p className="text-xs italic">Aucun document récent.</p>
                                         </div>
                                     )}
                                </div>
                            </Card>
                        </div>
                    </div>
                );
            case 'map':
                return (
                    <div className="h-[600px] flex flex-col gap-6 text-slate-800 animate-in fade-in duration-500">
                        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center z-20 shadow-xl border-0 rounded-2xl bg-white">
                            <div className="flex-1 font-black uppercase tracking-widest text-sm text-slate-500">Cartographie</div>
                            <Button variant={isAddingMode ? "danger" : "sky"} className="py-3 px-6 rounded-2xl uppercase tracking-widest text-xs h-12" onClick={() => setIsAddingMode(!isAddingMode)}>
                                {isAddingMode ? <><X size={16}/> Annuler</> : <><Plus size={16}/> Signaler un nid</>}
                            </Button>
                        </Card>
                        <div className={`flex-1 relative shadow-2xl rounded-3xl overflow-hidden bg-white transition-all duration-300 ${isAddingMode ? 'border-8 border-sky-500' : 'border-8 border-white'}`}>
                            {isAddingMode && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold animate-bounce pointer-events-none">
                                    📍 Cliquez sur la carte pour signaler un nid
                                </div>
                            )}
                            <LeafletMap 
                                markers={myMarkers} 
                                isAddingMode={isAddingMode} 
                                onMarkerClick={(m) => {
                                    if(!isAddingMode) setSelectedNestDetail(m);
                                }}
                                onMapClick={(ll) => {
                                    if(isAddingMode) {
                                        setPendingReport({
                                            id: Date.now(),
                                            clientId: user.clientId,
                                            lat: ll.lat,
                                            lng: ll.lng,
                                            address: "Nouveau signalement",
                                            status: "reported_by_client",
                                            title: "Signalement Client",
                                        });
                                        setIsAddingMode(false);
                                    }
                                }}
                            />
                            
                            {pendingReport && (
                                <div className="absolute top-6 left-6 z-[500] w-72 md:w-80 max-h-[90%] overflow-hidden flex flex-col animate-in slide-in-from-left-6 fade-in duration-300 shadow-2xl">
                                    <Card className="border-0 flex flex-col overflow-hidden rounded-3xl bg-white">
                                        <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                                            <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Crosshair size={16} className="text-sky-400"/> Signalement</span>
                                            <button onClick={() => setPendingReport(null)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={18}/></button>
                                        </div>
                                        <div className="p-6 overflow-y-auto shrink custom-scrollbar bg-white">
                                            <ClientReportForm nest={pendingReport} onSave={async (d) => {
                                                await onUpdateNest(d);
                                                setPendingReport(null);
                                                alert("Signalement enregistré !");
                                            }} onCancel={() => setPendingReport(null)} />
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {selectedNestDetail && (
                                <div className="absolute top-6 left-6 z-[500] w-72 md:w-80 max-h-[90%] overflow-hidden flex flex-col animate-in slide-in-from-left-6 fade-in duration-300 shadow-2xl">
                                    <Card className="border-0 flex flex-col overflow-hidden rounded-3xl bg-white">
                                        <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                                            <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><MapIcon size={16} className="text-sky-400"/> Détails du Nid</span>
                                            <button onClick={() => setSelectedNestDetail(null)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={18}/></button>
                                        </div>
                                        <div className="p-6 overflow-y-auto shrink custom-scrollbar bg-white">
                                            <NestEditForm nest={selectedNestDetail} readOnly={true} onCancel={() => setSelectedNestDetail(null)} />
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'list':
                return (
                     <Card className="p-0 border-0 shadow-xl rounded-3xl bg-white flex flex-col flex-1 overflow-hidden h-[600px] animate-in fade-in duration-500">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center mb-0 shrink-0">
                            <h3 className="font-black text-lg text-slate-800 uppercase tracking-tighter">État des Nids</h3>
                            <div className="p-2 bg-slate-100 rounded-full"><Bird size={18} className="text-slate-400"/></div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                             {myMarkers.length > 0 ? (
                                 <table className="w-full text-left text-xs">
                                     <thead className="bg-slate-50 text-slate-400 font-bold uppercase sticky top-0 z-10">
                                         <tr>
                                             <th className="p-3 pl-6">Ref</th>
                                             <th className="p-3">Statut</th>
                                             <th className="p-3 text-center">Œufs</th>
                                             <th className="p-3 pr-6">Obs.</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-50">
                                         {myMarkers.map(m => (
                                             <tr key={m.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setSelectedNestDetail(m); setActiveTab('map'); }}>
                                                 <td className="p-3 pl-6">
                                                     <div className="font-bold text-slate-700">{m.title || "Nid #" + m.id.toString().slice(-4)}</div>
                                                     <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{m.address}</div>
                                                 </td>
                                                 <td className="p-3"><Badge status={m.status}/></td>
                                                 <td className="p-3 text-center font-bold text-slate-600">{m.eggs}</td>
                                                 <td className="p-3 pr-6 text-slate-500 italic truncate max-w-[100px]" title={m.comments}>{m.comments || "-"}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             ) : (
                                 <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                     <Bird size={32} className="mb-2 opacity-50"/>
                                     <p>Aucun nid recensé pour le moment.</p>
                                 </div>
                             )}
                        </div>
                    </Card>
                );
            case 'documents':
                return (
                    <div className="h-[600px] flex flex-col gap-6 animate-in fade-in duration-500">
                         <Card className="p-0 border-0 shadow-xl rounded-3xl bg-white flex flex-col flex-1 overflow-hidden relative">
                             <div className="p-6 border-b border-slate-50 flex justify-between items-center mb-0 shrink-0">
                                <h3 className="font-black text-lg text-slate-800 uppercase tracking-tighter">Documents</h3>
                                <button onClick={() => setIsUploading(true)} className="p-2 bg-sky-50 text-sky-600 rounded-full hover:bg-sky-600 hover:text-white transition-colors"><Upload size={18}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                 {myReports.filter(r => r.author === 'admin').map(r => (
                                     <div key={r.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center group cursor-pointer hover:bg-slate-100">
                                         <div className="flex items-center gap-3">
                                             <div className="p-2 bg-white rounded-lg text-slate-400"><FileText size={16}/></div>
                                             <div>
                                                 <p className="font-bold text-xs text-slate-700">{r.title}</p>
                                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Reçu le {r.date}</p>
                                             </div>
                                         </div>
                                         <Download size={14} className="text-slate-300 group-hover:text-sky-600" onClick={() => generatePDF('file', r)}/>
                                     </div>
                                 ))}
                                 {myReports.filter(r => r.author === 'client').map(r => (
                                     <div key={r.id} className="p-3 bg-purple-50 rounded-xl flex justify-between items-center group">
                                         <div className="flex items-center gap-3">
                                             <div className="p-2 bg-white rounded-lg text-purple-400"><Send size={16}/></div>
                                             <div>
                                                 <p className="font-bold text-xs text-purple-700">{r.title}</p>
                                                 <p className="text-[9px] font-bold text-purple-400 uppercase">Envoyé le {r.date}</p>
                                             </div>
                                         </div>
                                         <CheckCircle size={14} className="text-purple-300"/>
                                     </div>
                                 ))}
                            </div>
                        </Card>
                        
                        {isUploading && (
                             <div className="absolute inset-0 z-[1000] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                                <Card className="p-6 w-full shadow-2xl border-0 rounded-3xl bg-white text-slate-800">
                                    <div className="flex justify-between items-center mb-6"><h3 className="font-black text-lg uppercase tracking-tighter">Transmettre un document</h3><button onClick={() => setIsUploading(false)}><X size={20} className="text-slate-400"/></button></div>
                                    <ReportEditForm 
                                        report={{id: Date.now(), clientId: user.clientId}} 
                                        clients={clients} 
                                        userRole="client"
                                        onSave={async (d) => { await onUpdateReport(d); setIsUploading(false); }} 
                                        onCancel={() => setIsUploading(false)} 
                                    />
                                </Card>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 text-slate-800 pb-20 md:pb-0">
             <Card className="p-8 bg-slate-900 text-white relative overflow-hidden shadow-2xl rounded-[32px] border-0 mb-8">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                         <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Bonjour, {user.name}</h2>
                         <p className="text-slate-400 font-bold max-w-lg text-xs tracking-widest uppercase">Espace Client Aerothau</p>
                    </div>
                    <button onClick={() => { if(window.confirm("Se déconnecter ?")) window.location.reload(); }} className="bg-red-500/20 hover:bg-red-500 text-white p-2 rounded-xl transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
                <Plane className="absolute -right-10 -bottom-10 h-48 w-48 text-white/5 rotate-12" />
            </Card>

            <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Tableau de bord</button>
                <button onClick={() => setActiveTab('map')} className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'map' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Carte Interactive</button>
                <button onClick={() => setActiveTab('list')} className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Liste des Nids</button>
                <button onClick={() => setActiveTab('documents')} className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'documents' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Documents</button>
            </div>

            {renderContent()}
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
                {view === "nests" && <NestManagement markers={markers} clients={clients} onUpdateNest={async (n) => updateFirebase("markers", n)} onDeleteNest={async (n) => deleteFromFirebase("markers", n.id)} onDeleteAllNests={async () => {
                    if (window.confirm("⚠️ Êtes-vous sûr de vouloir supprimer TOUS les nids ?")) {
                        for (const m of markers) { await deleteFromFirebase("markers", m.id); }
                        showToast("Tous les nids ont été supprimés.", "success");
                    }
                }} />}
                {view === "clients" && <ClientManagement clients={clients} setSelectedClient={setSelectedClient} setView={setView} onCreateClient={async (c) => updateFirebase("clients", c)} onDeleteClient={async (c) => deleteFromFirebase("clients", c.id)} />}
                {view === "client-detail" && <ClientDetail selectedClient={selectedClient} setView={setView} interventions={interventions} reports={reports} markers={markers} onUpdateClient={async (c) => updateFirebase("clients", c)} onDeleteClient={async (c) => { await deleteFromFirebase("clients", c.id); setView("clients"); }} />}
                {view === "schedule" && <ScheduleView interventions={interventions} clients={clients} onUpdateIntervention={async (i) => updateFirebase("interventions", i)} onDeleteIntervention={async (i) => deleteFromFirebase("interventions", i.id)} />}
                {view === "reports" && <ReportsView reports={reports} clients={clients} markers={markers} interventions={interventions} onUpdateReport={async (r) => updateFirebase("reports", r)} onDeleteReport={async (r) => deleteFromFirebase("reports", r.id)} />}
              </>
            ) : (
                <ClientSpace user={user} markers={markers} interventions={interventions} clients={clients} reports={reports} onUpdateNest={async (n) => updateFirebase("markers", n)} onUpdateReport={async (r) => updateFirebase("reports", r)} />
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