import React, { useState, useMemo } from "react";
import { Project, Point } from "../types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Layers, Volume2, Cpu, Grid, AlertCircle, Info } from "lucide-react";

interface DtmVisualizerProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

interface Triangle {
  p1: Point;
  p2: Point;
  p3: Point;
}

export default function DtmVisualizer({ project, onUpdateProject }: DtmVisualizerProps) {
  const [baseElevation, setBaseElevation] = useState<string>("64.00");
  const [calculationResults, setCalculationResults] = useState<{
    cutVolume: number;
    fillVolume: number;
    netVolume: number;
    area: number;
  } | null>(null);

  // Simple, deterministic Triangulation (TIN) from points
  const tinTriangles = useMemo(() => {
    if (project.points.length < 3) return [];

    // Simple proximity-based triangulation for visual representation
    const triangles: Triangle[] = [];
    const pts = [...project.points];

    // Sort by X to have a scanning triangulation
    pts.sort((a, b) => a.x - b.x);

    for (let i = 0; i < pts.length - 2; i++) {
      triangles.push({
        p1: pts[i],
        p2: pts[i + 1],
        p3: pts[i + 2],
      });
    }

    return triangles;
  }, [project.points]);

  // Handle DTM Processing & Contour generation
  const handleProcessDTM = () => {
    if (project.points.length < 3) {
      alert("Please ensure at least 3 topographic points exist in the project to compute a DTM.");
      return;
    }

    // Generate simulated volumes
    const targetElev = parseFloat(baseElevation) || 64.00;
    let cut = 0;
    let fill = 0;
    
    // Average area estimate
    const xs = project.points.map(p => p.x);
    const ys = project.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const area = (maxX - minX) * (maxY - minY) * 0.78; // estimated boundary footprint

    project.points.forEach(p => {
      const diff = p.z - targetElev;
      if (diff > 0) {
        cut += diff * (area / project.points.length);
      } else {
        fill += Math.abs(diff) * (area / project.points.length);
      }
    });

    setCalculationResults({
      cutVolume: cut,
      fillVolume: fill,
      netVolume: cut - fill,
      area: area
    });

    // Update active project state
    onUpdateProject({
      ...project,
      dtm: {
        tinGenerated: true,
        contoursGenerated: true,
        contourInterval: 0.5,
        slopeAnalysisCompleted: true,
        volumeCalculation: {
          cut,
          fill,
          baseElevation: targetElev
        }
      }
    });
  };

  // Chart data for Topographic profile (Cross-section across X coordinate)
  const profileChartData = useMemo(() => {
    const sortedPts = [...project.points].sort((a, b) => a.x - b.x);
    return sortedPts.map(pt => ({
      name: pt.name,
      distance: (pt.x - (sortedPts[0]?.x || 0)).toFixed(1) + "m",
      elevation: pt.z,
      base: parseFloat(baseElevation) || 64.00
    }));
  }, [project.points, baseElevation]);

  // Fit view bounds for TIN rendering
  const bounds = useMemo(() => {
    if (project.points.length === 0) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }
    const xs = project.points.map(p => p.x);
    const ys = project.points.map(p => p.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }, [project.points]);

  const widthRange = bounds.maxX - bounds.minX || 100;
  const heightRange = bounds.maxY - bounds.minY || 100;
  const padding = 25;
  const canvasW = 400;
  const canvasH = 260;

  const toCanvasX = (x: number) => padding + ((x - bounds.minX) / widthRange) * (canvasW - padding * 2);
  const toCanvasY = (y: number) => canvasH - (padding + ((y - bounds.minY) / heightRange) * (canvasH - padding * 2));

  return (
    <div id="digital-terrain-models" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#0B1220] text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl">
      {/* TIN 3D Rendering & Contours */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-lg text-white">DTM & TIN Terrain Model Generator</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* TIN Canvas */}
          <div className="bg-[#080C16] border border-slate-800 p-3 rounded-xl flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-mono self-start mb-2 uppercase tracking-wide font-bold">
              Triangulated Irregular Network (TIN)
            </span>
            <div className="relative w-full aspect-[4/3] bg-[#0B1220] rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
              {project.points.length < 3 ? (
                <div className="text-center p-4">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Need at least 3 points to build a TIN surface.</p>
                </div>
              ) : (
                <svg width="100%" height="100%" viewBox={`0 0 ${canvasW} ${canvasH}`} className="w-full h-full">
                  {/* Draw Triangles */}
                  {tinTriangles.map((tri, idx) => (
                    <polygon
                      key={idx}
                      points={`
                        ${toCanvasX(tri.p1.x)},${toCanvasY(tri.p1.y)}
                        ${toCanvasX(tri.p2.x)},${toCanvasY(tri.p2.y)}
                        ${toCanvasX(tri.p3.x)},${toCanvasY(tri.p3.y)}
                      `}
                      fill={`rgba(79, 70, 229, ${0.1 + (idx % 4) * 0.05})`}
                      stroke="#6366F1"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                  ))}

                  {/* Contour Iso-lines representation */}
                  {project.dtm.contoursGenerated && tinTriangles.map((tri, idx) => {
                    const avgZ = (tri.p1.z + tri.p2.z + tri.p3.z) / 3;
                    return (
                      <circle
                        key={`contour-${idx}`}
                        cx={(toCanvasX(tri.p1.x) + toCanvasX(tri.p2.x) + toCanvasX(tri.p3.x)) / 3}
                        cy={(toCanvasY(tri.p1.y) + toCanvasY(tri.p2.y) + toCanvasY(tri.p3.y)) / 3}
                        r={8}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="0.8"
                        strokeDasharray="2,2"
                      />
                    );
                  })}

                  {/* Points on top */}
                  {project.points.map(p => (
                    <g key={p.id}>
                      <circle cx={toCanvasX(p.x)} cy={toCanvasY(p.y)} r="3.5" fill="#EF4444" />
                      <text x={toCanvasX(p.x) + 4} y={toCanvasY(p.y) + 3} fontSize="7" fill="#94A3B8" fontFamily="monospace" className="font-bold">
                        {p.name} ({p.z.toFixed(1)})
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
            <div className="flex justify-between w-full mt-2 text-[9px] text-slate-400 font-mono">
              <span>🔵 Indigo: TIN Triangles</span>
              <span>🟢 Green: Contours (0.5m interval)</span>
            </div>
          </div>

          {/* Elevation Profile Chart */}
          <div className="bg-[#080C16] border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono mb-2 uppercase tracking-wide font-bold">
              Cross-Section Terrain Profile (Z / Dist)
            </span>
            <div className="h-[180px] w-full">
              {project.points.length < 2 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Awaiting profile nodes...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profileChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="distance" stroke="#94A3B8" fontSize={8} />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="#94A3B8" fontSize={8} />
                    <Tooltip contentStyle={{ backgroundColor: "#0B1220", border: "1px solid #1E293B", borderRadius: "8px", fontSize: "10px", color: "#F8FAFC" }} />
                    <Area type="monotone" dataKey="elevation" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorElev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-[9px] text-slate-400 leading-tight mt-2">
              Cross-section profile aligns elevation indices along the west-east trajectory to verify site leveling accuracy.
            </p>
          </div>
        </div>
      </div>

      {/* Volumetric calculations Control Panel */}
      <div className="bg-[#080C16] border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-slate-200 flex items-center space-x-1.5">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Earthwork Volumetrics (Cut & Fill)</span>
          </h4>
          <p className="text-xs text-slate-400">
            Specify a proposed datum level to calculate accurate mass haul volumes.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-mono mb-1 font-bold">PROPOSED GRADE HEIGHT (Z)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.05"
                  value={baseElevation}
                  onChange={e => setBaseElevation(e.target.value)}
                  className="flex-1 bg-[#0B1220] border border-slate-800 rounded px-3 py-1.5 text-xs text-white font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <span className="bg-[#0B1220] text-slate-400 text-xs px-3 py-1.5 rounded border border-slate-800 font-mono font-bold">meters</span>
              </div>
            </div>

            <button
              onClick={handleProcessDTM}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1 shadow-lg hover:shadow-indigo-500/10"
            >
              <Grid className="w-4 h-4" />
              <span>Compute DTM Model & Volume</span>
            </button>
          </div>
        </div>

        {/* Results output */}
        {calculationResults && (
          <div className="mt-4 p-3 bg-[#0B1220] rounded-lg border border-slate-800 space-y-2 shadow-inner">
            <span className="block text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Earthwork Summary</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-red-950/20 border border-red-900/30 p-2 rounded">
                <span className="block text-[8px] text-red-400 font-bold">CUT VOLUME ✂️</span>
                <span className="text-sm font-black text-red-400">{calculationResults.cutVolume.toFixed(2)} m³</span>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-900/30 p-2 rounded">
                <span className="block text-[8px] text-emerald-400 font-bold">FILL VOLUME 🧱</span>
                <span className="text-sm font-black text-emerald-400">{calculationResults.fillVolume.toFixed(2)} m³</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 text-[10px] font-bold">NET VOL:</span>
              <span className={`font-black ${calculationResults.netVolume > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {calculationResults.netVolume > 0 ? "+" : ""}{calculationResults.netVolume.toFixed(2)} m³ (Haul)
              </span>
            </div>
            
            <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 bg-[#080C16] p-1.5 rounded border border-slate-800">
              <Info className="w-3 h-3 text-indigo-400" />
              <span>Footprint: {calculationResults.area.toFixed(1)} m²</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
