import React, { useState } from "react";
import { 
  FileText, 
  Building, 
  Plus, 
  AlertTriangle, 
  MapPin, 
  User, 
  Layers, 
  Globe, 
  Calendar, 
  ArrowRight,
  Trash2,
  CheckCircle2,
  Database
} from "lucide-react";
import { Project } from "../types";

interface MyProjectHubProps {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  onCreateProject: (
    name: string, 
    description: string, 
    clientName: string, 
    category: "voirie" | "batiment" | "cadastral" | "other", 
    coordinateSystemId: string
  ) => Promise<any>;
  onSelectTab: (tabId: string) => void;
}

export default function MyProjectHub({
  projects = [],
  selectedProjectId,
  setSelectedProjectId,
  onCreateProject,
  onSelectTab
}: MyProjectHubProps) {
  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Creation states
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [jobName, setJobName] = useState("");
  const [jobClient, setJobClient] = useState("");
  const [jobCategory, setJobCategory] = useState<"voirie" | "batiment" | "cadastral" | "other">("cadastral");
  const [jobCoordSystem, setJobCoordSystem] = useState("morocco-lambert2");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNewJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName) return;

    setIsLoading(true);
    try {
      await onCreateProject(
        jobName, 
        jobDescription, 
        jobClient, 
        jobCategory, 
        jobCoordSystem
      );
      setIsCreatingJob(false);
      setJobName("");
      setJobClient("");
      setJobDescription("");
      setJobCategory("cadastral");
    } catch (err) {
      console.error("Error creating job inside MyProjectHub:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Le projet et toutes ses coordonnées associées seront définitivement effacés de la base de données.")) return;
    try {
      const res = await fetch(`/api/projects/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Panel */}
      <div className="bg-gradient-to-r from-[#0C1527] to-[#080C16] border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-indigo-950/80 text-indigo-400 text-[10px] font-mono rounded-full border border-indigo-900/30 uppercase tracking-widest font-black">TABLEAU DE BORD</span>
              <span className="text-slate-500 text-xs font-mono">• Console Générale</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 flex items-center space-x-2">
              <span className="bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">MY PROJECT</span>
              <span className="text-slate-400 font-normal">| Gestion des Chantiers</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pilotez tous vos levés topographiques, organisez les chantiers par catégorie, et lancez l'inspection as-built en direct.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingJob(!isCreatingJob)}
            className="self-start md:self-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-rose-500 hover:from-indigo-700 hover:to-rose-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-2 shadow-lg shadow-indigo-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Chantier Topographique</span>
          </button>
        </div>

        {/* 2. Interactive Job Creation Form */}
        {isCreatingJob && (
          <form 
            onSubmit={handleCreateNewJob}
            className="mt-6 bg-[#060A13] border border-slate-850 p-5 rounded-xl space-y-4 animate-fadeIn"
          >
            <h3 className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Établir un Nouveau Projet & Registre Topographique</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Nom du Chantier :</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Voirie Boulevard Mohammed V"
                  value={jobName}
                  onChange={e => setJobName(e.target.value)}
                  className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Client / Maître d'Ouvrage :</label>
                <input
                  type="text"
                  placeholder="ex: Commune de Rabat / Al Omrane"
                  value={jobClient}
                  onChange={e => setJobClient(e.target.value)}
                  className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Type de Chantier :</label>
                <select
                  value={jobCategory}
                  onChange={e => setJobCategory(e.target.value as any)}
                  className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
                >
                  <option value="cadastral">Cadastral & Foncier (Bornage)</option>
                  <option value="voirie">Voirie, Roads & Assainissement</option>
                  <option value="batiment">Bâtiment, Structures & Immeubles</option>
                  <option value="other">Autre Projet Spécifique</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Système de Coordonnées :</label>
                <select
                  value={jobCoordSystem}
                  onChange={e => setJobCoordSystem(e.target.value)}
                  className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-mono text-xs"
                >
                  <option value="morocco-lambert1">Maroc Lambert Zone I (Nord)</option>
                  <option value="morocco-lambert2">Maroc Lambert Zone II (Centre/Casa)</option>
                  <option value="morocco-lambert3">Maroc Lambert Zone III (Sud/Agadir)</option>
                  <option value="morocco-lambert4">Maroc Lambert Zone IV (Sahara)</option>
                  <option value="wgs84">WGS84 GPS Global (Lat/Lon)</option>
                </select>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <label className="text-slate-400 block font-semibold">Description et Références CAD/SIG :</label>
              <textarea
                placeholder="Renseignez les détails du levé (ex: Récolement assainissement, levé contradictoire, points d'appui GPS...)"
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                rows={2}
                className="w-full bg-[#0B1220] border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-[11px]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingJob(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs cursor-pointer shadow-md shadow-indigo-950 flex items-center space-x-1.5"
              >
                {isLoading ? "Création en cours..." : "Créer le Projet"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. Global Job Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B1220] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Total Active Jobs</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5 block">{projects.length}</span>
          </div>
          <div className="p-2.5 bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0B1220] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Voirie & Roads</span>
            <span className="text-2xl font-black text-blue-400 font-mono mt-0.5 block">
              {projects.filter(p => p.category === "voirie").length}
            </span>
          </div>
          <div className="p-2.5 bg-blue-950/40 border border-blue-900/30 text-blue-400 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0B1220] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Bâtiment / Structures</span>
            <span className="text-2xl font-black text-amber-500 font-mono mt-0.5 block">
              {projects.filter(p => p.category === "batiment").length}
            </span>
          </div>
          <div className="p-2.5 bg-amber-950/40 border border-amber-900/30 text-amber-500 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0B1220] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Cadastral & Foncier</span>
            <span className="text-2xl font-black text-rose-500 font-mono mt-0.5 block">
              {projects.filter(p => p.category === "cadastral").length}
            </span>
          </div>
          <div className="p-2.5 bg-rose-950/40 border border-rose-900/30 text-rose-500 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Active Project Details & Action Banner */}
      {activeProject && (
        <div className="bg-gradient-to-r from-indigo-950/20 to-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/30 text-[9px] font-mono font-black rounded uppercase">
                Projet Actif Sélectionné
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">{activeProject.coordinateSystem?.name}</span>
            </div>
            <h3 className="text-lg font-black text-white">{activeProject.name}</h3>
            <p className="text-xs text-slate-400 max-w-2xl font-mono leading-relaxed">
              {activeProject.description || "Aucune description fournie pour ce projet."}
            </p>
          </div>

          <button
            onClick={() => onSelectTab("reception")}
            className="w-full lg:w-auto px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-950 flex items-center justify-center space-x-2 group cursor-pointer"
          >
            <span>Ouvrir Fiche de Réception</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}

      {/* 5. Distribution Stats & Interactive Database Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Distribution */}
        <div className="bg-[#080C16] p-5 rounded-xl border border-slate-850 space-y-4">
          <h4 className="text-[11px] font-bold font-mono text-slate-300 uppercase tracking-widest flex items-center space-x-1.5">
            <span>📊 Distribution Statistique des Projets</span>
          </h4>

          <div className="space-y-4.5 pt-2">
            {/* Voirie bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-blue-400 font-bold">Voirie (Infrastructures)</span>
                <span className="text-slate-400">
                  {projects.filter(p => p.category === "voirie").length} ({projects.length > 0 ? Math.round((projects.filter(p => p.category === "voirie").length / projects.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${projects.length > 0 ? (projects.filter(p => p.category === "voirie").length / projects.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Bâtiment bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">Bâtiment & Génie Civil</span>
                <span className="text-slate-400">
                  {projects.filter(p => p.category === "batiment").length} ({projects.length > 0 ? Math.round((projects.filter(p => p.category === "batiment").length / projects.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${projects.length > 0 ? (projects.filter(p => p.category === "batiment").length / projects.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Cadastral bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold">Cadastral & Foncier</span>
                <span className="text-slate-400">
                  {projects.filter(p => p.category === "cadastral").length} ({projects.length > 0 ? Math.round((projects.filter(p => p.category === "cadastral").length / projects.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${projects.length > 0 ? (projects.filter(p => p.category === "cadastral").length / projects.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0B1220] border border-slate-800 p-4 rounded-xl text-xs space-y-3 mt-6">
            <h5 className="font-bold text-slate-200">💡 Astuces de Gestion</h5>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Associez chaque projet à sa catégorie appropriée pour appliquer automatiquement les tolérances topographiques de l'ONIGT : <strong>3cm</strong> pour la voirie, <strong>2cm</strong> pour le bâtiment et <strong>5cm</strong> pour le cadastral.
            </p>
          </div>
        </div>

        {/* Right Column: Database Table Registry */}
        <div className="lg:col-span-2 bg-[#080C16] p-5 rounded-xl border border-slate-850 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold font-mono text-slate-300 uppercase tracking-widest flex items-center space-x-1">
              <span>📂 Registre des Chantiers en Direct (Database)</span>
            </h4>
            <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900/30">
              SYNCRHONISÉ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <th className="pb-2.5">Projet / Chantier</th>
                  <th className="pb-2.5">Catégorie</th>
                  <th className="pb-2.5">Client</th>
                  <th className="pb-2.5 text-center">Points</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40">
                {projects.map(proj => {
                  const isCurrent = proj.id === selectedProjectId;
                  const cat = proj.category || "cadastral";
                  return (
                    <tr 
                      key={proj.id} 
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`hover:bg-[#0B1220]/70 transition-all cursor-pointer ${
                        isCurrent ? "bg-[#0E1729]/80 border-l-2 border-indigo-500" : ""
                      }`}
                    >
                      <td className="py-3 px-2">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className={`font-bold ${isCurrent ? "text-white" : "text-slate-200"}`}>
                              {proj.name}
                            </span>
                            {isCurrent && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </div>
                          {proj.coordinateSystem && (
                            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                              {proj.coordinateSystem.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase ${
                          cat === "voirie" ? "bg-blue-950/80 text-blue-400 border border-blue-900/30" :
                          cat === "batiment" ? "bg-amber-950/80 text-amber-400 border border-amber-900/30" :
                          cat === "cadastral" ? "bg-rose-950/80 text-rose-400 border border-rose-900/30" :
                          "bg-slate-900 text-slate-400 border border-slate-800"
                        }`}>
                          {cat === "voirie" ? "Voirie" :
                           cat === "batiment" ? "Bâtiment" :
                           cat === "cadastral" ? "Cadastral" : "Autre"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">{proj.clientName || "—"}</td>
                      <td className="py-3 font-mono text-center text-slate-300 font-bold">{proj.points?.length || 0}</td>
                      <td className="py-3 text-right pr-2">
                        <button
                          onClick={(e) => handleDeleteJob(proj.id, e)}
                          className="p-1.5 hover:bg-rose-950/60 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Supprimer ce projet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {projects.length === 0 && (
            <div className="text-center p-6 bg-[#0B1220] border border-dashed border-slate-800 rounded-xl text-slate-500">
              <AlertTriangle className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
              <p className="text-xs">Aucun projet enregistré dans la base de données.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
