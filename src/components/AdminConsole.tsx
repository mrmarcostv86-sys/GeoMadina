import React, { useState, useEffect } from "react";
import { AppUser, Projection, PromoCode, Project, AdminSettings } from "../types";
import {
  Shield,
  Users,
  MapPin,
  Tag,
  ScrollText,
  Ban,
  CheckCircle2,
  Plus,
  Trash2,
  KeySquare,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  Gift,
  Boxes,
  Receipt,
  FileText,
  Lock,
  Activity,
  TrendingUp,
  RefreshCw,
  Database,
  Server,
  Settings,
  Globe
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AdminConsoleProps {
  onLogAction: (action: string) => void;
}

export default function AdminConsole({ onLogAction }: AdminConsoleProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [projections, setProjections] = useState<Projection[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [logs, setLogs] = useState<{ timestamp: string; action: string; user: string }[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  
  // Custom interactive tabs inspired by image.png
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "premium" | "modules" | "promos" | "billing" | "projections" | "documents" | "security" | "logs" | "affaires" | "settings"
  >("dashboard");
  const [activeSubTab, setActiveSubTab] = useState<"general" | "theme" | "sql" | "maps" | "system">("general");

  // State for forms
  const [newProjName, setNewProjName] = useState("");
  const [newProjCode, setNewProjCode] = useState("");
  const [newProjType, setNewProjType] = useState("Lambert");
  const [newProjParams, setNewProjParams] = useState("");

  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoPct, setNewPromoPct] = useState("");
  const [newPromoAmt, setNewPromoAmt] = useState("");
  const [newPromoLimit, setNewPromoLimit] = useState("");
  const [newPromoExpiry, setNewPromoExpiry] = useState("2026-12-31");

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [planSelection, setPlanSelection] = useState<string>("Professional");

  // Affaires admin states
  const [affairesFilter, setAffairesFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [adminComments, setAdminComments] = useState<Record<string, string>>({});

  // Custom simulation variables
  const [testingSqlConnection, setTestingSqlConnection] = useState(false);
  const [sqlTestMessage, setSqlTestMessage] = useState<string | null>(null);
  const [brandingTitle, setBrandingTitle] = useState("GeoMadina Professional CAD");
  const [primaryColorTheme, setPrimaryColorTheme] = useState("Dark Obsidian Indigo");
  const [isMfaEnabled, setIsMfaEnabled] = useState(true);
  const [securityEncryptionKey, setSecurityEncryptionKey] = useState("AES-256-GCM-SURV-KEY-PRO");

  // Direct SQL terminal states
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users;");
  const [sqlResult, setSqlResult] = useState<{ success: boolean; message: string; columns: string[]; rows: any[] } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [executingSql, setExecutingSql] = useState(false);

  // Fetch all admin data
  const fetchAdminData = async () => {
    try {
      const [usersRes, projRes, promoRes, logsRes, projectsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/projections"),
        fetch("/api/promo"),
        fetch("/api/admin/logs"),
        fetch("/api/projects"),
        fetch("/api/admin/settings")
      ]);

      const [usersData, projData, promoData, logsData, projectsData, settingsData] = await Promise.all([
        usersRes.json(),
        projRes.json(),
        promoRes.json(),
        logsRes.json(),
        projectsRes.json(),
        settingsRes.json()
      ]);

      setUsers(usersData || []);
      setProjections(projData || []);
      setPromoCodes(promoData || []);
      setLogs(logsData || []);
      setProjects(projectsData || []);
      setAdminSettings(settingsData);
    } catch (err) {
      console.error("Error fetching admin console data:", err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUserAction = async (userId: string, action: "ban" | "unban" | "add_credits" | "remove_credits" | "set_plan", value?: any) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, value })
      });
      if (res.ok) {
        onLogAction(`Executed admin action '${action}' for user ID ${userId}`);
        fetchAdminData();
      }
    } catch (err) {
      console.error("User administration action failed:", err);
    }
  };

  const handleValidateProject = async (projectId: string, valStatus: "approved" | "rejected") => {
    const comments = adminComments[projectId] || "";
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validationStatus: valStatus, validationComments: comments })
      });
      if (res.ok) {
        onLogAction(`Admin validation updated for project ${projectId}: ${valStatus}`);
        fetchAdminData();
        alert(`L'affaire a été ${valStatus === "approved" ? "validée" : "rejetée"} avec succès.`);
      }
    } catch (err) {
      console.error("Error validating project:", err);
    }
  };

  const handleAddProjection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjCode) return;

    try {
      const res = await fetch("/api/projections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjName,
          code: newProjCode,
          type: newProjType,
          parameters: newProjParams
        })
      });

      if (res.ok) {
        onLogAction(`Added projection system ${newProjCode}: ${newProjName}`);
        setNewProjName("");
        setNewProjCode("");
        setNewProjParams("");
        fetchAdminData();
      }
    } catch (err) {
      console.error("Could not write projection coordinate system:", err);
    }
  };

  const handleDeleteProjection = async (id: string) => {
    try {
      const res = await fetch(`/api/projections/${id}`, { method: "DELETE" });
      if (res.ok) {
        onLogAction("Deleted custom geodetic datum reference index");
        fetchAdminData();
      }
    } catch (err) {
      console.error("Could not drop projection:", err);
    }
  };

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode) return;

    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newPromoCode.toUpperCase(),
          discountPercent: parseFloat(newPromoPct) || 0,
          discountFixed: parseFloat(newPromoAmt) || 0,
          usageLimit: parseInt(newPromoLimit) || 100,
          expirationDate: newPromoExpiry
        })
      });

      if (res.ok) {
        onLogAction(`Created promo bonus code ${newPromoCode.toUpperCase()}`);
        setNewPromoCode("");
        setNewPromoPct("");
        setNewPromoAmt("");
        setNewPromoLimit("");
        fetchAdminData();
      }
    } catch (err) {
      console.error("Could not append promo code to schema:", err);
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      const res = await fetch(`/api/promo/${id}`, { method: "DELETE" });
      if (res.ok) {
        onLogAction("Revoked promotional campaign bundle");
        fetchAdminData();
      }
    } catch (err) {
      console.error("Could not delete promo code:", err);
    }
  };

  const handleUpdateSettings = async (newSettings: AdminSettings) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        onLogAction("Updated site configuration settings");
        fetchAdminData();
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  // Simulated traffic analytics data
  const trafficChartData = [
    { name: "Lun", visits: 410, points: 28 },
    { name: "Mar", visits: 520, points: 45 },
    { name: "Mer", visits: 480, points: 30 },
    { name: "Jeu", visits: 610, points: 64 },
    { name: "Ven", visits: 590, points: 52 },
    { name: "Sam", visits: 780, points: 90 },
    { name: "Dim", visits: 697, points: 81 }
  ];

  // Real Cloud MySQL Phoenix server tester
  const testSqlConnectionDirect = async () => {
    setTestingSqlConnection(true);
    setSqlTestMessage(null);
    try {
      const res = await fetch("/api/admin/sql-test");
      const data = await res.json();
      setSqlTestMessage(data.message);
    } catch (err: any) {
      setSqlTestMessage("ERREUR DE CONNEXION : Impossible de joindre le serveur de base de données.");
    } finally {
      setTestingSqlConnection(false);
    }
  };

  const handleExecuteSql = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sqlQuery.trim()) return;
    setExecutingSql(true);
    setSqlError(null);
    setSqlResult(null);

    try {
      const res = await fetch("/api/admin/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sqlQuery, author: "admin@toposuite.ma" })
      });
      const data = await res.json();
      if (res.ok) {
        setSqlResult(data);
        onLogAction(`Exécuté SQL: ${sqlQuery.substring(0, 30)}...`);
        fetchAdminData(); // refresh in case something was updated
      } else {
        setSqlError(data.error || "Une erreur s'est produite lors de l'exécution.");
      }
    } catch (err) {
      setSqlError("Impossible de se connecter au service d'arrière-plan SQL.");
    } finally {
      setExecutingSql(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* 1. Header Admin Panel inspired directly by image.png */}
      <div className="p-6 bg-[#0B1220] border border-slate-800 rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-bold tracking-widest text-[#00F5D4] bg-[#00F5D4]/10 px-2.5 py-1 rounded-full uppercase border border-[#00F5D4]/20 animate-pulse">
              <span>●</span>
              <span>PRO CONSOLE • TOPOSQL V2.4B</span>
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Console d'Administration & Gestion de Cabinet
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Modifiez la marque de votre cabinet en temps réel, connectez et créez automatiquement des tables sur le cloud (<span className="text-[#00F5D4] font-mono">45.148.118.61</span>), et administrez votre équipe de géomètres.
            </p>
          </div>

          <div className="p-3 bg-[#080C16] border border-slate-800 rounded-xl flex items-center space-x-3 shrink-0">
            <div className="bg-rose-500/20 p-2 rounded-lg border border-rose-500/20">
              <KeySquare className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 font-mono font-bold">SESSION ADMINISTRATEUR</span>
              <span className="block text-xs text-slate-300 font-bold font-mono">admin@toposuite.ma</span>
            </div>
          </div>
        </div>

        {/* Sub-tab selection bar */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs font-mono font-bold">
          <button
            onClick={() => { setActiveTab("settings"); setActiveSubTab("general"); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === "settings" && activeSubTab === "general"
                ? "bg-[#1E293B] text-white border-b-2 border-[#00F5D4]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Général
          </button>
          <button
            onClick={() => { setActiveTab("settings"); setActiveSubTab("theme"); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === "settings" && activeSubTab === "theme"
                ? "bg-[#1E293B] text-white border-b-2 border-[#00F5D4]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Thème
          </button>
          <button
            onClick={() => { setActiveTab("settings"); setActiveSubTab("sql"); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === "settings" && activeSubTab === "sql"
                ? "bg-[#1E293B] text-white border-b-2 border-[#00F5D4]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Base SQL
          </button>
          <button
            onClick={() => { setActiveTab("settings"); setActiveSubTab("maps"); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === "settings" && activeSubTab === "maps"
                ? "bg-[#1E293B] text-white border-b-2 border-[#00F5D4]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            API Cartes
          </button>
          <button
            onClick={() => { setActiveTab("settings"); setActiveSubTab("system"); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === "settings" && activeSubTab === "system"
                ? "bg-[#1E293B] text-white border-b-2 border-[#00F5D4]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Système
          </button>
        </div>
      </div>

      {/* 2. Main 10-Tab Navigation layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Horizontal Navigation row for mobile and small screens, sidebar for large */}
        <div className="w-full lg:w-64 shrink-0 bg-[#0B1220] border border-slate-800 rounded-2xl p-4 space-y-2 h-fit">
          <span className="block text-[10px] text-slate-500 font-mono font-black tracking-widest uppercase mb-3 px-2">CONSOLE SECTIONS</span>
          
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-2 lg:pb-0 scrollbar-none font-sans text-xs">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Tableau de Bord</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "users"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Utilisateurs ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("premium")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "premium"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Abonnements Premium</span>
            </button>

            <button
              onClick={() => setActiveTab("modules")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "modules"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Modules & Outils</span>
            </button>

            <button
              onClick={() => setActiveTab("affaires")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between shrink-0 ${
                activeTab === "affaires"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ScrollText className="w-4 h-4 text-emerald-400" />
                <span>Validation d'Affaires</span>
              </div>
              {projects.filter(p => p.validationStatus === "pending").length > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {projects.filter(p => p.validationStatus === "pending").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("promos")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "promos"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Codes Promo ({promoCodes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "billing"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Facturation</span>
            </button>

            <button
              onClick={() => setActiveTab("projections")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "projections"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Projections ({projections.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("documents")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "documents"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "security"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Sécurité</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "logs"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Logs & Audit ({logs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2.5 shrink-0 ${
                activeTab === "settings"
                  ? "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white hover:bg-[#1E293B]/40"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configuration Site</span>
            </button>
          </div>
        </div>

        {/* 3. Dynamic Tab Body Content */}
        <div className="flex-1 bg-[#0B1220] border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
          
          {/* A: TABLEAU DE BORD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Analytics Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-md font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4.5 h-4.5 text-[#00F5D4]" />
                    <span>Analytique & Trafic Site</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Suivi en temps réel des statistiques d'utilisation du portail GeoMadina transitant par les serveurs Phoenix.
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-[#080C16] border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE TRAFFIC</span>
                </div>
              </div>

              {/* 3 Metrics Cards exact structure as requested */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. TRAFIC TOTAL */}
                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-2 relative">
                  <span className="block text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">TRAFIC TOTAL (VISITES)</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-white font-mono">3 687</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      ↑ 12% cette semaine
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Trafic global agrégé des sessions géomètres.</p>
                </div>

                {/* 2. UTILISATEURS */}
                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-2 relative">
                  <span className="block text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">UTILISATEURS INSCRITS</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-white font-mono">{users.length || 2}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold bg-[#1E293B] px-1.5 py-0.5 rounded border border-slate-800">
                      Base MySQL Phoenix
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Comptes actifs avec crédits sur le cloud.</p>
                </div>

                {/* 3. POINTS TOPO */}
                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-2 relative">
                  <span className="block text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">POINTS TOPO STOCKÉS</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-indigo-400 font-mono">184</span>
                    <span className="text-[10px] text-[#00F5D4] font-bold bg-[#00F5D4]/10 border border-[#00F5D4]/20 px-1.5 py-0.5 rounded font-mono">
                      Nuage de points cloud
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Coordonnées topo synchronisées dans la session.</p>
                </div>

              </div>

              {/* Interactive Traffic Chart using Recharts */}
              <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-3">
                <span className="block text-xs font-bold text-slate-300 font-mono">STATISTIQUES DE CHARGE SERVEUR & REQUÊTES</span>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00F5D4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} />
                      <YAxis stroke="#94A3B8" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "#0B1220", border: "1px solid #1E293B", color: "#FFFFFF", fontSize: "11px" }} />
                      <Area type="monotone" dataKey="visits" stroke="#00F5D4" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" name="Requêtes API" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cloud SQL Connection Status panel */}
              <div className="p-4 bg-indigo-950/15 border border-indigo-900/40 rounded-xl space-y-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-indigo-400 block uppercase">SERVEUR CLOUD PHOENIX STATUS</span>
                  <div className="flex items-center space-x-2 text-xs">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-emerald-400 font-bold">CONNECTÉ (45.148.118.61:3306)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Le schéma d'audit, de licences et de projections se synchronise de manière asynchrone.</p>
                </div>
                <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={testSqlConnectionDirect}
                    disabled={testingSqlConnection}
                    className="px-3 py-1.5 bg-[#0B1220] hover:bg-slate-850 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-1 cursor-pointer transition-all active:scale-95"
                  >
                    {testingSqlConnection ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Server className="w-3.5 h-3.5" />
                    )}
                    <span>{testingSqlConnection ? "Connexion..." : "Tester Connexion Directe SQL"}</span>
                  </button>
                </div>
              </div>

              {sqlTestMessage && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[11px] font-mono rounded-lg">
                  {sqlTestMessage}
                </div>
              )}

            </div>
          )}

          {/* B: UTILISATEURS TAB */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-md font-bold text-white">Gestion des Licences des Géomètres</h3>
                  <p className="text-xs text-slate-400">Modifiez les plans d'abonnement et distribuez les crédits de calculs d'enquête.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono font-black uppercase tracking-wider">
                      <th className="p-3">Géomètre Cabinet</th>
                      <th className="p-3">Email & Contact</th>
                      <th className="p-3">Inscrit le</th>
                      <th className="p-3">Plan d'Abonnement</th>
                      <th className="p-3 text-right">Crédits</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-850/40">
                        <td className="p-3 font-bold text-white">{u.name}</td>
                        <td className="p-3">
                          <span className="block text-slate-200">{u.email}</span>
                          <span className="block text-[10px] text-slate-500 font-mono">{u.phone || "+212 522-XXXXXX"}</span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono">{u.registrationDate}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            u.subscription === "Enterprise" ? "bg-purple-950/30 text-purple-400 border-purple-900/50" :
                            u.subscription === "Professional" ? "bg-blue-950/30 text-blue-400 border-blue-900/50" :
                            "bg-slate-900 text-slate-400 border-slate-800"
                          }`}>
                            {u.subscription}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">{u.creditBalance} cr</td>
                        <td className="p-3 text-center">
                          {u.isBanned ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-bold bg-red-950/30 text-red-400 border border-red-900/30">
                              <Ban className="w-2.5 h-2.5" />
                              <span>Suspendu</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950/30 text-emerald-400 border border-emerald-900/30">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Actif</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center space-x-2">
                            {u.isBanned ? (
                              <button
                                onClick={() => handleUserAction(u.id, "unban")}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Débannir
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUserAction(u.id, "ban")}
                                className="px-2 py-1 bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-900/50 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Suspendre
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedUserId(u.id);
                              }}
                              className="px-2 py-1 bg-[#1E293B] hover:bg-[#2D3748] text-white rounded border border-slate-700 text-[10px] font-bold cursor-pointer"
                            >
                              Modifier
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modify dialog simulation */}
              {selectedUserId && (
                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold font-mono text-[#00F5D4] uppercase">
                      AJUSTEMENT DE CONTRAT POUR {users.find(u => u.id === selectedUserId)?.name}
                    </span>
                    <button onClick={() => setSelectedUserId("")} className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer">
                      ✕ Fermer
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Credit balance */}
                    <div className="space-y-2">
                      <label className="block text-slate-400 font-mono font-bold uppercase">AJUSTER LES CRÉDITS COMPTE</label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Ex: 500"
                          value={creditAmount}
                          onChange={e => setCreditAmount(e.target.value)}
                          className="flex-1 bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => {
                            handleUserAction(selectedUserId, "add_credits", creditAmount);
                            setCreditAmount("");
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded cursor-pointer text-[11px]"
                        >
                          + Créditer
                        </button>
                        <button
                          onClick={() => {
                            handleUserAction(selectedUserId, "remove_credits", creditAmount);
                            setCreditAmount("");
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded cursor-pointer text-[11px]"
                        >
                          - Déduire
                        </button>
                      </div>
                    </div>

                    {/* Subscription plans */}
                    <div className="space-y-2">
                      <label className="block text-slate-400 font-mono font-bold uppercase">CHANGER LE TIER D'ABONNEMENT</label>
                      <div className="flex space-x-2">
                        <select
                          value={planSelection}
                          onChange={e => setPlanSelection(e.target.value)}
                          className="flex-1 bg-[#0B1220] border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer outline-none focus:border-indigo-500"
                        >
                          <option value="Free">Free Basic Plan</option>
                          <option value="Basic">Basic Survey Plan</option>
                          <option value="Professional">Professional Corporate</option>
                          <option value="Enterprise">Enterprise Unlimited</option>
                        </select>
                        <button
                          onClick={() => {
                            handleUserAction(selectedUserId, "set_plan", planSelection);
                          }}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer text-[11px]"
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* C: PREMIUM SUBSCRIPTIONS TAB */}
          {activeTab === "premium" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-md font-bold text-white">Tarifs & Licences d'Abonnement</h3>
                  <p className="text-xs text-slate-400">Structure des prix des cabinets de géomètres en Dirham Marocain (MAD).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* 1. Free */}
                <div className="bg-[#080C16] border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="block font-bold text-slate-400 font-mono text-xs uppercase">Basic Free</span>
                    <span className="block text-xl font-black text-white">0 MAD <span className="text-[10px] text-slate-500 font-normal">/mois</span></span>
                    <p className="text-[11px] text-slate-400">Pour géomètres indépendants faisant des tests.</p>
                    <ul className="text-[10px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-850">
                      <li>✓ CAD de base 2D</li>
                      <li>✓ 5 points max</li>
                      <li>✗ Pas de GPS RTK live</li>
                      <li>✗ Pas de dtm volumes</li>
                    </ul>
                  </div>
                  <button className="w-full py-1.5 bg-slate-900 border border-slate-850 text-slate-300 rounded text-xs font-bold font-mono">Plan Actuel</button>
                </div>

                {/* 2. Basic Survey */}
                <div className="bg-[#080C16] border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="block font-bold text-indigo-400 font-mono text-xs uppercase">Basic Survey</span>
                    <span className="block text-xl font-black text-white">450 MAD <span className="text-[10px] text-slate-500 font-normal">/mois</span></span>
                    <p className="text-[11px] text-slate-400">Pour petits cabinets topographiques régionaux.</p>
                    <ul className="text-[10px] text-slate-400 space-y-1.5 pt-2 border-t border-[#1E293B]">
                      <li>✓ CAD complet 2D/3D</li>
                      <li>✓ 100 points par projet</li>
                      <li>✓ Bornage parcellaire</li>
                      <li>✓ Profil d'élévation DTM</li>
                    </ul>
                  </div>
                  <button className="w-full py-1.5 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 rounded text-xs font-bold font-mono">Upgrade</button>
                </div>

                {/* 3. Professional Corporate */}
                <div className="bg-[#080C16] border border-indigo-500/40 rounded-xl p-4 space-y-3 flex flex-col justify-between relative shadow-lg shadow-indigo-500/5">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#00F5D4] text-[#0B1220] font-mono text-[9px] px-2 py-0.5 rounded-full font-black uppercase">RECOMMENDED</div>
                  <div className="space-y-2 pt-2">
                    <span className="block font-bold text-[#00F5D4] font-mono text-xs uppercase">Professional Corp</span>
                    <span className="block text-xl font-black text-white">950 MAD <span className="text-[10px] text-slate-500 font-normal">/mois</span></span>
                    <p className="text-[11px] text-slate-400">Idéal pour les ingénieurs IGT et cabinets d'expertise agréés.</p>
                    <ul className="text-[10px] text-slate-300 space-y-1.5 pt-2 border-t border-indigo-900/30">
                      <li>✓ Tout le contenu Basic</li>
                      <li>✓ Illimité en coordonnées</li>
                      <li>✓ GPS / GNSS RTK permanent</li>
                      <li>✓ Calculs de volumes volumétriques</li>
                      <li>✓ Export DWG / LandXML direct</li>
                    </ul>
                  </div>
                  <button className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold font-mono">S'abonner</button>
                </div>

                {/* 4. Enterprise Unlimited */}
                <div className="bg-[#080C16] border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="block font-bold text-purple-400 font-mono text-xs uppercase">Enterprise Limitless</span>
                    <span className="block text-xl font-black text-white">2 500 MAD <span className="text-[10px] text-slate-500 font-normal">/mois</span></span>
                    <p className="text-[11px] text-slate-400">Pour administrations cadastrales et grands cabinets nationaux.</p>
                    <ul className="text-[10px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-850">
                      <li>✓ Session multi-utilisateurs</li>
                      <li>✓ Serveur cloud SQL privé dédié</li>
                      <li>✓ Intégration API ArcGIS/QGIS</li>
                      <li>✓ Support prioritaire 24/7</li>
                    </ul>
                  </div>
                  <button className="w-full py-1.5 bg-purple-600/30 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 rounded text-xs font-bold font-mono">Contacter</button>
                </div>

              </div>
            </div>
          )}

          {/* D: MODULES & OUTILS TAB */}
          {activeTab === "modules" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-md font-bold text-white">Modules Actifs & Intégrations</h3>
                  <p className="text-xs text-slate-400">Activez ou configurez les passerelles géographiques et les algorithmes de la plateforme.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">Convertisseur Lambert Marocain</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">ACTIF</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Moteur de projection calculant les ellipsoïdes Clarke 1880 d'après Merchich d'après la formule officielle du cadastre national (ONIGT / Conservation Foncière).
                  </p>
                </div>

                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">Calculateur d'Ajustement de Cheminement</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">ACTIF</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Permet d'appliquer la compensation des traverses via la méthode Bowditch / Moindres carrés directement aux traverses polygonales fermées ou ouvertes.
                  </p>
                </div>

                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">Calcul Volumétrique DTM & Triangulation</span>
                    <span className="text-[10px] text-[#00F5D4] font-mono font-bold bg-[#00F5D4]/10 px-2 py-0.5 rounded border border-[#00F5D4]/20">PREMIUM</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Triangulation Irregular Network (TIN) haute vitesse avec estimation du volume de déblai / remblai pour les calculs de terrassement et de nivellement de chantier.
                  </p>
                </div>

                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">Reconnaissance de Forme Parcelle AI</span>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20">BETA PRO</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Détection automatique des parcelles et polygones délimités sur des orthophotos aériennes à l'aide de modèles de vision Gemini.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* E: CODES PROMO TAB */}
          {activeTab === "promos" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left panel: Add promo code form */}
              <form onSubmit={handleAddPromo} className="bg-[#080C16] p-4 border border-slate-800 rounded-xl space-y-4 h-fit">
                <span className="block text-xs font-bold font-mono text-indigo-400 uppercase">Créer un code promo</span>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 mb-1">NOM DU CODE PROMO</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MAROC2026"
                      value={newPromoCode}
                      onChange={e => setNewPromoCode(e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-white uppercase outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">RÉDUCTION %</label>
                      <input
                        type="number"
                        placeholder="20"
                        value={newPromoPct}
                        onChange={e => setNewPromoPct(e.target.value)}
                        className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">FIXE (MAD)</label>
                      <input
                        type="number"
                        placeholder="100"
                        value={newPromoAmt}
                        onChange={e => setNewPromoAmt(e.target.value)}
                        className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">LIMITE D'USAGE</label>
                      <input
                        type="number"
                        placeholder="150"
                        value={newPromoLimit}
                        onChange={e => setNewPromoLimit(e.target.value)}
                        className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">DATE D'EXPIRATION</label>
                      <input
                        type="date"
                        value={newPromoExpiry}
                        onChange={e => setNewPromoExpiry(e.target.value)}
                        className="w-full bg-[#0B1220] border border-slate-800 rounded px-2.5 py-1.5 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1 shadow-lg shadow-indigo-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer la campagne</span>
                  </button>
                </div>
              </form>

              {/* Right panel: promo list */}
              <div className="md:col-span-2 space-y-3">
                <span className="block text-xs font-bold font-mono text-slate-400">DISCOUNTS ACTIFS ({promoCodes.length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promoCodes.map(promo => (
                    <div key={promo.id} className="p-4 bg-[#080C16] border border-slate-800 rounded-xl flex justify-between items-center font-mono text-xs shadow-inner">
                      <div className="space-y-1">
                        <span className="block font-bold text-indigo-400 text-sm">{promo.code}</span>
                        <div className="text-[10px] text-slate-400 space-y-0.5">
                          {promo.discountPercent > 0 ? (
                            <span className="block text-emerald-400 font-bold">{promo.discountPercent}% DE RÉDUCTION</span>
                          ) : (
                            <span className="block text-emerald-400 font-bold">{promo.discountFixed} cr Crédits gratuits</span>
                          )}
                          <span className="block">Expire le: {promo.expirationDate}</span>
                          <span className="block">Usage: {promo.usageCount} / {promo.usageLimit} utilisés</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePromo(promo.id)}
                        className="text-red-400 hover:text-red-500 p-2 rounded hover:bg-red-950/20 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* F: BILLING TAB */}
          {activeTab === "billing" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-md font-bold text-white">Facturation & Transactions</h3>
                  <p className="text-xs text-slate-400">Historique des abonnements de votre cabinet et reçus PDF.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-mono text-xs">
                  <div>
                    <span className="block font-bold text-white">FACTURE #2026-042 - CABINET ALAMI SURVEYS</span>
                    <span className="text-[10px] text-slate-400">Généré le: 2026-06-15 • Plan Professional (950 MAD)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-black">PAYÉ VIA CMI</span>
                    <button className="px-3 py-1 bg-[#1E293B] hover:bg-slate-700 text-white rounded font-bold cursor-pointer transition-colors text-[10px]">
                      Télécharger PDF
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-mono text-xs">
                  <div>
                    <span className="block font-bold text-white">FACTURE #2026-011 - CABINET BENJELLOUN CAD</span>
                    <span className="text-[10px] text-slate-400">Généré le: 2026-05-15 • Plan Professional (950 MAD)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-black">PAYÉ VIA CMI</span>
                    <button className="px-3 py-1 bg-[#1E293B] hover:bg-slate-700 text-white rounded font-bold cursor-pointer transition-colors text-[10px]">
                      Télécharger PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* G: PROJECTIONS TAB */}
          {activeTab === "projections" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left panel: Add projection form */}
              <form onSubmit={handleAddProjection} className="bg-[#080C16] p-4 border border-slate-800 rounded-xl space-y-4 h-fit">
                <span className="block text-xs font-bold font-mono text-indigo-400 uppercase">Insérer un système géodésique</span>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Nom du système de coordonnées</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lambert Zone 1 Morocco"
                      value={newProjName}
                      onChange={e => setNewProjName(e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Code EPSG ou Autorité</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EPSG:26191"
                      value={newProjCode}
                      onChange={e => setNewProjCode(e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Type de projection</label>
                    <select
                      value={newProjType}
                      onChange={e => setNewProjType(e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-white cursor-pointer outline-none focus:border-indigo-500"
                    >
                      <option value="Lambert">Lambert Conformal Conic</option>
                      <option value="Transverse Mercator">Transverse Mercator</option>
                      <option value="Geographic">Geographic Coords (Ellipsoidal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono mb-1">Ellipsoïde & Paramètres</label>
                    <textarea
                      placeholder="e.g. Ellipsoid Clarke 1880, Latitude of origin: 33.30N"
                      value={newProjParams}
                      onChange={e => setNewProjParams(e.target.value)}
                      rows={2}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-white text-xs outline-none focus:border-indigo-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1 shadow-lg shadow-indigo-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Sauvegarder la Projection</span>
                  </button>
                </div>
              </form>

              {/* Right panel: projection database */}
              <div className="md:col-span-2 space-y-3">
                <span className="block text-xs font-bold font-mono text-slate-400">DATUMS GÉODÉSIQUES EN BASE ({projections.length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projections.map(proj => (
                    <div key={proj.id} className="p-3 bg-[#080C16] border border-slate-800 rounded-xl flex justify-between items-start shadow-inner">
                      <div className="text-xs space-y-1">
                        <span className="block font-bold text-white">{proj.name}</span>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-[#0B1220] text-[10px] font-mono font-bold text-indigo-400 border border-slate-850">
                          {proj.code}
                        </span>
                        <span className="block text-[10px] text-slate-500">Formule: {proj.type}</span>
                        {proj.parameters && (
                          <span className="block text-[9px] text-slate-400 font-mono leading-tight bg-[#0B1220] p-1.5 rounded border border-slate-850">{proj.parameters}</span>
                        )}
                      </div>
                      {!proj.code.includes("2619") && (
                        <button
                          onClick={() => handleDeleteProjection(proj.id)}
                          className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-950/20 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* H: DOCUMENTS TAB */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-md font-bold text-white">Archives & Modèles d'Enquête Légaux</h3>
                  <p className="text-xs text-slate-400">Modèles de rapports exigés par l'Agence Nationale de la Conservation Foncière (ANCFCC).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                
                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-3">
                  <span className="block font-bold text-white uppercase font-mono text-[10px] text-indigo-400">Modèle PV de Bornage</span>
                  <p className="text-[11px] text-slate-400">Rapport verbal d'arpentage officiel pour l'établissement de titres de propriété.</p>
                  <button className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-white rounded font-bold cursor-pointer w-full">Utiliser ce Modèle</button>
                </div>

                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-3">
                  <span className="block font-bold text-white uppercase font-mono text-[10px] text-indigo-400">Layout Plan de Situation</span>
                  <p className="text-[11px] text-slate-400">Modèle cartographique échelle 1:2000 ou 1:5000 avec flèche Nord automatique.</p>
                  <button className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-white rounded font-bold cursor-pointer w-full">Utiliser ce Modèle</button>
                </div>

                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-3">
                  <span className="block font-bold text-white uppercase font-mono text-[10px] text-indigo-400">Plan de Récolement Assainissement</span>
                  <p className="text-[11px] text-slate-400">Cartographie d'arpentage final pour réseaux de canalisations d'eaux usées.</p>
                  <button className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-white rounded font-bold cursor-pointer w-full">Utiliser ce Modèle</button>
                </div>

              </div>
            </div>
          )}

          {/* I: SÉCURITÉ TAB */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-md font-bold text-white">Sécurité du Système & Cryptage</h3>
                  <p className="text-xs text-slate-400">Contrôle des privilèges d'accès, clés cryptographiques et double authentification.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                
                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-4">
                  <span className="block text-indigo-400 font-bold uppercase">DOUBLE AUTHENTIFICATION DES GÉOMÈTRES</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Statut MFA Obligatoire :</span>
                    <button
                      type="button"
                      onClick={() => setIsMfaEnabled(!isMfaEnabled)}
                      className={`px-3 py-1 rounded font-bold cursor-pointer transition-all ${
                        isMfaEnabled ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                      }`}
                    >
                      {isMfaEnabled ? "ACTIF (REQUIS)" : "DÉSACTIVÉ"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans">
                    Force tous les ingénieurs inscrits à saisir un code d'authentification reçu sur leur appareil mobile (SMS/Authenticator) avant de pouvoir modifier les parcelles.
                  </p>
                </div>

                <div className="p-4 bg-[#080C16] border border-slate-800 rounded-xl space-y-4">
                  <span className="block text-indigo-400 font-bold uppercase">CLÉ DE CRYPTAGE AES CAD</span>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-500">CLÉ DE HACHAGE DES FICHIERS DXF/DWG :</label>
                    <input
                      type="text"
                      value={securityEncryptionKey}
                      onChange={e => setSecurityEncryptionKey(e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-white font-mono text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans">
                    Les fichiers DXF et coordonnées géométriques exportées du serveur sont signés cryptographiquement avec cette clé d'agence.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* K: validation des affaires tab */}
          {activeTab === "affaires" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold font-mono text-indigo-400">VALIDATION ET RECOULEMENT DES AFFAIRES CADASTRALES</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Approuvez ou rejetez les limites de bornage et relevés GNSS des dossiers topographiques soumis par vos ingénieurs.</p>
                </div>
                <div className="flex gap-1.5 bg-[#080C16] p-1 rounded-lg border border-slate-800 font-mono text-[10px]">
                  {[
                    { id: "all", label: "Toutes" },
                    { id: "pending", label: "En Attente" },
                    { id: "approved", label: "Validées" },
                    { id: "rejected", label: "Rejetées" }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setAffairesFilter(f.id as any)}
                      className={`px-2 py-1 rounded cursor-pointer ${
                        affairesFilter === f.id ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const filtered = projects.filter(p => {
                    if (affairesFilter === "all") return true;
                    if (affairesFilter === "pending") return p.validationStatus === "pending";
                    if (affairesFilter === "approved") return p.validationStatus === "approved";
                    if (affairesFilter === "rejected") return p.validationStatus === "rejected";
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 bg-[#080C16] border border-slate-850 rounded-2xl space-y-2 text-xs">
                        <p className="text-slate-500">Aucun dossier trouvé avec le filtre sélectionné.</p>
                      </div>
                    );
                  }

                  return filtered.map(p => {
                    // Calculation helpers (using math formula approximations)
                    const pointsCount = p.points ? p.points.length : 0;
                    
                    // Area helper
                    let area = 0;
                    if (p.points && p.points.length > 2) {
                      let sum = 0;
                      for (let i = 0; i < p.points.length; i++) {
                        const current = p.points[i];
                        const next = p.points[(i + 1) % p.points.length];
                        sum += current.x * next.y - next.x * current.y;
                      }
                      area = Math.abs(sum) / 2;
                    }

                    return (
                      <div key={p.id} className="bg-[#080C16] border border-slate-850 p-5 rounded-2xl space-y-4 shadow-sm hover:border-slate-700 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-850 pb-3">
                          <div>
                            <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest block font-bold">AFFAIRE CADASTRALE N° {p.id.toUpperCase()}</span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{p.name}</h4>
                            <span className="text-[10px] text-slate-400 block mt-1 font-serif">
                              Géomètre: <strong className="text-slate-300 font-sans">{p.surveyorName || "Ahmed Alami"}</strong> • Client: <strong className="text-slate-300 font-sans">{p.clientName}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              p.validationStatus === "approved" 
                                ? "bg-emerald-950/55 text-emerald-400 border-emerald-900/40" 
                                : p.validationStatus === "rejected"
                                ? "bg-rose-950/55 text-rose-400 border-rose-900/40"
                                : "bg-amber-950/55 text-amber-400 border-amber-900/40 animate-pulse"
                            }`}>
                              {p.validationStatus === "approved" ? "VALIDE" : p.validationStatus === "rejected" ? "REJETÉ" : "EN ATTENTE"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                          <div className="bg-[#0B1220] p-2.5 rounded-lg border border-slate-850 text-center">
                            <span className="block text-[8px] text-slate-500 uppercase">Superficie Gauss</span>
                            <span className="text-xs font-bold text-white">{area.toFixed(2)} m²</span>
                          </div>
                          <div className="bg-[#0B1220] p-2.5 rounded-lg border border-slate-850 text-center">
                            <span className="block text-[8px] text-slate-500 uppercase">Nombre de Sommets</span>
                            <span className="text-xs font-bold text-indigo-400">{pointsCount} sommets</span>
                          </div>
                          <div className="bg-[#0B1220] p-2.5 rounded-lg border border-slate-850 text-center">
                            <span className="block text-[8px] text-slate-500 uppercase">Titre Foncier</span>
                            <span className="text-xs font-bold text-emerald-400">{p.parcelInvestigation?.parcelNumber || "N/A"}</span>
                          </div>
                          <div className="bg-[#0B1220] p-2.5 rounded-lg border border-slate-850 text-center">
                            <span className="block text-[8px] text-slate-500 uppercase">Projection Géodésique</span>
                            <span className="text-[10px] font-bold text-indigo-300 truncate block mt-0.5">{p.coordinateSystem?.name || "Morocco Lambert 1"}</span>
                          </div>
                        </div>

                        {/* List coordinates table inside */}
                        {p.points && p.points.length > 0 && (
                          <div className="space-y-1.5 bg-[#0B1220] p-3 rounded-xl border border-slate-850 text-[10px] font-mono">
                            <span className="text-[9px] text-slate-500 font-bold block uppercase mb-1">Listing des Coordonnées Levées</span>
                            <div className="grid grid-cols-4 gap-1.5 text-slate-500 border-b border-slate-850 pb-1">
                              <span>Point ID</span>
                              <span>Easting X (m)</span>
                              <span>Northing Y (m)</span>
                              <span>Altitude Z (m)</span>
                            </div>
                            <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                              {p.points.map(pt => (
                                <div key={pt.id} className="grid grid-cols-4 gap-1.5 text-slate-300">
                                  <span className="font-bold text-[#00F5D4]">{pt.name}</span>
                                  <span>{pt.x.toFixed(3)}</span>
                                  <span>{pt.y.toFixed(3)}</span>
                                  <span>{pt.z.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions Panel */}
                        <div className="pt-2 border-t border-slate-850 space-y-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase font-mono">Commentaires de validation d'expert (Moroccan Land Registry Note)</label>
                            <textarea
                              placeholder="Indiquez les remarques ou corrections requises (ex: Alignement conforme sur la borne GPS03 d'origine. Dossier validé.)"
                              value={adminComments[p.id] || p.validationComments || ""}
                              onChange={e => setAdminComments({ ...adminComments, [p.id]: e.target.value })}
                              rows={2}
                              className="w-full bg-[#0B1220] border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                            ></textarea>
                          </div>

                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              onClick={() => handleValidateProject(p.id, "rejected")}
                              className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-900/30 rounded-lg font-bold transition-all cursor-pointer"
                            >
                              ✗ Rejeter avec corrections
                            </button>
                            <button
                              onClick={() => handleValidateProject(p.id, "approved")}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
                            >
                              ✓ Valider & Enregistrer l'Affaire
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* J: LOGS & AUDIT TAB */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold font-mono text-indigo-400">JOURNAL D'AUDIT COMPLET (CADASTRE AUDIT TRAIL)</span>
                <span className="text-[10px] text-[#00F5D4] font-mono font-bold animate-pulse">● SECURED BY AES-256</span>
              </div>

              <div className="bg-[#080C16] border border-slate-800 rounded-xl p-4 h-[350px] overflow-y-auto space-y-2 font-mono text-[10px] shadow-inner">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-start p-2 rounded bg-[#0B1220] border border-slate-850 hover:border-slate-700 transition-colors shadow-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">[{log.timestamp.replace("T", " ").substring(0, 19)}]</span>
                      <span className="text-[#00F5D4] font-bold">{log.action}</span>
                    </div>
                    <div className="text-slate-400 flex items-center space-x-1">
                      <span>Auteur:</span>
                      <span className="text-indigo-400 font-bold">{log.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && adminSettings && (
            <div className="space-y-6">
              {/* Header Title with Active Subtab Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    CONSOLE CONFIGURATION • {activeSubTab.toUpperCase()}
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center space-x-2">
                    <span>Paramètres Globaux du Portail</span>
                    <span className="text-slate-600 font-normal">/</span>
                    <span className="text-indigo-400 capitalize">{activeSubTab === "sql" ? "Direct SQL Query" : activeSubTab === "maps" ? "Cartes & Géodésie" : activeSubTab}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeSubTab === "general" && "Gérez l'identité visuelle de connexion, le titre de l'application et les bannières d'alerte."}
                    {activeSubTab === "theme" && "Sélectionnez le schéma de couleur maître et la force de l'effet de flou (Glassmorphism)."}
                    {activeSubTab === "sql" && "Requêtez en direct la base de données Phoenix Topo DB via des instructions SQL."}
                    {activeSubTab === "maps" && "Configurez le fournisseur de tuiles cartographiques par défaut et les clés d'API SIG."}
                    {activeSubTab === "system" && "Activez ou désactivez les modules topographiques pour l'ensemble des géomètres agréés."}
                  </p>
                </div>

                <button
                  onClick={() => handleUpdateSettings(adminSettings)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 self-start sm:self-center"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enregistrer Tout</span>
                </button>
              </div>

              {/* Subtab 1: GENERAL */}
              {activeSubTab === "general" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4 bg-[#080C16] border border-slate-800 p-6 rounded-2xl">
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-850 pb-2">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      <span>Branding & News nationales</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-mono font-bold text-slate-400">TITRE PRINCIPAL DU SITE</label>
                        <input
                          type="text"
                          value={adminSettings.brandingTitle}
                          onChange={e => handleUpdateSettings({ ...adminSettings, brandingTitle: e.target.value })}
                          className="w-full bg-[#0B1220] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-mono font-bold text-slate-400">BANNER D'ANNONCE ACTIVE</label>
                        <input
                          type="text"
                          value={adminSettings.announcementBanner}
                          onChange={e => handleUpdateSettings({ ...adminSettings, announcementBanner: e.target.value })}
                          className="w-full bg-[#0B1220] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-mono font-bold text-slate-400">SOUS-TITRE DE LA PAGE DE CONNEXION</label>
                      <textarea
                        rows={2}
                        value={adminSettings.loginSubtitle}
                        onChange={e => handleUpdateSettings({ ...adminSettings, loginSubtitle: e.target.value })}
                        className="w-full bg-[#0B1220] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div className="pt-2 flex flex-wrap gap-6">
                      <label className="flex items-center space-x-3 cursor-pointer bg-[#0B1220] p-3 rounded-xl border border-slate-850 hover:border-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={adminSettings.showAnnouncement}
                          onChange={e => handleUpdateSettings({ ...adminSettings, showAnnouncement: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-[#0B1220] border-slate-800"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-200">Afficher la Bannière d'Annonce</span>
                          <span className="block text-[10px] text-slate-500 font-mono">Bannière globale en haut du tableau de bord</span>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer bg-[#0B1220] p-3 rounded-xl border border-slate-850 hover:border-slate-800 transition-colors">
                        <input
                          type="checkbox"
                          checked={adminSettings.allowRegistration}
                          onChange={e => handleUpdateSettings({ ...adminSettings, allowRegistration: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-[#0B1220] border-slate-800"
                        />
                        <div>
                          <span className="block text-xs font-bold text-slate-200">Autoriser les inscriptions</span>
                          <span className="block text-[10px] text-slate-500 font-mono">Activer le bouton de création de compte géomètre</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 bg-[#080C16] border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-850 pb-2">
                        <Ban className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>Mode Maintenance</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        L'activation de cette option déconnectera tous les géomètres non-administrateurs et affichera une page de maintenance nationale officielle. Vous gardez l'accès complet en tant qu'admin.
                      </p>
                    </div>

                    <div className="bg-[#0B1220] border border-amber-500/20 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-400">SÉCURITÉ LOCK</span>
                        <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded ${adminSettings.maintenanceMode ? "bg-amber-500 text-slate-950 animate-pulse" : "bg-slate-800 text-slate-500"}`}>
                          {adminSettings.maintenanceMode ? "ACTIVE" : "STANDBY"}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleUpdateSettings({ ...adminSettings, maintenanceMode: !adminSettings.maintenanceMode })}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          adminSettings.maintenanceMode
                            ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                        }`}
                      >
                        {adminSettings.maintenanceMode ? "Désactiver la Maintenance" : "Activer la Maintenance"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: THEME */}
              {activeSubTab === "theme" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4 bg-[#080C16] border border-slate-800 p-6 rounded-2xl">
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-850 pb-2">
                      <Boxes className="w-4 h-4 text-indigo-400" />
                      <span>Palette de Couleur Maître</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Modifiez instantanément les accents de boutons, de liens, d'icônes et d'arrière-plan du site entier.
                    </p>

                    <div className="space-y-2.5 pt-2">
                      {[
                        { id: "indigo", name: "Deep Indigo & Cyber Mint (Standard)", color: "bg-indigo-600 border-indigo-400" },
                        { id: "emerald", name: "Moroccan Emerald & Jade (Foncier)", color: "bg-emerald-600 border-emerald-400" },
                        { id: "amber", name: "Solar Amber & Charcoal (Chantier)", color: "bg-amber-600 border-amber-400" },
                        { id: "amethyst", name: "Royal Amethyst & Rose (Premium)", color: "bg-purple-600 border-purple-400" },
                        { id: "crimson", name: "Crimson Cyber & Ruby (Urgence)", color: "bg-red-600 border-red-400" },
                      ].map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => handleUpdateSettings({ ...adminSettings, primaryColorTheme: theme.id })}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                            adminSettings.primaryColorTheme === theme.id
                              ? "bg-slate-800 border-[#00F5D4] font-bold"
                              : "bg-[#0B1220] border-slate-850 hover:border-slate-800"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-3.5 h-3.5 rounded-full ${theme.color} border`}></span>
                            <span>{theme.name}</span>
                          </div>
                          {adminSettings.primaryColorTheme === theme.id && (
                            <span className="text-[#00F5D4] font-mono text-[9px] font-black">ACTIVE</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 bg-[#080C16] border border-slate-800 p-6 rounded-2xl">
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-850 pb-2">
                      <Settings className="w-4 h-4 text-indigo-400" />
                      <span>Verre & Transparence (Glass)</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Ajustez le niveau de flou d'arrière-plan des panneaux et des fiches cadastrales.
                    </p>

                    <div className="space-y-2.5 pt-2">
                      {[
                        { id: "none", name: "Solide - Pas de transparence", desc: "Arrière-plans foncés opaques pour un rendu brutal" },
                        { id: "light", name: "Léger - Flou 4px", desc: "Transparence subtile à 90% d'opacité" },
                        { id: "medium", name: "Moyen - Flou 12px (Conseillé)", desc: "Effet verre givré classique" },
                        { id: "high", name: "Ultra - Flou 24px", desc: "Transparence maximale à 50% d'opacité avec néon glow" },
                      ].map(g => (
                        <button
                          key={g.id}
                          onClick={() => handleUpdateSettings({ ...adminSettings, glassmorphismStrength: g.id })}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col justify-center cursor-pointer ${
                            adminSettings.glassmorphismStrength === g.id
                              ? "bg-slate-800 border-[#00F5D4] font-bold"
                              : "bg-[#0B1220] border-slate-850 hover:border-slate-800"
                          }`}
                        >
                          <span className="text-xs text-white font-bold">{g.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">{g.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 bg-[#080C16] border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-850 pb-2">
                        <Activity className="w-4 h-4 text-[#00F5D4]" />
                        <span>Aperçu de la Marque</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-2">
                        Voici à quoi ressemblent vos contrôles de cartes thématiques actuelles :
                      </p>
                    </div>

                    <div className="bg-[#0B1220] border border-slate-850 p-5 rounded-2xl space-y-4 shadow-xl">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-xs font-bold text-white">{adminSettings.brandingTitle}</span>
                      </div>
                      
                      <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400">
                        PRIMARY_HEX_VALUE: {
                          adminSettings.primaryColorTheme === "indigo" ? "#4F46E5" :
                          adminSettings.primaryColorTheme === "emerald" ? "#059669" :
                          adminSettings.primaryColorTheme === "amber" ? "#D97706" :
                          adminSettings.primaryColorTheme === "amethyst" ? "#7C3AED" : "#DC2626"
                        }
                      </div>

                      <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg">
                        Bouton Action Maître
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 3: SQL */}
              {activeSubTab === "sql" && (
                <div className="space-y-6">
                  {/* SQL Config Header */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#080C16] border border-slate-800 p-6 rounded-2xl">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold text-slate-400">SERVEUR CLOUD HOST</label>
                      <input
                        type="text"
                        value={adminSettings.mysqlHost}
                        onChange={e => handleUpdateSettings({ ...adminSettings, mysqlHost: e.target.value })}
                        className="w-full bg-[#0B1220] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold text-slate-400">PORT DE CONNEXION</label>
                      <input
                        type="number"
                        value={adminSettings.mysqlPort}
                        onChange={e => handleUpdateSettings({ ...adminSettings, mysqlPort: parseInt(e.target.value) || 3306 })}
                        className="w-full bg-[#0B1220] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold text-slate-400">UTILISATEUR SQL</label>
                      <input
                        type="text"
                        value={adminSettings.mysqlUser}
                        onChange={e => handleUpdateSettings({ ...adminSettings, mysqlUser: e.target.value })}
                        className="w-full bg-[#0B1220] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono font-bold text-slate-400">BASE DE DONNÉES CIBLE</label>
                      <input
                        type="text"
                        value={adminSettings.mysqlDatabase}
                        onChange={e => handleUpdateSettings({ ...adminSettings, mysqlDatabase: e.target.value })}
                        className="w-full bg-[#0B1220] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* SQL Terminal Console */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-[#080C16] border border-slate-800 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center space-x-2">
                          <Database className="w-4 h-4 text-emerald-400" />
                          <span>Fichier de Commandes</span>
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Sélectionnez un modèle d'instruction SQL prêt à l'exécution ou saisissez-le à droite :
                      </p>

                      <div className="space-y-2 pt-1 font-mono text-[10px]">
                        {[
                          { label: "Lister tous les géomètres", sql: "SELECT * FROM users;" },
                          { label: "Lister tous les projets CAD", sql: "SELECT * FROM projects;" },
                          { label: "Afficher le journal de sécurité", sql: "SELECT * FROM logs;" },
                          { label: "Voir les projections Lambert", sql: "SELECT * FROM projections;" },
                          { label: "Créditer Ahmed Alami (5000 jetons)", sql: "UPDATE users SET creditBalance = 5000 WHERE id = 'usr1';" },
                          { label: "Débannir l'utilisateur test", sql: "UPDATE users SET isBanned = false WHERE id = 'usr5';" }
                        ].map((tpl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setSqlQuery(tpl.sql);
                              setSqlError(null);
                              setSqlResult(null);
                            }}
                            className="w-full p-2.5 bg-[#0B1220] hover:bg-slate-800 border border-slate-850 hover:border-slate-700 rounded-xl text-left text-indigo-400 transition-colors font-bold cursor-pointer"
                          >
                            <span className="block text-slate-200 text-[11px] font-sans font-bold">{tpl.label}</span>
                            <span className="block text-[9px] text-slate-500 mt-0.5 truncate">{tpl.sql}</span>
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={testSqlConnectionDirect}
                          disabled={testingSqlConnection}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-mono text-[10px] rounded-lg cursor-pointer"
                        >
                          {testingSqlConnection ? "Diagnostic en cours..." : "Tester Ping Serveur"}
                        </button>
                      </div>

                      {sqlTestMessage && (
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 font-mono text-[9px] leading-normal">
                          {sqlTestMessage}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-2 bg-[#080C16] border border-slate-800 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center space-x-2">
                          <Server className="w-4 h-4 text-indigo-400" />
                          <span>Console interactive TopoSQL</span>
                        </h4>
                        <span className="text-[9px] font-mono text-[#00F5D4] bg-[#00F5D4]/10 border border-[#00F5D4]/20 px-2 py-0.5 rounded uppercase font-black animate-pulse">
                          ● PHOENIX_ACTIVE
                        </span>
                      </div>

                      <form onSubmit={handleExecuteSql} className="space-y-3">
                        <textarea
                          rows={4}
                          value={sqlQuery}
                          onChange={e => setSqlQuery(e.target.value)}
                          placeholder="Saisissez votre commande SQL ici..."
                          className="w-full bg-[#05080E] border border-slate-800 rounded-2xl p-4 font-mono text-xs text-[#00F5D4] focus:outline-none focus:border-[#00F5D4] placeholder-slate-700 shadow-inner leading-relaxed"
                        />
                        <div className="flex items-center justify-end">
                          <button
                            type="submit"
                            disabled={executingSql}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-mono text-[11px] font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center space-x-2"
                          >
                            <span>{executingSql ? "Exécution..." : "EXECUTE SQL (F5)"}</span>
                          </button>
                        </div>
                      </form>

                      {sqlError && (
                        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 font-mono text-[11px]">
                          <strong>SQL ERROR:</strong> {sqlError}
                        </div>
                      )}

                      {sqlResult && (
                        <div className="space-y-3 pt-2">
                          <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 text-indigo-300 font-mono text-[11px] rounded-xl flex items-center justify-between">
                            <span>{sqlResult.message}</span>
                            <span className="text-[10px] text-slate-500">Query duration: 18ms</span>
                          </div>

                          <div className="overflow-x-auto border border-slate-850 rounded-xl bg-[#05080E]">
                            <table className="w-full text-left border-collapse font-mono text-[10px]">
                              <thead>
                                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                                  {sqlResult.columns.map((col, i) => (
                                    <th key={i} className="p-2.5 font-bold tracking-wider uppercase border-r border-slate-850 last:border-r-0">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sqlResult.rows.map((row, idx) => (
                                  <tr key={idx} className="border-b border-slate-850 hover:bg-slate-900/50 transition-colors last:border-b-0 text-slate-300">
                                    {sqlResult.columns.map((col, i) => (
                                      <td key={i} className="p-2.5 border-r border-slate-850 last:border-r-0 truncate max-w-[150px]" title={String((row as any)[col])}>
                                        {typeof (row as any)[col] === "boolean" 
                                          ? ((row as any)[col] ? "TRUE" : "FALSE") 
                                          : String((row as any)[col] ?? "NULL")}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 4: MAPS */}
              {activeSubTab === "maps" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 bg-[#080C16] border border-slate-800 p-6 rounded-2xl">
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-850 pb-2">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span>Fournisseur de Cartographie</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Sélectionnez la couche satellite, cartographique ou topographique par défaut pour le module SIG.
                    </p>

                    <div className="space-y-2.5 pt-2">
                      {[
                        { id: "osm", name: "OpenStreetMap Standard", desc: "Plan vectoriel gratuit, rafraîchi par la communauté." },
                        { id: "satellite", name: "Esri World Imagery Satellite", desc: "Imagerie aérienne satellite haute définition globale." },
                        { id: "topo", name: "OpenTopoMap (Modèle de relief)", desc: "Affiche les courbes de niveau et altitudes du terrain." },
                        { id: "carto-dark", name: "CartoDB Dark Matter (Nuit)", desc: "Fond de carte sombre minimaliste idéal pour les levés de nuit." }
                      ].map(provider => (
                        <button
                          key={provider.id}
                          onClick={() => handleUpdateSettings({ ...adminSettings, mapTileProvider: provider.id })}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col justify-center cursor-pointer ${
                            adminSettings.mapTileProvider === provider.id
                              ? "bg-slate-800 border-[#00F5D4] font-bold"
                              : "bg-[#0B1220] border-slate-850 hover:border-slate-800"
                          }`}
                        >
                          <span className="text-xs text-white font-bold">{provider.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">{provider.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 bg-[#080C16] border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-850 pb-2">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                        <span>Coordonnées & Référence Maroc</span>
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Le portail utilise les formules de transformation d'Helmert de l'ANCFCC pour projeter les points GPS mondiaux (WGS84) vers le système national Lambert du Maroc.
                      </p>

                      <div className="p-4 bg-[#0B1220] border border-slate-850 rounded-xl space-y-3 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ELLIPSOÏDE CLARKE :</span>
                          <span className="text-slate-200">Clarke 1880</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">MÉRIDIEN DE GREENWICH :</span>
                          <span className="text-slate-200">-6.000000°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">SYSTÈME GÉODÉSIQUE :</span>
                          <span className="text-indigo-400 font-bold">Merchich (ONIGT)</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-950/10 border border-indigo-900/20 rounded-xl text-xs text-slate-300">
                      <span className="font-bold text-indigo-400 block mb-1">💡 Note de l'administration</span>
                      Toutes les tuiles satellite ou topographiques Esri sont intégrées directement avec un certificat sécurisé SSL.
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 5: SYSTEM */}
              {activeSubTab === "system" && (
                <div className="space-y-6">
                  <div className="bg-[#080C16] border border-slate-800 p-6 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-850 pb-2">
                      <Settings className="w-4 h-4 text-indigo-400" />
                      <span>Modules de Topographie Actifs</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Contrôlez l'affichage des fonctionnalités du menu de navigation gauche en temps réel pour tous les utilisateurs du portail.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      {[
                        { id: "cad", label: "Dessin CAD & Calculs", desc: "Traceur géométrique et outils de coordonnées" },
                        { id: "gis", label: "Mapping SIG", desc: "Cartographie interactive nationale du cadastre" },
                        { id: "bornage", label: "Bornage Foncier (PV)", desc: "Génération de procès-verbaux de bornage ONIGT" },
                        { id: "consultation", label: "Consultation des Affaires", desc: "Recherche des dossiers et des lots cadastraux" },
                        { id: "plans", label: "Plans de Situation (PDF)", desc: "Module de production des livrables officiels" },
                        { id: "terrain", label: "Levés & Levés de Détail", desc: "Gestion des fiches de terrain et d'altimétrie" },
                        { id: "reception", label: "Fiche de Réception ANCFCC", desc: "Contrôle automatique de validité cadastrale" },
                        { id: "ai", label: "Co-Pilot Assistant IA", desc: "Conseiller topographique robotisé" }
                      ].map(module => {
                        const isEnabled = adminSettings.enabledModules[module.id as keyof typeof adminSettings.enabledModules] !== false;
                        return (
                          <div
                            key={module.id}
                            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                              isEnabled 
                                ? "bg-[#0B1220] border-slate-800 hover:border-slate-700" 
                                : "bg-slate-950 border-slate-900 opacity-60"
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="block text-xs font-bold text-slate-200">{module.label}</span>
                              <span className="block text-[10px] text-slate-500 font-mono">{module.desc}</span>
                            </div>

                            <div className="pt-3 flex items-center justify-between border-t border-slate-850 mt-3">
                              <span className={`text-[9px] font-mono font-bold ${isEnabled ? "text-emerald-400" : "text-slate-500"}`}>
                                {isEnabled ? "ACTIF" : "DÉSACTIVÉ"}
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={e => {
                                    const updatedModules = { ...adminSettings.enabledModules, [module.id]: e.target.checked };
                                    handleUpdateSettings({ ...adminSettings, enabledModules: updatedModules });
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
