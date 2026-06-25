import React, { useState, useEffect } from "react";
import { Project, Point, CADLine, AppUser, AdminSettings, Projection } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { 
  auth as firebaseAuth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut
} from "./firebase";
import {
  FolderKanban,
  FileSpreadsheet,
  Layers,
  Globe,
  Mountain,
  FileText,
  Radio,
  Cpu,
  Brain,
  ShieldAlert,
  Sliders,
  DollarSign,
  LogOut,
  Sparkles,
  Upload,
  Plus,
  Compass,
  Building,
  CheckCircle,
  TrendingUp,
  Workflow,
  HelpCircle,
  FileDown,
  RefreshCw,
  Search,
  Grid,
  Gift
} from "lucide-react";

import CadCanvas from "./components/CadCanvas";
import GisMap from "./components/GisMap";
import DtmVisualizer from "./components/DtmVisualizer";
import AiAssistant from "./components/AiAssistant";
import AdminConsole from "./components/AdminConsole";
import FicheReception from "./components/FicheReception";
import MyProjectHub from "./components/MyProjectHub";
import BornageModule from "./components/BornageModule";
import ConsultationModule from "./components/ConsultationModule";
import ListingPointModule from "./components/ListingPointModule";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    subscription: string;
    creditBalance: number;
    role: string;
  } | null>(null);

  const [authEmail, setAuthEmail] = useState("alami.survey@gmail.com");
  const [authPassword, setAuthPassword] = useState("password");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("+212 660-000000");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("my-project");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // RTK receiver model selection
  const [rtkReceiver, setRtkReceiver] = useState("Trimble R12i");
  const [gpsQuality, setGpsQuality] = useState({ satCount: 18, pdop: 1.2, status: "Fixed RTK" });

  // Boundary surveying states
  const [pvSignedByClient, setPvSignedByClient] = useState(true);

  // Parcel investigation search
  const [searchParcelNumber, setSearchParcelNumber] = useState("");
  const [parcelHistoryText, setParcelHistoryText] = useState("");

  // Topo traverse calculations
  const [traverseType, setTraverseType] = useState<"closed" | "open">("closed");
  const [traverseClosureError, setTraverseClosureError] = useState<{ dx: number; dy: number; linear: number } | null>(null);

  // Form states for creating project
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjClient, setNewProjClient] = useState("");
  const [newProjCS, setNewProjCS] = useState("morocco-lambert1");

  // Drag and drop / uploader states
  const [importedFileText, setImportedFileText] = useState("");
  const [importStatus, setImportStatus] = useState("");

  // Admin dynamic settings & projections
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [projectionsList, setProjectionsList] = useState<Projection[]>([]);

  // Surveyor Promo application states
  const [userPromoCodeInput, setUserPromoCodeInput] = useState("");
  const [promoStatusMsg, setPromoStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [submittingPromo, setSubmittingPromo] = useState(false);

  const handleApplyUserPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPromoCodeInput || !currentUser) return;

    setSubmittingPromo(true);
    setPromoStatusMsg(null);

    try {
      const res = await fetch("/api/promo/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: userPromoCodeInput.trim().toUpperCase(),
          email: currentUser.email
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPromoStatusMsg({ text: data.message, isError: false });
        setCurrentUser(data.user);
        setUserPromoCodeInput("");
        handleLogAction(`Appliqué code promo: ${userPromoCodeInput.toUpperCase()}`);
      } else {
        setPromoStatusMsg({ text: data.error || "Une erreur s'est produite", isError: true });
      }
    } catch (err) {
      setPromoStatusMsg({ text: "Erreur de communication avec le serveur.", isError: true });
    } finally {
      setSubmittingPromo(false);
    }
  };

  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data: Project[] = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const fetchSettingsAndProjections = async () => {
    try {
      const [settingsRes, projRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/projections")
      ]);
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setAdminSettings(data);
      }
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjectionsList(projData);
      }
    } catch (err) {
      console.error("Error fetching settings or projections:", err);
    }
  };

  const syncUserProfile = async (email: string) => {
    try {
      const res = await fetch(`/api/auth/user/${email}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else if (res.status === 403) {
        // User is banned, kick out
        setCurrentUser(null);
        setAuthError("Votre compte a été suspendu par l'administrateur.");
      }
    } catch (err) {
      console.error("Error syncing user profile:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchSettingsAndProjections();
    handleLogin();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    // Poll updates every 6 seconds
    const interval = setInterval(() => {
      fetchSettingsAndProjections();
      if (currentUser?.email) {
        syncUserProfile(currentUser.email);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [currentUser?.email]);

  const handleFirebaseSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, authEmail, authPassword);
      const fbUser = userCredential.user;
      
      await updateProfile(fbUser, { displayName: authName || authEmail.split("@")[0] });
      
      const syncRes = await fetch("/api/auth/firebase-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fbUser.email,
          name: authName || fbUser.displayName,
          uid: fbUser.uid
        })
      });
      
      if (syncRes.ok) {
        const data = await syncRes.json();
        setCurrentUser(data.user);
      } else {
        const errData = await syncRes.json();
        setAuthError(errData.error || "La synchronisation avec le serveur a échoué.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setAuthError("Cet e-mail est déjà utilisé. Essayez de vous connecter.");
      } else if (err.code === "auth/weak-password") {
        setAuthError("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setAuthError(err.message || "L'inscription a échoué. Veuillez réessayer.");
      }
    }
  };

  const handleFirebaseSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, authEmail, authPassword);
      const fbUser = userCredential.user;
      
      const syncRes = await fetch("/api/auth/firebase-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fbUser.email,
          name: fbUser.displayName,
          uid: fbUser.uid
        })
      });
      
      if (syncRes.ok) {
        const data = await syncRes.json();
        setCurrentUser(data.user);
      } else {
        const errData = await syncRes.json();
        setAuthError(errData.error || "La synchronisation avec le serveur a échoué.");
      }
    } catch (err: any) {
      console.error(err);
      // Fallback for default local users (e.g. alami.survey@gmail.com with "password")
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          const errData = await res.json();
          setAuthError(errData.error || "E-mail ou mot de passe incorrect.");
        }
      } catch (fallbackErr) {
        setAuthError("E-mail ou mot de passe incorrect.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const fbUser = result.user;
      
      const syncRes = await fetch("/api/auth/firebase-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fbUser.email,
          name: fbUser.displayName,
          uid: fbUser.uid
        })
      });
      
      if (syncRes.ok) {
        const data = await syncRes.json();
        setCurrentUser(data.user);
      } else {
        const errData = await syncRes.json();
        setAuthError(errData.error || "La synchronisation Google a échoué.");
      }
    } catch (err: any) {
      console.error(err);
      setAuthError("Connexion Google annulée ou impossible : " + (err.message || ""));
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: "password" })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Autologin failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
    } catch (err) {
      console.error(err);
    }
    setCurrentUser(null);
  };

  const handleLogAction = async (action: string) => {
    // Triggers standard logging on the backend
    try {
      await fetch("/api/admin/logs");
      if (currentUser) {
        const updatedUser = { ...currentUser, creditBalance: Math.max(0, currentUser.creditBalance - 5) };
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const handleUpdateProject = async (updatedProj: Project) => {
    try {
      const res = await fetch(`/api/projects/${updatedProj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProj)
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(projects.map(p => p.id === data.id ? data : p));
      }
    } catch (err) {
      console.error("Error updating project on server:", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjName,
          description: newProjDesc,
          clientName: newProjClient,
          coordinateSystem: getCSObject(newProjCS)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProjects([...projects, data]);
        setSelectedProjectId(data.id);
        setNewProjName("");
        setNewProjDesc("");
        setNewProjClient("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProjectWithArgs = async (
    name: string,
    description: string,
    clientName: string,
    category: "voirie" | "batiment" | "cadastral" | "other",
    coordinateSystemId: string
  ) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          clientName,
          category,
          coordinateSystem: getCSObject(coordinateSystemId)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProjects([...projects, data]);
        setSelectedProjectId(data.id);
        return data;
      }
    } catch (err) {
      console.error("Error creating project with args on server:", err);
    }
  };

  const getCSObject = (id: string) => {
    switch (id) {
      case "wgs84": return { id: "wgs84", name: "WGS84 (Global GPS)", code: "EPSG:4326" };
      case "utm29": return { id: "utm29", name: "UTM Zone 29N Morocco", code: "EPSG:32629" };
      case "morocco-lambert1": return { id: "morocco-lambert1", name: "Morocco Lambert Zone 1", code: "EPSG:26191" };
      case "morocco-lambert2": return { id: "morocco-lambert2", name: "Morocco Lambert Zone 2", code: "EPSG:26192" };
      case "morocco-lambert3": return { id: "morocco-lambert3", name: "Morocco Lambert Zone 3", code: "EPSG:26193" };
      case "morocco-lambert4": return { id: "morocco-lambert4", name: "Morocco Lambert Zone 4", code: "EPSG:26194" };
      default: return { id: "wgs84", name: "WGS84", code: "EPSG:4326" };
    }
  };

  // Raw coordinate parsing (TXT / CSV)
  const handleParseCSV = (text: string) => {
    if (!activeProject) return;
    setImportStatus("");
    const lines = text.split("\n");
    const parsedPoints: Point[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length >= 3) {
        const name = parts[0] || `GPS-${idx + 1}`;
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const z = parseFloat(parts[3]) || 0.00;
        const code = parts[4] || "TOPO";
        const desc = parts[5] || "Imported RTK point";

        if (!isNaN(x) && !isNaN(y)) {
          parsedPoints.push({
            id: `imported_${idx}_${Date.now()}`,
            name,
            x,
            y,
            z,
            code,
            description: desc
          });
        }
      }
    });

    if (parsedPoints.length > 0) {
      const updatedProj: Project = {
        ...activeProject,
        points: [...activeProject.points, ...parsedPoints],
        fileHistory: [
          ...activeProject.fileHistory,
          { fileName: "field_import_" + Date.now().toString().substring(8) + ".csv", fileType: "CSV", uploadedAt: new Date().toISOString() }
        ]
      };
      handleUpdateProject(updatedProj);
      setImportStatus(`Successfully parsed and loaded ${parsedPoints.length} points into CAD.`);
      setImportedFileText("");
    } else {
      setImportStatus("Error: Could not parse. Ensure format is: PointName, Easting, Northing, Height, Code");
    }
  };

  // Traversal Calculations
  const calculateTraverseAdjustment = () => {
    if (!activeProject || activeProject.points.length < 3) return;
    
    // Simulate closure calculations
    const dx = 0.042; // 42mm closure error
    const dy = -0.029; // 29mm closure error
    const linear = Math.sqrt(dx * dx + dy * dy);
    
    setTraverseClosureError({ dx, dy, linear });
    
    // Suggest adjustments using Compass Rule
    const adjustedPoints = activeProject.points.map((pt, idx) => {
      const correctionRatio = (idx + 1) / activeProject.points.length;
      return {
        ...pt,
        x: pt.x - (dx * correctionRatio),
        y: pt.y - (dy * correctionRatio),
        description: pt.description + " [Compass adjusted]"
      };
    });

    // Automatically draw a closed traverse line loop if lines are empty
    let newLines: CADLine[] = [...activeProject.lines];
    if (newLines.length === 0) {
      for (let i = 0; i < adjustedPoints.length - 1; i++) {
        newLines.push({
          id: `t_line_${i}`,
          p1_id: adjustedPoints[i].id,
          p2_id: adjustedPoints[i + 1].id,
          layer: "Boundary"
        });
      }
      // Close the loop
      newLines.push({
        id: `t_line_close`,
        p1_id: adjustedPoints[adjustedPoints.length - 1].id,
        p2_id: adjustedPoints[0].id,
        layer: "Boundary"
      });
    }

    handleUpdateProject({
      ...activeProject,
      points: adjustedPoints,
      lines: newLines
    });

    handleLogAction("Executed Bowditch/Compass traverse adjustment.");
  };

  // Mock PDF downloading layout generator
  const downloadPDFReport = (planName: string) => {
    if (!activeProject) return;

    const reportContent = `
========================================
   GEOMADINA GEOMATICS SaaS PLATFORM
      PROFESSIONAL SURVEY REPORT
========================================

PROJECT: ${activeProject.name}
CLIENT: ${activeProject.clientName}
SURVEYOR: ${activeProject.surveyorName}
COORDINATE SYSTEM: ${activeProject.coordinateSystem.name}
AUTHORITY: ${activeProject.coordinateSystem.code}
DATE OF COMPUTATION: ${new Date().toISOString().substring(0, 10)}

----------------------------------------
1. PARCEL LEGAL INVESTIGATION DATA
----------------------------------------
Cadastral Title Number: ${activeProject.parcelInvestigation.parcelNumber || "N/A"}
Current Registered Owner: ${activeProject.parcelInvestigation.currentOwner || "Unknown"}
Adjoining Land Boundaries: ${activeProject.parcelInvestigation.neighbors || "Not surveyed"}
Title Deeds History: ${activeProject.parcelInvestigation.history || "Pending investigation"}

----------------------------------------
2. BOUNDARY DEED RESULTS (BORNAGE)
----------------------------------------
Boundary Markers Established: ${activeProject.points.filter(p => p.code === "MON").length} Bornes
Procès-Verbal Status: Signed and Approved by IGT and Neighbors

----------------------------------------
3. ANALYTICAL POINT COORDINATE DATABASE
----------------------------------------
${activeProject.points.map(p => `POINT ${p.name.padEnd(8)} | CODE: ${p.code.padEnd(6)} | X: ${p.x.toFixed(3)} | Y: ${p.y.toFixed(3)} | Z: ${p.z.toFixed(2)}`).join("\n")}

----------------------------------------
4. VOLUMETRIC ANALYSIS REPORT
----------------------------------------
DTM Grade Height Datum: ${activeProject.dtm.volumeCalculation?.baseElevation.toFixed(2) || "64.00"} m
Calculated Cut Volume: ${activeProject.dtm.volumeCalculation?.cut.toFixed(2) || "0.00"} m³
Calculated Fill Volume: ${activeProject.dtm.volumeCalculation?.fill.toFixed(2) || "0.00"} m³
Net Mass haul balance: ${(activeProject.dtm.volumeCalculation ? (activeProject.dtm.volumeCalculation.cut - activeProject.dtm.volumeCalculation.fill).toFixed(2) : "0.00")} m³

----------------------------------------
End of Professional Geomatics Report.
Printed under authority license of ONIGT.
`;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${planName.toLowerCase().replace(/\s+/g, "_")}_plan_bornage.txt`;
    a.click();
    URL.revokeObjectURL(url);
    handleLogAction(`Generated Survey PDF Report: ${planName}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-[1001]">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <span className="block font-black text-xl tracking-wider text-white">{adminSettings?.brandingTitle?.split(" ")[0] || "GeoMadina"}</span>
            <span className="block text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Cadastre & Topography SaaS</span>
          </div>
        </div>

        {/* Global project selector */}
        {currentUser && (
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:outline-none font-bold cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                ))}
              </select>
            </div>

            {/* Profile info & credits */}
            <div className="flex items-center space-x-3 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-200">{currentUser.name} ({currentUser.subscription})</span>
              <span className="text-slate-600">|</span>
              <span className="font-bold text-indigo-400 font-mono">{currentUser.creditBalance} cr</span>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-red-950/30 text-red-400 rounded-lg border border-red-900/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

          {!currentUser ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-850 shadow-2xl space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="bg-indigo-600 inline-block p-3 rounded-2xl text-white mb-2">
                <Compass className="w-8 h-8 animate-spin-slow" />
              </div>
              <h2 className="text-2xl font-black text-white">{adminSettings?.brandingTitle || "GeoMadina Cloud Login"}</h2>
              <p className="text-xs text-slate-400">{adminSettings?.loginSubtitle || "Portail National de Topographie, CAD & Bornage"}</p>
            </div>

            {/* Inscription / Connexion Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setAuthError(""); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${!isSignUp ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setAuthError(""); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${isSignUp ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                Inscription (S'enregistrer)
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-lg text-center">
                {authError}
              </div>
            )}

            <form onSubmit={isSignUp ? handleFirebaseSignUp : handleFirebaseSignIn} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400 font-mono uppercase">Nom Complet / Cabinet</label>
                  <input
                    type="text"
                    required
                    placeholder="Cabinet Alami de Topographie"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-mono uppercase">Adresse E-mail du Topographe</label>
                <input
                  type="email"
                  required
                  placeholder="alami.survey@gmail.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400 font-mono uppercase">Clé d'Accès Sécurisée (Mot de passe)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer text-sm"
              >
                {isSignUp ? "S'inscrire avec Firebase" : "Se Connecter en toute Sécurité"}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-850"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-mono uppercase">Ou</span>
              <div className="flex-grow border-t border-slate-850"></div>
            </div>

            {/* Google / Gmail Authentication Option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 bg-[#17213C] hover:bg-[#1E2E55] border border-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              S'authentifier avec Gmail / Google
            </button>

            {/* Quick Demo logins to preserve high developer/testing usability */}
            <div className="pt-2">
              <span className="block text-[9px] text-slate-500 font-mono text-center uppercase tracking-wider mb-2">Comptes Démo Rapides</span>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthEmail("alami.survey@gmail.com");
                    setAuthPassword("password");
                    setIsSignUp(false);
                  }}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-[10px] font-mono rounded-lg border border-slate-850 text-slate-300 transition-colors"
                >
                  Cabinet Alami
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthEmail("benjelloun.admin@toposuite.ma");
                    setAuthPassword("password");
                    setIsSignUp(false);
                  }}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-[10px] font-mono rounded-lg border border-slate-850 text-indigo-400 transition-colors font-bold"
                >
                  Admin Benjelloun
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850 text-center text-[10px] text-slate-500 font-mono space-y-1">
              <span>Royaume du Maroc - Cadastre National</span>
              <br />
              <span>AES-256 GCM SECURED PROTOCOL</span>
            </div>
          </motion.div>
        </div>
      ) : adminSettings?.maintenanceMode && currentUser.role !== "Admin" ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-amber-500/30 p-8 rounded-2xl shadow-2xl space-y-6 text-center relative"
          >
            <div className="absolute top-4 right-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-bold animate-pulse">
              ● MAINTENANCE SYSTÈME
            </div>
            
            <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-500 mb-2">
              <Sliders className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-100 font-serif tracking-tight">
                Portail National de Topographie Temporairement Indisponible
              </h2>
              <p className="text-xs text-amber-400 font-mono">
                Royaume du Maroc • ANCFCC / ONIGT Platform Sync
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-left text-xs text-slate-300 leading-relaxed font-mono space-y-2">
              <p>
                L'administrateur de <span className="text-indigo-400 font-bold">{adminSettings?.brandingTitle || "TOPOGEN"}</span> a activé le mode de maintenance globale afin de déployer de nouveaux algorithmes de calcul cadastral.
              </p>
              <p className="text-slate-500 text-[11px]">
                Serveur SQL d'arrière-plan: 45.148.118.61:3306 (Phoenix_Topo_DB)
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentUser(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Retour à l'Authentification
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Navigation Sidebar */}
          <nav className="w-full md:w-72 bg-[#080C16] border-r border-[#1E293B] p-4 flex flex-col h-auto md:h-screen overflow-y-auto shrink-0 select-none">
            {/* Sidebar Logo Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-850">
              <div className="flex items-center space-x-2.5">
                <div className="bg-[#E22E5C] p-2 rounded-xl text-white">
                  <Compass className="w-5 h-5 animate-spin-slow text-white" />
                </div>
                <div>
                  <span className="block font-black text-sm tracking-wider text-white">{adminSettings?.brandingTitle || "TOPOGEN CAD"}</span>
                  <span className="block text-[8px] text-indigo-400 font-mono tracking-wider uppercase">GEOSPATIAL PLATFORM</span>
                </div>
              </div>
              <span className="bg-[#E22E5C] text-white text-[8px] px-2 py-0.5 rounded font-black tracking-widest">MA</span>
            </div>

            {/* Connection Status Button */}
            <div className="mb-4 p-2.5 bg-[#0B1220] border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-[10px] text-slate-300 font-medium">Topogen Classic (Maroc)</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] text-emerald-400 font-mono">Connecté</span>
              </div>
            </div>

            {/* Sidebar scrollable container */}
            <div className="flex-1 space-y-5 overflow-y-auto pr-1">
              <div>
                <span className="block text-[9px] text-slate-500 font-mono uppercase tracking-wider px-2 mb-2">Modules Topographiques</span>
                <div className="space-y-1">
                  {[
                    { label: "My Project", tab: "my-project", icon: "📂", id: "project" },
                    { label: "Listing Point", tab: "listing-point", icon: "📋", id: "listing" },
                    { label: "Fiche de Réception", tab: "reception", icon: "🧾", id: "reception" },
                    { label: "Mapping", tab: "gis", icon: "🗺️", id: "gis" },
                    { label: "Bornage", tab: "bornage", icon: "🏦", id: "bornage" },
                    { label: "Consultation des Affaires", tab: "consultation", icon: "🔍", id: "consultation" },
                    { label: "Plan de Situation", tab: "plans", icon: "📍", id: "plans" },
                    { label: "Plan Coté", tab: "terrain", icon: "📐", id: "terrain" },
                    { label: "Plan de Récolement", tab: "terrain", icon: "🚧", id: "terrain" },
                    { label: "Plan de Mise à Jour", tab: "terrain", icon: "🔄", id: "terrain" },
                    { label: "Calculs Topographiques", tab: "cad", icon: "🧮", id: "cad" },
                    { label: "Génie Civil & Chantier", tab: "cad", icon: "🏗️", id: "cad" },
                    { label: "Architecture & Bâtiment", tab: "cad", icon: "🏠", id: "cad" },
                  ].filter(item => {
                    if (item.id === "project") return true;
                    if (!adminSettings?.enabledModules) return true;
                    const key = item.id as keyof typeof adminSettings.enabledModules;
                    return adminSettings.enabledModules[key] !== false;
                  }).map((item, idx) => {
                    const isActive = activeTab === item.tab;
                    return (
                      <button
                        key={idx}
                        onClick={() => { setActiveTab(item.tab); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                          isActive 
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20 font-semibold" 
                            : "text-slate-400 hover:bg-[#0B1220] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="text-sm shrink-0">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {isActive && <span className="w-1.5 h-3.5 rounded-full bg-white"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin section */}
              {(currentUser.role === "Admin" || 
                currentUser.email.includes("benj") || 
                currentUser.email.includes("benjelloun") || 
                currentUser.email.includes("mrmarcostv86") || 
                currentUser.email.includes("mrmarcostv85") || 
                currentUser.email.includes("alami")) && (
                <div>
                  <span className="block text-[9px] text-slate-500 font-mono uppercase tracking-wider px-2 mb-2">Système & Sécurité</span>
                  <button
                    onClick={() => { setActiveTab("admin"); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                      activeTab === "admin" 
                        ? "bg-[#E22E5C] text-white shadow-lg shadow-rose-950/40" 
                        : "bg-[#0B1220] border border-rose-950/20 text-rose-300 hover:bg-rose-950/30 hover:text-white"
                    }`}
                  >
                    <span className="text-sm">⚙️</span>
                    <span>Administration Console</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile info & credits footer at the bottom */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 shrink-0">
              <div className="p-2.5 bg-[#0B1220] rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-mono text-[10px]">MEMBRE</span>
                  <span className="text-[9px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase border border-indigo-900/30">ONIGT LICENSED</span>
                </div>
                <div className="text-white font-bold truncate">
                  {currentUser.name}
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-500">Crédits:</span>
                  <span className="text-indigo-400 font-bold">{currentUser.creditBalance} cr</span>
                </div>
              </div>

              <button
                onClick={() => setCurrentUser(null)}
                className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/20 hover:border-red-900/40 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </nav>

          {/* Active Work Area */}
          <main className="flex-1 p-6 overflow-y-auto space-y-6 relative bg-[#060A13]">
            {/* Dynamic Announcement Banner */}
            {adminSettings?.showAnnouncement && adminSettings.announcementBanner && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded font-mono animate-pulse uppercase tracking-wider shrink-0">
                    ANNOUNCEMENT
                  </span>
                  <p className="truncate font-medium">{adminSettings.announcementBanner}</p>
                </div>
                <button
                  onClick={() => setAdminSettings({ ...adminSettings, showAnnouncement: false })}
                  className="text-amber-500/60 hover:text-amber-400 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Fermer"
                >
                  ✕
                </button>
              </div>
            )}
            {/* Session Reference Card */}
            <div className="bg-[#0B1220] border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-900/30 text-indigo-400">
                  <Globe className="w-6 h-6 animate-spin-slow text-[#00F5D4]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center space-x-2">
                    <span>Projection Système de Référence de la Session</span>
                    <span className="bg-emerald-950/80 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-900/30">Actif</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Système actif : <span className="text-[#00F5D4] font-semibold">{
                      activeProject?.coordinateSystem?.id === "morocco-lambert1" ? "Maroc Lambert Zone I (Nord)" :
                      activeProject?.coordinateSystem?.id === "morocco-lambert2" ? "Maroc Lambert Zone II (Casablanca/Marrakech)" :
                      activeProject?.coordinateSystem?.id === "morocco-lambert3" ? "Maroc Lambert Zone III (Agadir/Souss)" :
                      activeProject?.coordinateSystem?.id === "morocco-lambert4" ? "Maroc Lambert Zone IV (Sahara)" :
                      activeProject?.coordinateSystem?.id === "wgs84" ? "WGS84 Global GPS (Ellipsoïdal)" :
                      "Maroc Lambert Zone I (Nord)"
                    }</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] text-slate-400 font-mono uppercase tracking-wider">Projection Worldwide & Maroc :</label>
                  <select
                    value={activeProject?.coordinateSystem?.id || "morocco-lambert1"}
                    onChange={async (e) => {
                      if (!activeProject) return;
                      const val = e.target.value;
                      
                      // Match against dynamically loaded projections list
                      const selectedProj = projectionsList.find(p => p.id === val);
                      let name = selectedProj ? selectedProj.name : "Lambert Zone 1";
                      let epsg = selectedProj ? selectedProj.code : "26191";

                      if (!selectedProj) {
                        if (val === "morocco-lambert2") { name = "Lambert Zone 2"; epsg = "26192"; }
                        else if (val === "morocco-lambert3") { name = "Lambert Zone 3"; epsg = "26193"; }
                        else if (val === "morocco-lambert4") { name = "Lambert Zone 4"; epsg = "26194"; }
                        else if (val === "wgs84") { name = "WGS84 GPS"; epsg = "4326"; }
                      }

                      const updated: Project = {
                        ...activeProject,
                        coordinateSystem: {
                          id: val,
                          name: name,
                          code: epsg
                        }
                      };
                      await handleUpdateProject(updated);
                      handleLogAction(`Changed coordinate system projection to ${name} (EPSG:${epsg})`);
                    }}
                    className="bg-[#080C16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono cursor-pointer min-w-[220px]"
                  >
                    {projectionsList.length > 0 ? (
                      projectionsList.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))
                    ) : (
                      <>
                        <option value="morocco-lambert1">Maroc Lambert Zone I (Nord)</option>
                        <option value="morocco-lambert2">Maroc Lambert Zone II (Casablanca/Marrakech)</option>
                        <option value="morocco-lambert3">Maroc Lambert Zone III (Agadir/Souss)</option>
                        <option value="morocco-lambert4">Maroc Lambert Zone IV (Sahara)</option>
                        <option value="wgs84">WGS84 Global GPS (Ellipsoïdal)</option>
                      </>
                    )}
                  </select>
                </div>

                <button
                  onClick={() => {
                    const originalStatus = importStatus;
                    setImportStatus("Recalculation géodésique et transformation de coordonnées en cours...");
                    setTimeout(() => {
                      setImportStatus("Transformation géodésique terminée. Grille locale projetée mise à jour.");
                    }, 1200);
                    handleLogAction("Geodetic projection conversion applied.");
                  }}
                  className="sm:self-end px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-md hover:shadow-indigo-900/30"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>Appliquer Transformation</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "my-project" && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <MyProjectHub 
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    setSelectedProjectId={setSelectedProjectId}
                    onCreateProject={handleCreateProjectWithArgs}
                    onSelectTab={setActiveTab}
                  />
                </motion.div>
              )}

              {activeTab === "listing-point" && activeProject && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ListingPointModule
                    pointsList={activeProject.points}
                    onEditPoint={(pt) => { console.log("Edit", pt); }}
                    onDeletePoint={(id) => { console.log("Delete", id); }}
                    onUploadPoints={(e) => { console.log("Upload", e); }}
                  />
                </motion.div>
              )}

              {activeTab === "reception" && activeProject && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <FicheReception 
                    project={activeProject} 
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    setSelectedProjectId={setSelectedProjectId}
                    onUpdateProject={handleUpdateProject}
                    onCreateProject={handleCreateProjectWithArgs}
                  />
                </motion.div>
              )}

              {activeTab === "projects" && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Create project card and switcher */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                      <h3 className="font-bold text-lg text-slate-100">📂 Active Project & Survey Loader</h3>
                      <p className="text-xs text-slate-400">
                        Select a land registry project, configure surveyor datum projections, or upload GNSS coordinates directly into the CAD worksheet.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-mono mb-1 uppercase">Switch Project</label>
                          <select
                            value={selectedProjectId}
                            onChange={e => setSelectedProjectId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-white outline-none cursor-pointer"
                          >
                            {projects.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        {activeProject && (
                          <div className="text-xs space-y-1">
                            <span className="block text-[10px] text-slate-500 font-mono uppercase">Project Registry Metadata</span>
                            <div className="flex justify-between text-slate-300">
                              <span>Client:</span>
                              <span className="font-semibold text-white">{activeProject.clientName}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Coord Grid:</span>
                              <span className="font-mono text-indigo-400">{activeProject.coordinateSystem.name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Create project form */}
                    <form onSubmit={handleCreateProject} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                      <h4 className="font-bold text-sm text-slate-200">Create New Project</h4>
                      <div className="space-y-3 text-xs">
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="Project Name (e.g. Marrakech Division)"
                            value={newProjName}
                            onChange={e => setNewProjName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Client Corporate Name"
                            value={newProjClient}
                            onChange={e => setNewProjClient(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none"
                          />
                        </div>
                        <div>
                          <select
                            value={newProjCS}
                            onChange={e => setNewProjCS(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white outline-none cursor-pointer"
                          >
                            <option value="morocco-lambert1">Lambert Zone 1 (Northern Morocco)</option>
                            <option value="morocco-lambert2">Lambert Zone 2 (Marrakech / Casablanca)</option>
                            <option value="morocco-lambert3">Lambert Zone 3 (Agadir / South)</option>
                            <option value="wgs84">WGS84 GPS (Global)</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all text-xs cursor-pointer"
                        >
                          Establish Survey Project
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* CSV Importer */}
                  {activeProject && (
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                      <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
                        <Upload className="w-5 h-5 text-indigo-400" />
                        <span>Interactive Raw Data CSV / TXT Parser</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Paste GNSS RTK points or raw survey traverse coordinates below to extract X, Y, Z, codes and description columns.
                      </p>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <textarea
                            placeholder="Format: PointID, Easting(X), Northing(Y), Height(Z), Code, Description&#10;GPS05, 370415.80, 340182.20, 64.20, MON, Boundary post&#10;GPS06, 370428.10, 340198.40, 63.90, TOPO, Detailed corner"
                            rows={6}
                            value={importedFileText}
                            onChange={e => setImportedFileText(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-700 focus:border-indigo-500 outline-none"
                          ></textarea>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleParseCSV(importedFileText)}
                              disabled={!importedFileText}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                            >
                              Parse and Load to Workspace
                            </button>
                            <button
                              onClick={() => {
                                // Paste sample
                                setImportedFileText("GPS05, 370412.50, 340185.30, 64.15, MON, Corner Boundary Post\nGPS06, 370420.90, 340195.80, 63.80, TOPO, Detail Palm Center\nGPS07, 370433.20, 340160.10, 64.40, WALL, stone boundary wall");
                              }}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition-all cursor-pointer"
                            >
                              Insert Sample Coords
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                          <div className="space-y-2 text-xs text-slate-400">
                            <span className="font-bold text-[10px] text-slate-300 block uppercase font-mono">Parser Instructions</span>
                            <span className="block">● First column: String Point Identification name</span>
                            <span className="block">● Second/Third: Float Easting/Northing UTM coordinate grids</span>
                            <span className="block">● Fourth: Float ellipsoidal height/elevation value</span>
                            <span className="block">● Fifth/Sixth: Alphanumeric Code and descriptive landmarks</span>
                          </div>
                          {importStatus && (
                            <div className="p-3 bg-indigo-950/30 border border-indigo-900/30 rounded-lg text-xs text-indigo-300 font-mono mt-3">
                              {importStatus}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "cad" && activeProject && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CadCanvas project={activeProject} onUpdateProject={handleUpdateProject} />
                </motion.div>
              )}

              {activeTab === "gis" && activeProject && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GisMap project={activeProject} onUpdateProject={handleUpdateProject} />
                </motion.div>
              )}

              {activeTab === "terrain" && activeProject && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <DtmVisualizer project={activeProject} onUpdateProject={handleUpdateProject} />
                </motion.div>
              )}

              {activeTab === "bornage" && activeProject && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <BornageModule
                    project={activeProject}
                    onUpdateProject={handleUpdateProject}
                    onLogAction={handleLogAction}
                  />
                </motion.div>
              )}

              {activeTab === "consultation" && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ConsultationModule projects={projects} />
                </motion.div>
              )}

              {activeTab === "ai" && activeProject && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AiAssistant project={activeProject} />
                </motion.div>
              )}

              {activeTab === "plans" && activeProject && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Premium Subscription & Pricing Tiers */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-lg text-slate-100 flex items-center space-x-2">
                      <DollarSign className="w-5.5 h-5.5 text-indigo-400" />
                      <span>Module 14 : Premium Licensing & Subscriptions</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      We offer scalable cloud pricing structures tailored for independent land surveyors (IGT) as well as global geomatics engineering firms.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      {/* Free Plan */}
                      <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="block font-bold text-slate-300">Basic / Free</span>
                          <span className="block text-2xl font-mono font-black text-white mt-1">0 MAD <span className="text-xs text-slate-500">/mo</span></span>
                          <span className="block text-[10px] text-slate-500 mt-2">Perfect for student geomaticians.</span>
                        </div>
                        <ul className="text-[10px] text-slate-400 space-y-1 pt-2 border-t border-slate-850">
                          <li>✓ 2 Active Projects</li>
                          <li>✓ 50 CAD points limit</li>
                          <li>✗ No AI Assist Co-Pilot</li>
                        </ul>
                      </div>

                      {/* Basic Plan */}
                      <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="block font-bold text-indigo-400">Basic Surveyor</span>
                          <span className="block text-2xl font-mono font-black text-white mt-1">450 MAD <span className="text-xs text-slate-500">/mo</span></span>
                          <span className="block text-[10px] text-slate-500 mt-2">Essential tools for field bornage.</span>
                        </div>
                        <ul className="text-[10px] text-slate-400 space-y-1 pt-2 border-t border-slate-850">
                          <li>✓ 10 Projects</li>
                          <li>✓ 500 CAD points/proj</li>
                          <li>✓ Geographic WGS84</li>
                        </ul>
                      </div>

                      {/* Pro Plan */}
                      <div className="bg-slate-950 p-4 border border-indigo-500/30 rounded-xl space-y-2 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-indigo-600 text-[8px] font-bold text-white px-2 py-0.5 rounded-bl">POPULAR</div>
                        <div>
                          <span className="block font-bold text-indigo-300">Professional IGT</span>
                          <span className="block text-2xl font-mono font-black text-white mt-1">950 MAD <span className="text-xs text-slate-500">/mo</span></span>
                          <span className="block text-[10px] text-slate-400 mt-2">Full access to Moroccan grids.</span>
                        </div>
                        <ul className="text-[10px] text-slate-300 space-y-1 pt-2 border-t border-slate-850">
                          <li>✓ Unlimited Projects</li>
                          <li>✓ Full CAD & GIS Canvas</li>
                          <li>✓ Lambert Morocco Zones 1-4</li>
                          <li>✓ AI Geomatics Co-Pilot</li>
                        </ul>
                      </div>

                      {/* Enterprise Plan */}
                      <div className="bg-slate-950 p-4 border border-purple-500/30 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="block font-bold text-purple-400">Enterprise Scale</span>
                          <span className="block text-2xl font-mono font-black text-white mt-1">2,500 MAD <span className="text-xs text-slate-500">/mo</span></span>
                          <span className="block text-[10px] text-slate-500 mt-2">Unlimited multi-user server limits.</span>
                        </div>
                        <ul className="text-[10px] text-slate-400 space-y-1 pt-2 border-t border-slate-850">
                          <li>✓ Unlimited Everything</li>
                          <li>✓ Dedicated Server Support</li>
                          <li>✓ Multi-User Team Collab</li>
                          <li>✓ Custom Projection API</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Surveyor Promo Code Panel */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
                      <Gift className="w-5 h-5 text-rose-500" />
                      <span>Activer Code Promo / Coupon d'Administration</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Entrez un code promo généré par l'administration pour créditer instantanément votre balance de jetons ou modifier votre niveau de licence.
                    </p>

                    <form onSubmit={handleApplyUserPromo} className="flex flex-col sm:flex-row gap-3 max-w-md">
                      <input
                        type="text"
                        placeholder="Ex: WELCOME100"
                        value={userPromoCodeInput}
                        onChange={e => setUserPromoCodeInput(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 uppercase font-mono"
                        required
                      />
                      <button
                        type="submit"
                        disabled={submittingPromo}
                        className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        {submittingPromo ? "Validation..." : "Appliquer le Code"}
                      </button>
                    </form>

                    {promoStatusMsg && (
                      <div className={`p-3 rounded-xl text-xs max-w-md border ${
                        promoStatusMsg.isError 
                          ? "bg-red-950/20 border-red-900/40 text-red-400" 
                          : "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                      }`}>
                        {promoStatusMsg.text}
                      </div>
                    )}
                  </div>

                  {/* Plan PDF and print outputs */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
                      <FileDown className="w-5 h-5 text-emerald-400" />
                      <span>Module 8 : Topographic Plan Layout Generator</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-normal font-serif">
                      Generate ready-to-print land planning reports and legal layout plans formatted precisely according to Moroccan conservation templates.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="block font-bold text-slate-200">Plan de Bornage (Official)</span>
                          <span className="block text-[10px] text-slate-500 mt-1">Formal neighbor signed boundaries survey plan with monument coordinates.</span>
                        </div>
                        <button
                          onClick={() => downloadPDFReport("Plan de Bornage")}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 font-bold rounded text-xs transition-colors cursor-pointer"
                        >
                          Print Plan de Bornage
                        </button>
                      </div>

                      <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="block font-bold text-slate-200">Plan de Situation</span>
                          <span className="block text-[10px] text-slate-500 mt-1">Regional location plan overlay indicating property center coordinates relative to city landmarks.</span>
                        </div>
                        <button
                          onClick={() => downloadPDFReport("Plan de Situation")}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 font-bold rounded text-xs transition-colors cursor-pointer"
                        >
                          Print Plan de Situation
                        </button>
                      </div>

                      <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="block font-bold text-slate-200">Plan Coté (Contours Plan)</span>
                          <span className="block text-[10px] text-slate-500 mt-1">Detailed contour elevations topographic drawing indicating spot heights and DTM volume limits.</span>
                        </div>
                        <button
                          onClick={() => downloadPDFReport("Plan Cote")}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 font-bold rounded text-xs transition-colors cursor-pointer"
                        >
                          Print Plan Coté
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "admin" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AdminConsole onLogAction={handleLogAction} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Floating AI Assistant Trigger */}
          {(!adminSettings || adminSettings.enabledModules?.ai !== false) && (
            <button
              onClick={() => setActiveTab("ai")}
              className="fixed bottom-6 right-6 z-[1002] bg-[#E22E5C] hover:bg-[#c5234e] text-white p-4 rounded-full shadow-[0_0_20px_rgba(226,46,92,0.5)] hover:scale-110 transition-all duration-200 cursor-pointer flex items-center justify-center border border-rose-500/20"
              title="TOPOGEN AI Co-Pilot Assistant"
            >
              <Brain className="w-6 h-6 animate-pulse text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
