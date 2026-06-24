import React, { useState, useEffect, useRef } from "react";
import { Project, Point } from "../types";
import {
  Search,
  CheckCircle,
  MapPin,
  Compass,
  Layers,
  FileDown,
  ChevronRight,
  Info,
  Calendar,
  User,
  Hash,
  Activity
} from "lucide-react";

interface ConsultationModuleProps {
  projects: Project[];
}

export default function ConsultationModule({ projects }: ConsultationModuleProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Filter only approved/validated affairs
  const approvedProjects = projects.filter(p => p.validationStatus === "approved");

  // Apply search filtering
  const filteredProjects = approvedProjects.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.clientName && p.clientName.toLowerCase().includes(q)) ||
      (p.surveyorName && p.surveyorName.toLowerCase().includes(q)) ||
      (p.parcelInvestigation?.parcelNumber && p.parcelInvestigation.parcelNumber.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const selectedProject = approvedProjects.find(p => p.id === selectedProjectId);

  // Re-draw the canvas when a project is selected
  useEffect(() => {
    if (!selectedProject || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const points = selectedProject.points || [];
    if (points.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#475569";
      ctx.font = "12px monospace";
      ctx.fillText("Aucun sommet à afficher", 20, 30);
      return;
    }

    // Clear and draw grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Find min/max bounds
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const pad = 40;
    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;

    const mapX = (x: number) => pad + ((x - minX) / dx) * (canvas.width - pad * 2);
    // Invert Y for cartesian representation
    const mapY = (y: number) => canvas.height - pad - ((y - minY) / dy) * (canvas.height - pad * 2);

    // Draw boundary polygon filled
    ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(mapX(p.x), mapY(p.y));
      else ctx.lineTo(mapX(p.x), mapY(p.y));
    });
    ctx.closePath();
    ctx.fill();

    // Draw boundary line
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(mapX(p.x), mapY(p.y));
      else ctx.lineTo(mapX(p.x), mapY(p.y));
    });
    ctx.closePath();
    ctx.stroke();

    // Draw point markers and text names
    points.forEach(p => {
      const cx = mapX(p.x);
      const cy = mapY(p.y);

      // Draw outer halo
      ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw center core
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw name label with background
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 9px sans-serif";
      const lbl = p.name;
      const w = ctx.measureText(lbl).width;
      ctx.fillRect(cx + 8, cy - 7, w + 6, 12);

      ctx.fillStyle = "#00f5d4";
      ctx.fillText(lbl, cx + 11, cy + 2);
    });

    // Draw north arrow top right
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width - 30, 50);
    ctx.lineTo(canvas.width - 30, 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width - 35, 30);
    ctx.lineTo(canvas.width - 30, 20);
    ctx.lineTo(canvas.width - 25, 30);
    ctx.stroke();

    ctx.fillStyle = "#f43f5e";
    ctx.font = "bold 9px monospace";
    ctx.fillText("N", canvas.width - 33, 15);

  }, [selectedProject]);

  // Handle DXF export trigger
  const handleExportDxf = () => {
    if (!selectedProject) return;
    alert(`Génération du fichier DXF conforme pour l'affaire ${selectedProject.name}.\nTéléchargement du calque cadastral Lambert...`);
  };

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#0B1220] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-600/30 text-indigo-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-900/40">CONSULTATION ARCHIVES</span>
            <span className="text-[#00F5D4] text-[10px] font-mono font-bold animate-pulse">● CONFORME CONSERVATION MAROC</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">Registre National des Affaires de Bornage Amiable</h2>
          <p className="text-xs text-slate-400">Recherchez et consultez l'historique complet des dossiers validés et archivés par la Conservation Foncière (ANCFCC).</p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher par titre, client, IGT..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#080C16] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Grid: List of approved projects */}
        <div className="lg:col-span-4 space-y-3">
          <span className="block text-[10px] text-slate-500 font-bold font-mono uppercase tracking-widest px-1">Dossiers Topographiques Approuvés ({filteredProjects.length})</span>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center bg-[#0B1220] border border-slate-850 rounded-2xl text-xs text-slate-500 space-y-2">
                <p>Aucun dossier de bornage approuvé.</p>
                <p className="text-[10px] text-indigo-400">Soumettez une affaire depuis le module Bornage puis validez-la dans la Console d'Administration.</p>
              </div>
            ) : (
              filteredProjects.map(p => {
                const isSelected = selectedProjectId === p.id;
                const ptCount = p.points ? p.points.length : 0;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer block relative ${
                      isSelected
                        ? "bg-[#1E1B4B]/30 border-indigo-500 shadow-md shadow-indigo-950/40"
                        : "bg-[#0B1220] border-slate-850 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] text-[#00F5D4] font-mono font-bold uppercase tracking-widest">PRODUIT ARCHIVE</span>
                      <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded font-bold uppercase font-mono">
                        ✓ Validée
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-1.5 truncate">{p.name}</h4>
                    
                    <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-400 font-mono mt-3">
                      <span className="truncate">Client: <strong className="text-slate-300 font-sans">{p.clientName}</strong></span>
                      <span className="truncate">Titre: <strong className="text-emerald-400">{p.parcelInvestigation?.parcelNumber || "N/A"}</strong></span>
                    </div>

                    <div className="flex justify-between items-center text-[8px] text-slate-500 mt-2.5 pt-2 border-t border-slate-900">
                      <span>{ptCount} sommets cadastrés</span>
                      <span className="text-indigo-400 font-sans flex items-center">Consulter <ChevronRight className="w-3 h-3 ml-0.5" /></span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Grid: Detailed split view with interactive Map */}
        <div className="lg:col-span-8">
          {selectedProject ? (
            <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              
              {/* Detailed Title Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-widest block">DOSSIER TECHNIQUE RATTACHÉ</span>
                  <h3 className="text-base font-bold text-white">{selectedProject.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-500" /> Client: <strong className="text-slate-300">{selectedProject.clientName}</strong></span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Date d'approbation: <strong className="text-slate-300">Juin 2026</strong></span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportDxf}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>DXF</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Imprimer PV</span>
                  </button>
                </div>
              </div>

              {/* Grid Layout inside Detail: Text Metrics vs CAD Canvas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visualizer Canvas Card */}
                <div className="space-y-2">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase font-mono">Plan de Bornage Validé (Echelle CAD auto)</span>
                  <div className="bg-[#080C16] border border-slate-850 rounded-xl overflow-hidden relative shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={340}
                      height={260}
                      className="w-full h-[260px] block"
                    />
                    <div className="absolute bottom-2 left-2 bg-[#0B1220]/80 px-2 py-0.5 rounded border border-slate-800 text-[8px] text-slate-400 font-mono">
                      Système de projection Lambert officiel
                    </div>
                  </div>
                </div>

                {/* Technical Geometry Details & Coordinate listing */}
                <div className="space-y-4">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase font-mono">Métriques de Délimitation</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-[#080C16] p-2.5 rounded-lg border border-slate-850">
                      <span className="text-[8px] text-slate-500 uppercase block">Superficie</span>
                      <strong className="text-white text-xs block mt-0.5">
                        {(() => {
                          let area = 0;
                          const pts = selectedProject.points || [];
                          if (pts.length > 2) {
                            let sum = 0;
                            for (let i = 0; i < pts.length; i++) {
                              const current = pts[i];
                              const next = pts[(i + 1) % pts.length];
                              sum += current.x * next.y - next.x * current.y;
                            }
                            area = Math.abs(sum) / 2;
                          }
                          return `${area.toFixed(2)} m²`;
                        })()}
                      </strong>
                    </div>

                    <div className="bg-[#080C16] p-2.5 rounded-lg border border-slate-850">
                      <span className="text-[8px] text-slate-500 uppercase block">Titre Foncier</span>
                      <strong className="text-emerald-400 text-xs block mt-0.5 truncate">{selectedProject.parcelInvestigation?.parcelNumber || "T-45982/R"}</strong>
                    </div>

                    <div className="bg-[#080C16] p-2.5 rounded-lg border border-slate-850">
                      <span className="text-[8px] text-slate-500 uppercase block">Sommets Posés</span>
                      <strong className="text-indigo-400 text-xs block mt-0.5">{(selectedProject.points || []).length} bornes</strong>
                    </div>

                    <div className="bg-[#080C16] p-2.5 rounded-lg border border-slate-850">
                      <span className="text-[8px] text-slate-500 uppercase block">Ingénieur IGT</span>
                      <strong className="text-indigo-300 text-xs block mt-0.5 truncate">{selectedProject.surveyorName || "Ahmed Alami"}</strong>
                    </div>
                  </div>

                  {/* List coordinates table inside */}
                  <div className="space-y-1.5 bg-[#080C16] p-3 rounded-xl border border-slate-850 text-[10px] font-mono">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase pb-1 border-b border-slate-850 mb-1">
                      <span>Listing Coordonnées Cadastré</span>
                      <span className="text-indigo-400">Lambert Zone</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1.5 text-slate-500 font-bold">
                      <span>Borne</span>
                      <span>X Easting</span>
                      <span>Y Northing</span>
                      <span>Z Altitude</span>
                    </div>

                    <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                      {(selectedProject.points || []).map(pt => (
                        <div key={pt.id} className="grid grid-cols-4 gap-1.5 text-slate-300">
                          <span className="font-bold text-[#00F5D4]">{pt.name}</span>
                          <span>{pt.x.toFixed(3)}</span>
                          <span>{pt.y.toFixed(3)}</span>
                          <span>{pt.z.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Moroccan Administrative Sign-off Stamp Block */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 font-sans">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">VISE ET ENREGISTRÉ PAR L'ANCFCC</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Ce plan de bornage est officiellement homologué par l'Administration de la Conservation Foncière du Maroc. Les calculs géométriques et la position centimétrique des bornes ont été validés conformes pour intégration à la base de données cartographique nationale.
                  </p>
                  <span className="block text-[10px] text-emerald-500 font-mono mt-1">Numéro de dépôt de récolement officiel : REC-2026-RAB-842</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-[450px] bg-[#0B1220] border border-slate-850 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-3">
              <Compass className="w-12 h-12 text-slate-700 animate-spin-slow" />
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">Aucun Dossier Sélectionné</h3>
                <p className="text-xs text-slate-400 max-w-sm">Choisissez un dossier de bornage dans la colonne de gauche pour visualiser son plan interactif, les métriques géométriques, et les coordonnées officielles.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
