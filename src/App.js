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
  Users, MapPin, Calendar, FileText, CheckCircle, LogOut, Menu, X, Plus, 
  Search, Bird, Plane, ChevronRight, ChevronLeft, Phone, Home, Map as MapIcon, 
  Crosshair, Edit, Trash2, Key, User, Send, Info, Printer, Locate, Camera, 
  MessageSquare, AlertTriangle, Download, Upload, File, FileCheck, Activity, 
  Cloud, Wind, List as ListIcon, Layers, Bell, FileSpreadsheet, BarChart3, 
  MessageCircle, QrCode, Filter, Flame
} from "lucide-react";

// ============================================================================
// 1. CONFIGURATION & CONSTANTES
// ============================================================================

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

const LOGO_URL = "https://aerothau.fr/wp-content/uploads/2025/10/New-Logo-Aerothau.png";
const MAP_CENTER_DEFAULT = { lat: 43.4028, lng: 3.696 }; 

const TILE_URLS = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  plan: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};

const INITIAL_USERS = [
  { username: "admin", password: "aerothau2024", role: "admin", name: "Aerothau Admin", id: 0 },
];

const MOCK_CLIENTS = [
  { id: 1, name: "Mairie de Sète", type: "Collectivité", address: "12 Rue de l'Hôtel de Ville, 34200 Sète", contact: "Jean Dupont", phone: "04 67 00 00 00", email: "contact@sete.fr", username: "mairie", password: "123" },
  { id: 2, name: "Mairie de Narbonne", type: "Collectivité", address: "Place de l'Hôtel de Ville, 11100 Narbonne", contact: "Contacts Multiples", phone: "Voir contacts", email: "", username: "narbonne", password: "123",
    extendedContacts: [
        "La maison de Charles TRENET : Mme Manuelle NOYES (06.33.82.55.74)",
        "La Calandreta/La Jaquetona : Mme Sophie VAISSIERES (06.19.02.26.20)",
        "Ecole Pasteur, Lamartine, Lakanal, Buisson : M. Louis AYMERIC (06.84.69.40.35)"
    ]
  },
  { id: 3, name: "Domitia Habitat", type: "Syndic", address: "11100 Narbonne", contact: "Responsables Secteurs", phone: "Voir contacts", email: "", username: "domitia", password: "123",
    extendedContacts: [
        "Mme BAUDEMONT pour le secteur Centre-Ville : 06.07.42.28.31",
        "Mme ABAD pour le secteur Razimbaud : 07.64.18.49.37"
    ]
  }
];

// ============================================================================
// 2. COMPOSANTS UI DE BASE
// ============================================================================

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-3xl shadow-sm border border-slate-100 ${className}`}>{children}</div>
);

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
    purple: "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200"
  };
  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Badge = ({ status }) => {
  const styles = {
    Terminé: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    present_high: "bg-red-100 text-red-700 border border-red-200",
    present: "bg-[#27F5D6]/20 text-slate-900 border border-[#27F5D6] shadow-sm", // CYAN DEMANDÉ
    present_medium: "bg-orange-100 text-orange-700 border border-orange-200",
    present_low: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    non_priority: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    sterilized_1: "bg-lime-100 text-lime-700 border border-lime-200",
    sterilized_2: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    reported_by_client: "bg-purple-100 text-purple-700 border border-purple-200",
    non_present: "bg-slate-100 text-slate-500 border border-slate-200",
    temp: "bg-slate-800 text-white animate-pulse"
  };
  const labels = {
    present: "Présent",
    present_high: "Prio Haute",
    non_priority: "Non Prioritaire",
    sterilized_1: "1er Passage",
    sterilized_2: "2ème Passage",
    reported_by_client: "Signalement",
    non_present: "Absent",
    temp: "À valider"
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || "bg-gray-100 text-gray-600"}`}>{labels[status] || status}</span>;
};

const Toast = ({ message, type, onClose }) => {
    useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
    const bg = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';
    const icon = type === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>;
    return <div className={`fixed bottom-4 right-4 ${bg} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 z-[2000]`}>{icon} <span className="font-bold">{message}</span></div>;
};

const PopulationStats = ({ markers }) => {
    const total = markers.length || 1;
    const sterilized = markers.filter(m => m.status && m.status.includes('sterilized')).length;
    const active = markers.filter(m => m.status && m.status.startsWith('present')).length;
    const reported = markers.filter(m => m.status === 'reported_by_client').length;
    const absent = markers.filter(m => m.status === 'non_present').length;

    return (
        <Card className="p-6 mt-6">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4"><BarChart3 size={18} className="text-sky-500"/> Évolution de la Population</h3>
            <div className="h-4 w-full rounded-full flex overflow-hidden shadow-inner bg-slate-100 mb-4">
                <div style={{width: `${(sterilized/total)*100}%`}} className="bg-emerald-500 transition-all duration-1000" title="Stérilisés"></div>
                <div style={{width: `${(active/total)*100}%`, backgroundColor: '#27F5D6'}} className="transition-all duration-1000" title="Actifs"></div>
                <div style={{width: `${(reported/total)*100}%`}} className="bg-purple-500 transition-all duration-1000" title="Signalements"></div>
                <div style={{width: `${(absent/total)*100}%`}} className="bg-slate-300 transition-all duration-1000" title="Absents"></div>
            </div>
            <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest justify-center">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Stérilisés ({Math.round((sterilized/total)*100)}%)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full" style={{backgroundColor: '#27F5D6'}}></div> Actifs ({Math.round((active/total)*100)}%)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Signalés ({Math.round((reported/total)*100)}%)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Absents ({Math.round((absent/total)*100)}%)</div>
            </div>
        </Card>
    );
};

// ============================================================================
// 3. UTILITAIRES 
// ============================================================================

const filterNestsHelper = (nests, searchQuery, filterStatus) => {
    return nests.filter(n => {
        const query = searchQuery ? searchQuery.toLowerCase() : "";
        const matchSearch = (n.title || "").toLowerCase().includes(query) || 
                            (n.address || "").toLowerCase().includes(query) ||
                            (n.id || "").toString().includes(query);
        let matchStatus = true;
        if (filterStatus === "reported") matchStatus = n.status === "reported_by_client";
        else if (filterStatus === "active") matchStatus = n.status && n.status.startsWith("present");
        else if (filterStatus === "treated") matchStatus = n.status && n.status.startsWith("sterilized");
        else if (filterStatus === "absent") matchStatus = n.status === "non_present";

        return matchSearch && matchStatus;
    });
};

const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
    };
});

const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
});

const loadSheetJS = () => loadScript("https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js").then(() => window.XLSX);

const generateRoadmapPDF = async (markers, clients) => {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    if (!window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("AEROTHAU - FEUILLE DE ROUTE", 20, 20);
    
    let y = 45;
    doc.setTextColor(0, 0, 0);

    const activeMarkers = markers.filter(m => m.status && m.status !== 'non_present');

    for (let i = 0; i < activeMarkers.length; i++) {
        const m = activeMarkers[i];
        if (y > 250) { doc.addPage(); y = 20; }
        
        const clientName = clients.find(c => c.id === m.clientId)?.name || "Non assigné";
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`${i+1}. ${m.title || 'Nid'} - ${clientName}`, 20, y);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Adresse : ${m.address}`, 20, y + 6);
        doc.text(`Statut : ${m.status} | Oeufs : ${m.eggs}`, 20, y + 12);
        if (m.comments) {
            const commentsLines = doc.splitTextToSize(`Notes: ${m.comments}`, 120);
            doc.text(commentsLines, 20, y + 18);
        }
        
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`)}`;
        try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = qrUrl;
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            doc.addImage(img, "PNG", 160, y - 5, 30, 30);
        } catch(e) {
            console.error("Erreur QR", e);
        }

        y += 40;
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y - 5, 190, y - 5);
    }
    
    doc.save(`Feuille_Route_Aerothau.pdf`);
};

const generatePDF = (type, data, extraData = {}) => {
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
        doc.text(`Généré le : ${today}`, 190, 25, { align: 'right' });

        if (type === 'nest_detail') {
            const nest = data;
            const clientName = extraData.clientName || "Inconnu";
            doc.text("FICHE NID", 20, 50);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            let y = 65;
            doc.text(`Référence : ${nest.title || "Nid #" + nest.id}`, 20, y); y += 8;
            doc.text(`Client : ${clientName}`, 20, y); y += 8;
            doc.text(`Adresse : ${nest.address}`, 20, y); y += 8;
            doc.text(`GPS : ${nest.lat?.toFixed(6)}, ${nest.lng?.toFixed(6)}`, 20, y); y += 8;
            doc.text(`Statut : ${nest.status}`, 20, y); y += 8;
            doc.text(`Contenu : ${nest.eggs} œuf(s)`, 20, y); y += 8;
            
            if(nest.dateInspection) { doc.text(`Date d'inspection : ${new Date(nest.dateInspection).toLocaleDateString('fr-FR')}`, 20, y); y += 8; }
            if(nest.ster_1_date) { doc.text(`Date 1er passage : ${new Date(nest.ster_1_date).toLocaleDateString('fr-FR')}`, 20, y); y += 8; }
            if(nest.ster_2_date) { doc.text(`Date 2ème passage : ${new Date(nest.ster_2_date).toLocaleDateString('fr-FR')}`, 20, y); y += 8; }
            
            const notesLines = doc.splitTextToSize(`Notes : ${nest.comments || "Aucune observation."}`, 170);
            doc.text(notesLines, 20, y);
            y += (notesLines.length * 8) + 10;

            const photos = nest.photos ? [...nest.photos] : (nest.photo ? [{ data: nest.photo, comment: "" }] : []);
            if (photos.length > 0) {
                doc.setFontSize(14);
                doc.text("Documentation Photographique :", 20, y);
                y += 10;
                doc.setFontSize(10);
                
                photos.forEach((p, idx) => {
                    if (y > 230) { doc.addPage(); y = 20; }
                    const xPos = (idx % 2 === 0) ? 20 : 115;
                    try { doc.addImage(p.data, 'JPEG', xPos, y, 80, 60); } catch(e) {}
                    if (p.comment) doc.text(doc.splitTextToSize(p.comment, 80), xPos, y + 65);
                    if (idx % 2 === 1 || idx === photos.length - 1) y += 80;
                });
            }
            doc.save(`Fiche_Nid_${nest.id}.pdf`);
        } else if (type === 'complete_report') {
            const client = extraData.client || { name: "Client Inconnu" };
            const markers = extraData.markers || [];
            const interventions = extraData.interventions || [];

            doc.text("BILAN ACTIVITÉ", 20, 50);
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
            
            const nestRows = markers.map(m => [
                `${m.title || "Nid"}\n${m.address}`, 
                m.status, 
                m.eggs,
                m.dateInspection ? new Date(m.dateInspection).toLocaleDateString('fr-FR') : "-",
                m.ster_2_date ? new Date(m.ster_2_date).toLocaleDateString('fr-FR') : "-"
            ]);

            doc.autoTable({ 
                startY: 110, 
                head: [['Réf / Localisation', 'Statut', 'Oeufs', 'Insp.', 'Stérilisé le']], 
                body: nestRows, 
                theme: 'grid', 
                headStyles: { fillColor: [14, 165, 233] },
                styles: { fontSize: 8 }
            });
            
            doc.save(`Rapport_${client.name.replace(/\s+/g, '_')}.pdf`);
        } else {
            const report = data;
            doc.text("DOCUMENT", 20, 50);
            doc.setTextColor(0, 0, 0);
            doc.text(`Titre : ${report.title}`, 20, 65);
            doc.save(`${report.title}.pdf`);
        }
    }).catch(e => console.error("PDF Error", e));
};

// ============================================================================
// 4. FORMULAIRES ET MODALES
// ============================================================================

const LoginForm = ({ onLogin, users, logoUrl }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const userFound = users.find(u => u.username === username && u.password === password);
    if (userFound) onLogin(userFound); else setError("Identifiants invalides.");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="p-10 w-full max-w-md shadow-2xl border-0">
        <div className="flex justify-center mb-8"><img src={logoUrl} alt="Logo" className="h-16 w-auto" /></div>
        <h1 className="text-3xl font-black text-center text-slate-900 mb-2 uppercase tracking-tighter">Aerothau<span className="text-sky-500">.</span></h1>
        <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Espace Sécurisé</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-500 text-sm font-medium transition-all" placeholder="Identifiant" />
          </div>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-500 text-sm font-medium transition-all" placeholder="Mot de passe" />
          </div>
          {error && <p className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl text-center">{error}</p>}
          <Button type="submit" variant="sky" className="w-full py-4 uppercase tracking-widest text-xs mt-2">Connexion</Button>
        </form>
      </Card>
    </div>
  );
};

const ClientReportForm = ({ nest, onSave, onCancel }) => {
  const initialPhotos = nest.photos ? [...nest.photos] : (nest.photo ? [{ data: nest.photo, comment: "" }] : []);
  const [formData, setFormData] = useState({ 
      title: "", comments: "", contactName: "", contactPhone: "", status: "reported_by_client", ...nest, photos: initialPhotos
  });

  const handlePhotoUpload = async (e) => { 
      const files = Array.from(e.target.files);
      if (!files.length) return;
      const remainingSlots = 4 - (formData.photos || []).length;
      const filesToProcess = files.slice(0, remainingSlots);
      
      const newPhotos = await Promise.all(filesToProcess.map(async file => {
          const compressedData = await compressImage(file);
          return { data: compressedData, comment: "" };
      }));

      setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), ...newPhotos] }));
  };

  const updatePhotoComment = (index, comment) => {
      const updatedPhotos = [...formData.photos];
      updatedPhotos[index].comment = comment;
      setFormData({ ...formData, photos: updatedPhotos });
  };

  const removePhoto = (index) => {
      setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) });
  };

  const handleSave = () => {
      const finalData = {
          ...formData,
          comments: formData.comments ? `[Signalement Client] : ${formData.comments}` : "",
          nestContacts: (formData.contactName || formData.contactPhone) ? [{ name: formData.contactName, phone: formData.contactPhone, email: "" }] : []
      };
      delete finalData.contactName; delete finalData.contactPhone; delete finalData.photo; 
      onSave(finalData);
  };

  return (
    <div className="space-y-4 text-slate-800">
      <div className="p-4 bg-sky-50 rounded-xl text-sky-800 text-sm flex gap-3 items-center">
        <Info size={20} className="text-sky-600 shrink-0"/>
        <div><p className="font-bold">Nouveau Signalement</p><p className="text-xs opacity-80">Précisez les détails pour l'équipe technique.</p></div>
      </div>
      
      <div>
          <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Photos (Optionnel - Max 4)</label>
              <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-md">{(formData.photos || []).length} / 4</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(formData.photos || []).map((p, index) => (
                  <div key={index} className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col shadow-sm">
                      <div className="h-28 relative bg-slate-200">
                          <img src={p.data} className="w-full h-full object-cover" alt={`Photo ${index + 1}`}/>
                          <button type="button" onClick={() => removePhoto(index)} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-700 transition-colors"><Trash2 size={12}/></button>
                      </div>
                      <div className="p-2 bg-slate-50">
                          <input 
                              type="text" 
                              className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500" 
                              placeholder="Lieu de la photo..." 
                              value={p.comment} 
                              onChange={(e) => updatePhotoComment(index, e.target.value)} 
                          />
                      </div>
                  </div>
              ))}
              {(formData.photos || []).length < 4 && (
                  <label className="h-40 border-2 border-dashed border-sky-300 bg-sky-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-sky-100 transition-colors">
                      <Camera size={28} className="text-sky-400 mb-2"/>
                      <span className="text-[10px] font-black uppercase text-sky-600">Prendre photo</span>
                      <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoUpload}/>
                  </label>
              )}
          </div>
      </div>

      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Titre / Repère</label><input type="text" className="w-full mt-1 p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Toiture Bâtiment A" /></div>
      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Adresse</label><div className="bg-white border border-slate-200 p-3 mt-1 rounded-xl text-sm text-slate-600 flex items-center gap-2"><MapPin size={16} className="text-sky-500 shrink-0" /> <span className="truncate">{formData.address}</span></div></div>
      
      <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Contact (Nom)</label><input type="text" className="w-full mt-1 p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} placeholder="Ex: Gardien" /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Téléphone</label><input type="tel" className="w-full mt-1 p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="06..." /></div>
      </div>

      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Détails supplémentaires</label><textarea className="w-full mt-1 p-3 bg-slate-50 border-0 rounded-xl text-sm resize-none focus:ring-2 focus:ring-sky-500 outline-none h-20" value={formData.comments} onChange={(e) => setFormData({ ...formData, comments: e.target.value })} placeholder="Accès, agressivité, particularités..." /></div>
      
      <div className="flex gap-2 pt-2"><Button variant="outline" onClick={onCancel} className="flex-1 py-3">Annuler</Button><Button variant="sky" onClick={handleSave} className="flex-1 py-3"><Send size={16}/> Envoyer</Button></div>
    </div>
  );
};

const NestEditForm = ({ nest, clients = [], onSave, onCancel, onDelete, readOnly = false, onGeneratePDF }) => {
  const initialPhotos = nest.photos ? [...nest.photos] : (nest.photo ? [{ data: nest.photo, comment: "" }] : []);
  
  const [formData, setFormData] = useState({ 
      title: "", comments: "", eggs: 0, status: "present_high", clientId: "", 
      lieux: "", dateVisite: "", dateInspection: "", nbAdultes: "", nbPoussins: "", comportement: "", remarques: "", info: "",
      ster_1_date: "", ster_2_date: "",
      ...nest,
      photos: initialPhotos
  });
  const [nestContacts, setNestContacts] = useState(nest.nestContacts || []);
  
  const handlePhotoUpload = async (e) => { 
      const files = Array.from(e.target.files);
      if (!files.length) return;
      const remainingSlots = 4 - (formData.photos || []).length;
      const filesToProcess = files.slice(0, remainingSlots);
      
      const newPhotos = await Promise.all(filesToProcess.map(async file => {
          const compressedData = await compressImage(file);
          return { data: compressedData, comment: "" };
      }));

      setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), ...newPhotos] }));
  };

  const updatePhotoComment = (index, comment) => {
      const updatedPhotos = [...formData.photos];
      updatedPhotos[index].comment = comment;
      setFormData({ ...formData, photos: updatedPhotos });
  };

  const removePhoto = (index) => {
      setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) });
  };

  const handleContactChange = (index, field, value) => {
      const updated = [...nestContacts];
      updated[index][field] = value;
      setNestContacts(updated);
  };

  const addContact = () => setNestContacts([...nestContacts, { name: "", phone: "", email: "" }]);
  const removeContact = (index) => setNestContacts(nestContacts.filter((_, i) => i !== index));

  const handleSave = () => {
      const validContacts = nestContacts.filter(c => c.name.trim() || c.phone.trim() || c.email.trim());
      const finalData = { ...formData, nestContacts: validContacts.length > 0 ? validContacts : null };
      delete finalData.photo; 
      onSave(finalData);
  };

  if (readOnly) return (
      <div className="space-y-6 text-slate-800">
          {/* LECTURE : PHOTOS MULTIPLES */}
          {formData.photos && formData.photos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {formData.photos.map((p, idx) => (
                      <div key={idx} className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white flex flex-col">
                          <div className="h-40 relative bg-slate-100">
                              <img src={p.data} className="w-full h-full object-cover" alt={`Nid ${idx + 1}`} />
                          </div>
                          {p.comment && (
                              <div className="p-3 text-xs text-slate-700 bg-slate-50 border-t border-slate-100 italic flex gap-2">
                                  <MessageSquare size={14} className="shrink-0 text-sky-500 mt-0.5"/>
                                  <span>{p.comment}</span>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          )}

          <div className="flex justify-between items-start">
             <div>
                <h4 className="font-black text-2xl text-slate-900 tracking-tighter">{nest.title || "Nid sans nom"}</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1"><MapPin size={12}/>{nest.address}</p>
             </div>
             <Badge status={nest.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contenu observé</p>
                  <p className="text-3xl font-black text-slate-800">{nest.eggs} <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">œufs</span></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center flex flex-col justify-center items-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Locate size={10}/> Coordonnées GPS</p>
                   <p className="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded shadow-sm w-full">{nest.lat?.toFixed(5)}</p>
                   <p className="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded shadow-sm w-full mt-1">{nest.lng?.toFixed(5)}</p>
              </div>
          </div>

          {(nest.dateInspection || nest.ster_1_date || nest.ster_2_date) && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                  {nest.dateInspection && (
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Inspection</span>
                          <span className="font-bold text-xs text-slate-800">{new Date(nest.dateInspection).toLocaleDateString('fr-FR')}</span>
                      </div>
                  )}
                  {nest.ster_1_date && (
                      <div className="bg-lime-50 p-2 rounded-xl border border-lime-100 flex flex-col items-center justify-center text-center">
                          <span className="text-[8px] font-black uppercase tracking-widest text-lime-600 mb-1">1er Passage</span>
                          <span className="font-bold text-xs text-slate-800">{new Date(nest.ster_1_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                  )}
                  {nest.ster_2_date && (
                      <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1">2ème Passage</span>
                          <span className="font-bold text-xs text-slate-800">{new Date(nest.ster_2_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                  )}
              </div>
          )}
          
          {/* LECTURE : BLOC CONTACTS SUR PLACE + WHATSAPP */}
          {nest.nestContacts && nest.nestContacts.length > 0 && (
             <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-sm space-y-3">
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2"><User size={14}/> Contacts sur place</p>
                 {nest.nestContacts.map((c, i) => (
                     <div key={i} className="flex flex-col gap-2 p-3 bg-white rounded-xl shadow-sm border border-indigo-50">
                         <span className="font-bold text-slate-800 text-xs">{c.name || "Contact sans nom"}</span>
                         <div className="flex gap-2">
                             {c.phone && (
                                 <>
                                     <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 p-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors">
                                         <Phone size={14}/> Appeler
                                     </a>
                                     <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '').replace(/^0/, '33')}?text=${encodeURIComponent(`Bonjour, le télépilote Aerothau est en route pour l'intervention sur le site ${nest.title}. À tout de suite !`)}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 p-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-colors">
                                         <MessageCircle size={14}/> WhatsApp
                                     </a>
                                 </>
                             )}
                         </div>
                     </div>
                 ))}
             </div>
          )}

          {hasExtraData && (
             <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm space-y-3">
                 <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2 flex items-center gap-2"><Layers size={14}/> Données Fichier</p>
                 <div className="grid grid-cols-2 gap-2 text-xs">
                     {nest.lieux && <div><span className="text-slate-400 uppercase font-bold text-[9px] block">Lieux</span><span className="font-medium text-slate-700">{nest.lieux}</span></div>}
                     {nest.dateVisite && <div><span className="text-slate-400 uppercase font-bold text-[9px] block">Date visite</span><span className="font-medium text-slate-700">{nest.dateVisite}</span></div>}
                     {nest.nbAdultes && <div><span className="text-slate-400 uppercase font-bold text-[9px] block">Adultes</span><span className="font-medium text-slate-700">{nest.nbAdultes}</span></div>}
                     {nest.nbPoussins && <div><span className="text-slate-400 uppercase font-bold text-[9px] block">Poussins</span><span className="font-medium text-slate-700">{nest.nbPoussins}</span></div>}
                 </div>
                 {nest.comportement && <div><span className="text-slate-400 uppercase font-bold text-[9px] block">Comportement</span><span className="font-medium text-slate-700 text-xs">{nest.comportement}</span></div>}
                 {nest.remarques && <div><span className="text-slate-400 uppercase font-bold text-[9px] block">Remarques</span><span className="font-medium text-slate-700 text-xs italic">{nest.remarques}</span></div>}
             </div>
          )}

          {nest.comments && (
              <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100">
                <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-2 flex items-center gap-2"><Info size={14}/> Observations Équipe</p>
                <p className="text-sm text-sky-900 font-medium leading-relaxed">{nest.comments}</p>
              </div>
          )}
          <Button variant="sky" className="w-full py-4 uppercase tracking-widest text-xs" onClick={onCancel}>Fermer la fiche</Button>
      </div>
  );
  
  return (
    <div className="space-y-6 text-slate-800">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Photos du nid (Max 4)</label>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-1 rounded-md">{(formData.photos || []).length} / 4</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(formData.photos || []).map((p, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden border border-slate-200 bg-white flex flex-col shadow-sm">
                        <div className="h-32 relative bg-slate-200">
                            <img src={p.data} className="w-full h-full object-cover" alt={`Nid ${index + 1}`}/>
                            <button type="button" onClick={() => removePhoto(index)} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-700 transition-colors"><Trash2 size={14}/></button>
                        </div>
                        <div className="p-2 border-t border-slate-100">
                            <input 
                                type="text" 
                                className="w-full p-2 text-xs bg-slate-50 border-0 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 transition-shadow" 
                                placeholder="Commentaire (ex: Toiture Sud...)" 
                                value={p.comment} 
                                onChange={(e) => updatePhotoComment(index, e.target.value)} 
                            />
                        </div>
                    </div>
                ))}
                
                {(formData.photos || []).length < 4 && (
                    <label className="h-[178px] border-2 border-dashed border-sky-300 bg-sky-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-sky-100 transition-colors">
                        <Camera size={32} className="text-sky-500 mb-2"/>
                        <span className="text-[10px] font-black uppercase tracking-widest text-sky-600">Ajouter Photo</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload}/>
                    </label>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">État du nid</label>
                    <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-none" value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                        <option value="reported_by_client">🟣 Signalement Client</option>
                        <option value="present_high">🔴 Priorité Haute (Rouge)</option>
                        <option value="present">💠 Présent (Classique - Cyan)</option>
                        <option value="present_medium">🟠 Priorité Moyenne (Orange)</option>
                        <option value="present_low">🟡 Priorité Faible (Jaune)</option>
                        <option value="non_priority">🔵 Non Prioritaire (Bleu)</option>
                        <option value="sterilized_1">🟢 1er Passage (Traité)</option>
                        <option value="sterilized_2">🟢 2ème Passage (Confirmé)</option>
                        <option value="non_present">⚪ Non présent / Inactif</option>
                    </select>
                 </div>
                 
                 <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 mt-4">
                    <div>
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block pl-1">Inspection</label>
                         <input type="date" className="w-full p-2 bg-white border-0 rounded-lg text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-none shadow-sm" value={formData.dateInspection || ""} onChange={e=>setFormData({...formData, dateInspection: e.target.value})} />
                    </div>
                    <div>
                         <label className="text-[9px] font-black text-lime-600 uppercase tracking-widest mb-1 block pl-1">1er Pass.</label>
                         <input type="date" className="w-full p-2 bg-white border-0 rounded-lg text-xs font-bold focus:ring-2 focus:ring-lime-500 outline-none shadow-sm" value={formData.ster_1_date || ""} onChange={e=>setFormData({...formData, ster_1_date: e.target.value})} />
                    </div>
                    <div>
                         <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 block pl-1">2ème Pass.</label>
                         <input type="date" className="w-full p-2 bg-white border-0 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm" value={formData.ster_2_date || ""} onChange={e=>setFormData({...formData, ster_2_date: e.target.value})} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Identification</label>
                    <input className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="Titre / Référence"/>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Client Associé</label>
                    <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.clientId} onChange={e=>setFormData({...formData, clientId: parseInt(e.target.value)})}>
                        <option value="">-- Indépendant --</option>
                        {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Œufs</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-xl font-black text-center text-sky-600 focus:ring-2 focus:ring-sky-500 outline-none" value={formData.eggs} onChange={e=>setFormData({...formData, eggs: parseInt(e.target.value)})} placeholder="0"/>
                    </div>
                </div>
            </div>
        </div>
        
        <div>
            <div className="flex justify-between items-end mb-1 pl-1 pr-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Adresse complète</label>
                <span className="text-[9px] font-mono font-bold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">GPS: {formData.lat?.toFixed(5)}, {formData.lng?.toFixed(5)}</span>
            </div>
            <textarea className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none leading-relaxed" rows="2" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Numéro, Rue, Bâtiment..."/>
        </div>

        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block pl-1">Observations Techniques</label>
            <textarea className="w-full p-4 bg-slate-50 border-0 rounded-2xl text-sm h-24 focus:ring-2 focus:ring-sky-500 outline-none resize-none leading-relaxed" placeholder="Accès difficile, type de toiture, nacelle nécessaire..." value={formData.comments} onChange={(e) => setFormData({...formData, comments: e.target.value})}/>
        </div>

        <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-3 pl-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Contacts sur place</label>
                <button type="button" onClick={addContact} className="text-[10px] font-bold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors flex items-center gap-1"><Plus size={12}/> Ajouter</button>
            </div>
            <div className="space-y-3">
                {nestContacts.map((contact, index) => (
                    <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
                        <button type="button" onClick={() => removeContact(index)} className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                        <div className="grid grid-cols-1 gap-2 pr-8">
                            <input type="text" className="w-full p-2 border-0 rounded-lg text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Nom du contact (ex: Gardien, M. Durand)" value={contact.name} onChange={(e) => handleContactChange(index, 'name', e.target.value)} />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="tel" className="w-full p-2 border-0 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Téléphone" value={contact.phone} onChange={(e) => handleContactChange(index, 'phone', e.target.value)} />
                                <input type="email" className="w-full p-2 border-0 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Email" value={contact.email} onChange={(e) => handleContactChange(index, 'email', e.target.value)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {(formData.lieux || formData.dateVisite || formData.nbAdultes || formData.nbPoussins || formData.comportement || formData.remarques || formData.info) && (
            <div className="pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1"><Layers size={14}/> Champs Import Excel</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input className="p-3 bg-slate-50 border-0 rounded-xl text-xs" placeholder="Lieux" value={formData.lieux || ""} onChange={e=>setFormData({...formData, lieux: e.target.value})} />
                    <input className="p-3 bg-slate-50 border-0 rounded-xl text-xs" placeholder="Date visite" value={formData.dateVisite || ""} onChange={e=>setFormData({...formData, dateVisite: e.target.value})} />
                    <input className="p-3 bg-slate-50 border-0 rounded-xl text-xs" placeholder="Nb Adultes" value={formData.nbAdultes || ""} onChange={e=>setFormData({...formData, nbAdultes: e.target.value})} />
                    <input className="p-3 bg-slate-50 border-0 rounded-xl text-xs" placeholder="Nb Poussins" value={formData.nbPoussins || ""} onChange={e=>setFormData({...formData, nbPoussins: e.target.value})} />
                </div>
                <input className="w-full p-3 bg-slate-50 border-0 rounded-xl text-xs mb-3" placeholder="Comportement" value={formData.comportement || ""} onChange={e=>setFormData({...formData, comportement: e.target.value})} />
            </div>
        )}
        
        {onGeneratePDF && <Button variant="secondary" className="w-full py-4 rounded-2xl text-xs uppercase tracking-widest border-2" onClick={()=>onGeneratePDF(nest)}><Printer size={16}/> Générer Fiche PDF</Button>}
        
        <div className="flex gap-3 pt-4 border-t border-slate-100">
             {onDelete && <button onClick={() => onDelete(formData)} className="p-4 text-red-500 bg-red-50 hover:bg-red-600 hover:text-white rounded-2xl transition-colors"><Trash2 size={20}/></button>}
             <Button variant="outline" className="flex-1 py-4 rounded-2xl text-xs uppercase tracking-widest border-2" onClick={onCancel}>Annuler</Button>
             <Button variant="success" className="flex-1 py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-emerald-200" onClick={handleSave}>Enregistrer</Button>
        </div>
    </div>
  );
};

const ClientEditForm = ({ client, onSave, onCancel }) => {
    const initialExtendedContactsText = client.extendedContacts ? client.extendedContacts.join('\n') : "";
    const [formData, setFormData] = useState({ name: "", type: "Privé", address: "", phone: "", username: "", password: "", extendedContactsText: initialExtendedContactsText, ...client });
    
    const handleSave = () => {
        const contactsArray = formData.extendedContactsText
            .split('\n')
            .map(c => c.trim())
            .filter(c => c.length > 0);
            
        const dataToSave = {
            ...formData,
            extendedContacts: contactsArray.length > 0 ? contactsArray : null
        };
        delete dataToSave.extendedContactsText;
        onSave(dataToSave);
    }

    return (
      <div className="space-y-4 text-slate-800">
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nom</label><input type="text" className="w-full p-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Type</label><select className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}><option value="Privé">Privé</option><option value="Collectivité">Collectivité</option><option value="Syndic">Syndic</option></select></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Téléphone principal</label><input type="text" className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
        </div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Adresse</label><input type="text" className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
        
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">Contacts étendus (Sites, Survol...)</label>
            <textarea className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-sky-500 outline-none" value={formData.extendedContactsText} onChange={(e) => setFormData({ ...formData, extendedContactsText: e.target.value })} placeholder="Ecole Pasteur : M. Dupont (06...)" />
        </div>

        <div className="bg-slate-100 p-4 rounded-xl">
          <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3">Identifiants Espace Client</h4>
          <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Identifiant" className="p-3 border-0 rounded-lg bg-white text-sm focus:ring-2 focus:ring-sky-500 outline-none w-full" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              <input type="text" placeholder="Mot de passe" className="p-3 border-0 rounded-lg bg-white text-sm focus:ring-2 focus:ring-sky-500 outline-none w-full" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1 py-3" onClick={onCancel}>Annuler</Button><Button variant="success" className="flex-1 py-3" onClick={handleSave}>Enregistrer</Button></div>
      </div>
    );
};

const InterventionEditForm = ({ intervention, clients, onSave, onDelete, onCancel }) => {
    const [formData, setFormData] = useState({ clientId: clients[0]?.id || "", status: "Planifié", technician: "", notes: "", date: new Date().toISOString().split("T")[0], ...intervention });
    return (
      <div className="space-y-4 text-slate-800">
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Client</label><select className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500" value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: parseInt(e.target.value) })}>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Date</label><input type="date" className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Statut</label><select className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="Planifié">Planifié</option><option value="En attente">En attente</option><option value="Terminé">Terminé</option><option value="Annulé">Annulé</option></select></div>
        </div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Agent / Télépilote</label><input type="text" className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500" value={formData.technician} onChange={(e) => setFormData({ ...formData, technician: e.target.value })} /></div>
        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Observations</label><textarea className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm h-20 resize-none outline-none focus:ring-2 focus:ring-sky-500" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
        <div className="flex gap-2 pt-2">
          {onDelete && formData.id && <button onClick={() => onDelete(formData)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>}
          <Button variant="outline" className="flex-1 py-3" onClick={onCancel}>Annuler</Button>
          <Button variant="success" className="flex-1 py-3" onClick={() => onSave(formData)}>Sauver</Button>
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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, title: file.name, type: "Fichier", status: "Envoyé" });
            if(file.type.startsWith('image/')) {
                 const compressed = await compressImage(file);
                 setFormData(prev => ({...prev, attachmentData: compressed }));
            }
        }
    };

    return (
      <div className="space-y-4 text-slate-800">
        {userRole === 'admin' && (
            <div className="grid grid-cols-3 gap-2 mb-2">
                <button className={`p-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${formData.type === 'Fichier' ? 'bg-slate-900 text-white border-slate-900' : 'bg-transparent text-slate-500 border-slate-200'}`} onClick={() => setFormData({...formData, type: 'Fichier', title: ""})}>Fichier</button>
                <button className={`p-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${formData.type === 'Rapport Complet' ? 'bg-slate-900 text-white border-slate-900' : 'bg-transparent text-slate-500 border-slate-200'}`} onClick={() => { const clientName = clients.find(c => c.id === formData.clientId)?.name || ""; setFormData({...formData, type: 'Rapport Complet', title: "Rapport - " + clientName}); }}>Bilan Client</button>
                <button className={`p-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${formData.type === 'Fiche Nid' ? 'bg-slate-900 text-white border-slate-900' : 'bg-transparent text-slate-500 border-slate-200'}`} onClick={() => setFormData({...formData, type: 'Fiche Nid', title: "Fiche Nid"})}>Fiche Nid</button>
            </div>
        )}

        {formData.type === 'Fichier' && (
            <div className="relative mt-2">
                <input type="file" className="hidden" id="doc-upload" onChange={handleFileUpload}/>
                <label htmlFor="doc-upload" className="w-full p-6 border-2 border-dashed border-sky-300 bg-sky-50 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-sky-100 text-sky-600 transition-colors">
                    <Upload size={32}/> <span className="text-xs font-black uppercase tracking-widest">{formData.title ? formData.title : "Sélectionner un fichier"}</span>
                </label>
            </div>
        )}

        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Client concerné</label>
          <select className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none mt-1" value={formData.clientId} onChange={(e) => {
              const cid = parseInt(e.target.value);
              let newTitle = formData.title;
              if (formData.type === 'Rapport Complet') newTitle = "Rapport - " + (clients.find(c => c.id === cid)?.name || "");
              setFormData({ ...formData, clientId: cid, title: newTitle });
          }}>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>

        {formData.type === 'Fiche Nid' && (
             <div><label className="text-[10px] font-bold text-slate-400 uppercase">Lier à un Nid</label>
                <select className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none mt-1" value={formData.nestId} onChange={(e) => {
                     const nid = parseInt(e.target.value);
                     const nestTitle = markers.find(m => m.id === nid)?.title || ("Nid #" + nid);
                     setFormData({ ...formData, nestId: nid, title: "Fiche - " + nestTitle });
                }}>
                    <option value="">-- Choisir un nid --</option>
                    {markers.filter(m => m.clientId === formData.clientId).map(m => <option key={m.id} value={m.id}>{m.title || m.address}</option>)}
                </select>
            </div>
        )}

        <div><label className="text-[10px] font-bold text-slate-400 uppercase">Nom du document</label><input type="text" className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none mt-1" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
        
        {userRole === 'admin' && (
             <div><label className="text-[10px] font-bold text-slate-400 uppercase">Date</label><input type="date" className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none mt-1" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1 py-3" onClick={onCancel}>Annuler</Button>
          <Button variant="success" className="flex-1 py-3" onClick={() => onSave(formData)}>{userRole === 'admin' ? "Valider" : "Envoyer"}</Button>
        </div>
      </div>
    );
};

// ============================================================================
// 5. CARTE LEAFLET SÉCURISÉE
// ============================================================================

const LeafletMap = ({ markers, isAddingMode, onMapClick, onMarkerClick, center }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userLayerRef = useRef(null);
  const heatLayerRef = useRef(null);
  const [mapType, setMapType] = useState("satellite");
  const [userPosition, setUserPosition] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const initMap = async () => {
        if (!mapContainerRef.current) return;
        try {
            if (!window.L) {
                await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
                const link = document.createElement("link"); 
                link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; 
                document.head.appendChild(link);
            }
            if (!window.L.heatLayer) {
                await loadScript("https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js");
            }

            const L = window.L;
            const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([43.4028, 3.696], 15);
            mapInstanceRef.current = map;

            L.control.zoom({ position: 'bottomright' }).addTo(map);
            map.tileLayer = L.tileLayer(TILE_URLS['satellite'], { attribution: 'Esri' }).addTo(map);
            
            markersLayerRef.current = L.layerGroup().addTo(map);
            heatLayerRef.current = L.layerGroup().addTo(map);

            map.on('click', (e) => {
                if(onMapClickRef.current) onMapClickRef.current(e.latlng);
            });
            
            setTimeout(() => map.invalidateSize(), 400); 
        } catch (e) { console.error("Erreur Map:", e); }
    };
    initMap();

    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  useEffect(() => {
     if (mapInstanceRef.current) {
         setTimeout(() => { mapInstanceRef.current.invalidateSize(); }, 400);
     }
  }, [markers, isAddingMode, showHeatmap]);

  useEffect(() => {
      if (!mapInstanceRef.current || !window.L || !markersLayerRef.current || !heatLayerRef.current) return;
      const L = window.L;
      markersLayerRef.current.clearLayers();
      heatLayerRef.current.clearLayers();
      
      if (showHeatmap && L.heatLayer) {
          const heatPoints = markers.map(m => [m.lat, m.lng, 1]); 
          L.heatLayer(heatPoints, { radius: 35, blur: 25, maxZoom: 17, gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red'} }).addTo(heatLayerRef.current);
      } else {
          markers.forEach(m => {
              let color = "#64748b"; 
              if (m.status === "present_high") color = "#ef4444"; 
              else if (m.status === "present") color = "#27F5D6"; // CYAN
              else if (m.status === "present_medium") color = "#f97316"; 
              else if (m.status === "present_low") color = "#eab308"; 
              else if (m.status === "non_priority") color = "#0ea5e9"; 
              else if (m.status === "temp") color = "#94a3b8"; 
              else if (m.status === "sterilized_1") color = "#84cc16"; 
              else if (m.status === "sterilized_2" || m.status === "sterilized") color = "#22c55e"; 
              else if (m.status === "reported_by_client") color = "#a855f7"; 

              const icon = L.divIcon({ 
                  className: "custom-icon", 
                  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); ${m.status === 'temp' ? 'animation: pulse 1.5s infinite;' : ''}"></div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
              });
              const marker = L.marker([m.lat, m.lng], { icon });
              marker.on('click', (e) => { L.DomEvent.stopPropagation(e); if(onMarkerClickRef.current) onMarkerClickRef.current(m); });
              marker.addTo(markersLayerRef.current);
          });
      }
  }, [markers, showHeatmap]);

  useEffect(() => {
      if (mapInstanceRef.current && mapInstanceRef.current.tileLayer && TILE_URLS[mapType]) {
          mapInstanceRef.current.tileLayer.setUrl(TILE_URLS[mapType]);
      }
  }, [mapType]);

  useEffect(() => {
      if (mapInstanceRef.current && center) mapInstanceRef.current.setView([center.lat, center.lng], 18);
  }, [center]);

  // Suivi GPS du Drone
  useEffect(() => {
      if (!navigator.geolocation) return;
      const watchId = navigator.geolocation.watchPosition(
          (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => console.warn("Erreur GPS:", err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
      if (!mapInstanceRef.current || !window.L || !userPosition) return;
      if (!userLayerRef.current) { userLayerRef.current = window.L.layerGroup().addTo(mapInstanceRef.current); }
      userLayerRef.current.clearLayers();
      const droneSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px; transform: rotate(45deg);"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4 12H2"/><path d="M22 12h-2"/><path d="M5.4 5.4l2.8 2.8"/><path d="M15.8 15.8l2.8 2.8"/><path d="M5.4 18.6l2.8-2.8"/><path d="M15.8 8.2l2.8-2.8"/><rect x="8" y="8" width="8" height="8" rx="2" fill="white"/></svg>`;
      const droneIcon = window.L.divIcon({ className: "drone-marker", html: `<div style="background-color: white; border-radius: 50%; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; border: 2px solid #0ea5e9;">${droneSvg}</div>`, iconSize: [36, 36], iconAnchor: [18, 18] });
      window.L.marker([userPosition.lat, userPosition.lng], { icon: droneIcon, zIndexOffset: 1000 }).addTo(userLayerRef.current);
  }, [userPosition]);

  const centerOnUser = (e) => {
      e.stopPropagation();
      if (userPosition && mapInstanceRef.current) { mapInstanceRef.current.setView([userPosition.lat, userPosition.lng], 19); }
      else alert("Recherche de votre position GPS en cours...");
  };

  return (
      <div className="relative w-full h-full">
          <div ref={mapContainerRef} className="w-full h-full bg-slate-100 z-0" style={{minHeight:'100%'}}/>
          <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-lg flex gap-1">
              <button onClick={(e) => { e.stopPropagation(); setShowHeatmap(!showHeatmap); }} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors flex items-center gap-1 ${showHeatmap ? 'bg-rose-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`} title="Carte de densité"><Flame size={14}/> Densité</button>
              <div className="w-px h-6 bg-slate-200 my-auto mx-1"></div>
              <button onClick={centerOnUser} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors text-sky-600 hover:bg-sky-50 flex items-center gap-1" title="Ma position GPS"><Locate size={14}/> Moi</button>
              <div className="w-px h-6 bg-slate-200 my-auto mx-1"></div>
              <button onClick={(e) => { e.stopPropagation(); setMapType('satellite'); }} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${mapType === 'satellite' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Satellite</button>
              <button onClick={(e) => { e.stopPropagation(); setMapType('plan'); }} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${mapType === 'plan' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Plan</button>
          </div>
      </div>
  );
};

// ============================================================================
// 6. VUES PRINCIPALES (ADMIN)
// ============================================================================

const MapInterface = ({ markers, clients, onUpdateNest, onDeleteNest }) => {
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterQuery, setFilterQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isAdding, setIsAdding] = useState(false);
    const [mapCenter, setMapCenter] = useState(null);
    const [tempMarker, setTempMarker] = useState(null);

    const handleSearch = useCallback(async (e) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            let lat, lng, addr;
            const coords = searchQuery.replace(/,/g, " ").split(/\s+/).filter(Boolean).map(parseFloat);
            if (coords.length === 2 && !coords.some(isNaN) && Math.abs(coords[0]) <= 90) {
                lat = coords[0]; lng = coords[1]; addr = `Point GPS`;
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

    const displayMarkers = useMemo(() => {
        let filtered = filterNestsHelper(markers, filterQuery, statusFilter);
        if (tempMarker) filtered.push(tempMarker);
        return filtered;
    }, [markers, tempMarker, filterQuery, statusFilter]);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6 text-slate-800 animate-in fade-in duration-300">
            <Card className="p-3 flex flex-col md:flex-row gap-4 items-center z-20 shadow-lg border-0 rounded-3xl bg-white">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={20}/>
                    <input type="text" placeholder="Aller à une adresse (Taper Entrée)..." className="w-full pl-14 pr-6 py-3 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearch} />
                </div>
                
                <div className="flex-1 flex gap-2 w-full">
                    <div className="relative flex-1 group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={16}/>
                        <input type="text" placeholder="Filtrer la carte (Réf...)" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={filterQuery} onChange={e => setFilterQuery(e.target.value)} />
                    </div>
                    <select className="flex-1 p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">Tous les statuts</option>
                        <option value="reported">Signalements</option>
                        <option value="active">Nids Actifs (À traiter)</option>
                        <option value="treated">Stérilisés (Pass. 1 & 2)</option>
                        <option value="absent">Absents</option>
                    </select>
                </div>

                <div className="flex gap-2 shrink-0 pr-2">
                    <Button variant={isAdding ? "danger" : "sky"} className={`py-3 px-6 rounded-2xl text-xs uppercase tracking-widest h-12 ${isAdding ? '' : 'shadow-xl shadow-sky-200'}`} onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? <><X size={16}/> Annuler</> : <><Plus size={16}/> Pointer un nid</>}
                    </Button>
                </div>
            </Card>
            
            <div className={`flex-1 relative shadow-2xl rounded-3xl overflow-hidden bg-white transition-all duration-300 ${isAdding ? 'ring-4 ring-sky-500 ring-offset-2' : ''}`}>
                {isAdding && (
                    <div className="absolute inset-x-0 top-6 z-[1000] flex justify-center pointer-events-none animate-in slide-in-from-top-4">
                        <div className="bg-slate-900 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-900/50 flex items-center gap-3">
                            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span></span>
                            Cliquez sur la carte pour placer le nid
                        </div>
                    </div>
                )}
                
                {tempMarker && !isAdding && (<div className="absolute top-6 left-1/2 -translate-x-1/2 z-[500] bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest animate-bounce pointer-events-none shadow-2xl">📍 Cliquez sur le point gris pour valider</div>)}

                <LeafletMap markers={displayMarkers} isAddingMode={isAdding} center={mapCenter} onMarkerClick={handleMarkerClick} onMapClick={async (ll) => {
                    if(!isAdding) return;
                    const newM = { id: Date.now(), lat: ll.lat, lng: ll.lng, address: "Localisation enregistrée", status: "present_high", eggs: 0, clientId: clients[0]?.id || "" };
                    await onUpdateNest(newM); setSelectedMarker(newM); setIsAdding(false);
                }}/>
                
                {selectedMarker && selectedMarker.id !== "temp" && (
                    <div className="absolute top-6 left-6 z-[500] w-80 md:w-96 max-h-[90%] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-left-6 rounded-[32px]">
                        <Card className="border-0 flex flex-col overflow-hidden bg-white shadow-none rounded-none h-full">
                            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
                                <span className="font-black text-sm uppercase tracking-widest flex items-center gap-3"><Crosshair size={18} className="text-sky-400"/> Fiche Nid</span>
                                <button onClick={() => setSelectedMarker(null)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
                            </div>
                            <div className="p-6 overflow-y-auto shrink custom-scrollbar bg-white">
                                <NestEditForm nest={selectedMarker} clients={clients} onSave={async(u) => { await onUpdateNest(u); setSelectedMarker(null); }} onCancel={() => setSelectedMarker(null)} onDelete={async(u) => { if(window.confirm("Supprimer définitivement ce nid ?")) { await onDeleteNest(u); setSelectedMarker(null); } }} onGeneratePDF={(n, cb) => generatePDF('nest_detail', n, { clientName: clients.find(c => c.id === n.clientId)?.name }, () => {}, cb)} />
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminDashboard = ({ interventions, clients, markers }) => {
  const stats = useMemo(() => ({
    total: markers.length,
    reported: markers.filter(m => m.status === "reported_by_client").length,
    nonPresent: markers.filter(m => m.status === "non_present").length,
    sterilized: markers.filter(m => m.status === "sterilized_2" || m.status === "sterilized").length,
  }), [markers]);

  const reportedNests = markers.filter(m => m.status === "reported_by_client");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-800">
      <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">TABLEAU DE BORD</h2>
      </div>
      
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

      {/* STATISTIQUES OPTION 4 */}
      <PopulationStats markers={markers} />

      {reportedNests.length > 0 && (
          <div className="bg-purple-600 rounded-[32px] p-1 shadow-xl shadow-purple-200 animate-in slide-in-from-top-4 mt-6">
              <div className="bg-white rounded-[28px] p-6">
                  <h3 className="text-purple-700 font-black uppercase tracking-widest text-sm flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-full"><Bell size={18} className="animate-bounce" /></div>
                      Nouveaux Signalements Clients ({reportedNests.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {reportedNests.map(nest => (
                          <div key={nest.id} className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex justify-between items-center hover:bg-purple-100 transition-colors">
                              <div className="overflow-hidden pr-4">
                                  <p className="font-black text-slate-800 text-sm truncate">{nest.title || "Nid signalé"}</p>
                                  <p className="text-[10px] text-purple-600 font-bold mt-1 uppercase tracking-widest">{clients.find(c => c.id === nest.clientId)?.name || "Client inconnu"}</p>
                                  <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0"/> {nest.address}</p>
                              </div>
                              <div className="shrink-0">
                                  <Badge status="reported_by_client" />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          <div className="lg:col-span-2">
              <Card className="p-0 border-0 shadow-lg rounded-3xl overflow-hidden bg-white flex flex-col h-full">
                  <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Users size={16} className="text-sky-400"/> État par client</h3>
                  </div>
                  <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-widest sticky top-0 z-10 shadow-sm">
                              <tr>
                                  <th className="p-4 pl-6">Client / Site</th>
                                  <th className="p-4 text-center">Total</th>
                                  <th className="p-4 text-center text-purple-500">Signalés</th>
                                  <th className="p-4 text-center text-red-500">Actifs</th>
                                  <th className="p-4 text-center text-lime-600">1er Pass.</th>
                                  <th className="p-4 text-center text-emerald-500">2ème Pass.</th>
                                  <th className="p-4 text-center text-slate-500">Absents</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {clients.map(client => {
                                  const cNests = markers.filter(m => m.clientId === client.id);
                                  if (cNests.length === 0) return null;
                                  
                                  const cTotal = cNests.length;
                                  const cReported = cNests.filter(m => m.status === "reported_by_client").length;
                                  const cActive = cNests.filter(m => m.status.startsWith("present")).length;
                                  const cPassage1 = cNests.filter(m => m.status === "sterilized_1").length;
                                  const cPassage2 = cNests.filter(m => m.status === "sterilized_2" || m.status === "sterilized").length;
                                  const cAbsent = cNests.filter(m => m.status === "non_present").length;
                                  
                                  return (
                                      <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="p-4 pl-6 font-bold text-slate-800 text-xs">{client.name}</td>
                                          <td className="p-4 text-center font-black text-slate-600">{cTotal}</td>
                                          <td className="p-4 text-center">
                                              {cReported > 0 ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">{cReported}</span> : <span className="text-slate-300">-</span>}
                                          </td>
                                          <td className="p-4 text-center">
                                              {cActive > 0 ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">{cActive}</span> : <span className="text-slate-300">-</span>}
                                          </td>
                                          <td className="p-4 text-center">
                                              {cPassage1 > 0 ? <span className="bg-lime-100 text-lime-700 px-2 py-1 rounded-md text-xs font-bold">{cPassage1}</span> : <span className="text-slate-300">-</span>}
                                          </td>
                                          <td className="p-4 text-center">
                                              {cPassage2 > 0 ? <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-bold">{cPassage2}</span> : <span className="text-slate-300">-</span>}
                                          </td>
                                          <td className="p-4 text-center">
                                              {cAbsent > 0 ? <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">{cAbsent}</span> : <span className="text-slate-300">-</span>}
                                          </td>
                                      </tr>
                                  );
                              })}
                              {clients.filter(c => markers.some(m => m.clientId === c.id)).length === 0 && (
                                  <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic text-xs">Aucune donnée disponible.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </Card>
          </div>
          
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMarkers = useMemo(() => filterNestsHelper(markers, searchQuery, statusFilter), [markers, searchQuery, statusFilter]);

  const cleanGhosts = async () => {
      const ghosts = markers.filter(m => m.lat === MAP_CENTER_DEFAULT.lat && m.lng === MAP_CENTER_DEFAULT.lng);
      if (ghosts.length === 0) {
          alert("Aucun nid fantôme trouvé.");
          return;
      }
      if(window.confirm(`Voulez-vous supprimer les ${ghosts.length} nids fantômes empilés à Sète ?`)) {
          for (const ghost of ghosts) {
              await onDeleteNest(ghost);
          }
          alert("Nettoyage des fantômes terminé !");
      }
  };

  const handleExport = async () => {
    setIsExporting(true);
    const XLSX = await loadSheetJS();
    const data = filteredMarkers.map(m => ({ 
      "Noms Client": clients.find(c => c.id === m.clientId)?.name || "Non assigné",
      "ID": m.id,
      "Etat du nids": m.status,
      "nbr d'œuf": m.eggs,
      "adresse precis": m.address,
      "observation": m.comments || "",
      "Latitude": m.lat,
      "Longitude": m.lng,
      "Date d'inspection": m.dateInspection || "",
      "Date 1er Passage": m.ster_1_date || "",
      "Date 2ème Passage": m.ster_2_date || "",
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
            
            // ANTI-FANTÔME
            if (!row["ID"] && !row["N° point"] && !row["Noms Client"] && !row["Lieux"] && !row["Latitude"] && !row["Gps"]) {
                continue;
            }
            
            let lat = MAP_CENTER_DEFAULT.lat;
            let lng = MAP_CENTER_DEFAULT.lng;
            let hasGps = false;

            if (row["Gps"]) {
                const parts = row["Gps"].toString().split(",");
                if (parts.length === 2) {
                    const pLat = parseFloat(parts[0].trim());
                    const pLng = parseFloat(parts[1].trim());
                    if(!isNaN(pLat) && !isNaN(pLng)) {
                        lat = pLat;
                        lng = pLng;
                        hasGps = true;
                    }
                }
            } else if (row["Latitude"] && row["Longitude"]) {
                const pLat = parseFloat(row["Latitude"]);
                const pLng = parseFloat(row["Longitude"]);
                if(!isNaN(pLat) && !isNaN(pLng)) {
                    lat = pLat;
                    lng = pLng;
                    hasGps = true;
                }
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
                status: hasGps ? (row["Etat du nids"] || "present_high") : "temp",
                eggs: parseInt(row["nbr d'œuf"]) || 0,
                address: row["Adresse"] || row["adresse precis"] || (hasGps ? "Adresse importée" : "⚠️ À REPLACER (Pas de GPS)"),
                lat: lat,
                lng: lng,
                title: `N°${row["N° point"] || count} - ${row["Lieux"] || "Nid importé"}`,
                comments: row["observation"] || "Import depuis fichier Excel.",
                dateInspection: row["Date d'inspection"] || row["Date inspection"] || "",
                ster_1_date: row["Date 1er Passage"] || "",
                ster_2_date: row["Date 2ème Passage"] || "",
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

  const handleRoadmapPDF = () => {
      generateRoadmapPDF(filteredMarkers, clients);
  };

  return (
    <div className="space-y-8 text-slate-800 animate-in fade-in duration-300">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-800">GESTION DES NIDS</h2>
        <div className="flex gap-3 flex-wrap">
            <Button variant="primary" onClick={handleRoadmapPDF} className="h-12 rounded-2xl text-xs uppercase tracking-widest px-6 border-0 shadow-lg"><QrCode size={16}/> Feuille de Route</Button>
            <Button variant="outline" className="h-12 rounded-2xl text-xs uppercase tracking-widest px-6 border-2 border-orange-200 text-orange-600 hover:bg-orange-50" onClick={cleanGhosts}><Trash2 size={16}/> Purger Fantômes</Button>
            <Button variant="danger" onClick={onDeleteAllNests} className="h-12 rounded-2xl text-xs uppercase tracking-widest px-6"><Trash2 size={16}/> Tout purger</Button>
            <Button variant="secondary" onClick={handleExport} disabled={isExporting} className="h-12 rounded-2xl text-xs uppercase tracking-widest px-6 border-2"><Download size={16}/> Exporter .xlsx</Button>
            <div className="relative">
                <input type="file" accept=".xlsx, .csv" onChange={handleImport} className="hidden" id="import-excel-file" />
                <label htmlFor="import-excel-file" className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase cursor-pointer hover:bg-sky-700 shadow-xl shadow-sky-200 h-12 transition-all">
                    <Upload size={16}/> Importer Fichier
                </label>
            </div>
        </div>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-4 bg-white border-0 shadow-lg rounded-3xl">
          <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={18}/>
              <input type="text" placeholder="Rechercher par référence, adresse..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
              <Filter className="text-slate-400" size={18}/>
              <select className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">Tous les statuts</option>
                  <option value="reported">Signalements</option>
                  <option value="active">Nids Actifs (À traiter)</option>
                  <option value="treated">Stérilisés (Pass. 1 & 2)</option>
                  <option value="absent">Absents</option>
              </select>
          </div>
      </Card>

      {clients.map(client => {
          const clientNests = filteredMarkers.filter(m => m.clientId === client.id);
          if (clientNests.length === 0) return null; 
          
          return (
              <Card key={client.id} className="overflow-hidden border-0 shadow-xl rounded-[32px] mb-8">
                  <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/10 rounded-2xl"><Users size={20} className="text-sky-400"/></div>
                          <h3 className="font-black uppercase tracking-wide text-lg">{client.name}</h3>
                      </div>
                      <span className="bg-white/20 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-inner">{clientNests.length} Nids affichés</span>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                              <tr>
                                  <th className="p-5 pl-8">Réf / Adresse</th>
                                  <th className="p-5">Statut</th>
                                  <th className="p-5 text-center">Contenu</th>
                                  <th className="p-5 text-right pr-8">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {clientNests.map((m) => (
                                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="p-5 pl-8">
                                          <div className="font-black text-slate-800 text-base mb-1">{m.title || "Nid"}</div>
                                          <div className="text-xs text-slate-400 font-medium truncate max-w-[350px] flex items-center gap-1"><MapPin size={12} className="text-slate-300"/> {m.address}</div>
                                      </td>
                                      <td className="p-5"><Badge status={m.status}/></td>
                                      <td className="p-5 text-center font-black text-slate-700 text-lg">{m.eggs} <span className="font-bold text-xs uppercase tracking-widest opacity-50">œuf(s)</span></td>
                                      <td className="p-5 flex justify-end gap-3 pr-8">
                                          <button onClick={() => setSelectedNest(m)} className="p-3 text-sky-600 bg-sky-50 rounded-xl hover:bg-sky-600 hover:text-white transition-colors shadow-sm"><Edit size={16}/></button>
                                          <button onClick={() => { if (window.confirm("Supprimer ce nid ?")) onDeleteNest(m); }} className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-600 hover:text-white transition-colors shadow-sm"><Trash2 size={16} /></button>
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
        <div className="fixed inset-0 z-[1000] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="bg-white rounded-[32px] p-8 md:p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-0">
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                  <h3 className="font-black text-3xl uppercase tracking-tighter text-slate-900 flex items-center gap-3"><Edit size={28} className="text-sky-500"/> Édition du Nid</h3>
                  <button onClick={() => setSelectedNest(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={28} className="text-slate-400"/></button>
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
    <div className="space-y-8 text-slate-800 animate-in fade-in duration-300">
      <div className="flex justify-between items-center"><h2 className="text-3xl font-black uppercase tracking-tighter">CLIENTS</h2><Button variant="sky" className="rounded-2xl px-6 h-12 text-xs uppercase font-black tracking-widest" onClick={() => setIsCreating(true)}><Plus size={16} /> Nouveau</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((c) => (
          <Card key={c.id} className="p-8 cursor-pointer hover:shadow-2xl transition-all group border-0 shadow-lg rounded-3xl bg-white" onClick={() => { setSelectedClient(c); setView("client-detail"); }}>
            <div className="flex justify-between items-start mb-6"><div className="p-4 bg-sky-50 text-sky-600 rounded-2xl group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300 shadow-sm"><Users size={24} /></div><span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-md border border-slate-100">{c.type}</span></div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">{c.name}</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide truncate mt-4 flex items-center gap-2"><MapPin size={14} className="text-sky-500" /> {c.address}</p>
          </Card>
        ))}
      </div>
      {isCreating && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <Card className="p-8 w-full max-w-lg shadow-2xl border-0 rounded-[32px] text-slate-800"><h3 className="font-black text-2xl mb-6 uppercase tracking-tighter text-slate-900">Créer une fiche</h3><ClientEditForm client={{ id: Date.now(), name: "", type: "Privé", address: "", contact: "", phone: "", email: "" }} onSave={(d) => { onCreateClient(d); setIsCreating(false); }} onCancel={() => setIsCreating(false)} /></Card>
        </div>
      )}
    </div>
  );
};

const ClientDetail = ({ selectedClient, setView, interventions, reports, markers, onUpdateClient, onDeleteClient }) => {
    const [isEditing, setIsEditing] = useState(false);
    const cInt = useMemo(() => interventions.filter(i => i.clientId === selectedClient.id), [interventions, selectedClient]);
    const cNests = useMemo(() => markers.filter(m => m.clientId === selectedClient.id), [markers, selectedClient]);
    
    return (
        <div className="space-y-8 text-slate-800 animate-in fade-in duration-300">
            <Button variant="secondary" onClick={() => setView("clients")} className="rounded-2xl px-6 border-2 h-12 text-xs uppercase tracking-widest font-black">&larr; Retour Clients</Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-8">
                    <Card className="p-8 border-0 shadow-xl rounded-[32px] bg-white">
                        {isEditing ? <ClientEditForm client={selectedClient} onSave={(d) => {onUpdateClient(d); setIsEditing(false);}} onCancel={() => setIsEditing(false)}/> : (
                            <>
                                <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter text-slate-900">{selectedClient.name}</h2>
                                <div className="space-y-4 text-sm font-bold text-slate-600 uppercase">
                                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl"><MapPin size={20} className="text-sky-500 shrink-0"/><p className="leading-tight text-xs mt-0.5">{selectedClient.address}</p></div>
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl"><Phone size={20} className="text-sky-500 shrink-0"/><p className="text-xs">{selectedClient.phone}</p></div>
                                    
                                    {selectedClient.extendedContacts && selectedClient.extendedContacts.length > 0 && (
                                        <div className="bg-sky-50 p-5 rounded-2xl border border-sky-100 mt-4 shadow-inner">
                                            <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14}/> Contacts de Survol</p>
                                            <div className="space-y-2">
                                                {selectedClient.extendedContacts.map((contact, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded-xl shadow-sm text-[10px] font-bold text-slate-700 flex items-start gap-3 border border-sky-50 leading-relaxed normal-case">
                                                        <span className="text-sky-500 mt-0.5 shrink-0">•</span>
                                                        <span>{contact}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl mt-8">
                                        <p className="text-[10px] font-black opacity-50 tracking-widest text-center mb-4">ACCÈS ESPACE CLIENT</p>
                                        <p className="text-xs tracking-widest mb-2 font-mono"><span className="opacity-50 mr-2 font-sans">ID:</span>{selectedClient.username}</p>
                                        <p className="text-xs tracking-widest font-mono"><span className="opacity-50 mr-2 font-sans">PASS:</span>{selectedClient.password}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-slate-100">
                                    <Button variant="sky" className="w-full py-4 rounded-2xl uppercase tracking-widest text-xs" onClick={() => setIsEditing(true)}>Modifier la fiche</Button>
                                    <Button variant="danger" className="w-full py-4 rounded-2xl uppercase tracking-widest text-xs bg-red-50 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => {if(window.confirm("Supprimer ce client et toutes ses données ?")){onDeleteClient(selectedClient); setView("clients");}}}>Supprimer le client</Button>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-8 shadow-xl border-0 rounded-[32px] bg-slate-900 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Nids recensés</p>
                                <p className="text-6xl font-black text-sky-400 tracking-tighter">{cNests.length}</p>
                            </div>
                            <Bird className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 transform -scale-x-100"/>
                        </Card>
                        <Card className="p-8 shadow-xl border-0 rounded-[32px] bg-sky-600 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Missions effectuées</p>
                                <p className="text-6xl font-black tracking-tighter">{cInt.filter(i => i.status === "Terminé").length}</p>
                            </div>
                            <CheckCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10"/>
                        </Card>
                    </div>
                    <Card className="p-0 border-0 shadow-xl rounded-[32px] bg-white overflow-hidden h-[400px] flex flex-col">
                        <div className="p-6 bg-slate-50 border-b border-slate-100 shrink-0">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2"><Calendar size={16} className="text-sky-500"/> Historique des Passages</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <table className="w-full text-left text-sm">
                                <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100"><tr><th className="pb-4">Date</th><th className="pb-4">Statut</th><th className="pb-4">Notes Intervention</th></tr></thead>
                                <tbody className="divide-y divide-slate-50">
                                    {cInt.length === 0 ? <tr><td colSpan="3" className="py-8 text-center text-slate-400 font-bold uppercase text-xs italic">Aucune intervention enregistrée</td></tr> : cInt.map(i => <tr key={i.id} className="hover:bg-slate-50/50 transition-colors"><td className="py-4 font-black text-slate-700">{i.date}</td><td className="py-4"><Badge status={i.status}/></td><td className="py-4 text-xs font-medium text-slate-500 italic max-w-[200px]">{i.notes || "-"}</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

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

        for (let i = 0; i < startOffset; i++) days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50 border-r border-b border-slate-100" />);
        
        for (let d = 1; d <= dInM; d++) {
            const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const dayInts = interventions.filter(i => i.date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            
            days.push(
                <div key={d} className={`h-32 border-r border-b border-slate-100 p-2 hover:bg-sky-50/50 transition-all cursor-pointer relative group flex flex-col ${isToday ? 'bg-sky-50/30' : 'bg-white'}`} onClick={() => { setEditingInt({ id: Date.now(), date: dateStr }); setIsCreating(true); }}>
                    <div className="flex justify-end mb-1 shrink-0">
                        <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-100'}`}>{d}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
                        {dayInts.map(i => (
                            <div key={i.id} className={`text-[9px] px-2 py-1.5 rounded-lg truncate font-black uppercase tracking-tighter shadow-sm border-l-4 ${i.status === 'Terminé' ? 'bg-emerald-50 text-emerald-700 border-emerald-400' : 'bg-slate-900 text-white border-sky-400'}`}>
                                {clients.find(c => c.id === i.clientId)?.name || "Mission"}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="space-y-8 text-slate-800 animate-in fade-in duration-300">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">PLANNING</h2>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                        <button onClick={() => setViewMode("calendar")} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "calendar" ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Calendrier</button>
                        <button onClick={() => setViewMode("list")} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === "list" ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Liste</button>
                    </div>
                    <Button variant="sky" className="rounded-2xl px-6 h-12 text-xs uppercase tracking-widest shadow-xl shadow-sky-200" onClick={() => setIsCreating(true)}><Plus size={16}/> Programmer</Button>
                </div>
            </div>

            {viewMode === "calendar" ? (
                <Card className="overflow-hidden border-0 shadow-2xl rounded-[32px] bg-white">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24}/></button>
                        <h3 className="text-xl font-black uppercase tracking-widest">{currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={24}/></button>
                    </div>
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 border-l border-slate-100">{renderCalendar()}</div>
                </Card>
            ) : (
                <Card className="overflow-hidden border-0 shadow-2xl rounded-[32px] bg-white">
                    <div className="overflow-x-auto text-slate-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                                <tr><th className="p-6 pl-8">Date</th><th className="p-6">Client / Site</th><th className="p-6">Pilote</th><th className="p-6">Statut</th><th className="p-6 text-right pr-8">Actions</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {interventions.length === 0 ? <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Aucune intervention programmée</td></tr> : interventions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(i => (
                                    <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-6 pl-8 font-black text-sky-600">{i.date}</td>
                                        <td className="p-6 font-bold uppercase text-slate-800 tracking-tight">{clients.find(c => c.id === i.clientId)?.name || "Non assigné"}</td>
                                        <td className="p-6 text-xs font-bold text-slate-500">{i.technician || "-"}</td>
                                        <td className="p-6"><Badge status={i.status}/></td>
                                        <td className="p-6 flex justify-end gap-2 pr-8">
                                            <button onClick={() => setEditingInt(i)} className="p-2.5 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-all shadow-sm"><Edit size={18}/></button>
                                            <button onClick={() => {if(window.confirm("Supprimer la mission ?")) onDeleteIntervention(i);}} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {(isCreating || editingInt) && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <Card className="p-10 w-full max-w-md shadow-2xl border-0 rounded-[32px] bg-white">
                        <div className="flex justify-between items-center mb-8 border-b pb-4">
                            <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter flex items-center gap-3"><Calendar size={24} className="text-sky-500"/> {isCreating && !editingInt?.clientId ? "Nouveau Vol" : "Détails Mission"}</h3>
                            <button onClick={() => {setEditingInt(null); setIsCreating(false);}} className="text-slate-400 hover:text-slate-800 p-2 bg-slate-50 rounded-full transition-colors"><X size={24}/></button>
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
    const [filter, setFilter] = useState('all'); 
    
    const filteredReports = useMemo(() => { 
        if (filter === 'admin') return reports.filter(r => r.author === 'admin'); 
        if (filter === 'client') return reports.filter(r => r.author === 'client'); 
        return reports; 
    }, [reports, filter]);

    const handleDownloadReport = (r) => {
        const client = clients.find(c => c.id === r.clientId) || { name: "Inconnu" };
        if (r.type === 'Fiche Nid') {
            const targetNest = markers.find(m => m.id === r.nestId);
            if (!targetNest) return alert("Impossible de générer : le nid associé a été supprimé.");
            generatePDF('nest_detail', targetNest, { clientName: client.name });
        } else if (r.type === 'Rapport Complet') {
            const clientMarkers = markers.filter(m => m.clientId === r.clientId);
            const clientInts = interventions.filter(i => i.clientId === r.clientId);
            generatePDF('complete_report', r, { client, markers: clientMarkers, interventions: clientInts });
        } else {
            generatePDF('file', r);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300 text-slate-800">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">DOCUMENTS</h2>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                        <button onClick={() => setFilter('all')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Tous</button>
                        <button onClick={() => setFilter('client')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'client' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Reçus Client</button>
                    </div>
                    <Button variant="sky" className="rounded-2xl px-6 h-12 text-xs uppercase tracking-widest shadow-xl shadow-sky-200" onClick={() => setIsCreating(true)}><Plus size={16}/> Créer Document</Button>
                </div>
            </div>
            
            <Card className="overflow-hidden border-0 shadow-2xl rounded-[32px] bg-white">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                            <tr><th className="p-6 pl-8">Document</th><th className="p-6">Client / Cible</th><th className="p-6">Date</th><th className="p-6">Catégorie</th><th className="p-6 text-right pr-8">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredReports.length === 0 ? <tr><td colSpan="5" className="p-16 text-center text-slate-400 font-bold uppercase italic tracking-widest"><FileText size={40} className="mx-auto mb-4 opacity-20"/> Aucun document trouvé</td></tr> : filteredReports.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-6 pl-8 font-black flex items-center gap-4 text-slate-800 text-base">
                                        <div className={`p-3 rounded-2xl ${r.author === 'client' ? 'bg-purple-100 text-purple-600 shadow-inner' : 'bg-slate-100 text-slate-500 shadow-inner'}`}>
                                            {r.author === 'client' ? <FileCheck size={20}/> : <File size={20}/>}
                                        </div> 
                                        {r.title}
                                    </td>
                                    <td className="p-6">
                                        <span className="text-xs font-black uppercase text-slate-700 tracking-tight">{clients.find(c => c.id === r.clientId)?.name || "Non assigné"}</span>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{r.author === 'client' ? "Envoyé par le client" : "Généré par Aerothau"}</div>
                                    </td>
                                    <td className="p-6 text-xs font-black text-sky-600">{r.date}</td>
                                    <td className="p-6"><Badge status={r.type === 'Fiche Nid' ? 'reported_by_client' : (r.type === 'Rapport Complet' ? 'sterilized_2' : 'Planifié')}/></td>
                                    <td className="p-6 flex justify-end gap-2 pr-8">
                                        <button 
                                            onClick={() => handleDownloadReport(r)} 
                                            className="p-3 text-slate-600 hover:text-white bg-slate-50 hover:bg-slate-900 rounded-xl transition-all shadow-sm" 
                                            title="Télécharger le PDF"
                                        >
                                            <Download size={18}/>
                                        </button>
                                        <button onClick={() => setEditingRep(r)} className="p-3 text-sky-600 bg-sky-50 hover:bg-sky-600 hover:text-white rounded-xl transition-all shadow-sm"><Edit size={18}/></button>
                                        <button onClick={() => {if(window.confirm("Supprimer ce document définitivement ?")) onDeleteReport(r);}} className="p-3 text-red-500 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {(isCreating || editingRep) && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <Card className="p-10 w-full max-w-md shadow-2xl border-0 rounded-[32px] bg-white text-slate-800">
                        <div className="flex justify-between items-center mb-8 border-b pb-4">
                            <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter flex items-center gap-3"><FileText size={24} className="text-sky-500"/> {isCreating ? "Nouveau Doc" : "Éditer"}</h3>
                            <button onClick={() => {setEditingRep(null); setIsCreating(false);}} className="text-slate-400 hover:text-slate-800 p-2 bg-slate-50 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <ReportEditForm report={editingRep || {id: Date.now()}} clients={clients} markers={markers} interventions={interventions} onSave={async (d) => { await onUpdateReport(d); setEditingRep(null); setIsCreating(false); }} onCancel={() => {setEditingRep(null); setIsCreating(false);}} />
                    </Card>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// 7. ESPACE CLIENT (FRONT-END CLIENT)
// ============================================================================

const ClientSpace = ({ user, markers, interventions, clients, reports, onUpdateNest, onUpdateReport }) => {
    const myMarkers = useMemo(() => markers.filter(m => m.clientId === user.clientId), [markers, user.clientId]);
    const myReports = useMemo(() => reports.filter(r => r.clientId === user.clientId), [reports, user.clientId]);
    
    const clientStats = useMemo(() => ({
        reported: myMarkers.filter(m => m.status === "reported_by_client").length,
        active: myMarkers.filter(m => m.status && m.status.startsWith("present")).length,
        passage1: myMarkers.filter(m => m.status === "sterilized_1").length,
        passage2: myMarkers.filter(m => m.status === "sterilized_2" || m.status === "sterilized").length,
        nonPresent: myMarkers.filter(m => m.status === "non_present").length,
    }), [myMarkers]);

    const [pendingReport, setPendingReport] = useState(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [selectedNestDetail, setSelectedNestDetail] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    
    const [searchQuery, setSearchQuery] = useState(""); 
    const [nestFilterQuery, setNestFilterQuery] = useState(""); 
    const [statusFilter, setStatusFilter] = useState("all");
    
    const [mapCenter, setMapCenter] = useState(null);
    const [tempMarker, setTempMarker] = useState(null);

    const requestIntervention = async () => {
        if(window.confirm("Confirmer la demande d'intervention urgente ?")) {
            alert("Votre demande a été transmise à nos équipes. Nous vous contacterons sous 24h.");
        }
    };

    const handleDownloadReport = (r) => {
        const client = clients.find(c => c.id === r.clientId) || { name: "Inconnu" };
        if (r.type === 'Fiche Nid') {
            const targetNest = myMarkers.find(m => m.id === r.nestId);
            if (!targetNest) return alert("Le nid associé à ce document est introuvable.");
            generatePDF('nest_detail', targetNest, { clientName: client.name });
        } else if (r.type === 'Rapport Complet') {
            const clientInts = interventions.filter(i => i.clientId === r.clientId);
            generatePDF('complete_report', r, { client, markers: myMarkers, interventions: clientInts });
        } else {
            generatePDF('file', r);
        }
    };

    const handleSearch = useCallback(async (e) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            let lat, lng, addr;
            const coords = searchQuery.replace(/,/g, " ").split(/\s+/).filter(Boolean).map(parseFloat);
            if (coords.length === 2 && !coords.some(isNaN) && Math.abs(coords[0]) <= 90) {
                lat = coords[0]; lng = coords[1]; addr = `Point GPS`;
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

    const displayMarkers = useMemo(() => {
        let filtered = filterNestsHelper(myMarkers, nestFilterQuery, statusFilter);
        if (tempMarker) filtered.push(tempMarker);
        return filtered;
    }, [myMarkers, tempMarker, nestFilterQuery, statusFilter]);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900">
                            <Card className="p-8 border-0 shadow-xl rounded-[32px] flex flex-col justify-center bg-white relative overflow-hidden group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setActiveTab('map')}>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin size={14} className="text-sky-500"/> Surveillance Globale</p>
                                    <p className="text-5xl font-black text-slate-800 tracking-tighter">{myMarkers.length} <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nids</span></p>
                                </div>
                                <Bird size={100} className="text-slate-50 absolute -right-4 -bottom-4 transform -scale-x-100 group-hover:text-slate-100 transition-colors" />
                            </Card>

                            <Card className="p-8 border-0 shadow-xl rounded-[32px] flex flex-col justify-center bg-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle size={14}/> Impact Sanitaire</p>
                                    <p className="text-5xl font-black text-emerald-600 tracking-tighter">{clientStats.passage2} <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Stérilisés</span></p>
                                </div>
                                <CheckCircle size={100} className="text-emerald-50 absolute -right-4 -bottom-4" />
                            </Card>
                        </div>

                        <PopulationStats markers={myMarkers} />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                            <Card className="p-8 border-0 shadow-2xl rounded-[32px] bg-slate-900 text-white flex flex-col justify-center items-center text-center relative overflow-hidden lg:col-span-1">
                                <div className="relative z-10 w-full">
                                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <AlertTriangle size={32} className="text-red-400 animate-pulse"/>
                                    </div>
                                    <h3 className="font-black text-2xl uppercase tracking-tighter mb-3">Nid Problématique ?</h3>
                                    <p className="text-xs text-slate-400 mb-8 leading-relaxed font-medium px-4">Signalez-nous immédiatement toute nuisance ou comportement agressif.</p>
                                    <Button variant="sky" className="w-full rounded-2xl text-xs uppercase font-black tracking-widest py-4 shadow-xl shadow-sky-900" onClick={() => {setIsAddingMode(true); setActiveTab('map');}}>
                                        <Crosshair size={18}/> Pointer sur la carte
                                    </Button>
                                    <button onClick={requestIntervention} className="w-full mt-4 text-[10px] uppercase font-bold text-slate-500 hover:text-white tracking-widest transition-colors">Demander un passage technique</button>
                                </div>
                            </Card>

                            <Card className="p-0 border-0 shadow-xl rounded-[32px] bg-white flex flex-col h-full lg:col-span-2 overflow-hidden">
                                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-widest flex items-center gap-3"><FileText size={18} className="text-sky-500"/> Rapports d'intervention</h3>
                                    <button onClick={() => setActiveTab('documents')} className="text-[10px] font-black bg-white px-4 py-2 rounded-xl text-sky-600 uppercase hover:bg-sky-50 transition-colors shadow-sm">Tout voir</button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                                     {myReports && myReports.length > 0 ? myReports.slice(0, 4).map(r => (
                                         <div key={r.id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-sky-300 hover:shadow-md transition-all cursor-pointer bg-white" onClick={() => handleDownloadReport(r)}>
                                             <div className="flex items-center gap-4">
                                                 <div className={`p-3 rounded-xl ${r.author === 'client' ? 'bg-purple-50 text-purple-600' : 'bg-sky-50 text-sky-600'}`}>
                                                    {r.author === 'client' ? <Upload size={20}/> : <Download size={20}/>}
                                                 </div>
                                                 <div>
                                                     <p className="font-black text-sm text-slate-800 leading-tight mb-1">{r.title}</p>
                                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.date} • {r.author === 'client' ? 'Soumis' : 'Reçu'}</p>
                                                 </div>
                                             </div>
                                             <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-sky-500 group-hover:text-white text-slate-400 transition-colors">
                                                 <Printer size={16}/>
                                             </div>
                                         </div>
                                     )) : (
                                         <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                                             <File size={48} className="mb-4 opacity-10"/>
                                             <p className="text-xs font-bold uppercase tracking-widest">Aucun rapport récent.</p>
                                         </div>
                                     )}
                                </div>
                            </Card>
                        </div>
                    </div>
                );
            case 'map':
                return (
                    <div className="h-[700px] flex flex-col gap-6 text-slate-800 animate-in fade-in duration-500">
                        <Card className="p-3 flex flex-col md:flex-row gap-4 items-center z-20 shadow-xl border-0 rounded-3xl bg-white">
                            <div className="relative flex-1 w-full group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={20}/>
                                <input type="text" placeholder="Aller à une adresse (Taper Entrée)..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={handleSearch} />
                            </div>
                            
                            <div className="flex-1 flex gap-2 w-full">
                                <div className="relative flex-1 group">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={16}/>
                                    <input type="text" placeholder="Filtrer la carte par Réf/Titre..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={nestFilterQuery} onChange={e => setNestFilterQuery(e.target.value)} />
                                </div>
                                <select className="flex-1 p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="all">Tous les nids</option>
                                    <option value="reported">Signalements</option>
                                    <option value="active">Actifs (À traiter)</option>
                                    <option value="treated">Stérilisés</option>
                                    <option value="absent">Absents</option>
                                </select>
                            </div>

                            <Button variant={isAddingMode ? "danger" : "sky"} className="py-4 px-8 rounded-2xl uppercase font-black tracking-widest text-xs shadow-lg h-12" onClick={() => setIsAddingMode(!isAddingMode)}>
                                {isAddingMode ? <><X size={18}/> Mode Navigation</> : <><Plus size={18}/> Signaler un nouveau nid</>}
                            </Button>
                        </Card>
                        <div className={`flex-1 relative shadow-2xl rounded-[32px] overflow-hidden bg-white transition-all duration-300 ${isAddingMode ? 'border-[8px] border-sky-500' : 'border-0'}`}>
                            {isAddingMode && (
                                <div className="absolute inset-x-0 top-6 z-[1000] flex justify-center pointer-events-none animate-in slide-in-from-top-4">
                                    <div className="bg-slate-900 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-900/50 flex items-center gap-3">
                                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span></span>
                                        Cliquez sur la toiture pour placer le nid
                                    </div>
                                </div>
                            )}
                            
                            {tempMarker && !isAddingMode && (<div className="absolute top-6 left-1/2 -translate-x-1/2 z-[500] bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest animate-bounce pointer-events-none shadow-2xl">📍 Cliquez sur le point gris pour valider</div>)}
                            
                            <LeafletMap 
                                markers={displayMarkers} 
                                isAddingMode={isAddingMode} 
                                center={mapCenter}
                                onMarkerClick={(m) => { 
                                    if (m.id === "temp") {
                                        setPendingReport({ id: Date.now(), clientId: user.clientId, lat: m.lat, lng: m.lng, address: m.address, status: "reported_by_client", title: "Nouveau Signalement" });
                                        setTempMarker(null);
                                    } else if(!isAddingMode) {
                                        setSelectedNestDetail(m); 
                                    }
                                }}
                                onMapClick={(ll) => {
                                    if(isAddingMode) {
                                        setPendingReport({ id: Date.now(), clientId: user.clientId, lat: ll.lat, lng: ll.lng, address: "Signalement en attente", status: "reported_by_client", title: "Nouveau Signalement" });
                                        setIsAddingMode(false);
                                    }
                                }}
                            />
                            
                            {pendingReport && (
                                <div className="absolute top-6 left-6 z-[500] w-80 md:w-96 max-h-[90%] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-left-6 rounded-[32px]">
                                    <Card className="border-0 flex flex-col overflow-hidden bg-white shadow-none rounded-none h-full">
                                        <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
                                            <span className="font-black text-sm uppercase tracking-widest flex items-center gap-3"><Crosshair size={18} className="text-sky-400"/> Finaliser Signalement</span>
                                            <button onClick={() => setPendingReport(null)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
                                        </div>
                                        <div className="p-6 overflow-y-auto shrink custom-scrollbar bg-white">
                                            <ClientReportForm nest={pendingReport} onSave={async (d) => {
                                                await onUpdateNest(d);
                                                setPendingReport(null);
                                                alert("Votre signalement a été transmis à l'équipe technique avec succès !");
                                            }} onCancel={() => setPendingReport(null)} />
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {selectedNestDetail && (
                                <div className="absolute top-6 left-6 z-[500] w-80 md:w-96 max-h-[90%] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-left-6 rounded-[32px]">
                                    <Card className="border-0 flex flex-col overflow-hidden bg-white shadow-none rounded-none h-full">
                                        <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
                                            <span className="font-black text-sm uppercase tracking-widest flex items-center gap-3"><MapIcon size={18} className="text-sky-400"/> Détails du Nid</span>
                                            <button onClick={() => setSelectedNestDetail(null)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
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
                     <Card className="p-0 border-0 shadow-2xl rounded-[32px] bg-white flex flex-col flex-1 overflow-hidden h-[700px] animate-in fade-in duration-500">
                        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter mb-1">Inventaire du site</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Liste détaillée de tous les nids</p>
                            </div>
                            <div className="flex items-center gap-3 flex-1 max-w-xl mx-8">
                                <div className="relative flex-1 group">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={16}/>
                                    <input type="text" placeholder="Filtrer par Réf/Adresse..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all" value={nestFilterQuery} onChange={e => setNestFilterQuery(e.target.value)} />
                                </div>
                                <select className="p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-sky-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                    <option value="all">Tous les statuts</option>
                                    <option value="reported">Signalements</option>
                                    <option value="active">Actifs (À traiter)</option>
                                    <option value="treated">Stérilisés</option>
                                    <option value="absent">Absents</option>
                                </select>
                            </div>
                            <div className="p-4 bg-white rounded-2xl shadow-sm"><Bird size={24} className="text-sky-500"/></div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                             {displayMarkers.length > 0 ? (
                                 <table className="w-full text-left text-sm">
                                     <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10 shadow-sm">
                                         <tr><th className="p-5 pl-8">Référence / Localisation</th><th className="p-5">État d'avancement</th><th className="p-5 text-center">Contenu</th><th className="p-5 pr-8">Notes équipe</th></tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-50">
                                         {displayMarkers.map(m => (
                                             <tr key={m.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => { setSelectedNestDetail(m); setActiveTab('map'); }}>
                                                 <td className="p-5 pl-8">
                                                     <div className="font-black text-slate-800 text-base mb-1 group-hover:text-sky-600 transition-colors">{m.title || "Nid #" + m.id.toString().slice(-4)}</div>
                                                     <div className="text-xs text-slate-400 truncate max-w-[250px] font-medium flex items-center gap-1"><MapPin size={10}/>{m.address}</div>
                                                 </td>
                                                 <td className="p-5"><Badge status={m.status}/></td>
                                                 <td className="p-5 text-center font-black text-slate-700 text-lg">{m.eggs} <span className="text-[10px] uppercase text-slate-400">œuf(s)</span></td>
                                                 <td className="p-5 pr-8 text-xs font-medium text-slate-500 italic max-w-[200px] truncate" title={m.comments}>{m.comments || "-"}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             ) : (
                                 <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                                     <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Bird size={48} className="opacity-20"/></div>
                                     <p className="text-sm font-bold uppercase tracking-widest">Aucun nid ne correspond aux filtres.</p>
                                 </div>
                             )}
                        </div>
                    </Card>
                );
            case 'documents':
                return (
                    <div className="h-[700px] flex flex-col gap-6 animate-in fade-in duration-500">
                         <Card className="p-0 border-0 shadow-2xl rounded-[32px] bg-white flex flex-col flex-1 overflow-hidden relative">
                             <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter mb-1">Espace Documentaire</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rapports, devis et attestations</p>
                                </div>
                                <Button variant="sky" className="px-6 py-3 rounded-2xl uppercase font-black text-xs tracking-widest shadow-xl shadow-sky-200" onClick={() => setIsUploading(true)}><Upload size={16}/> Transmettre un fichier</Button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                                 {myReports.length === 0 && <p className="text-center text-slate-400 font-bold uppercase text-xs tracking-widest py-12">Dossier vide</p>}
                                 
                                 {/* Documents Aerothau */}
                                 {myReports.filter(r => r.author === 'admin').map(r => (
                                     <div key={r.id} className="p-5 border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-sky-300 hover:shadow-md transition-all cursor-pointer bg-white" onClick={() => handleDownloadReport(r)}>
                                         <div className="flex items-center gap-5">
                                             <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl group-hover:scale-110 transition-transform"><FileText size={24}/></div>
                                             <div>
                                                 <p className="font-black text-base text-slate-800 leading-tight mb-1">{r.title}</p>
                                                 <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold text-white bg-slate-900 px-2 py-0.5 rounded uppercase tracking-widest">Document Officiel</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.date}</span>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-colors shadow-sm">
                                             <Download size={20}/>
                                         </div>
                                     </div>
                                 ))}

                                 {/* Documents Client */}
                                 {myReports.filter(r => r.author === 'client').map(r => (
                                     <div key={r.id} className="p-5 border border-slate-100 rounded-2xl flex justify-between items-center bg-slate-50">
                                         <div className="flex items-center gap-5">
                                             <div className="p-4 bg-white text-purple-500 rounded-2xl shadow-sm"><Send size={24}/></div>
                                             <div>
                                                 <p className="font-black text-base text-slate-800 leading-tight mb-1">{r.title}</p>
                                                 <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded uppercase tracking-widest">Envoyé par vous</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.date}</span>
                                                 </div>
                                             </div>
                                         </div>
                                         <CheckCircle size={24} className="text-emerald-500"/>
                                     </div>
                                 ))}
                            </div>
                        </Card>
                        
                        {/* Modal Upload Client */}
                        {isUploading && (
                             <div className="fixed inset-0 z-[1000] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                                <Card className="p-10 w-full max-w-md shadow-2xl border-0 rounded-[32px] bg-white text-slate-800">
                                    <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                                        <h3 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-3"><Upload size={24} className="text-sky-500"/> Transmettre</h3>
                                        <button onClick={() => setIsUploading(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400"/></button>
                                    </div>
                                    <ReportEditForm report={{id: Date.now(), clientId: user.clientId}} clients={clients} userRole="client" onSave={async (d) => { await onUpdateReport(d); setIsUploading(false); }} onCancel={() => setIsUploading(false)} />
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
        <div className="space-y-8 text-slate-800 pb-24 lg:pb-0">
             <Card className="p-10 bg-slate-900 text-white relative overflow-hidden shadow-2xl rounded-[32px] border-0">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                         <p className="text-sky-400 font-black uppercase tracking-widest text-xs mb-2">Espace Client Sécurisé</p>
                         <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">{user.name}</h2>
                         <p className="text-slate-400 font-medium text-sm">Gestion et suivi des interventions avifaunes.</p>
                    </div>
                    <button onClick={() => { if(window.confirm("Voulez-vous vous déconnecter ?")) window.location.reload(); }} className="bg-white/10 hover:bg-red-500 text-white px-6 py-3 rounded-2xl transition-colors flex items-center gap-3 font-bold text-sm uppercase tracking-widest w-fit">
                        <LogOut size={18} /> Quitter
                    </button>
                </div>
                <Plane className="absolute -right-12 -bottom-24 h-64 w-64 text-white/5 rotate-12 pointer-events-none" />
            </Card>

            <div className="flex overflow-x-auto gap-3 pb-4 custom-scrollbar">
                <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}><Activity size={16}/> Vue d'ensemble</button>
                <button onClick={() => setActiveTab('map')} className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'map' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}><MapIcon size={16}/> Cartographie</button>
                <button onClick={() => setActiveTab('list')} className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'list' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}><ListIcon size={16}/> Inventaire</button>
                <button onClick={() => setActiveTab('documents')} className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'documents' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}><FileText size={16}/> Documents</button>
            </div>

            {renderContent()}
        </div>
    );
};

// ============================================================================
// 8. APP PRINCIPALE & ROUTING
// ============================================================================

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

  const showToast = useCallback((message, type = 'success') => { setToast({ message, type }); }, []);

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
          showToast("Données sauvegardées", "success");
      } catch (error) { showToast("Erreur d'enregistrement", "error"); }
  };
  
  const deleteFromFirebase = async (collectionName, id) => {
      if (!isFirebaseReady) return;
      try {
          await deleteDoc(doc(db, "artifacts", appId, "public", "data", collectionName, id.toString()));
          showToast("Suppression confirmée", "success");
      } catch (error) { showToast("Erreur de suppression", "error"); }
  };

  if (!user) return <LoginForm onLogin={setUser} users={availableUsers} logoUrl={LOGO_URL} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-900 font-sans selection:bg-sky-200 selection:text-sky-900">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* SIDEBAR ADMIN */}
      {user.role === 'admin' && (
      <>
          {/* Overlay Mobile */}
          {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-[990] lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}
          
          <aside className={`fixed lg:static inset-y-0 left-0 z-[1000] w-72 bg-slate-900 text-white transform transition-transform duration-500 ease-in-out shadow-2xl flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
            <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4"><div className="p-2 bg-white rounded-xl shadow-lg"><img src={LOGO_URL} alt="Logo" className="h-8 w-auto" /></div><span className="text-xl font-black uppercase tracking-tighter">Aerothau</span></div>
                <button className="lg:hidden p-2 text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 ml-2">Menu Principal</p>
                {[
                    { id: "dashboard", label: "Vue Générale", icon: Home },
                    { id: "map", label: "Cartographie Globale", icon: MapIcon },
                    { id: "nests", label: "Base de données Nids", icon: Bird },
                    { id: "clients", label: "Portefeuille Clients", icon: Users },
                    { id: "schedule", label: "Planning Interventions", icon: Calendar },
                    { id: "reports", label: "Rapports & Docs", icon: FileText },
                ].map(item => (
                  <button key={item.id} onClick={() => { setView(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest ${view === item.id || (item.id === "clients" && view === "client-detail") ? "bg-sky-500 text-white shadow-xl shadow-sky-900/50 translate-x-1" : "text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1"}`}>
                    <item.icon size={20} className={view === item.id ? "text-white" : "text-slate-600 group-hover:text-white"} /> <span>{item.label}</span>
                  </button>
                ))}
            </div>
            
            <div className="p-6 mt-auto bg-slate-950/50 shrink-0">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center font-black text-sky-400 border-2 border-slate-700 shadow-inner uppercase text-xl">{user.name.charAt(0)}</div>
                      <div className="overflow-hidden flex-1"><p className="text-sm font-black uppercase tracking-tighter truncate text-white">{user.name}</p><p className="text-[10px] font-bold uppercase text-sky-500 tracking-widest">Administrateur</p></div>
                  </div>
                  <button onClick={() => setUser(null)} className="w-full flex items-center justify-center gap-3 text-red-400 hover:bg-red-500 hover:text-white py-4 rounded-2xl transition-all font-black uppercase text-xs tracking-widest group shadow-sm bg-red-500/10 border border-red-500/20"><LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/> Déconnexion</button>
            </div>
          </aside>
      </>
      )}

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {user.role === 'admin' && (
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 p-4 flex lg:hidden items-center justify-between sticky top-0 z-[900] shadow-sm">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"><Menu size={24} /></button>
                <span className="font-black uppercase tracking-tighter text-slate-900">Aerothau Admin</span>
                <div className="w-10"></div>
            </header>
        )}

        <div className="flex-1 overflow-auto custom-scrollbar relative" id="main-scroll-container">
          <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10">
            {user.role === "admin" ? (
              <>
                {view === "dashboard" && <AdminDashboard interventions={interventions} clients={clients} markers={markers} />}
                {view === "map" && <MapInterface markers={markers} clients={clients} onUpdateNest={async (n) => updateFirebase("markers", n)} onDeleteNest={async (n) => deleteFromFirebase("markers", n.id)} />}
                {view === "nests" && <NestManagement markers={markers} clients={clients} onUpdateNest={async (n) => updateFirebase("markers", n)} onDeleteNest={async (n) => deleteFromFirebase("markers", n.id)} onDeleteAllNests={async () => {
                    if (window.confirm("⚠️ ACTION IRRÉVERSIBLE : Supprimer absolument TOUS les nids de la base ?")) {
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

      {/* CSS GLOBAL POUR SCROLLBAR ET ICONES */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px;}
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; border: 2px solid transparent; background-clip: padding-box; }
        .custom-icon { display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
}