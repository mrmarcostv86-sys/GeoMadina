import React, { useState, useRef, useMemo } from "react";
import { Point, CADLine, CADLayer, Project } from "../types";
import { Plus, Trash, Eye, EyeOff, Layers, Download, Move, Edit3, Grid } from "lucide-react";

interface CadCanvasProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export default function CadCanvas({ project, onUpdateProject }: CadCanvasProps) {
  const [activeLayer, setActiveLayer] = useState<string>("Boundary");
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [newPointName, setNewPointName] = useState("");
  const [newPointX, setNewPointX] = useState("");
  const [newPointY, setNewPointY] = useState("");
  const [newPointZ, setNewPointZ] = useState("");
  const [newPointCode, setNewPointCode] = useState("MON");
  
  // Fit view calculation
  const padding = 40;
  const bounds = useMemo(() => {
    if (project.points.length === 0) {
      return { minX: 370000, maxX: 371000, minY: 340000, maxY: 341000 };
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

  // Render coordinates into SVG space
  const svgWidth = 600;
  const svgHeight = 400;

  const toSvgX = (x: number) => {
    if (widthRange === 0) return svgWidth / 2;
    return padding + ((x - bounds.minX) / widthRange) * (svgWidth - padding * 2);
  };

  const toSvgY = (y: number) => {
    if (heightRange === 0) return svgHeight / 2;
    // Invert Y for screen coordinates
    return svgHeight - (padding + ((y - bounds.minY) / heightRange) * (svgHeight - padding * 2));
  };

  // Click on a point to draw lines
  const handlePointClick = (ptId: string) => {
    if (selectedPointId === null) {
      setSelectedPointId(ptId);
    } else {
      if (selectedPointId !== ptId) {
        // Create line
        const exists = project.lines.some(
          l => (l.p1_id === selectedPointId && l.p2_id === ptId) || 
               (l.p1_id === ptId && l.p2_id === selectedPointId)
        );
        if (!exists) {
          const newLine: CADLine = {
            id: "line_" + Date.now(),
            p1_id: selectedPointId,
            p2_id: ptId,
            layer: activeLayer
          };
          onUpdateProject({
            ...project,
            lines: [...project.lines, newLine]
          });
        }
      }
      setSelectedPointId(null);
    }
  };

  const handleAddPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const x = parseFloat(newPointX);
    const y = parseFloat(newPointY);
    const z = parseFloat(newPointZ) || 0;
    if (isNaN(x) || isNaN(y)) {
      alert("Please enter valid numeric X and Y coordinates");
      return;
    }

    const newPt: Point = {
      id: "pt_" + Date.now(),
      name: newPointName || "PT_" + (project.points.length + 1),
      x,
      y,
      z,
      code: newPointCode,
      description: "Manually entered in CAD"
    };

    onUpdateProject({
      ...project,
      points: [...project.points, newPt]
    });

    setNewPointName("");
    setNewPointX("");
    setNewPointY("");
    setNewPointZ("");
  };

  const toggleLayerVisibility = (layerName: string) => {
    const updatedLayers = project.layers.map(l => 
      l.name === layerName ? { ...l, visible: !l.visible } : l
    );
    onUpdateProject({
      ...project,
      layers: updatedLayers
    });
  };

  // Export DXF
  const exportDXF = () => {
    let dxf = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nENDSEC\n0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
    
    // Write Points as DXF POINT elements
    project.points.forEach(p => {
      dxf += `0\nPOINT\n8\n${activeLayer}\n10\n${p.x}\n20\n${p.y}\n30\n${p.z}\n`;
    });

    // Write Lines as DXF LINE elements
    project.lines.forEach(line => {
      const p1 = project.points.find(p => p.id === line.p1_id);
      const p2 = project.points.find(p => p.id === line.p2_id);
      if (p1 && p2) {
        dxf += `0\nLINE\n8\n${line.layer}\n10\n${p1.x}\n20\n${p1.y}\n30\n${p1.z}\n11\n${p2.x}\n21\n${p2.y}\n31\n${p2.z}\n`;
      }
    });

    dxf += `0\nENDSEC\n0\nEOF\n`;

    const blob = new Blob([dxf], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, "_")}_cad.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    let csv = "PointID,X,Y,Z,Code,Description\n";
    project.points.forEach(p => {
      csv += `"${p.name}",${p.x},${p.y},${p.z},"${p.code}","${p.description}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, "_")}_points.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="cad-drawing-engine" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white text-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm">
      {/* CAD Canvas */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-lg text-slate-900">Interactive CAD Workspace</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportDXF}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export DXF</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* CAD Canvas Screen */}
        <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
          <div className="absolute top-3 left-3 bg-slate-900/95 text-[10px] text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono z-10 flex flex-col space-y-1 shadow-md">
            <span>Projection: {project.coordinateSystem.name} ({project.coordinateSystem.code})</span>
            <span>X range: {bounds.minX.toFixed(2)}m to {bounds.maxX.toFixed(2)}m</span>
            <span>Y range: {bounds.minY.toFixed(2)}m to {bounds.maxY.toFixed(2)}m</span>
          </div>

          <div className="absolute top-3 right-3 bg-slate-900/95 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs font-bold z-10 text-emerald-400 font-mono shadow-md">
            {selectedPointId ? "CLICK NEXT POINT TO DRAW LINE" : "READY"}
          </div>

          <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
            {/* Grid Lines */}
            <defs>
              <pattern id="cadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cadGrid)" />

            {/* Boundary Lines */}
            {project.lines.map(line => {
              const p1 = project.points.find(p => p.id === line.p1_id);
              const p2 = project.points.find(p => p.id === line.p2_id);
              const layer = project.layers.find(l => l.name === line.layer);
              if (!p1 || !p2 || (layer && !layer.visible)) return null;

              return (
                <line
                  key={line.id}
                  x1={toSvgX(p1.x)}
                  y1={toSvgY(p1.y)}
                  x2={toSvgX(p2.x)}
                  y2={toSvgY(p2.y)}
                  stroke={layer?.color || "#FFFFFF"}
                  strokeWidth="2"
                  strokeDasharray={line.layer === "Boundary" ? "none" : "4,4"}
                />
              );
            })}

            {/* Points */}
            {project.points.map(pt => {
              const isSelected = selectedPointId === pt.id;
              const isBoundary = pt.code === "MON";
              
              return (
                <g key={pt.id} className="cursor-pointer" onClick={() => handlePointClick(pt.id)}>
                  <circle
                    cx={toSvgX(pt.x)}
                    cy={toSvgY(pt.y)}
                    r={isSelected ? 7 : isBoundary ? 5 : 4}
                    fill={isSelected ? "#F59E0B" : isBoundary ? "#EF4444" : "#10B981"}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <text
                    x={toSvgX(pt.x) + 8}
                    y={toSvgY(pt.y) - 6}
                    fill="#E2E8F0"
                    fontSize="10"
                    fontFamily="monospace"
                    className="select-none pointer-events-none font-bold"
                  >
                    {pt.name}
                  </text>
                  <text
                    x={toSvgX(pt.x) + 8}
                    y={toSvgY(pt.y) + 6}
                    fill="#94A3B8"
                    fontSize="8"
                    fontFamily="monospace"
                    className="select-none pointer-events-none"
                  >
                    {pt.code} ({pt.z.toFixed(1)}m)
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-xs text-slate-500 italic">
          💡 **CAD CAD Engine Tooltip:** Click on any point to start a line, then click on another point to connect them. Drawn elements are assigned to the active layer.
        </p>
      </div>

      {/* Control Panel / Side lists */}
      <div className="flex flex-col space-y-6">
        {/* Layer Management */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <div className="flex items-center space-x-2 mb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-800">Layer Manager</h4>
          </div>
          <div className="space-y-2">
            {project.layers.map(layer => (
              <div 
                key={layer.name} 
                className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-colors border ${
                  activeLayer === layer.name ? "bg-white border-slate-200 text-slate-900 shadow-sm" : "bg-transparent border-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                <button
                  onClick={() => setActiveLayer(layer.name)}
                  className="flex items-center space-x-2 text-left flex-1 cursor-pointer"
                >
                  <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: layer.color }}></span>
                  <span className={activeLayer === layer.name ? "font-bold text-slate-900" : ""}>{layer.name}</span>
                </button>
                <button 
                  onClick={() => toggleLayerVisibility(layer.name)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors cursor-pointer"
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Coordinates Form */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Add Coordinate (COGO)</span>
          </h4>
          <form onSubmit={handleAddPoint} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">Point Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GPS05"
                  value={newPointName}
                  onChange={e => setNewPointName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">Feature Code</label>
                <select
                  value={newPointCode}
                  onChange={e => setNewPointCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-blue-500 focus:ring-1 focus:blue-500 outline-none cursor-pointer"
                >
                  <option value="MON">MON (Monument)</option>
                  <option value="TOPO">TOPO (Detail Point)</option>
                  <option value="TREE">TREE (Palm/Tree)</option>
                  <option value="WALL">WALL (Stone Wall)</option>
                  <option value="GRID">GRID (DTM Point)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">Easting (X)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="370420"
                  value={newPointX}
                  onChange={e => setNewPointX(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">Northing (Y)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="340150"
                  value={newPointY}
                  onChange={e => setNewPointY(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-mono mb-1">Height (Z)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="65.00"
                  value={newPointZ}
                  onChange={e => setNewPointZ(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Insert CAD Point</span>
            </button>
          </form>
        </div>

        {/* CAD Point Coordinates List */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex-1 flex flex-col min-h-[200px]">
          <h4 className="font-bold text-sm text-slate-800 mb-3 font-mono flex items-center justify-between">
            <span>COORDINATE DATABASE ({project.points.length})</span>
            <span className="text-[10px] text-blue-600">XYZ</span>
          </h4>
          <div className="overflow-y-auto max-h-[220px] space-y-1.5 flex-1 pr-1 font-mono text-[10px]">
            {project.points.map(pt => (
              <div key={pt.id} className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 hover:border-slate-300">
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-800 mr-2">{pt.name}</span>
                  <span className="text-blue-600 font-bold mr-1">[{pt.code}]</span>
                  <span className="text-slate-500">
                    X:{pt.x.toFixed(2)} Y:{pt.y.toFixed(2)} Z:{pt.z.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const filtered = project.points.filter(p => p.id !== pt.id);
                    const filteredLines = project.lines.filter(l => l.p1_id !== pt.id && l.p2_id !== pt.id);
                    onUpdateProject({
                      ...project,
                      points: filtered,
                      lines: filteredLines
                    });
                  }}
                  className="text-red-500 hover:text-red-700 ml-2 cursor-pointer"
                >
                  <Trash className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
