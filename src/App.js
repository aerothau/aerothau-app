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
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  Users,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
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
  Mail,
  Home,
  Map as MapIcon,
  Crosshair,
  Edit,
  Save,
  Trash2,
  File,
  Lock,
  Key,
  User,
  Clock,
  Send,
  Loader2,
  Bell,
  Info,
  Printer,
  Grid,
  List as ListIcon,
  Locate,
  Layers,
  Camera,
  Image as ImageIcon,
  MessageSquare,
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
const LOGO_URL =
  "https://aerothau.fr/wp-content/uploads/2025/10/New-Logo-Aerothau.png";

// --- DONNÉES DE DÉMONSTRATION ---
const INITIAL_USERS = [
  {
    username: "admin",
    password: "aerothau2024",
    role: "admin",
    name: "Aerothau Admin",
    id: 0,
  },
];

const MOCK_CLIENTS = [
  {
    id: 1,
    name: "Mairie de Sète",
    type: "Collectivité",
    address: "12 Rue de l'Hôtel de Ville, 34200 Sète",
    contact: "Jean Dupont",
    phone: "04 67 00 00 00",
    email: "contact@sete.fr",
    username: "mairie",
    password: "123",
    documents: [],
  },
  {
    id: 2,
    name: "Camping Les Flots Bleus",
    type: "Privé",
    address: "Route de la Corniche, 34200 Sète",
    contact: "Marie Martin",
    phone: "06 12 34 56 78",
    email: "info@flotsbleus.com",
    username: "camping",
    password: "123",
    documents: [],
  },
  {
    id: 3,
    name: "Résidence Le Phare",
    type: "Syndic",
    address: "5 Quai de la Marine, 34200 Sète",
    contact: "Syndic Agence",
    phone: "04 99 99 99 99",
    email: "syndic@agence.com",
    username: "syndic",
    password: "123",
    documents: [],
  },
];

const MOCK_INTERVENTIONS = [
  {
    id: 101,
    clientId: 1,
    date: "2024-04-15",
    status: "Terminé",
    nests: 12,
    eggs: 34,
    notes: "Passage drone effectué.",
    technician: "Thomas",
  },
  {
    id: 102,
    clientId: 2,
    date: "2024-04-16",
    status: "Terminé",
    nests: 4,
    eggs: 10,
    notes: "Accès difficile toiture restaurant.",
    technician: "Julie",
  },
  {
    id: 103,
    clientId: 3,
    date: "2024-05-20",
    status: "Planifié",
    nests: 0,
    eggs: 0,
    notes: "Vérification annuelle.",
    technician: "Marc",
  },
];

const MOCK_MARKERS = [
  {
    id: 1,
    clientId: 1,
    lat: 43.4025,
    lng: 3.695,
    address: "12 Quai de la Marine, 34200 Sète",
    status: "sterilized_2",
    eggs: 3,
    notes: "Toit Principal",
  },
  {
    id: 2,
    clientId: 2,
    lat: 43.4035,
    lng: 3.697,
    address: "45 Route de la Corniche, 34200 Sète",
    status: "present",
    eggs: 0,
    notes: "Corniche Est",
  },
];

const MOCK_REPORTS = [
  {
    id: 1,
    clientId: 1,
    title: "Rapport Intervention #101",
    client: "Mairie de Sète",
    date: "2024-04-16",
    type: "Intervention",
    status: "Envoyé",
  },
];

// --- COMPOSANTS UI DE BASE ---

function Button({ children, variant = "primary", className = "", ...props }) {
  const baseStyle =
    "px-4 py-2 rounded-lg font-bold transition-all active:scale-95 flex items-center gap-2 justify-center";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary:
      "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700",
    outline: "border border-slate-300 text-slate-600 hover:bg-slate-50",
    purple: "bg-purple-600 text-white hover:bg-purple-700",
    ghost: "text-slate-500 hover:bg-slate-100 border-transparent",
  };
  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}
    >
      {children}
    </div>
  );
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
    reported_by_client:
      "bg-purple-100 text-purple-700 border border-purple-200",
    Envoyé: "bg-green-100 text-green-700",
    Brouillon: "bg-slate-200 text-slate-700",
    Archivé: "bg-gray-100 text-gray-500",
    Signé: "bg-blue-100 text-blue-700",
  };
  const labels = {
    Terminé: "Terminé",
    Planifié: "Planifié",
    "En attente": "En attente",
    Annulé: "Annulé",
    non_present: "Non présent",
    present: "Présent",
    sterilized_1: "Stérilisé (1er)",
    sterilized_2: "Stérilisé (2ème)",
    sterilized: "Stérilisé",
    reported_by_client: "Signalement Client",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

// --- FORMULAIRES ---

function ClientReportForm({ nest, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    ...nest,
    ownerContact: "",
    description: "",
    status: "reported_by_client",
  });
  return (
    <div className="space-y-4">
      <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-purple-800 text-sm flex gap-2">
        <Info size={18} className="shrink-0" />
        <p>Signalement en cours pour Aerothau.</p>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Adresse
        </label>
        <div className="bg-slate-100 p-3 mt-1 rounded-lg text-sm text-slate-600 flex items-center gap-2">
          <MapPin size={16} className="text-purple-500" /> {formData.address}
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Contact
        </label>
        <input
          type="text"
          placeholder="Nom ou téléphone..."
          className="w-full mt-1 p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
          value={formData.ownerContact}
          onChange={(e) =>
            setFormData({ ...formData, ownerContact: e.target.value })
          }
        />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Détails
        </label>
        <textarea
          placeholder="Description du lieu..."
          className="w-full mt-1 p-2 border rounded-lg text-sm resize-none outline-none focus:ring-2 focus:ring-purple-500"
          rows="3"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 justify-center"
        >
          Annuler
        </Button>
        <Button
          variant="purple"
          onClick={() => onSave(formData)}
          className="flex-1 justify-center"
        >
          <Send size={16} /> Envoyer
        </Button>
      </div>
    </div>
  );
}

function ClientEditForm({ client, onSave, onCancel }) {
  const [formData, setFormData] = useState({ ...client });
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Nom
        </label>
        <input
          type="text"
          className="w-full p-2 mt-1 border rounded-lg"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Type
        </label>
        <select
          className="w-full p-2 mt-1 border rounded-lg bg-white"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="Collectivité">Collectivité</option>
          <option value="Privé">Privé</option>
          <option value="Syndic">Syndic</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Adresse
        </label>
        <input
          type="text"
          className="w-full p-2 mt-1 border rounded-lg"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
        />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Contact
        </label>
        <input
          type="text"
          className="w-full p-2 mt-1 border rounded-lg"
          value={formData.contact}
          onChange={(e) =>
            setFormData({ ...formData, contact: e.target.value })
          }
        />
      </div>

      <h4 className="font-bold text-sm text-slate-800 border-b pb-1 mb-2 mt-4">
        Accès Espace Client
      </h4>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Identifiant
        </label>
        <input
          type="text"
          className="w-full p-2 mt-1 border rounded-lg bg-slate-50 focus:bg-white transition-colors"
          placeholder="ex: mairie34"
          value={formData.username || ""}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
        />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Mot de passe
        </label>
        <input
          type="text"
          className="w-full p-2 mt-1 border rounded-lg bg-slate-50 focus:bg-white transition-colors"
          placeholder="Définir un mot de passe"
          value={formData.password || ""}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 justify-center"
        >
          Annuler
        </Button>
        <Button
          variant="success"
          onClick={() => onSave(formData)}
          className="flex-1 justify-center"
        >
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}

function InterventionEditForm({
  intervention,
  clients,
  onSave,
  onDelete,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    clientId: clients[0]?.id,
    status: "Planifié",
    technician: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    ...intervention,
  });

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Client
        </label>
        <select
          className="w-full p-2 mt-1 border rounded-lg bg-white focus:ring-2 focus:ring-sky-500 outline-none"
          value={formData.clientId}
          onChange={(e) =>
            setFormData({ ...formData, clientId: parseInt(e.target.value) })
          }
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">
            Date
          </label>
          <input
            type="date"
            className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">
            Technicien
          </label>
          <input
            type="text"
            placeholder="Nom..."
            className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            value={formData.technician || ""}
            onChange={(e) =>
              setFormData({ ...formData, technician: e.target.value })
            }
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Statut
        </label>
        <select
          className="w-full p-2 mt-1 border rounded-lg bg-white focus:ring-2 focus:ring-sky-500 outline-none"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="Planifié">Planifié</option>
          <option value="En attente">En attente</option>
          <option value="Terminé">Terminé</option>
          <option value="Annulé">Annulé</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Notes
        </label>
        <textarea
          rows="3"
          className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none"
          placeholder="Détails de l'intervention..."
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <div className="flex gap-2 pt-4">
        {onDelete && (
          <Button variant="danger" onClick={() => onDelete(formData)}>
            <Trash2 size={18} />
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 justify-center"
        >
          Annuler
        </Button>
        <Button
          variant="success"
          onClick={() => onSave(formData)}
          className="flex-1 justify-center"
        >
          <Save size={18} /> Sauver
        </Button>
      </div>
    </div>
  );
}

function NestEditForm({
  nest,
  clients = [],
  onSave,
  onCancel,
  readOnly = false,
}) {
  const [formData, setFormData] = useState({
    title: "",
    comments: "",
    ...nest,
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData({ ...formData, photo: null });
  };

  if (readOnly)
    return (
      <div className="space-y-3">
        {nest.photo && (
          <div className="w-full h-32 rounded-lg bg-slate-100 overflow-hidden mb-2">
            <img
              src={nest.photo}
              alt="Nid"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            {nest.title && (
              <h4 className="font-bold text-slate-800 text-sm mb-1">
                {nest.title}
              </h4>
            )}
            <div className="flex items-center gap-2">
              <Badge status={nest.status} />
              <span className="text-xs font-mono text-slate-400">
                #{nest.id.toString().slice(-4)}
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm font-medium text-slate-800 flex items-start gap-2">
          <MapPin size={16} className="text-slate-400 mt-1 shrink-0" />{" "}
          {nest.address}
        </p>
        {nest.clientId && clients.length > 0 && (
          <p className="text-xs text-sky-600 bg-sky-50 px-2 py-1 rounded border border-sky-100 inline-block">
            Client:{" "}
            {clients.find((c) => c.id === nest.clientId)?.name || "Inconnu"}
          </p>
        )}
        {nest.comments && (
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <MessageSquare size={12} />{" "}
              <span className="uppercase font-bold text-[10px]">
                Commentaire
              </span>
            </div>
            {nest.comments}
          </div>
        )}
      </div>
    );
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
          Photo du nid
        </label>
        {formData.photo ? (
          <div className="relative w-full h-40 bg-slate-100 rounded-lg overflow-hidden group border border-slate-200">
            <img
              src={formData.photo}
              alt="Aperçu"
              className="w-full h-full object-cover"
            />
            <button
              onClick={removePhoto}
              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
              title="Supprimer la photo"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="nest-photo-upload"
              onChange={handlePhotoUpload}
            />
            <label
              htmlFor="nest-photo-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Camera size={24} className="text-slate-400 mb-2" />
              <span className="text-sm text-slate-600 font-medium">
                Ajouter une photo
              </span>
              <span className="text-xs text-slate-400 mt-1">JPG, PNG</span>
            </label>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Titre
        </label>
        <input
          type="text"
          className="w-full p-2 mt-1 border rounded-lg text-sm"
          placeholder="Ex: Nid Toiture Nord"
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Adresse
        </label>
        <textarea
          rows="2"
          className="w-full p-2 mt-1 border rounded-lg text-sm resize-none"
          value={formData.address || ""}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Client Associé
        </label>
        <select
          className="w-full p-2 mt-1 border rounded-lg bg-white"
          value={formData.clientId || ""}
          onChange={(e) =>
            setFormData({ ...formData, clientId: parseInt(e.target.value) })
          }
        >
          <option value="">-- Aucun --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">
            Latitude
          </label>
          <input
            type="text"
            disabled
            className="w-full p-2 mt-1 border rounded-lg bg-slate-50 text-xs text-slate-500"
            value={formData.lat ? formData.lat.toFixed(6) : ""}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">
            Longitude
          </label>
          <input
            type="text"
            disabled
            className="w-full p-2 mt-1 border rounded-lg bg-slate-50 text-xs text-slate-500"
            value={formData.lng ? formData.lng.toFixed(6) : ""}
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Statut
        </label>
        <select
          className="w-full p-2 mt-1 border rounded-lg bg-white"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="present">Présent</option>
          <option value="sterilized_1">Stérilisé 1er passage</option>
          <option value="sterilized_2">Stérilisé 2ème passage</option>
          <option value="reported_by_client">Signalement</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Oeufs
        </label>
        <input
          type="number"
          className="w-full p-2 mt-1 border rounded-lg"
          value={formData.eggs}
          onChange={(e) =>
            setFormData({ ...formData, eggs: parseInt(e.target.value) })
          }
        />
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">
          Commentaire
        </label>
        <textarea
          rows="3"
          className="w-full p-2 mt-1 border rounded-lg text-sm resize-none"
          placeholder="Observations, accès, détails..."
          value={formData.comments || ""}
          onChange={(e) =>
            setFormData({ ...formData, comments: e.target.value })
          }
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 justify-center text-sm"
        >
          Fermer
        </Button>
        <Button
          variant="success"
          onClick={() => onSave(formData)}
          className="flex-1 justify-center text-sm"
        >
          Sauver
        </Button>
      </div>
    </div>
  );
}

// --- CARTOGRAPHIE ---

function LeafletMap({
  markers,
  isAddingMode,
  onMapClick,
  onMarkerClick,
  center,
  zoom,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [mapType, setMapType] = useState("satellite");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initMap = () => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const L = window.L;
    // Default Sète
    const map = L.map(mapContainerRef.current).setView([43.4028, 3.696], 16);
    mapInstanceRef.current = map;

    // Auto-locate
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 18);
        },
        (err) => {
          console.log("Géolocalisation refusée ou indisponible", err);
        }
      );
    }

    markersLayerRef.current = L.layerGroup().addTo(map);
    // Note: click listener is handled by useEffect below to avoid stale closures
    updateTileLayer(map, "satellite");
    updateMarkers(L);
  };

  // Click Listener Management
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handler = (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    };

    map.off("click");
    map.on("click", handler);

    return () => {
      map.off("click", handler);
    };
  }, [onMapClick]); // Critical: re-bind when onMapClick (and thus isAddingMode) changes

  const updateTileLayer = (map, type) => {
    const L = window.L;
    if (!L) return;
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    if (type === "satellite")
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri" }
      ).addTo(map);
    else
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OSM",
      }).addTo(map);
  };

  const updateMarkers = (L) => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    markers.forEach((marker) => {
      let color;
      const isPurple = marker.status === "reported_by_client";
      const isTemp = marker.status === "temp";
      switch (marker.status) {
        case "sterilized_1":
          color = "#84cc16"; // Lime Green (Passage 1)
          break;
        case "sterilized_2":
        case "sterilized": // Fallback for legacy
          color = "#22c55e"; // Full Green (Passage 2)
          break;
        case "reported_by_client":
          color = "#a855f7"; // Purple
          break;
        case "present":
          color = "#ef4444"; // Red
          break;
        case "temp":
          color = "#94a3b8"; // Slate (Gris)
          break;
        default:
          color = "#64748b"; // Slate
          break;
      }
      const customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; ${
          isPurple ? "animation: pulse-purple 2s infinite;" : ""
        } ${
          isTemp ? "animation: pulse-grey 2s infinite; border: 2px dashed white;" : ""
        }"><div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: customIcon,
      });
      leafletMarker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onMarkerClick(marker);
      });
      leafletMarker.addTo(markersLayerRef.current);
    });
  };

  useEffect(() => {
    if (window.L) updateMarkers(window.L);
  }, [markers]);
  useEffect(() => {
    if (window.L && mapInstanceRef.current)
      updateTileLayer(mapInstanceRef.current, mapType);
  }, [mapType]);
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom || 18);
    }
  }, [center, zoom]);

  const handleLocate = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstanceRef.current.setView([latitude, longitude], 18);
        },
        (error) => {
          console.error("Error getting location", error);
        }
      );
    }
  };

  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden shadow-inner border border-slate-300 bg-slate-100 ${
        isAddingMode ? "cursor-crosshair" : ""
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-md p-1 flex">
          <button
            onClick={() => setMapType("satellite")}
            className={`px-3 py-1 text-xs font-bold rounded ${
              mapType === "satellite"
                ? "bg-slate-800 text-white"
                : "text-slate-600"
            }`}
          >
            Sat
          </button>
          <button
            onClick={() => setMapType("plan")}
            className={`px-3 py-1 text-xs font-bold rounded ${
              mapType === "plan" ? "bg-slate-800 text-white" : "text-slate-600"
            }`}
          >
            Plan
          </button>
        </div>
        <button
          onClick={handleLocate}
          className="bg-white p-2 rounded-lg shadow-md text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors flex items-center justify-center"
          title="Ma position"
        >
          <Locate size={18} />
        </button>
      </div>

      <style>{`
        @keyframes pulse-purple { 0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); } 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); } }
        @keyframes pulse-grey { 0% { box-shadow: 0 0 0 0 rgba(148, 163, 184, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(148, 163, 184, 0); } 100% { box-shadow: 0 0 0 0 rgba(148, 163, 184, 0); } }
      `}</style>
    </div>
  );
}

// --- PAGES / SOUS-COMPOSANTS ---

function LoginForm({ onLogin, users, logoUrl }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    const userFound = users.find(
      (u) => u.username === username && u.password === password
    );
    if (userFound) onLogin(userFound);
    else setError("Identifiants invalides.");
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-8">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-24 w-auto object-contain"
            />
          ) : (
            <Plane size={48} className="text-sky-600" />
          )}
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-tighter">
            Aerothau<span className="text-sky-600">.</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-2">
            Espace de Gestion Sécurisé
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              placeholder="Identifiant"
            />
          </div>
          <div className="relative">
            <Key
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          <button
            type="submit"
            className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
          >
            Se connecter
          </button>
        </form>
        
        {/* Lien retour vers le site principal */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <a 
            href={MAIN_WEBSITE_URL} 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-sky-600 uppercase tracking-widest transition-colors"
          >
            <ChevronLeft size={14} /> Retour au site Aerothau.fr
          </a>
        </div>
      </div>
    </div>
  );
}

function ReportDetail({
  report,
  client,
  interventions,
  markers,
  onSave,
  onCancel,
}) {
  const [reportData, setReportData] = useState({ ...report });
  const totalNests = markers.length;
  const sterilizedNests = markers.filter(
    (m) =>
      m.status === "sterilized_1" ||
      m.status === "sterilized_2" ||
      m.status === "sterilized"
  ).length;
  const totalEggs = markers.reduce((acc, curr) => acc + curr.eggs, 0);
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <style>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }
          /* Unhide the report and its children */
          #printable-report, #printable-report * {
            visibility: visible;
          }
          /* Position the report at the top-left of the page */
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20mm !important; /* Keep padding for A4 look */
            background: white;
            z-index: 9999;
            box-shadow: none;
          }
          /* Important: Force ancestors to allow scrolling/printing full height */
          html, body, #root, .fixed, .overflow-hidden {
            overflow: visible !important;
            height: auto !important;
            position: static !important; /* Break fixed positioning context */
          }
          /* Hide buttons specifically to be sure */
          button {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-800"
          >
            <X size={24} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {reportData.title}
            </h2>
            <p className="text-xs text-slate-500">{reportData.date}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={16} /> Imprimer
          </Button>
          <Button variant="primary" onClick={() => onSave(reportData)}>
            <Save size={16} /> Enregistrer
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 flex justify-center print:p-0">
        <div
          id="printable-report"
          className="bg-white shadow-lg w-[210mm] min-h-[297mm] p-[20mm] flex flex-col gap-8 text-slate-800"
        >
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6">
            <div className="flex flex-col">
              <span className="text-3xl font-bold tracking-tighter text-slate-900 uppercase">
                Aerothau
              </span>
              <span className="text-sm font-medium text-slate-500">
                Stérilisation de goélands
              </span>
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold uppercase">{reportData.type}</h1>
              <p className="text-sm text-slate-500">Date: {reportData.date}</p>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
              Client
            </h3>
            <div className="text-lg font-bold text-slate-900">
              {client.name}
            </div>
            <div className="text-slate-600">{client.address}</div>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase border-b pb-2 mb-4">
              Synthèse
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded text-center">
                <div className="text-2xl font-bold text-sky-600">
                  {totalNests}
                </div>
                <div className="text-[10px] uppercase">Nids</div>
              </div>
              <div className="p-4 border rounded text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sterilizedNests}
                </div>
                <div className="text-[10px] uppercase">Neutralisés</div>
              </div>
              <div className="p-4 border rounded text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {totalEggs}
                </div>
                <div className="text-[10px] uppercase">Oeufs</div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase border-b pb-2 mb-4">
              Détails Nids
            </h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2">Adresse</th>
                  <th className="p-2">État</th>
                  <th className="p-2 text-right">Oeufs</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {markers.map((m) => (
                  <tr key={m.id}>
                    <td className="p-2">{m.address}</td>
                    <td className="p-2">{m.status}</td>
                    <td className="p-2 text-right font-bold">{m.eggs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-auto pt-8 border-t text-xs text-slate-400 flex justify-between">
            <div>Aerothau Gestion - Document officiel</div>
            <div>Page 1/1</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientDetail({
  selectedClient,
  setView,
  interventions,
  clients,
  users,
  onUpdateClient,
  onDeleteClient,
  reports,
  onUpdateReport,
  markers,
  onUpdateIntervention,
}) {
  const [isClientEditing, setIsClientEditing] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const clientInterventions = interventions.filter(
    (i) => i.clientId === selectedClient.id
  );
  const clientReports = reports.filter((r) => r.clientId === selectedClient.id);
  const clientMarkers = markers.filter((m) => m.clientId === selectedClient.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Button
        variant="secondary"
        onClick={() => setView("clients")}
        className="mb-4"
      >
        &larr; Retour
      </Button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            {isClientEditing ? (
              <ClientEditForm
                client={selectedClient}
                onSave={(d) => {
                  onUpdateClient(d);
                  setIsClientEditing(false);
                }}
                onCancel={() => setIsClientEditing(false)}
              />
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                  {selectedClient.name}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Adresse
                    </label>
                    <p className="text-sm text-slate-700 flex gap-2 mt-1">
                      <MapPin size={16} /> {selectedClient.address}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Contact
                    </label>
                    <p className="text-sm text-slate-700 mt-1 font-medium">
                      {selectedClient.contact}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
                    Accès Application
                  </h3>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Identifiant :</span>
                      <span className="font-mono font-bold text-slate-700">
                        {selectedClient.username || "Non défini"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Mot de passe :</span>
                      <span className="font-mono font-bold text-slate-700">
                        {selectedClient.password || "Non défini"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => setIsClientEditing(true)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full justify-center"
                    onClick={() => {
                      if (window.confirm("Supprimer ce client ?"))
                        onDeleteClient(selectedClient);
                    }}
                  >
                    <Trash2 size={16} /> Supprimer
                  </Button>
                </div>
              </>
            )}
          </Card>
          <Card className="p-6">
            <h3 className="font-bold mb-4">Rapports Client</h3>
            <div className="space-y-2">
              {clientReports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setViewingReport(r)}
                  className="p-3 bg-slate-50 border rounded-lg cursor-pointer hover:bg-slate-100 flex justify-between items-center"
                >
                  <span className="text-sm font-medium">{r.title}</span>
                  <ChevronRight size={16} />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 h-full flex flex-col">
            <h3 className="font-bold mb-4">Historique Interventions</h3>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4">Nids</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {clientInterventions.map((i) => (
                    <tr key={i.id}>
                      <td className="p-4">{i.date}</td>
                      <td className="p-4">
                        <Badge status={i.status} />
                      </td>
                      <td className="p-4 font-bold">{i.nests || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden">
            <ReportDetail
              report={viewingReport}
              client={selectedClient}
              interventions={clientInterventions}
              markers={clientMarkers}
              onSave={onUpdateReport}
              onCancel={() => setViewingReport(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsView({
  clients,
  reports,
  setReports,
  interventions,
  markers,
  onUpdateReport,
}) {
  const [viewingReport, setViewingReport] = useState(null);
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold">Rapports d'Activité</h2>
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
            <tr>
              <th className="p-4">Document</th>
              <th className="p-4">Client</th>
              <th className="p-4">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reports.map((r) => (
              <tr
                key={r.id}
                onClick={() => setViewingReport(r)}
                className="hover:bg-slate-50 cursor-pointer"
              >
                <td className="p-4 font-medium">{r.title}</td>
                <td className="p-4">{r.client}</td>
                <td className="p-4">
                  <Badge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden">
            <ReportDetail
              report={viewingReport}
              client={
                clients.find((c) => c.id === viewingReport.clientId) || {}
              }
              interventions={interventions.filter(
                (i) => i.clientId === viewingReport.clientId
              )}
              markers={markers.filter(
                (m) => m.clientId === viewingReport.clientId
              )}
              onSave={onUpdateReport}
              onCancel={() => setViewingReport(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ClientSpace({ user, interventions, markers, clients, onUpdateNest }) {
  const myId = user.clientId;
  const myMarkers = markers.filter((m) => m.clientId === myId);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);

  // --- Données Essentielles Calculées ---
  const sterilizedCount = myMarkers.filter(
    (m) => m.status === "sterilized_2" || m.status === "sterilized"
  ).length;
  const activeCount = myMarkers.filter((m) => m.status === "present").length;

  const onMapClick = async (latlng) => {
    if (!isAddingMode) {
      setSelectedMarker(null);
      return;
    }
    let detectedAddress = "Position sélectionnée";
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await response.json();
      if (data && data.display_name)
        detectedAddress = data.display_name.split(",").slice(0, 3).join(",");
    } catch (e) {}
    setPendingReport({
      id: Date.now(),
      clientId: myId,
      lat: latlng.lat,
      lng: latlng.lng,
      address: detectedAddress,
      eggs: 0,
      notes: "",
      status: "reported_by_client",
    });
    setIsAddingMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 tracking-tight">
            Bonjour, {user.name}
          </h2>
          <p className="text-purple-100">
            Bienvenue sur votre espace de suivi. Voici la situation de votre
            site.
          </p>
        </div>
        <Bell className="absolute -right-8 -bottom-8 h-48 w-48 text-white/10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MapIcon size={20} className="text-purple-500" /> Cartographie
                des Nids
              </h3>
              {isAddingMode && (
                <span className="text-xs font-bold text-purple-600 animate-pulse bg-purple-50 px-2 py-1 rounded">
                  Cliquez sur la carte pour positionner le nid
                </span>
              )}
            </div>
            <div className="h-[500px] rounded-xl overflow-hidden border flex-1 relative">
              <LeafletMap
                markers={myMarkers}
                isAddingMode={isAddingMode}
                onMapClick={onMapClick}
                onMarkerClick={setSelectedMarker}
              />
              {selectedMarker && (
                <div className="absolute top-4 left-4 z-[500] w-72 md:w-80 max-h-[calc(100%-2rem)] flex flex-col">
                  <Card className="shadow-2xl border-0 flex flex-col max-h-full overflow-hidden">
                    <div className="bg-slate-800 p-3 text-white flex justify-between items-center rounded-t-xl shrink-0">
                      <span className="font-bold text-sm">Détails Nid</span>
                      <button
                        onClick={() => setSelectedMarker(null)}
                        className="hover:bg-white/20 p-1 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="p-4 overflow-y-auto">
                      <NestEditForm nest={selectedMarker} readOnly={true} />
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          {/* État du Site (Compact) */}
          <Card className="p-4 border-l-4 border-l-emerald-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 shrink-0">
                <CheckCircle size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                  État du parc
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-bold text-slate-900 text-lg">
                      {sterilizedCount}/{myMarkers.length}
                    </p>
                    <p className="text-xs text-slate-500">Nids neutralisés</p>
                  </div>
                  {activeCount > 0 && (
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                      {activeCount} Actifs
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Liste des Nids */}
          <Card className="p-6 flex flex-col max-h-[400px]">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex justify-between items-center">
              Liste des Nids
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                Total: {myMarkers.length}
              </span>
            </h3>
            <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {myMarkers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 italic text-sm">
                  Aucun nid recensé pour le moment.
                </div>
              ) : (
                myMarkers.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMarker(m)}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p
                        className="text-sm font-medium text-slate-800 truncate group-hover:text-purple-700 transition-colors"
                        title={m.address}
                      >
                        {m.address}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {m.eggs > 0 ? `${m.eggs} oeufs` : "0 oeuf"}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Badge status={m.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Action Button */}
          <Button
            variant={isAddingMode ? "danger" : "purple"}
            className="w-full justify-center h-12 shadow-md"
            onClick={() => setIsAddingMode(!isAddingMode)}
          >
            {isAddingMode ? (
              <>
                <X size={20} /> Annuler
              </>
            ) : (
              <>
                <Plus size={20} /> Signaler un nid
              </>
            )}
          </Button>
        </div>
      </div>
      {pendingReport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold">Nouveau Signalement</h3>
              <button onClick={() => setPendingReport(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <ClientReportForm
                nest={pendingReport}
                onSave={async (d) => {
                  await onUpdateNest(d);
                  setPendingReport(null);
                }}
                onCancel={() => setPendingReport(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ interventions, clients, markers, setView }) {
  const stats = {
    total: markers.length,
    neutralized: markers.filter(
      (m) =>
        m.status === "sterilized_1" ||
        m.status === "sterilized_2" ||
        m.status === "sterilized"
    ).length,
    pending: interventions.filter((i) => i.status === "Planifié").length,
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-slate-800">
          Tableau de Bord
        </h2>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-sky-600 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-80 uppercase font-bold">
                  Total Nids
                </p>
                <p className="text-4xl font-black mt-1">{stats.total}</p>
              </div>
              <Bird className="opacity-20" size={32} />
            </div>
          </Card>
          <Card className="p-6 bg-emerald-600 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-80 uppercase font-bold">
                  Neutralisés
                </p>
                <p className="text-4xl font-black mt-1">{stats.neutralized}</p>
              </div>
              <CheckCircle className="opacity-20" size={32} />
            </div>
          </Card>
          <Card className="p-6 bg-orange-600 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-80 uppercase font-bold">
                  Interventions
                </p>
                <p className="text-4xl font-black mt-1">{stats.pending}</p>
              </div>
              <Calendar className="opacity-20" size={32} />
            </div>
          </Card>
        </div>
      </div>

      {/* Per Client Stats */}
      <div>
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Users size={20} className="text-sky-600" />
          Situation par Client
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => {
            const clientMarkers = markers.filter(
              (m) => m.clientId === client.id
            );
            const total = clientMarkers.length;
            const neutralized = clientMarkers.filter(
              (m) =>
                m.status === "sterilized_1" ||
                m.status === "sterilized_2" ||
                m.status === "sterilized"
            ).length;
            const pending = interventions.filter(
              (i) => i.clientId === client.id && i.status === "Planifié"
            ).length;
            const progress = total > 0 ? (neutralized / total) * 100 : 0;

            return (
              <Card
                key={client.id}
                className="hover:shadow-md transition-all cursor-pointer border-slate-200"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4
                        className="font-bold text-lg text-slate-800 line-clamp-1"
                        title={client.name}
                      >
                        {client.name}
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {client.type}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progression stérilisation</span>
                        <span className="font-bold">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                        <span className="block font-bold text-slate-700">
                          {total}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          Nids
                        </span>
                      </div>
                      <div className="bg-orange-50 p-2 rounded border border-orange-100 text-center text-orange-700">
                        <span className="block font-bold">{pending}</span>
                        <span className="text-[10px] opacity-80 uppercase">
                          À planifier
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4 text-slate-800">Activité Récente</h3>
          <div className="divide-y">
            {interventions.slice(0, 5).map((i) => (
              <div
                key={i.id}
                className="py-3 flex justify-between items-center"
              >
                <div className="text-sm">
                  <p className="font-bold">
                    {clients.find((c) => c.id === i.clientId)?.name}
                  </p>
                  <p className="text-xs text-slate-500">{i.date}</p>
                </div>
                <Badge status={i.status} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold mb-4 text-slate-800">
            Derniers signalements
          </h3>
          <div className="divide-y">
            {markers
              .filter((m) => m.status === "reported_by_client")
              .slice(0, 5)
              .map((m) => (
                <div
                  key={m.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div className="text-sm">
                    <p className="font-medium truncate max-w-xs">{m.address}</p>
                    <p className="text-[10px] text-slate-400">
                      {clients.find((c) => c.id === m.clientId)?.name ||
                        "Inconnu"}
                    </p>
                  </div>
                  <Badge status={m.status} />
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function NestManagement({
  markers,
  setView,
  onUpdateNest,
  onDeleteNest,
  clients,
}) {
  const [selectedNest, setSelectedNest] = useState(null);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestion des Nids</h2>
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
            <tr>
              <th className="p-4">Adresse</th>
              <th className="p-4">Status</th>
              <th className="p-4">Oeufs</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {markers.map((m) => (
              <tr key={m.id}>
                <td className="p-4">{m.address}</td>
                <td className="p-4">
                  <Badge status={m.status} />
                </td>
                <td className="p-4 font-bold">{m.eggs}</td>
                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => setSelectedNest(m)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Supprimer ce nid ?")) onDeleteNest(m);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {selectedNest && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Modifier Nid</h3>
            <NestEditForm
              nest={selectedNest}
              clients={clients}
              onSave={async (d) => {
                await onUpdateNest(d);
                setSelectedNest(null);
              }}
              onCancel={() => setSelectedNest(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleView({
  interventions,
  clients,
  onUpdateIntervention,
  onDeleteIntervention,
}) {
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar' | 'list'
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTech, setFilterTech] = useState("all");

  // --- Helpers pour le calendrier ---
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    // 0 = Sunday, 1 = Monday... adjust so Monday is first
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const filteredInterventions = interventions.filter((i) => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (
      filterTech !== "all" &&
      i.technician?.toLowerCase() !== filterTech.toLowerCase()
    )
      return false;
    return true;
  });

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);

    const days = [];
    // Empty cells for days before start of month
    for (let i = 0; i < startDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-32 bg-slate-50 border-b border-r border-slate-100"
        ></div>
      );
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const dayInterventions = filteredInterventions.filter(
        (i) => i.date === dateStr
      );
      const isToday = new Date().toISOString().split("T")[0] === dateStr;

      days.push(
        <div
          key={day}
          onClick={() => {
            setEditingIntervention({
              id: Date.now(),
              date: dateStr,
              status: "Planifié",
              clientId: clients[0]?.id,
            });
            setIsCreating(true);
          }}
          className={`h-32 border-b border-r border-slate-100 p-2 relative group hover:bg-sky-50 transition-colors cursor-pointer ${
            isToday ? "bg-sky-50" : "bg-white"
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span
              className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                isToday ? "bg-sky-600 text-white" : "text-slate-500"
              }`}
            >
              {day}
            </span>
            {dayInterventions.length > 0 && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded-full">
                {dayInterventions.length}
              </span>
            )}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
            {dayInterventions.map((i) => {
              const clientName =
                clients.find((c) => c.id === i.clientId)?.name || "Client";
              let dotColor = "bg-slate-400";
              if (i.status === "Terminé") dotColor = "bg-green-500";
              if (i.status === "Planifié") dotColor = "bg-blue-500";
              if (i.status === "En attente") dotColor = "bg-orange-500";

              return (
                <div
                  key={i.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingIntervention(i);
                    setIsCreating(false);
                  }}
                  className="text-xs p-1 rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center gap-1.5 truncate"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}
                  />
                  <span className="truncate text-slate-700 font-medium">
                    {clientName}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus size={14} className="text-sky-600" />
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="text-sky-600" /> Planning
          </h2>
          <p className="text-slate-500 text-sm">
            Gérez les interventions de vos équipes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filters */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border rounded-lg text-sm bg-slate-50 border-slate-200 outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="Planifié">Planifié</option>
            <option value="Terminé">Terminé</option>
            <option value="En attente">En attente</option>
          </select>

          <select
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
            className="p-2 border rounded-lg text-sm bg-slate-50 border-slate-200 outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Tous les techniciens</option>
            <option value="Thomas">Thomas</option>
            <option value="Julie">Julie</option>
            <option value="Marc">Marc</option>
          </select>

          {/* View Toggles */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "calendar"
                  ? "bg-white shadow text-sky-600"
                  : "text-slate-500"
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-white shadow text-sky-600"
                  : "text-slate-500"
              }`}
            >
              <ListIcon size={18} />
            </button>
          </div>

          <Button
            onClick={() => {
              setEditingIntervention(null);
              setIsCreating(true);
            }}
          >
            <Plus size={16} />{" "}
            <span className="hidden sm:inline">Nouvelle</span>
          </Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-600"
              >
                <ChevronLeft />
              </button>
              <h3 className="text-lg font-bold text-slate-800 w-32 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-600"
              >
                <ChevronRight />
              </button>
            </div>
            <div className="text-xs font-medium text-slate-400">
              {filteredInterventions.length} intervention(s)
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 flex-1 overflow-y-auto">
            {renderCalendar()}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInterventions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <p className="text-slate-500">Aucune intervention trouvée.</p>
            </div>
          ) : (
            filteredInterventions
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((i) => (
                <Card
                  key={i.id}
                  className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div
                      className={`p-3 rounded-lg shrink-0 ${
                        i.status === "Terminé"
                          ? "bg-green-50 text-green-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      <Calendar size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold truncate">
                        {clients.find((c) => c.id === i.clientId)?.name ||
                          "Client inconnu"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {i.date}
                        </span>
                        {i.technician && (
                          <span className="flex items-center gap-1">
                            <User size={12} /> {i.technician}
                          </span>
                        )}
                      </div>
                      {i.notes && (
                        <p className="text-xs text-slate-400 mt-1 truncate">
                          {i.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <Badge status={i.status} />
                    <button
                      onClick={() => {
                        setEditingIntervention(i);
                        setIsCreating(false);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                </Card>
              ))
          )}
        </div>
      )}

      {(editingIntervention || isCreating) && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-slate-800">
                {isCreating && !editingIntervention?.id
                  ? "Nouvelle Intervention"
                  : "Modifier Intervention"}
              </h3>
              <button
                onClick={() => {
                  setEditingIntervention(null);
                  setIsCreating(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <InterventionEditForm
              intervention={
                editingIntervention || {
                  id: Date.now(),
                  date: new Date().toISOString().split("T")[0],
                  status: "Planifié",
                  clientId: clients[0]?.id,
                }
              }
              clients={clients}
              onSave={async (d) => {
                await onUpdateIntervention(d);
                setEditingIntervention(null);
                setIsCreating(false);
              }}
              onDelete={onDeleteIntervention}
              onCancel={() => {
                setEditingIntervention(null);
                setIsCreating(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MapInterface({ markers, onUpdateNest, setMarkers, clients }) {
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [mapCenter, setMapCenter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Ajout d'un marqueur temporaire pour la recherche
  const [tempMarker, setTempMarker] = useState(null);

  const onMapClick = async (latlng) => {
    if (!isAddingMode) return;

    let addr = "Nouveau nid";
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const d = await r.json();
      if (d.display_name)
        addr = d.display_name.split(",").slice(0, 3).join(",");
    } catch (e) {}

    const newM = {
      id: Date.now(),
      clientId: clients[0]?.id || 0,
      lat: latlng.lat,
      lng: latlng.lng,
      address: addr,
      status: "present",
      eggs: 0,
    };

    await onUpdateNest(newM);
    setSelectedMarker(newM);
    setIsAddingMode(false);
  };

  // Transformation du point gris en "vrai" point si cliqué
  const handleMarkerClick = async (marker) => {
    if (marker.id === "temp") {
      const newM = {
        id: Date.now(),
        clientId: clients[0]?.id || 0,
        lat: marker.lat,
        lng: marker.lng,
        address: marker.address,
        status: "present", // Devient rouge et présent
        eggs: 0,
      };
      setTempMarker(null); // On enlève le gris
      await onUpdateNest(newM); // On l'enregistre
      setSelectedMarker(newM); // On ouvre la page d'édition pour le modifier
    } else {
      setSelectedMarker(marker);
    }
  };

  const handleSearch = async (e) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      // 1. On vérifie d'abord si c'est des coordonnées GPS
      // Remplace les virgules par des espaces pour gérer "43.402, 3.696" ou "43.402 3.696"
      const coords = searchQuery.replace(/,/g, " ").split(/\s+/).filter(Boolean);
      if (coords.length === 2) {
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);
        
        // Vérification que ce sont de vraies coordonnées valides
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setMapCenter({ lat, lng });
          setTempMarker({
            id: "temp",
            lat: lat,
            lng: lng,
            address: `Position GPS : ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            status: "temp",
            eggs: 0,
          });
          return; // On arrête là
        }
      }

      // 2. Si ce n'est pas du GPS, on cherche une adresse normale
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&countrycodes=fr`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setMapCenter({ lat, lng });
          setTempMarker({
            id: "temp",
            lat: lat,
            lng: lng,
            address: data[0].display_name.split(",").slice(0, 3).join(","),
            status: "temp",
            eggs: 0,
          });
        } else {
          alert("Adresse introuvable.");
        }
      } catch (error) {
        console.error("Erreur recherche :", error);
        alert("Erreur lors de la recherche.");
      }
    }
  };

  // On ajoute le point gris à la liste des points visibles
  let visibleMarkers = markers.filter(
    (m) => filterStatus === "all" || m.status === filterStatus
  );
  if (tempMarker) {
    visibleMarkers = [...visibleMarkers, tempMarker];
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* Top Toolbar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 z-10">
        {/* Search & Add */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Adresse ou GPS (ex: 43.40, 3.69)..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          <Button
            variant={isAddingMode ? "danger" : "primary"}
            onClick={() => {
              setIsAddingMode(!isAddingMode);
              if (isAddingMode) setTempMarker(null); // On efface le point gris si on annule
            }}
            className="shrink-0"
          >
            {isAddingMode ? "Annuler" : "Ajouter un nid (Clic manuel)"}
          </Button>
        </div>

        {/* Legend / Filters */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              filterStatus === "all"
                ? "bg-white shadow text-slate-800"
                : "text-slate-500 hover:bg-white/50"
            }`}
          >
            <Layers size={14} /> Tous ({markers.length})
          </button>
          <button
            onClick={() => setFilterStatus("present")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              filterStatus === "present"
                ? "bg-white shadow text-slate-800"
                : "text-slate-500 hover:bg-white/50"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-red-500" /> Présents
          </button>
          <button
            onClick={() => setFilterStatus("sterilized_1")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              filterStatus === "sterilized_1"
                ? "bg-white shadow text-slate-800"
                : "text-slate-500 hover:bg-white/50"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-lime-500" /> 1er Passage
          </button>
          <button
            onClick={() => setFilterStatus("sterilized_2")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              filterStatus === "sterilized_2"
                ? "bg-white shadow text-slate-800"
                : "text-slate-500 hover:bg-white/50"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-green-500" /> 2ème Passage
          </button>
          <button
            onClick={() => setFilterStatus("reported_by_client")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              filterStatus === "reported_by_client"
                ? "bg-white shadow text-slate-800"
                : "text-slate-500 hover:bg-white/50"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-purple-500" /> Signalements
          </button>
        </div>
      </div>

      <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-300">
        {/* Instruction Overlay */}
        {isAddingMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-slate-900/90 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <Crosshair size={18} className="text-red-400 animate-pulse" />
            <span className="text-sm font-bold">
              Cliquez n'importe où sur la carte pour placer le nid
            </span>
          </div>
        )}
        
        {tempMarker && !isAddingMode && (
           <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
           <MapPin size={16} className="text-slate-400" />
           <span className="text-sm font-bold">
             Cliquez sur le point gris pour l'ajouter comme nid
           </span>
         </div>
        )}

        <LeafletMap
          markers={visibleMarkers}
          isAddingMode={isAddingMode}
          onMarkerClick={handleMarkerClick}
          onMapClick={onMapClick}
          center={mapCenter}
        />

        {selectedMarker && selectedMarker.id !== "temp" && (
          <div className="absolute top-4 left-4 z-[500] w-72 md:w-80 max-h-[calc(100%-2rem)] flex flex-col animate-in slide-in-from-left-4 fade-in duration-300">
            <Card className="shadow-2xl border-0 flex flex-col max-h-full overflow-hidden">
              <div className="bg-slate-800 p-3 text-white flex justify-between items-center rounded-t-xl shrink-0">
                <span className="font-bold flex items-center gap-2">
                  <MapIcon size={16} /> Détails Nid
                </span>
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="hover:bg-white/20 p-1 rounded transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <NestEditForm
                  nest={selectedMarker}
                  clients={clients}
                  onSave={async (u) => {
                    await onUpdateNest(u);
                    setSelectedMarker(null);
                  }}
                  onCancel={() => setSelectedMarker(null)}
                />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function ClientManagement({
  clients,
  setSelectedClient,
  setView,
  interventions,
  onCreateClient,
  onDeleteClient,
}) {
  const [isCreating, setIsCreating] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          Fiches Clients
        </h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus size={18} /> Nouveau Client
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card
            key={client.id}
            className="hover:shadow-md transition-all cursor-pointer relative group border-slate-200"
            onClick={() => {
              setSelectedClient(client);
              setView("client-detail");
            }}
          >
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Supprimer ce client ?"))
                    onDeleteClient(client);
                }}
                className="p-1.5 bg-white text-slate-400 hover:text-red-500 border rounded-full shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                  <Users size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {client.type}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {client.name}
              </h3>
              <div className="space-y-1 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <MapPin size={14} /> {client.address}
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} /> {client.phone}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Nouveau Client</h3>
            <ClientEditForm
              client={{
                id: Date.now(),
                name: "",
                type: "Privé",
                address: "",
                contact: "",
                phone: "",
                email: "",
              }}
              onSave={(d) => {
                onCreateClient(d);
                setIsCreating(false);
              }}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// --- APPLICATION PRINCIPALE ---

export default function AerothauApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [logoUrl, setLogoUrl] = useState(LOGO_URL);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {}
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setIsFirebaseReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isFirebaseReady) return;
    const unsubClients = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "clients"),
      (snap) => {
        if (!snap.empty)
          setClients(
            snap.docs.map((doc) => ({ ...doc.data(), id: parseInt(doc.id) }))
          );
        else
          MOCK_CLIENTS.forEach((c) =>
            setDoc(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "clients",
                c.id.toString()
              ),
              c
            )
          );
      }
    );
    const unsubInterventions = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "interventions"),
      (snap) => {
        if (!snap.empty)
          setInterventions(
            snap.docs.map((doc) => ({ ...doc.data(), id: parseInt(doc.id) }))
          );
        else
          MOCK_INTERVENTIONS.forEach((i) =>
            setDoc(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "interventions",
                i.id.toString()
              ),
              i
            )
          );
      }
    );
    const unsubMarkers = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "markers"),
      (snap) => {
        if (!snap.empty)
          setMarkers(
            snap.docs.map((doc) => ({ ...doc.data(), id: parseInt(doc.id) }))
          );
        else
          MOCK_MARKERS.forEach((m) =>
            setDoc(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "markers",
                m.id.toString()
              ),
              m
            )
          );
      }
    );
    const unsubReports = onSnapshot(
      collection(db, "artifacts", appId, "public", "data", "reports"),
      (snap) => {
        if (!snap.empty)
          setReports(
            snap.docs.map((doc) => ({ ...doc.data(), id: parseInt(doc.id) }))
          );
        else
          MOCK_REPORTS.forEach((r) =>
            setDoc(
              doc(
                db,
                "artifacts",
                appId,
                "public",
                "data",
                "reports",
                r.id.toString()
              ),
              r
            )
          );
      }
    );
    return () => {
      unsubClients();
      unsubInterventions();
      unsubMarkers();
      unsubReports();
    };
  }, [isFirebaseReady]);

  const handleUpdateNest = async (n) => {
    if (!isFirebaseReady) return;
    await setDoc(
      doc(db, "artifacts", appId, "public", "data", "markers", n.id.toString()),
      n
    );
  };

  // Combine admin users with clients who have credentials
  const availableUsers = [
    ...INITIAL_USERS,
    ...clients
      .filter((c) => c.username && c.password)
      .map((c) => ({
        id: c.id,
        username: c.username,
        password: c.password,
        role: "client",
        name: c.name,
        clientId: c.id,
      })),
  ];

  if (!user)
    return (
      <LoginForm onLogin={setUser} users={availableUsers} logoUrl={logoUrl} />
    );

  const adminMenu = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "map", label: "Carte", icon: MapIcon },
    { id: "nests", label: "Gestion Nids", icon: Bird },
    { id: "clients", label: "Fiches Clients", icon: Users },
    { id: "schedule", label: "Planning", icon: Calendar },
    { id: "reports", label: "Rapports", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8">
            <img src={LOGO_URL} alt="Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold">Aerothau</span>
          </div>
          <nav className="flex-1 space-y-2">
            {(user.role === "admin"
              ? adminMenu
              : [{ id: "dashboard", label: "Mon Espace", icon: Home }]
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  view === item.id ||
                  (item.id === "clients" && view === "client-detail")
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-900/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          <button
            onClick={() => setUser(null)}
            className="flex items-center gap-3 text-red-400 hover:bg-slate-800 p-4 rounded-lg mt-auto transition-colors font-bold tracking-tight"
          >
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="bg-white border-b p-4 flex lg:hidden items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-600"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold">Aerothau Gestion</span>
          <div className="w-8"></div>
        </header>
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {user.role === "admin" ? (
              <>
                {view === "dashboard" && (
                  <AdminDashboard
                    interventions={interventions}
                    clients={clients}
                    markers={markers}
                    setView={setView}
                  />
                )}
                {view === "map" && (
                  <MapInterface
                    markers={markers}
                    onUpdateNest={handleUpdateNest}
                    setMarkers={setMarkers}
                    clients={clients}
                  />
                )}
                {view === "nests" && (
                  <NestManagement
                    markers={markers}
                    setView={setView}
                    onUpdateNest={handleUpdateNest}
                    onDeleteNest={async (n) => {
                      await deleteDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "public",
                          "data",
                          "markers",
                          n.id.toString()
                        )
                      );
                    }}
                    clients={clients}
                  />
                )}
                {view === "clients" && (
                  <ClientManagement
                    clients={clients}
                    setSelectedClient={setSelectedClient}
                    setView={setView}
                    interventions={interventions}
                    onCreateClient={async (c) => {
                      await setDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "public",
                          "data",
                          "clients",
                          c.id.toString()
                        ),
                        c
                      );
                    }}
                    onDeleteClient={async (c) => {
                      await deleteDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "public",
                          "data",
                          "clients",
                          c.id.toString()
                        )
                      );
                    }}
                  />
                )}
                {view === "client-detail" && (
                  <ClientDetail
                    selectedClient={selectedClient}
                    setView={setView}
                    interventions={interventions}
                    clients={clients}
                    users={INITIAL_USERS}
                    onUpdateClient={async (c) =>
                      await setDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "public",
                          "data",
                          "clients",
                          c.id.toString()
                        ),
                        c
                      )
                    }
                    onDeleteClient={async (c) => {
                      await deleteDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "public",
                          "data",
                          "clients",
                          c.id.toString()
                        )
                      );
                      setView("clients");
                    }}
                    reports={reports}
                    onUpdateReport={async (r) =>
                      await setDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "public",
                          "data",
                          "reports",
                          r.id.toString()
                        ),
                        r
                      )
                    }
                    markers={markers}
                    onUpdateIntervention={async (i) =>
                      await setDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "public",
                          "data",
                          "interventions",
                          i.id.toString()
                        ),
                        i
                      )
                    }
                  />
                )}
                {view === "schedule" && (
                  <ScheduleView
                    interventions={interventions}
                    clients={clients}
                    onUpdateIntervention={async (i) =>
                      await setDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "public",
                          "data",
                          "interventions",
                          i.id.toString()
                        ),
                        i
                      )
                    }
                    onDeleteIntervention={async (i) =>
                      await deleteDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "public",
                          "data",
                          "interventions",
                          i.id.toString()
                        )
                      )
                    }
                  />
                )}
                {view === "reports" && (
                  <ReportsView
                    clients={clients}
                    reports={reports}
                    setReports={setReports}
                    interventions={interventions}
                    markers={markers}
                    onUpdateReport={async (r) =>
                      await setDoc(
                        doc(
                          db,
                          "artifacts",
                          appId,
                          "public",
                          "data",
                          "reports",
                          r.id.toString()
                        ),
                        r
                      )
                    }
                  />
                )}
              </>
            ) : (
              <ClientSpace
                user={user}
                interventions={interventions}
                markers={markers}
                clients={clients}
                onUpdateNest={handleUpdateNest}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}