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

// Fonction de génération PDF Robuste
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
            doc.text(`Titre : ${nest.title || "Nid #" + nest.id}`, 20, 65);
            doc.text(`Client : ${clientName}`, 20, 72);
            doc.text(`Adresse : ${nest.address}`, 20, 79);
            doc.text(`Coordonnées GPS : ${nest.lat?.toFixed(6)}, ${nest.lng?.toFixed(6)}`, 20, 86);
            doc.text(`Statut : ${nest.status}`, 20, 93);
            doc.text(`Œufs : ${nest.eggs}`, 20, 100);
            doc.text(`Notes : ${nest.comments || "Aucune"}`, 20, 107);
            if (nest.photo) { try { doc.addImage(nest.photo, 'JPEG', 20, 115, 100, 75); } catch(e) {} }
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
    non_present: "bg-slate-100 text-slate-500 border border-slate-200",
    sterilized_1: "bg-lime-100 text-lime-700 border border-lime-200",
    sterilized_2: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    reported_by_client: "bg-purple-100 text-purple-700 border border-purple-200",
    temp: "bg-slate-500 text-white animate-pulse border-2 border-dashed border-white",
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
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

// --- COMPOSANTS DE FORMULAIRES ---

const ClientReportForm = ({ nest, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ title: "", ...nest, ownerContact: "", description: "", status: "reported_by_client" });
  return (<div className="space-y-4"><input className="w-full p-2 border rounded-lg" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="Titre" /><textarea className="w-full p-2 border rounded-lg" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} placeholder="Description" /><div className="flex gap-2"><Button variant="outline" onClick={onCancel}>Annuler</Button><Button variant="sky" onClick={()=>onSave(formData)}>Envoyer</Button></div></div>);
};

const ClientEditForm = ({ client, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ ...client });
    return (<div className="space-y-4"><input className="w-full p-2 border rounded-lg" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Nom" /><input className="w-full p-2 border rounded-lg" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} placeholder="Adresse" /><div className="flex gap-2"><Button variant="outline" onClick={onCancel}>Annuler</Button><Button variant="success" onClick={()=>onSave(formData)}>Sauver</Button></div></div>);
};

const InterventionEditForm = ({ intervention, clients, onSave, onDelete, onCancel }) => {
    const [formData, setFormData] = useState({ clientId: clients[0]?.id || "", status: "Planifié", technician: "", notes: "", date: new Date().toISOString().split("T")[0], ...intervention });
    return (<div className="space-y-4"><select className="w-full p-2 border rounded-lg" value={formData.clientId} onChange={e=>setFormData({...formData, clientId: parseInt(e.target.value)})}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input type="date" className="w-full p-2 border rounded-lg" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})}/><textarea className="w-full p-2 border rounded-lg" value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} placeholder="Notes"/><div className="flex gap-2"><Button variant="outline" onClick={onCancel}>Annuler</Button><Button variant="success" onClick={()=>onSave(formData)}>Sauver</Button></div></div>);
};

const ReportEditForm = ({ report, clients, onSave, onCancel, userRole = "admin" }) => {
    const [formData, setFormData] = useState({ title: "", date: new Date().toISOString().split("T")[0], type: "Fichier", status: "Envoyé", clientId: userRole === 'admin' ? (clients[0]?.id || "") : report.clientId, author: userRole === 'admin' ? "admin" : "client", nestId: "", ...report });
    const handleFileUpload = (e) => { const file = e.target.files[0]; if(file) setFormData({...formData, title: file.name, type: "Fichier", status: "Envoyé"}); };
    return (
      <div className="space-y-4">
        {userRole === 'admin' && (<div className="grid grid-cols-3 gap-2 mb-2"><button className="p-2 border rounded text-xs" onClick={()=>setFormData({...formData, type: 'Fichier', title: ""})}>Upload</button><button className="p-2 border rounded text-xs" onClick={()=>setFormData({...formData, type: 'Rapport Complet', title: "Rapport - " + (clients.find(c=>c.id===formData.clientId)?.name||"")})}>Rapport</button><button className="p-2 border rounded text-xs" onClick={()=>setFormData({...formData, type: 'Fiche Nid', title: "Fiche Nid"})}>Fiche</button></div>)}
        {formData.type === 'Fichier' && <input type="file" className="w-full p-2 border rounded-lg" onChange={handleFileUpload}/>}
        {userRole === 'admin' && <select className="w-full p-2 border rounded-lg" value={formData.clientId} onChange={e=>setFormData({...formData, clientId: parseInt(e.target.value)})}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}
        <input className="w-full p-2 border rounded-lg" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="Nom document"/>
        <div className="flex gap-2"><Button variant="outline" onClick={onCancel}>Annuler</Button><Button variant="success" onClick={()=>onSave(formData)}>Valider</Button></div>
      </div>
    );
};

const NestEditForm = ({ nest, clients = [], onSave, onCancel, onDelete, readOnly = false, onGeneratePDF }) => {
  const [formData, setFormData] = useState({ title: "", comments: "", eggs: 0, status: "present", clientId: "", ...nest });
  const handlePhotoUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData({ ...formData, photo: reader.result }); reader.readAsDataURL(file); } };
  const openRoute = () => { if (nest.lat && nest.lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${nest.lat},${nest.lng}`, '_blank'); else alert("Coordonnées GPS manquantes."); };
  
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
                        <option value="present">🔴 Présent (Actif)</option>
                        <option value="sterilized_1">🟢 1er Passage (Traité)</option>
                        <option value="sterilized_2">🟢 2ème Passage (Confirmé)</option>
                        <option value="non_present">⚪ Non présent / Inactif</option>
                    </select>
                 </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Identification</label>
                    <input className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="Titre / Référence"/>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Client</label>
                    <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.clientId} onChange={e=>setFormData({...formData, clientId: parseInt(e.target.value)})}>
                        <option value="">-- Sélectionner --</option>
                        {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Œufs</label>
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
            <textarea className="w-full p-3 border border-slate-200 rounded-xl text-sm h-20 focus:ring-2 focus:ring-sky-500 outline-none resize-none" placeholder="Accès difficile, hauteur, matériel nécessaire..." value={formData.comments} onChange={(e) => setFormData({...formData, comments: e.target.value})}/>
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
          if (m.status === "present") color = "#ef4444"; 
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

// --- COMPOSANTS DE VUE ---

const AdminDashboard = ({ interventions, clients, markers }) => {
  const stats = useMemo(() => ({
    total: markers.length,
    reported: markers.filter(m => m.status === "reported_by_client").length,
    nonPresent: markers.filter(m => m.status === "non_present").length,
    sterilized: markers.filter(m => m.status === "sterilized_2").length,
  }), [markers]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-slate-800">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-black uppercase tracking-tighter">TABLEAU DE BORD</h2></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg border-0 text-center relative overflow-hidden">
            <div className="relative z-10"><Cloud size={20} className="mx-auto mb-1 opacity-70"/><div className="text-2xl font-black">18°C</div><div className="text-[10px] font-bold uppercase">✅ Vol Autorisé</div></div>
            <Wind className="absolute -right-4 -bottom-4 w-16 h-16 text-white/10" />
        </Card>
        <Card className={`p-4 text-center border-0 shadow-lg ${stats.reported > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-slate-400'}`}>
            <AlertTriangle size={20} className="mx-auto mb-1"/><div className="text-2xl font-black">{stats.reported}</div><div className="text-[10px] font-bold uppercase">Signalements</div>
        </Card>
        <Card className="p-4 bg-white text-center shadow-sm"><span className="text-[10px] font-black uppercase text-slate-400">Non Présents</span><div className="text-2xl font-black">{stats.nonPresent}</div></Card>
        <Card className="p-4 bg-white text-center shadow-sm"><span className="text-[10px] font-black uppercase text-emerald-500">Stérilisés</span><div className="text-2xl font-black text-emerald-600">{stats.sterilized}</div></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => {
              const cNests = markers.filter(m => m.clientId === client.id);
              const cReported = cNests.filter(m => m.status === "reported_by_client").length;
              const cDone = cNests.filter(m => m.status === "sterilized_2").length;
              if (cNests.length === 0) return null;
              return (
                  <Card key={client.id} className="p-6">
                    <h4 className="font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2 truncate"><Users size={16}/> {client.name}</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-center"><p className="text-[9px] font-black text-purple-400 uppercase">Alertes</p><p className="text-xl font-black text-purple-700">{cReported}</p></div>
                        <div className="p-2 bg-emerald-50 rounded-lg text-center"><p className="text-[9px] font-black text-emerald-400 uppercase">Stérilisés</p><p className="text-xl font-black text-emerald-700">{cDone}</p></div>
                    </div>
                  </Card>
              );
          })}
      </div>
    </div>
  );
};

const NestManagement = ({ markers, onUpdateNest, onDeleteNest, clients }) => {
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
      "Longitude": m.lng
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 40 }, { wch: 40 }, { wch: 15 }, { wch: 15 }];
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
            const clientName = row["Noms Client"];
            const client = clients.find(c => c.name === clientName);
            const newNest = {
                id: row["ID"] || Date.now() + count,
                clientId: client ? client.id : (clients[0]?.id || ""),
                status: row["Etat du nids"] || "present",
                eggs: parseInt(row["nbr d'œuf"]) || 0,
                address: row["adresse precis"] || "Adresse importée",
                comments: row["observation"] || "",
                lat: parseFloat(row["Latitude"]) || MAP_CENTER_DEFAULT.lat,
                lng: parseFloat(row["Longitude"]) || MAP_CENTER_DEFAULT.lng,
                title: row["Identification"] || "Nid " + (row["ID"] || count)
            };
            await onUpdateNest(newNest);
            count++;
        }
        alert(`${count} nids importés ou mis à jour.`);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-8 text-slate-800">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter">GESTION DES NIDS</h2>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport} disabled={isExporting}><Download size={18}/> Exporter Excel</Button>
            <div className="relative">
                <input type="file" accept=".xlsx" onChange={handleImport} className="hidden" id="import-excel-file" />
                <label htmlFor="import-excel-file" className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-sky-700 shadow-lg h-full"><Upload size={18}/> Importer Excel</label>
            </div>
        </div>
      </div>
      {clients.map(client => {
          const clientNests = markers.filter(m => m.clientId === client.id);
          if (clientNests.length === 0) return null;
          return (
              <Card key={client.id} className="overflow-hidden border-0 shadow-lg rounded-3xl mb-8">
                  <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3"><Users size={20} className="text-sky-400"/><h3 className="font-black uppercase tracking-wide text-lg">{client.name}</h3></div>
                      <span className="bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">{clientNests.length} Nids</span>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b"><tr><th className="p-4 pl-8">Réf / Adresse</th><th className="p-4">État</th><th className="p-4 text-center">Œufs</th><th className="p-4 text-right pr-8">Actions</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">{clientNests.map(m => (<tr key={m.id} className="hover:bg-slate-50 transition-colors"><td className="p-4 pl-8"><div className="font-bold text-slate-900 text-base">{m.title || "Nid"}</div><div className="text-xs text-slate-400 truncate max-w-[300px] flex items-center gap-1 mt-1"><MapPin size={10}/> {m.address}</div></td><td className="p-4"><Badge status={m.status}/></td><td className="p-4 text-center font-black text-slate-700">{m.eggs} <span className="font-normal opacity-50">œuf(s)</span></td><td className="p-4 flex justify-end gap-2 pr-8"><button onClick={() => setSelectedNest(m)} className="p-2.5 text-sky-600 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors"><Edit size={18}/></button><button onClick={() => { if(window.confirm("Supprimer ce nid ?")) onDeleteNest(m); }} className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={18}/></button></td></tr>))}</tbody>
                      </table>
                  </div>
              </Card>
          );
      })}
      {selectedNest && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <Card className="bg-white rounded-[32px] p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-0">
              <div className="flex justify-between items-center mb-8 border-b pb-4"><h3 className="font-black text-3xl uppercase tracking-tighter text-slate-900">Édition du Nid</h3><button onClick={() => setSelectedNest(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={32} className="text-slate-400"/></button></div>
              <NestEditForm nest={selectedNest} clients={clients} onSave={async (d) => { await onUpdateNest(d); setSelectedNest(null); }} onCancel={() => setSelectedNest(null)} onGeneratePDF={(n, cb) => generatePDF('nest_detail', n, { clientName: clients.find(c => c.id === n.clientId)?.name }, () => {}, cb)}/>
          </Card>
        </div>
      )}
    </div>
  );
};

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
            const newNest = { id: Date.now(), lat: marker.lat, lng: marker.lng, address: marker.address, status: "present", eggs: 0, clientId: clients[0]?.id || "" };
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
                    const newM = { id: Date.now(), lat: ll.lat, lng: ll.lng, address: "Localisation enregistrée", status: "present", eggs: 0, clientId: clients[0]?.id || "" };
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

// ... ClientManagement, ScheduleView, ReportsView, ClientSpace (Restent identiques) ...
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
    const [filter, setFilter] = useState('all'); 
    const filteredReports = useMemo(() => reports, [reports]);
    return (
        <div className="space-y-8 animate-in fade-in duration-300 text-slate-800">
            <div className="flex justify-between items-center flex-wrap gap-4"><h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">DOCUMENTS</h2><Button variant="sky" className="rounded-2xl px-6 py-3 uppercase tracking-widest text-xs h-12" onClick={() => setIsCreating(true)}><Plus size={16}/> Ajouter</Button></div>
            <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest"><tr><th className="p-6">Document</th><th className="p-6">Client / Source</th><th className="p-6">Date</th><th className="p-6">Type</th><th className="p-6 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredReports.length === 0 ? <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold uppercase italic tracking-widest">Aucun document trouvé</td></tr> : filteredReports.map(r => (<tr key={r.id} className="hover:bg-slate-50 transition-colors"><td className="p-6 font-black flex items-center gap-4 text-slate-700 tracking-tight"><div className={`p-2.5 rounded-xl ${r.author === 'client' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>{r.author === 'client' ? <FileCheck size={20}/> : <File size={20}/>}</div> {r.title}</td><td className="p-6"><span className="text-xs font-black uppercase text-slate-700">{clients.find(c => c.id === r.clientId)?.name || "Client supprimé"}</span></td><td className="p-6 text-xs font-bold text-slate-500">{r.date}</td><td className="p-6"><Badge status={r.type === 'Fiche Nid' ? 'reported_by_client' : (r.type === 'Rapport Complet' ? 'sterilized_2' : 'Planifié')}/></td><td className="p-6 flex justify-end gap-3"><button onClick={() => generatePDF(r.type === 'Fiche Nid' ? 'nest_detail' : (r.type === 'Rapport Complet' ? 'complete_report' : 'file'), r.type === 'Fiche Nid' ? markers.find(m => m.id === r.nestId) : r, { client: clients.find(c => c.id === r.clientId), markers: markers.filter(m => m.clientId === r.clientId), interventions: interventions.filter(i => i.clientId === r.clientId) })} className="p-2.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all shadow-sm" title="Télécharger / Imprimer"><Printer size={18}/></button><button onClick={() => setEditingRep(r)} className="p-2.5 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all shadow-sm"><Edit size={18}/></button><button onClick={() => {if(window.confirm("Supprimer ce document ?")) onDeleteReport(r);}} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div></Card>
            {(isCreating || editingRep) && (<div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"><Card className="p-8 w-full max-w-md shadow-2xl border-0 rounded-3xl bg-white text-slate-800"><div className="flex justify-between items-center mb-8"><h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter">{isCreating ? "Nouveau Document" : "Modifier"}</h3><button onClick={() => {setEditingRep(null); setIsCreating(false);}} className="text-slate-400 p-1.5 bg-slate-100 rounded-full"><X size={20}/></button></div><ReportEditForm report={editingRep || {id: Date.now()}} clients={clients} markers={markers} interventions={interventions} onSave={async (d) => { await onUpdateReport(d); setEditingRep(null); setIsCreating(false); }} onCancel={() => {setEditingRep(null); setIsCreating(false);}} /></Card></div>)}
        </div>
    );
};

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
                    <div className="space-y-10 animate-in fade-in duration-500">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-900">
                            <Card className="p-8 border-0 shadow-lg ring-1 ring-slate-100 rounded-3xl flex items-center gap-8 bg-white"><div className="p-5 bg-sky-50 text-sky-600 rounded-[28px]"><Bird size={40}/></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nids sous surveillance</p><p className="text-5xl font-black text-slate-900 tracking-tighter">{myMarkers.length}</p></div></Card>
                            <Card className="p-8 border-0 shadow-lg ring-1 ring-slate-100 rounded-3xl flex items-center gap-8 bg-white"><div className="p-5 bg-emerald-50 text-emerald-600 rounded-[28px]"><CheckCircle size={40}/></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Neutralisations</p><p className="text-5xl font-black text-slate-900 tracking-tighter">{neut}</p></div></Card>
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
                            
                            {/* FORMULAIRE SIGNALEMENT */}
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

                            {/* DETAIL NID (LECTURE SEULE) */}
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
                                 {/* Documents reçus (Admin -> Client) */}
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
                                 {/* Documents envoyés (Client -> Admin) */}
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
                        
                        {/* Modal Upload Client */}
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

            {/* NAVIGATION DES ONGLETS */}
            <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                <button 
                    onClick={() => setActiveTab('dashboard')} 
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                    Tableau de bord
                </button>
                <button 
                    onClick={() => setActiveTab('map')} 
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'map' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                    Carte Interactive
                </button>
                <button 
                    onClick={() => setActiveTab('list')} 
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                    Liste des Nids
                </button>
                <button 
                    onClick={() => setActiveTab('documents')} 
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === 'documents' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                    Documents
                </button>
            </div>

            {/* CONTENU */}
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
                {view === "nests" && <NestManagement markers={markers} clients={clients} onUpdateNest={async (n) => updateFirebase("markers", n)} onDeleteNest={async (n) => deleteFromFirebase("markers", n.id)} />}
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