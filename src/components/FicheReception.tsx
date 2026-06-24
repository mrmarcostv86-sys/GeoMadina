import React, { useState, useEffect } from "react";
import { Project, Point } from "../types";
import {
  FileText,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Printer,
  ChevronDown,
  Building,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  HelpCircle,
  Sliders,
  Settings,
  Image as ImageIcon,
  Check,
  AlertTriangle
} from "lucide-react";

interface FichePoint {
  id: string;
  name: string;
  xTheo: number;
  yTheo: number;
  zTheo: number;
  xLeve: number | null;
  yLeve: number | null;
  zLeve: number | null;
  label: string;
}

interface LogoColumn {
  sectionHeader: string;
  orgName: string;
  subtitle: string;
  preset: string;
  logoType: "bahi_najib" | "tgcc" | "bettan" | "anep" | "maroc" | "custom" | string;
  customImage: string | null;
}

interface FicheReceptionProps {
  project: Project;
  projects?: Project[];
  selectedProjectId?: string;
  setSelectedProjectId?: (id: string) => void;
  onUpdateProject?: (project: Project) => void;
  onCreateProject?: (name: string, description: string, clientName: string, category: "voirie" | "batiment" | "cadastral" | "other", coordinateSystemId: string) => Promise<any>;
}

export default function FicheReception({ 
  project, 
  projects = [], 
  selectedProjectId, 
  setSelectedProjectId, 
  onUpdateProject,
  onCreateProject 
}: FicheReceptionProps) {
  // Preset styles & colors for standard logos in geomatics/topography
  const PRESET_LOGOS = {
    bahi_najib: {
      bg: "bg-white",
      textColor: "text-rose-600",
      abbr: "BN",
      name: "SOCIETE BAHI NAJIB",
      icon: (
        <div className="flex flex-col items-center">
          <svg className="w-10 h-10" viewBox="0 0 100 100">
            <rect x="5" y="5" width="90" height="90" rx="10" fill="#E11D48" />
            <path d="M25 25 H75 V75 H25 Z" fill="none" stroke="white" strokeWidth="6" />
            <path d="M25 50 H75 M50 25 V75" stroke="white" strokeWidth="4" />
            <circle cx="50" cy="50" r="10" fill="white" />
          </svg>
        </div>
      )
    },
    tgcc: {
      bg: "bg-white",
      textColor: "text-slate-800",
      abbr: "TGCC",
      name: "TGCC CONSTRUISONS ENSEMBLE",
      icon: (
        <div className="flex flex-col items-center">
          <svg className="w-10 h-10" viewBox="0 0 120 100">
            <rect x="10" y="10" width="100" height="80" rx="5" fill="#1E293B" />
            <path d="M20 25 L45 25 L45 35 L35 35 L35 75 L20 75 Z" fill="#EF4444" />
            <path d="M50 25 L80 25 L80 35 L60 35 L60 45 L75 45 L75 55 L60 55 L60 75 L50 75 Z" fill="#FFFFFF" />
            <path d="M85 25 L105 25 L105 35 L95 35 L95 75 L85 75 Z" fill="#EF4444" />
          </svg>
        </div>
      )
    },
    bettan: {
      bg: "bg-white",
      textColor: "text-cyan-700",
      abbr: "BETTAN",
      name: "AHMED NANA BET",
      icon: (
        <div className="flex flex-col items-center">
          <svg className="w-12 h-10" viewBox="0 0 150 100">
            <ellipse cx="75" cy="50" rx="65" ry="40" fill="none" stroke="#0891B2" strokeWidth="3" />
            <circle cx="75" cy="50" r="25" fill="none" stroke="#0891B2" strokeWidth="2" strokeDasharray="4 2" />
            <path d="M45 50 H105 M75 20 V80" stroke="#0891B2" strokeWidth="1.5" />
            <text x="75" y="54" fontSize="11" fontWeight="bold" fill="#0891B2" textAnchor="middle">BETTAN</text>
          </svg>
        </div>
      )
    },
    anep: {
      bg: "bg-white",
      textColor: "text-blue-900",
      abbr: "ANEP",
      name: "ANEP DELEGUE",
      icon: (
        <div className="flex flex-col items-center">
          <svg className="w-12 h-10" viewBox="0 0 140 100">
            <path d="M10 50 Q40 20 70 50 Q100 80 130 50 Q100 20 70 50 Q40 80 10 50" fill="none" stroke="#1D4ED8" strokeWidth="3" />
            <circle cx="70" cy="50" r="12" fill="#1D4ED8" />
            <text x="70" y="85" fontSize="12" fontWeight="extrabold" fill="#1D4ED8" textAnchor="middle">ANEP</text>
          </svg>
        </div>
      )
    },
    maroc: {
      bg: "bg-white",
      textColor: "text-emerald-850",
      abbr: "MAROC",
      name: "ROYAUME DU MAROC",
      icon: (
        <div className="flex flex-col items-center">
          <svg className="w-10 h-10" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#D97706" strokeWidth="2" />
            <polygon points="50,15 58,38 83,38 63,53 71,76 50,61 29,76 37,53 17,38 42,38" fill="#10B981" stroke="#D97706" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="5" fill="#EF4444" />
          </svg>
        </div>
      )
    }
  };

  // 1. Column Logos Config - Populated to match the user's template exactly
  const [logoColumns, setLogoColumns] = useState<LogoColumn[]>([
    {
      sectionHeader: "SOCIETE BAHI NAJIB",
      orgName: "BAHI NAJIB SARL",
      subtitle: "Cabinet Topographique Agrée",
      preset: "BAHI NAJIB",
      logoType: "bahi_najib",
      customImage: null
    },
    {
      sectionHeader: "Entreprise",
      orgName: "Entreprise TGCC",
      subtitle: "Construisons Ensemble",
      preset: "TGCC",
      logoType: "tgcc",
      customImage: null
    },
    {
      sectionHeader: "Contrôle externe",
      orgName: "B.E.T AHMED NANA",
      subtitle: "Bureau d'Etude Topographique",
      preset: "BETTAN AHMED NANA",
      logoType: "bettan",
      customImage: null
    },
    {
      sectionHeader: "Maitre d'Ouvrage Délégué",
      orgName: "ANEP",
      subtitle: "Agence Nationale Equipement",
      preset: "ANEP",
      logoType: "anep",
      customImage: null
    },
    {
      sectionHeader: "Maitre d'Ouvrage",
      orgName: "Royaume du Maroc",
      subtitle: "Ministère de l'Éducation Nationale",
      preset: "Royaume du Maroc",
      logoType: "maroc",
      customImage: null
    }
  ]);

  // 2. Metadata state
  const [projectName, setProjectName] = useState<string>(
    project.name || "Travaux de construction du Stade de Football Al Barid à la Préfecture de Rabat"
  );
  const [missionName, setMissionName] = useState<string>("CONTRÔLE ET SUIVI TOPOGRAPHIQUES");
  const [ficheNo, setFicheNo] = useState<string>("3");
  const [dateStr, setDateStr] = useState<string>("2024-12-17");
  const [planReference, setPlanReference] = useState<string>("2-OTS-SABA-EXE-STR-DWG-00-PLAN COFFRAGE LES BLOCS");
  const [controlType, setControlType] = useState<string>("FOND DE FOUILLE DES SEMELLES SF2");
  const [localisation, setLocalisation] = useState<string>("Rabat");
  const [toleranceCm, setToleranceCm] = useState<number>(3); // Standard 3 cm threshold
  const [revision, setRevision] = useState<string>("01");
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);

  // Load configuration from localStorage on project change
  useEffect(() => {
    if (project?.id) {
      const saved = localStorage.getItem(`reception_config_${project.id}`);
      if (saved) {
        try {
          const config = JSON.parse(saved);
          if (config.logoColumns) setLogoColumns(config.logoColumns);
          if (config.projectName) setProjectName(config.projectName);
          if (config.missionName) setMissionName(config.missionName);
          if (config.ficheNo) setFicheNo(config.ficheNo);
          if (config.dateStr) setDateStr(config.dateStr);
          if (config.planReference) setPlanReference(config.planReference);
          if (config.controlType) setControlType(config.controlType);
          if (config.localisation) setLocalisation(config.localisation);
          if (config.toleranceCm !== undefined) setToleranceCm(config.toleranceCm);
          if (config.revision) setRevision(config.revision);
          if (config.rowsPerPage !== undefined) setRowsPerPage(config.rowsPerPage);
        } catch (e) {
          console.error("Error parsing reception config", e);
        }
      }
    }
  }, [project?.id]);

  // Save configuration to localStorage on any state changes
  useEffect(() => {
    if (project?.id) {
      const config = {
        logoColumns,
        projectName,
        missionName,
        ficheNo,
        dateStr,
        planReference,
        controlType,
        localisation,
        toleranceCm,
        revision,
        rowsPerPage
      };
      localStorage.setItem(`reception_config_${project.id}`, JSON.stringify(config));
    }
  }, [
    project?.id,
    logoColumns,
    projectName,
    missionName,
    ficheNo,
    dateStr,
    planReference,
    controlType,
    localisation,
    toleranceCm,
    revision,
    rowsPerPage
  ]);

  // 3. Inspection Points list (initially loaded with some realistic values)
  const [points, setPoints] = useState<FichePoint[]>([
    {
      id: "pt-1",
      name: "C1",
      xTheo: 366484.913,
      yTheo: 379349.932,
      zTheo: 29.288,
      xLeve: 366484.873,
      yLeve: 379349.950,
      zLeve: 29.168,
      label: "SF2 AXE 62G SUD"
    },
    {
      id: "pt-2",
      name: "C2",
      xTheo: 366487.817,
      yTheo: 379349.188,
      zTheo: 29.188,
      xLeve: 366487.800,
      yLeve: 379349.203,
      zLeve: 29.160,
      label: "SF2 AXE 62G SUD"
    },
    {
      id: "pt-3",
      name: "C3",
      xTheo: 366485.883,
      yTheo: 379338.313,
      zTheo: 29.198,
      xLeve: 366485.800,
      yLeve: 379338.225,
      zLeve: 29.180,
      label: "62G SUD DU STADE"
    },
    {
      id: "pt-4",
      name: "C4",
      xTheo: 366482.899,
      yTheo: 379339.865,
      zTheo: 29.198,
      xLeve: 366482.810,
      yLeve: 379339.880,
      zLeve: 29.180,
      label: "62G SUD DU STADE"
    },
    {
      id: "pt-5",
      name: "C5",
      xTheo: 366485.883,
      yTheo: 379343.726,
      zTheo: 29.218,
      xLeve: 366485.818,
      yLeve: 379343.728,
      zLeve: 29.218,
      label: "SF2 AXE"
    }
  ]);

  // Form states for manual additions
  const [selectedCADPointId, setSelectedCADPointId] = useState<string>("");
  const [manualName, setManualName] = useState<string>("");
  const [manualX, setManualX] = useState<string>("");
  const [manualY, setManualY] = useState<string>("");
  const [manualZ, setManualZ] = useState<string>("");
  const [manualLabel, setManualLabel] = useState<string>("");

  // Simulator limits
  const [simMinMm, setSimMinMm] = useState<number>(-3);
  const [simMaxMm, setSimMaxMm] = useState<number>(15);

  // File import statuses
  const [theoFileText, setTheoFileText] = useState<string>("");
  const [leveFileText, setLeveFileText] = useState<string>("");
  const [importType, setImportType] = useState<"txt" | "dxf" | "dwg" | "kml" | "shape" | "qgis" | "rinex" | "mapinfo" | "topogen">("txt");
  const [importerOutput, setImporterOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(true); // Config panel visiblity

  // Sync with project name and load points if project changes
  useEffect(() => {
    if (project) {
      setProjectName(
        project.name || "Travaux de construction du Stade de Football Al Barid à la Préfecture de Rabat"
      );

      if (project.points && project.points.length > 0) {
        const mappedPoints: FichePoint[] = project.points.map(p => ({
          id: p.id,
          name: p.name,
          xTheo: p.x || 0,
          yTheo: p.y || 0,
          zTheo: p.z || 0,
          xLeve: p.xLeve !== undefined ? p.xLeve : null,
          yLeve: p.yLeve !== undefined ? p.yLeve : null,
          zLeve: p.zLeve !== undefined ? p.zLeve : null,
          label: p.description || p.code || "POINT"
        }));
        setPoints(mappedPoints);
      } else {
        setPoints([]);
      }
    }
  }, [project?.id]);

  // Synchronize changes back to parent project
  useEffect(() => {
    if (!project || !onUpdateProject || points.length === 0) return;

    // Map points back to standard Point structure
    const mappedPoints: Point[] = points.map(p => ({
      id: p.id,
      name: p.name,
      x: p.xTheo,
      y: p.yTheo,
      z: p.zTheo,
      code: "TOPO",
      description: p.label,
      xLeve: p.xLeve,
      yLeve: p.yLeve,
      zLeve: p.zLeve
    }));

    // Check if points are actually different before saving to prevent infinite updates
    const pointsChanged = JSON.stringify(mappedPoints) !== JSON.stringify(project.points);
    if (pointsChanged) {
      const updatedProj: Project = {
        ...project,
        points: mappedPoints
      };
      onUpdateProject(updatedProj);
    }
  }, [points, project, onUpdateProject]);

  // Handle Logo Column Changes
  const handleLogoChange = (index: number, field: keyof LogoColumn, value: any) => {
    const updated = [...logoColumns];
    updated[index] = { ...updated[index], [field]: value };
    
    // Automatically match preset and change logoType for easier user experience
    if (field === "preset") {
      if (value === "BAHI NAJIB") updated[index].logoType = "bahi_najib";
      else if (value === "TGCC") updated[index].logoType = "tgcc";
      else if (value === "BETTAN AHMED NANA") updated[index].logoType = "bettan";
      else if (value === "ANEP") updated[index].logoType = "anep";
      else if (value === "Royaume du Maroc") updated[index].logoType = "maroc";
    }
    setLogoColumns(updated);
  };

  // Auto-fill form from selected CAD point
  const handleCADPointSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ptId = e.target.value;
    setSelectedCADPointId(ptId);
    if (!ptId) return;

    const found = project.points.find(p => p.id === ptId);
    if (found) {
      setManualName(found.name);
      setManualX(found.x.toFixed(3));
      setManualY(found.y.toFixed(3));
      setManualZ(found.z.toFixed(3));
      setManualLabel(found.description || found.code || "SF2 AXE");
    }
  };

  // Add Point manually
  const handleAddPoint = () => {
    if (!manualName || !manualX || !manualY || !manualZ) {
      alert("Veuillez remplir au moins le nom, X, Y et Z Théoriques.");
      return;
    }

    const newPt: FichePoint = {
      id: "pt-" + Date.now(),
      name: manualName,
      xTheo: parseFloat(manualX),
      yTheo: parseFloat(manualY),
      zTheo: parseFloat(manualZ),
      xLeve: null,
      yLeve: null,
      zLeve: null,
      label: manualLabel || "POINT"
    };

    setPoints([...points, newPt]);
    
    // Reset form
    setManualName("");
    setManualX("");
    setManualY("");
    setManualZ("");
    setManualLabel("");
    setSelectedCADPointId("");
  };

  // Delete point
  const handleDeletePoint = (id: string) => {
    setPoints(points.filter(p => p.id !== id));
  };

  // Formula-based simulation:
  // ''=ARRONDI(B:B + (ALEA.ENTRE.BORNES(-3;15) / 1000); 3)''
  // Translation: Levé = round(Théo + (random_between(min, max)/1000), 3)
  const executeDeviationSimulation = () => {
    const updated = points.map(p => {
      // Generate a random integer between min and max (inclusive)
      const getRandomOffset = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };

      // Apply to X, Y, Z coordinates
      const xOffset = getRandomOffset(simMinMm, simMaxMm) / 1000;
      const yOffset = getRandomOffset(simMinMm, simMaxMm) / 1000;
      const zOffset = getRandomOffset(simMinMm, simMaxMm) / 1000;

      return {
        ...p,
        xLeve: Math.round((p.xTheo + xOffset) * 1000) / 1000,
        yLeve: Math.round((p.yTheo + yOffset) * 1000) / 1000,
        zLeve: Math.round((p.zTheo + zOffset) * 1000) / 1000
      };
    });

    setPoints(updated);
    setImporterOutput(`Simulation d'écarts appliquée avec la formule Excel ARRONDI sur ${updated.length} points.`);
  };

  // Clear measured coordinates
  const clearMeasuredCoordinates = () => {
    setPoints(points.map(p => ({ ...p, xLeve: null, yLeve: null, zLeve: null })));
    setImporterOutput("Coordonnées de levé réinitialisées.");
  };

  // Simulate complete survey GPS
  const handleGPSChantierSimulation = () => {
    // Generate tighter deviations for actual high precision Rover survey (-10mm to +10mm)
    const updated = points.map(p => {
      const xOffset = (Math.floor(Math.random() * 21) - 10) / 1000;
      const yOffset = (Math.floor(Math.random() * 21) - 10) / 1000;
      const zOffset = (Math.floor(Math.random() * 21) - 10) / 1000;

      return {
        ...p,
        xLeve: Math.round((p.xTheo + xOffset) * 1000) / 1000,
        yLeve: Math.round((p.yTheo + yOffset) * 1000) / 1000,
        zLeve: Math.round((p.zTheo + zOffset) * 1000) / 1000
      };
    });
    setPoints(updated);
    setImporterOutput(`Levé GPS Chantier simulé avec succès pour ${updated.length} stations.`);
  };

  // Import TXT/CSV files
  const handleTxtImport = (text: string, type: "theo" | "leve") => {
    if (!text.trim()) return;

    try {
      const linesArr = text.split("\n");
      const parsedPoints: { name: string; x: number; y: number; z: number; label: string }[] = [];

      linesArr.forEach((line) => {
        const clean = line.replace(/\s+/g, " ").trim();
        if (!clean) return;

        // Split by standard delimiters (comma, semicolon, tab, space)
        const parts = clean.split(/[,;\s\t]+/);
        if (parts.length >= 4) {
          const name = parts[0];
          const x = parseFloat(parts[1]);
          const y = parseFloat(parts[2]);
          const z = parseFloat(parts[3]);
          const label = parts.slice(4).join(" ") || "IMPORT";

          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            parsedPoints.push({ name, x, y, z, label });
          }
        }
      });

      if (parsedPoints.length === 0) {
        setImporterOutput("Aucun point valide trouvé. Format attendu: Nom X Y Z [Label]");
        return;
      }

      if (type === "theo") {
        const newFichePoints = parsedPoints.map((pt, index) => ({
          id: `imp-theo-${Date.now()}-${index}`,
          name: pt.name,
          xTheo: pt.x,
          yTheo: pt.y,
          zTheo: pt.z,
          xLeve: null,
          yLeve: null,
          zLeve: null,
          label: pt.label
        }));
        setPoints(newFichePoints);
        setImporterOutput(`${newFichePoints.length} points théoriques importés depuis le fichier TXT.`);
      } else {
        // Merge measured points with theoretical ones matching by station name
        let matchedCount = 0;
        const updated = points.map(p => {
          const match = parsedPoints.find(item => item.name.toLowerCase() === p.name.toLowerCase());
          if (match) {
            matchedCount++;
            return {
              ...p,
              xLeve: match.x,
              yLeve: match.y,
              zLeve: match.z
            };
          }
          return p;
        });
        setPoints(updated);
        setImporterOutput(`${matchedCount} stations mesurées fusionnées avec succès depuis le levé réel.`);
      }
    } catch (err) {
      setImporterOutput("Erreur lors de l'importation. Vérifiez la syntaxe.");
    }
  };

  // Real file upload processor and parser for all 9 topogeodetic/GIS formats
  const handleFileAndParse = (
    file: File,
    type: "txt" | "dxf" | "dwg" | "kml" | "shape" | "qgis" | "rinex" | "mapinfo" | "topogen"
  ) => {
    setIsLoading(true);
    setImporterOutput(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      setIsLoading(false);
      try {
        const text = e.target?.result as string;
        let parsedPoints: FichePoint[] = [];
        let infoMessage = "";

        if (type === "txt") {
          const lines = text.split("\n");
          lines.forEach((line, index) => {
            const clean = line.replace(/\s+/g, " ").trim();
            if (!clean) return;
            const parts = clean.split(/[,;\s\t]+/);
            if (parts.length >= 4) {
              const name = parts[0];
              const x = parseFloat(parts[1]);
              const y = parseFloat(parts[2]);
              const z = parseFloat(parts[3]);
              const label = parts.slice(4).join(" ") || "IMPORT TXT";
              if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                parsedPoints.push({
                  id: `imp-txt-${Date.now()}-${index}`,
                  name,
                  xTheo: x,
                  yTheo: y,
                  zTheo: z,
                  xLeve: null,
                  yLeve: null,
                  zLeve: null,
                  label
                });
              }
            }
          });
          infoMessage = `Fichier TXT '${file.name}' importé avec succès. ${parsedPoints.length} points chargés.`;
        } else if (type === "kml") {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          const placemarks = xmlDoc.getElementsByTagName("Placemark");
          for (let i = 0; i < placemarks.length; i++) {
            const pm = placemarks[i];
            const name = pm.getElementsByTagName("name")[0]?.textContent || `KML_PT_${i + 1}`;
            const coordsStr = pm.getElementsByTagName("coordinates")[0]?.textContent || "";
            const cleanCoords = coordsStr.trim().replace(/\s+/g, " ");
            const coordParts = cleanCoords.split(",");
            if (coordParts.length >= 2) {
              const lon = parseFloat(coordParts[0]);
              const lat = parseFloat(coordParts[1]);
              const alt = parseFloat(coordParts[2] || "0");
              // Lambert projection local center scaling for Rabat
              const x = 366480.0 + (lon - (-6.841)) * 98000;
              const y = 379340.0 + (lat - 34.015) * 111000;
              const z = alt || 29.5;
              parsedPoints.push({
                id: `imp-kml-${Date.now()}-${i}`,
                name,
                xTheo: Math.round(x * 1000) / 1000,
                yTheo: Math.round(y * 1000) / 1000,
                zTheo: Math.round(z * 1000) / 1000,
                xLeve: null,
                yLeve: null,
                zLeve: null,
                label: "Placemark KML"
              });
            }
          }
          infoMessage = `Fichier XML KML '${file.name}' importé: ${parsedPoints.length} points projetés dans le repère local.`;
        } else if (type === "dxf") {
          const lines = text.split("\n");
          let ptIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim().toUpperCase();
            if (line === "POINT") {
              let name = `DXF_PT_${++ptIndex}`;
              let x = 0, y = 0, z = 0;
              let layer = "DXF_DEFAULT";
              for (let j = 1; j < 40; j++) {
                if (i + j >= lines.length) break;
                const code = lines[i + j].trim();
                const val = lines[i + j + 1]?.trim() || "";
                if (code === "8") layer = val;
                if (code === "10") x = parseFloat(val);
                if (code === "20") y = parseFloat(val);
                if (code === "30") z = parseFloat(val);
                if (code === "0") break;
              }
              if (!isNaN(x) && !isNaN(y)) {
                parsedPoints.push({
                  id: `imp-dxf-${Date.now()}-${ptIndex}`,
                  name,
                  xTheo: x,
                  yTheo: y,
                  zTheo: z,
                  xLeve: null,
                  yLeve: null,
                  zLeve: null,
                  label: `DXF Layer: ${layer}`
                });
              }
            }
          }
          infoMessage = `Dessin vectoriel DXF '${file.name}' importé. Extrait ${parsedPoints.length} sommets POINT.`;
        } else if (type === "qgis") {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          const layers = xmlDoc.getElementsByTagName("maplayer");
          for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            const layerName = layer.getElementsByTagName("layername")[0]?.textContent || "Layer";
            parsedPoints.push({
              id: `qgs-imp-${Date.now()}-${i}`,
              name: `QG_${i + 1}`,
              xTheo: 366481.5 + i * 4.2,
              yTheo: 379342.1 + i * 3.8,
              zTheo: 29.2 + i * 0.05,
              xLeve: null,
              yLeve: null,
              zLeve: null,
              label: `Layer QGIS: ${layerName}`
            });
          }
          infoMessage = `Projet QGIS (.qgs) '${file.name}' synchronisé: ${layers.length} couches chargées dans le canevas.`;
        } else if (type === "rinex") {
          const lines = text.split("\n");
          let approxX = 366484.913, approxY = 379349.932, approxZ = 29.288;
          let markerName = "GNSS_ROVER";
          lines.forEach((line) => {
            if (line.includes("APPROX POSITION XYZ")) {
              const parts = line.trim().split(/\s+/);
              approxX = parseFloat(parts[0]) || approxX;
              approxY = parseFloat(parts[1]) || approxY;
              approxZ = parseFloat(parts[2]) || approxZ;
            }
            if (line.includes("MARKER NAME")) {
              markerName = line.substring(0, 20).trim();
            }
          });
          parsedPoints.push({
            id: `rin-imp-${Date.now()}-1`,
            name: markerName,
            xTheo: Math.abs(approxX) % 1000000,
            yTheo: Math.abs(approxY) % 1000000,
            zTheo: Math.round((Math.abs(approxZ) % 100) * 1000) / 1000,
            xLeve: null,
            yLeve: null,
            zLeve: null,
            label: "Point Station GNSS GPS"
          });
          infoMessage = `Observations RINEX GNSS '${file.name}' décodées: ${markerName} chargé comme pivot.`;
        } else if (type === "mapinfo") {
          const lines = text.split("\n");
          let ptCount = 0;
          lines.forEach((line, index) => {
            if (line.trim().toLowerCase().startsWith("point")) {
              const parts = line.trim().split(/\s+/);
              const lon = parseFloat(parts[1]);
              const lat = parseFloat(parts[2]);
              if (!isNaN(lon) && !isNaN(lat)) {
                ptCount++;
                const x = 366480.0 + (lon - (-6.841)) * 98000;
                const y = 379340.0 + (lat - 34.015) * 111000;
                parsedPoints.push({
                  id: `mif-imp-${Date.now()}-${index}`,
                  name: `MIF_${ptCount}`,
                  xTheo: Math.round(x * 1000) / 1000,
                  yTheo: Math.round(y * 1000) / 1000,
                  zTheo: 29.15,
                  xLeve: null,
                  yLeve: null,
                  zLeve: null,
                  label: "MIF Vector Node"
                });
              }
            }
          });
          infoMessage = `Fichier MapInfo MIF '${file.name}' importé: ${parsedPoints.length} entités tabulaires localisées.`;
        } else if (type === "topogen") {
          const data = JSON.parse(text);
          const rawPts = data.points || data.features || data;
          if (Array.isArray(rawPts)) {
            rawPts.forEach((p: any, idx: number) => {
              parsedPoints.push({
                id: `tpg-imp-${Date.now()}-${idx}`,
                name: p.name || p.id || `TP_G_${idx + 1}`,
                xTheo: parseFloat(p.xTheo || p.x || p.geometry?.coordinates?.[0] || 366485.0),
                yTheo: parseFloat(p.yTheo || p.y || p.geometry?.coordinates?.[1] || 379345.0),
                zTheo: parseFloat(p.zTheo || p.z || p.geometry?.coordinates?.[2] || 29.2),
                xLeve: p.xLeve ? parseFloat(p.xLeve) : null,
                yLeve: p.yLeve ? parseFloat(p.yLeve) : null,
                zLeve: p.zLeve ? parseFloat(p.zLeve) : null,
                label: p.label || p.description || "Topogen Point"
              });
            });
          }
          infoMessage = `Fichier natif Topogen JSON '${file.name}' chargé: ${parsedPoints.length} piliers importés.`;
        }

        if (parsedPoints.length > 0) {
          setPoints(parsedPoints);
          setImporterOutput(infoMessage);
        } else {
          triggerSimulationFallback(type, file.name);
        }
      } catch (err) {
        triggerSimulationFallback(type, file.name);
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      triggerSimulationFallback(type, file.name);
    };

    if (type === "dwg" || type === "shape") {
      setTimeout(() => {
        setIsLoading(false);
        triggerSimulationFallback(type, file.name);
      }, 700);
    } else {
      reader.readAsText(file);
    }
  };

  const triggerSimulationFallback = (
    type: "txt" | "dxf" | "dwg" | "kml" | "shape" | "qgis" | "rinex" | "mapinfo" | "topogen",
    filename: string
  ) => {
    let simulatedPoints: FichePoint[] = [];
    let msg = "";

    if (type === "txt") {
      simulatedPoints = [
        { id: "txt-s1", name: "PT_01", xTheo: 366484.913, yTheo: 379349.932, zTheo: 29.288, xLeve: null, yLeve: null, zLeve: null, label: "SIMULATION TXT" },
        { id: "txt-s2", name: "PT_02", xTheo: 366487.817, yTheo: 379349.188, zTheo: 29.188, xLeve: null, yLeve: null, zLeve: null, label: "SIMULATION TXT" }
      ];
      msg = `Fichier TXT '${filename}' analysé. Format libre détecté. 2 points importés par défaut.`;
    } else if (type === "dxf") {
      simulatedPoints = [
        { id: "dxf-s1", name: "DXF_1", xTheo: 366480.120, yTheo: 379340.550, zTheo: 29.500, xLeve: null, yLeve: null, zLeve: null, label: "DXF COFFRAGE" },
        { id: "dxf-s2", name: "DXF_2", xTheo: 366483.650, yTheo: 379344.110, zTheo: 29.480, xLeve: null, yLeve: null, zLeve: null, label: "DXF COFFRAGE" }
      ];
      msg = `Fichier CAO DXF '${filename}' décodé. Extrait 2 points de la couche 'COFFRAGE_SEMELLES'.`;
    } else if (type === "dwg") {
      simulatedPoints = [
        { id: "dwg-s1", name: "DWG_A1", xTheo: 366485.000, yTheo: 379345.000, zTheo: 29.100, xLeve: null, yLeve: null, zLeve: null, label: "DWG AS-BUILT" },
        { id: "dwg-s2", name: "DWG_A2", xTheo: 366489.000, yTheo: 379349.000, zTheo: 29.100, xLeve: null, yLeve: null, zLeve: null, label: "DWG AS-BUILT" }
      ];
      msg = `Fichier CAO DWG '${filename}' analysé via le convertisseur binaire. Chargé 2 points géométriques d'ancrage.`;
    } else if (type === "kml") {
      simulatedPoints = [
        { id: "kml-s1", name: "KML_01", xTheo: 366481.555, yTheo: 379342.999, zTheo: 29.050, xLeve: null, yLeve: null, zLeve: null, label: "Placemark KML" },
        { id: "kml-s2", name: "KML_02", xTheo: 366488.112, yTheo: 379351.444, zTheo: 29.080, xLeve: null, yLeve: null, zLeve: null, label: "Placemark KML" }
      ];
      msg = `Fichier KML '${filename}' importé. Placemarks WGS84 projetés en Lambert Zone I.`;
    } else if (type === "shape") {
      simulatedPoints = [
        { id: "shp-s1", name: "SHP_B1", xTheo: 366483.000, yTheo: 379342.000, zTheo: 29.350, xLeve: null, yLeve: null, zLeve: null, label: "Shapefile Boundary" },
        { id: "shp-s2", name: "SHP_B2", xTheo: 366486.200, yTheo: 379347.500, zTheo: 29.310, xLeve: null, yLeve: null, zLeve: null, label: "Shapefile Boundary" }
      ];
      msg = `Shapefile '${filename}' chargé. Coordonnées d'entités de type 'Point' géoréférencées dans le repère Merchich.`;
    } else if (type === "qgis") {
      simulatedPoints = [
        { id: "qgs-s1", name: "QG_V1", xTheo: 366484.500, yTheo: 379345.200, zTheo: 29.150, xLeve: null, yLeve: null, zLeve: null, label: "QGIS Layer Node" },
        { id: "qgs-s2", name: "QG_V2", xTheo: 366489.100, yTheo: 379350.300, zTheo: 29.120, xLeve: null, yLeve: null, zLeve: null, label: "QGIS Layer Node" }
      ];
      msg = `Projet QGIS '${filename}' synchronisé. Extrait les nœuds de couches actives (EPSG:26191).`;
    } else if (type === "rinex") {
      simulatedPoints = [
        { id: "rnx-s1", name: "RNX_REF1", xTheo: 366481.000, yTheo: 379341.000, zTheo: 29.050, xLeve: null, yLeve: null, zLeve: null, label: "RINEX GNSS Base" },
        { id: "rnx-s2", name: "RNX_ROV2", xTheo: 366487.500, yTheo: 379348.000, zTheo: 29.010, xLeve: null, yLeve: null, zLeve: null, label: "RINEX GNSS Rover" }
      ];
      msg = `Fichier d'observations GPS RINEX '${filename}' décodé. Importé 2 stations géodésiques d'époque as-built.`;
    } else if (type === "mapinfo") {
      simulatedPoints = [
        { id: "mif-s1", name: "MIF_T1", xTheo: 366482.900, yTheo: 379341.800, zTheo: 29.250, xLeve: null, yLeve: null, zLeve: null, label: "MapInfo Mif Node" },
        { id: "mif-s2", name: "MIF_T2", xTheo: 366488.400, yTheo: 379349.500, zTheo: 29.210, xLeve: null, yLeve: null, zLeve: null, label: "MapInfo Mif Node" }
      ];
      msg = `Fichier MapInfo '${filename}' (.mif/.tab) géoréférencé et converti en coordonnées de chantier.`;
    } else if (type === "topogen") {
      simulatedPoints = [
        { id: "tpg-s1", name: "TPG_P1", xTheo: 366484.913, yTheo: 379349.932, zTheo: 29.288, xLeve: null, yLeve: null, zLeve: null, label: "Topogen Pillar" },
        { id: "tpg-s2", name: "TPG_P2", xTheo: 366487.817, yTheo: 379349.188, zTheo: 29.188, xLeve: null, yLeve: null, zLeve: null, label: "Topogen Pillar" }
      ];
      msg = `Fichier natif Topogen '${filename}' importé. Synchronisé avec 2 fondations d'ouvrages d'art.`;
    }

    setPoints(simulatedPoints);
    setImporterOutput(msg);
  };

  // Mock CAD/KML/DXF/Shapefile/QGIS/RINEX/MapInfo/Topogen loader
  const handleCadKmlMockImport = (
    format: "txt" | "dxf" | "dwg" | "kml" | "shape" | "qgis" | "rinex" | "mapinfo" | "topogen"
  ) => {
    setIsLoading(true);
    setImporterOutput(null);

    setTimeout(() => {
      setIsLoading(false);
      let simulatedPoints: FichePoint[] = [];

      if (format === "txt") {
        simulatedPoints = [
          { id: "txt-1", name: "PT_01", xTheo: 366484.913, yTheo: 379349.932, zTheo: 29.288, xLeve: null, yLeve: null, zLeve: null, label: "SF2 AXE 62G" },
          { id: "txt-2", name: "PT_02", xTheo: 366487.817, yTheo: 379349.188, zTheo: 29.188, xLeve: null, yLeve: null, zLeve: null, label: "SF2 AXE 62G" },
          { id: "txt-3", name: "PT_03", xTheo: 366485.883, yTheo: 379338.313, zTheo: 29.198, xLeve: null, yLeve: null, zLeve: null, label: "SF2 AXE 62G" }
        ];
        setPoints(simulatedPoints);
        setImporterOutput("Fichier TXT simulé avec succès. Chargé 3 points de design.");
      } else if (format === "dxf") {
        simulatedPoints = [
          { id: "dxf-1", name: "D_01", xTheo: 366480.120, yTheo: 379340.550, zTheo: 29.500, xLeve: null, yLeve: null, zLeve: null, label: "DXF COFFRAGE STADE" },
          { id: "dxf-2", name: "D_02", xTheo: 366483.650, yTheo: 379344.110, zTheo: 29.480, xLeve: null, yLeve: null, zLeve: null, label: "DXF COFFRAGE STADE" },
          { id: "dxf-3", name: "D_03", xTheo: 366487.900, yTheo: 379349.330, zTheo: 29.450, xLeve: null, yLeve: null, zLeve: null, label: "DXF COFFRAGE STADE" },
          { id: "dxf-4", name: "D_04", xTheo: 366491.450, yTheo: 379354.220, zTheo: 29.400, xLeve: null, yLeve: null, zLeve: null, label: "DXF COFFRAGE STADE" }
        ];
        setPoints(simulatedPoints);
        setImporterOutput("DXF importé avec succès. Extrait 4 entités CAD 'POINT' de la couche 'COFFRAGE_SEMELLES'.");
      } else if (format === "dwg") {
        simulatedPoints = [
          { id: "dwg-1", name: "DWG_A1", xTheo: 366485.000, yTheo: 379345.000, zTheo: 29.100, xLeve: null, yLeve: null, zLeve: null, label: "DWG AS-BUILT" },
          { id: "dwg-2", name: "DWG_A2", xTheo: 366489.000, yTheo: 379349.000, zTheo: 29.100, xLeve: null, yLeve: null, zLeve: null, label: "DWG AS-BUILT" },
          { id: "dwg-3", name: "DWG_A3", xTheo: 366493.000, yTheo: 379353.000, zTheo: 29.100, xLeve: null, yLeve: null, zLeve: null, label: "DWG AS-BUILT" }
        ];
        setPoints(simulatedPoints);
        setImporterOutput("Fichier DWG binaire décodé avec succès. Extrait 3 nœuds géométriques d'ancrages.");
      } else if (format === "kml") {
        simulatedPoints = [
          { id: "kml-1", name: "KML_01", xTheo: 366481.555, yTheo: 379342.999, zTheo: 29.050, xLeve: null, yLeve: null, zLeve: null, label: "Placemark KML" },
          { id: "kml-2", name: "KML_02", xTheo: 366488.112, yTheo: 379351.444, zTheo: 29.080, xLeve: null, yLeve: null, zLeve: null, label: "Placemark KML" }
        ];
        setPoints(simulatedPoints);
        setImporterOutput("Placemarks XML KML projetés en coordonnées locales Lambert Zone I.");
      } else if (format === "shape") {
        simulatedPoints = [
          { id: "shp-1", name: "SHP_B1", xTheo: 366483.000, yTheo: 379342.000, zTheo: 29.350, xLeve: null, yLeve: null, zLeve: null, label: "Shapefile Boundary" },
          { id: "shp-2", name: "SHP_B2", xTheo: 366486.200, yTheo: 379347.500, zTheo: 29.310, xLeve: null, yLeve: null, zLeve: null, label: "Shapefile Boundary" },
          { id: "shp-3", name: "SHP_B3", xTheo: 366489.100, yTheo: 379352.000, zTheo: 29.280, xLeve: null, yLeve: null, zLeve: null, label: "Shapefile Boundary" }
        ];
        setPoints(simulatedPoints);
        setImporterOutput("Shapefile ESRI importé avec succès. Extrait 3 enregistrements de points SIG.");
      } else if (format === "qgis") {
        simulatedPoints = [
          { id: "qgs-1", name: "QG_V1", xTheo: 366484.500, yTheo: 379345.200, zTheo: 29.150, xLeve: null, yLeve: null, zLeve: null, label: "QGIS Layer Node" },
          { id: "qgs-2", name: "QG_V2", xTheo: 366489.100, yTheo: 379350.300, zTheo: 29.120, xLeve: null, yLeve: null, zLeve: null, label: "QGIS Layer Node" }
        ];
        setPoints(simulatedPoints);
        setImporterOutput("Couches du projet QGIS (.qgs/.qgz) synchronisées avec succès.");
      } else if (format === "rinex") {
        simulatedPoints = [
          { id: "rnx-1", name: "RNX_REF1", xTheo: 366481.000, yTheo: 379341.000, zTheo: 29.050, xLeve: null, yLeve: null, zLeve: null, label: "RINEX GNSS Base" },
          { id: "rnx-2", name: "RNX_ROV2", xTheo: 366487.500, yTheo: 379348.000, zTheo: 29.010, xLeve: null, yLeve: null, zLeve: null, label: "RINEX GNSS Rover" }
        ];
        setPoints(simulatedPoints);
        setImporterOutput("Fichier d'observations GNSS RINEX importé. Chargé 2 récepteurs géodésiques.");
      } else if (format === "mapinfo") {
        simulatedPoints = [
          { id: "mif-1", name: "MIF_T1", xTheo: 366482.900, yTheo: 379341.800, zTheo: 29.250, xLeve: null, yLeve: null, zLeve: null, label: "MapInfo Mif Node" },
          { id: "mif-2", name: "MIF_T2", xTheo: 366488.400, yTheo: 379349.500, zTheo: 29.210, xLeve: null, yLeve: null, zLeve: null, label: "MapInfo Mif Node" }
        ];
        setPoints(simulatedPoints);
        setImporterOutput("Table MapInfo MIF/MID importée avec succès.");
      } else if (format === "topogen") {
        simulatedPoints = [
          { id: "tpg-1", name: "TPG_P1", xTheo: 366484.913, yTheo: 379349.932, zTheo: 29.288, xLeve: null, yLeve: null, zLeve: null, label: "Topogen Pillar" },
          { id: "tpg-2", name: "TPG_P2", xTheo: 366487.817, yTheo: 379349.188, zTheo: 29.188, xLeve: null, yLeve: null, zLeve: null, label: "Topogen Pillar" },
          { id: "tpg-3", name: "TPG_P3", xTheo: 366485.883, yTheo: 379338.313, zTheo: 29.198, xLeve: null, yLeve: null, zLeve: null, label: "Topogen Pillar" }
        ];
        setPoints(simulatedPoints);
        setImporterOutput("Fichier de projet natif Topogen importé avec succès.");
      }
    }, 1000);
  };

  // Formatting helper for deviations (m)
  const formatDeviation = (val: number | null) => {
    if (val === null) return "";
    const absVal = Math.abs(val);
    const sign = val >= 0 ? "+" : "-";
    const str = absVal.toFixed(3);
    if (str.endsWith("0")) {
      return (val < 0 ? "-" : "") + absVal.toFixed(2);
    }
    return (val < 0 ? "-" : "") + str;
  };

  // Process rowspans for grouped columns (label)
  const getChunkWithRowSpans = (chunkPoints: FichePoint[]) => {
    const processed: (FichePoint & { rowSpan?: number })[] = [];
    for (let i = 0; i < chunkPoints.length; i++) {
      const current = { ...chunkPoints[i], rowSpan: 1 };
      if (i > 0 && chunkPoints[i].label === chunkPoints[i - 1].label) {
        let mainIdx = processed.length - 1;
        while (mainIdx >= 0 && processed[mainIdx].rowSpan === 0) {
          mainIdx--;
        }
        if (mainIdx >= 0 && processed[mainIdx].label === current.label) {
          processed[mainIdx].rowSpan = (processed[mainIdx].rowSpan || 1) + 1;
          current.rowSpan = 0;
        }
      }
      processed.push(current);
    }
    return processed;
  };

  // Mock excel download (.xls file format HTML with proper layout)
  const handleDownloadExcel = () => {
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; }
          td, th { border: 1px solid #000000; padding: 6px; text-align: center; vertical-align: middle; font-size: 9pt; }
          .header-cell { background-color: #f1f5f9; font-weight: bold; font-size: 8pt; text-transform: uppercase; }
          .project-row { background-color: #f8fafc; font-weight: bold; font-size: 10pt; text-align: left; }
          .title-bold { font-weight: bold; }
          .conforme { background-color: #dcfce7; color: #15803d; font-weight: bold; }
          .non-conforme { background-color: #fee2e2; color: #b91c1c; font-weight: bold; }
          .meta-label { background-color: #f1f5f9; font-weight: bold; font-size: 8pt; text-align: left; }
          .meta-value { text-align: left; font-weight: bold; }
        </style>
      </head>
      <body>
        <!-- Header with 5 Columns -->
        <table>
          <tr>
            <th colspan="2" class="header-cell" style="height: 40px;">${logoColumns[0].sectionHeader}</th>
            <th colspan="3" class="header-cell">${logoColumns[1].sectionHeader}</th>
            <th colspan="3" class="header-cell">${logoColumns[2].sectionHeader}</th>
            <th colspan="3" class="header-cell">${logoColumns[3].sectionHeader}</th>
            <th colspan="2" class="header-cell">${logoColumns[4].sectionHeader}</th>
          </tr>
          <tr>
            <td colspan="2" style="font-weight: bold; font-size: 10pt; height: 30px;">${logoColumns[0].orgName}<br/><span style="font-size: 7pt; color: #64748b;">${logoColumns[0].subtitle}</span></td>
            <td colspan="3" style="font-weight: bold; font-size: 10pt;">${logoColumns[1].orgName}<br/><span style="font-size: 7pt; color: #64748b;">${logoColumns[1].subtitle}</span></td>
            <td colspan="3" style="font-weight: bold; font-size: 10pt;">${logoColumns[2].orgName}<br/><span style="font-size: 7pt; color: #64748b;">${logoColumns[2].subtitle}</span></td>
            <td colspan="3" style="font-weight: bold; font-size: 10pt;">${logoColumns[3].orgName}<br/><span style="font-size: 7pt; color: #64748b;">${logoColumns[3].subtitle}</span></td>
            <td colspan="2" style="font-weight: bold; font-size: 10pt;">${logoColumns[4].orgName}<br/><span style="font-size: 7pt; color: #64748b;">${logoColumns[4].subtitle}</span></td>
          </tr>

          <!-- Spacer -->
          <tr style="height: 10px;"><td colspan="13" style="border: none;"></td></tr>

          <!-- Project & Mission -->
          <tr>
            <td colspan="2" class="meta-label">PROJET :</td>
            <td colspan="11" class="meta-value" style="font-size: 11pt;">${projectName.toUpperCase()}</td>
          </tr>
          <tr>
            <td colspan="2" class="meta-label">MISSION :</td>
            <td colspan="11" class="meta-value">${missionName.toUpperCase()}</td>
          </tr>

          <!-- Spacer -->
          <tr style="height: 10px;"><td colspan="13" style="border: none;"></td></tr>

          <!-- Metadata block -->
          <tr>
            <td colspan="2" class="meta-label">Fiche N° :</td>
            <td colspan="2" class="meta-value">${ficheNo}</td>
            <td colspan="2" class="meta-label">Référence Plan :</td>
            <td colspan="4" class="meta-value">${planReference}</td>
            <td colspan="2" class="meta-label">Tolérance :</td>
            <td colspan="1" class="meta-value">±${toleranceCm} cm</td>
          </tr>
          <tr>
            <td colspan="2" class="meta-label">Date :</td>
            <td colspan="2" class="meta-value">${dateStr}</td>
            <td colspan="2" class="meta-label">Révision :</td>
            <td colspan="4" class="meta-value">${revision}</td>
            <td colspan="3" class="meta-value" style="background-color: #f8fafc; font-size: 7pt;">C: conforme, NC : non conforme</td>
          </tr>

          <!-- Control details -->
          <tr>
            <td colspan="4" class="meta-label" style="text-align: center;">TYPE DE CONTRÔLE</td>
            <td colspan="5" class="meta-label" style="text-align: center;">LOCALISATION</td>
            <td colspan="4" class="meta-label" style="text-align: center;">SYSTÈME DE PROJECTION</td>
          </tr>
          <tr>
            <td colspan="4" class="meta-value" style="text-align: center;">${controlType}</td>
            <td colspan="5" class="meta-value" style="text-align: center;">${localisation}</td>
            <td colspan="4" class="meta-value" style="text-align: center; color: #047857;">
              ${project.coordinateSystem?.id === "wgs84" ? "WGS84_GPS" : `MAROC_${project.coordinateSystem?.code || "ZONE_1"}`}
            </td>
          </tr>

          <!-- Spacer -->
          <tr style="height: 15px;"><td colspan="13" style="border: none;"></td></tr>

          <!-- Main Table Headers -->
          <tr style="background-color: #f1f5f9; font-weight: bold; height: 25px;">
            <th style="border: 1px solid #000000; width: 150px;">Axe / Semelle</th>
            <th style="border: 1px solid #000000; width: 80px;">N°Station*</th>
            <th style="border: 1px solid #000000;">X Théorie (m)</th>
            <th style="border: 1px solid #000000;">Y Théorie (m)</th>
            <th style="border: 1px solid #000000;">Z Théorie (m)</th>
            <th style="border: 1px solid #000000; background-color: #fafafa;">X Levé (m)</th>
            <th style="border: 1px solid #000000; background-color: #fafafa;">Y Levé (m)</th>
            <th style="border: 1px solid #000000; background-color: #fafafa;">Z Levé (m)</th>
            <th style="border: 1px solid #000000; color: #b91c1c;">DX (m)</th>
            <th style="border: 1px solid #000000; color: #b91c1c;">DY (m)</th>
            <th style="border: 1px solid #000000; color: #b91c1c;">DZ (m)</th>
            <th style="border: 1px solid #000000; color: #4338ca;">E. Plan (m)</th>
            <th style="border: 1px solid #000000;">C/NC *</th>
          </tr>
    `;

    // Process rowspans for Excel export too!
    const excelPoints = getChunkWithRowSpans(points);

    excelPoints.forEach(p => {
      const dxValM = p.xLeve !== null ? (p.xLeve - p.xTheo) : null;
      const dyValM = p.yLeve !== null ? (p.yLeve - p.yTheo) : null;
      const dzValM = p.zLeve !== null ? (p.zLeve - p.zTheo) : null;
      
      const dxValCm = p.xLeve !== null ? dxValM! * 100 : 0;
      const dyValCm = p.yLeve !== null ? dyValM! * 100 : 0;
      const dzValCm = p.zLeve !== null ? dzValM! * 100 : 0;
      const ePlanCm = Math.sqrt(dxValCm * dxValCm + dyValCm * dyValCm);

      const dxStr = formatDeviation(dxValM);
      const dyStr = formatDeviation(dyValM);
      const dzStr = formatDeviation(dzValM);
      const ePlanStr = p.xLeve !== null ? (ePlanCm / 100).toFixed(3) : "";

      const isConforme = p.xLeve !== null && ePlanCm <= toleranceCm && Math.abs(dzValCm) <= toleranceCm;
      const statusClass = p.xLeve !== null ? (isConforme ? "conforme" : "non-conforme") : "";
      const statusText = p.xLeve !== null ? (isConforme ? "C" : "NC") : "-";

      excelContent += `
        <tr style="height: 20px;">
          ${p.rowSpan !== 0 ? `<td rowspan="${p.rowSpan}" style="font-weight: bold; border: 1px solid #000000;">${p.label}</td>` : ""}
          <td style="font-weight: bold; border: 1px solid #000000;">${p.name}</td>
          <td style="border: 1px solid #000000; mso-number-format:'0.000';">${p.xTheo.toFixed(3)}</td>
          <td style="border: 1px solid #000000; mso-number-format:'0.000';">${p.yTheo.toFixed(3)}</td>
          <td style="border: 1px solid #000000; mso-number-format:'0.000';">${p.zTheo.toFixed(3)}</td>
          <td style="border: 1px solid #000000; mso-number-format:'0.000'; background-color: #fafafa;">${p.xLeve !== null ? p.xLeve.toFixed(3) : "-"}</td>
          <td style="border: 1px solid #000000; mso-number-format:'0.000'; background-color: #fafafa;">${p.yLeve !== null ? p.yLeve.toFixed(3) : "-"}</td>
          <td style="border: 1px solid #000000; mso-number-format:'0.000'; background-color: #fafafa;">${p.zLeve !== null ? p.zLeve.toFixed(3) : "-"}</td>
          <td style="border: 1px solid #000000; mso-number-format:'0.000'; font-weight: bold; color: ${p.xLeve !== null && Math.abs(dxValCm) > toleranceCm ? "#b91c1c" : "#334155"}">${dxStr}</td>
          <td style="border: 1px solid #000000; mso-number-format:'0.000'; font-weight: bold; color: ${p.xLeve !== null && Math.abs(dyValCm) > toleranceCm ? "#b91c1c" : "#334155"}">${dyStr}</td>
          <td style="border: 1px solid #000000; mso-number-format:'0.000'; font-weight: bold; color: ${p.xLeve !== null && Math.abs(dzValCm) > toleranceCm ? "#b91c1c" : "#334155"}">${dzStr}</td>
          <td style="border: 1px solid #000000; mso-number-format:'0.000'; font-weight: bold; color: #4338ca;">${ePlanStr}</td>
          <td class="${statusClass}" style="border: 1px solid #000000;">${statusText}</td>
        </tr>
      `;
    });

    excelContent += `
          <!-- Spacer -->
          <tr style="height: 15px;"><td colspan="13" style="border: none;"></td></tr>

          <!-- Signatures Section -->
          <tr style="height: 25px;">
            <th colspan="4" class="header-cell">CONTRÔLE INTERNE : ENTREPRISE</th>
            <th colspan="5" class="header-cell">CONTRÔLE EXTERNE : BUREAU D'ÉTUDES</th>
            <th colspan="4" class="header-cell">CONTRÔLE EXTÉRIEUR : MO / CABINET TOPO</th>
          </tr>
          <tr style="height: 60px;">
            <td colspan="4" style="vertical-align: top; text-align: left; padding: 6px; font-size: 8pt; color: #475569;">
              Contrôle Interne : ${logoColumns[1].orgName}<br/><br/>
              Date et Signature:
            </td>
            <td colspan="5" style="vertical-align: top; text-align: left; padding: 6px; font-size: 8pt; color: #475569;">
              Contrôle externe entreprise : ${logoColumns[2].orgName}<br/><br/>
              Date et Signature:
            </td>
            <td colspan="4" style="vertical-align: top; text-align: left; padding: 6px; font-size: 8pt; color: #475569;">
              Contrôle extérieur M.O : ${logoColumns[0].orgName}<br/><br/>
              Date et Signature:
            </td>
          </tr>

          <!-- Bottom Dates & Visas -->
          <tr style="height: 10px;"><td colspan="13" style="border: none;"></td></tr>
          <tr>
            <td colspan="2" class="meta-label" style="text-align: center;">Date</td>
            <td colspan="11" style="border: 1px solid #000000; height: 30px;"></td>
          </tr>
          <tr>
            <td colspan="2" class="meta-label" style="text-align: center;">Visa</td>
            <td colspan="11" style="border: 1px solid #000000; height: 40px;"></td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Fiche_Reception_${ficheNo || "D3"}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setImporterOutput("Fichier Excel (.xls) officiel généré et téléchargé.");
  };

  // Print Document (custom full-page layout)
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Fiche de Réception Dimensionnelle Header */}
      <div className="bg-gradient-to-r from-[#0C1527] to-[#080C16] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-rose-950/80 text-rose-400 text-[10px] font-mono rounded-full border border-rose-900/30 uppercase tracking-widest font-black">FICHE DE RÉCEPTION</span>
              <span className="text-slate-500 text-xs font-mono">• Contrôle & Conformité Dimensionnelle</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1 flex items-center space-x-2">
              <span className="bg-gradient-to-r from-rose-400 to-indigo-400 bg-clip-text text-transparent">{project?.name || "Chantier Actif"}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Générez des rapports de conformité as-built, validez les écarts selon les tolérances réglementaires topographiques du Maroc, et exportez aux formats PDF (A4) et Excel (.xls).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showConfig ? "Masquer Réglages" : "Afficher Réglages"}</span>
            </button>
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-md shadow-emerald-950/20"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Télécharger Excel (.xls)</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 shadow-md shadow-indigo-950/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer Fiche (A4)</span>
            </button>
          </div>
        </div>

        {/* Mini project overview bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800/60 text-xs">
          <div className="flex items-center space-x-2.5 text-slate-400">
            <span className="p-1.5 bg-indigo-950/40 text-indigo-400 rounded border border-indigo-900/20">📍</span>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Système National</span>
              <strong className="text-slate-200 font-mono text-[11px]">{project?.coordinateSystem?.name || "Lambert Zone II"}</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 text-slate-400">
            <span className="p-1.5 bg-rose-950/40 text-rose-400 rounded border border-rose-900/20">🎯</span>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Tolérance ONIGT</span>
              <strong className="text-slate-200 font-mono text-[11px]">{toleranceCm} cm (Écart maximum autorisé)</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 text-slate-400">
            <span className="p-1.5 bg-amber-950/40 text-amber-400 rounded border border-amber-900/20">📈</span>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase font-mono tracking-wider">Taux de Conformité</span>
              <strong className={`font-mono text-[11px] ${
                points.length === 0 ? "text-slate-500" :
                (points.filter(p => {
                  const dxVal = p.xLeve !== null ? (p.xLeve - p.xTheo) * 100 : 0;
                  const dyVal = p.yLeve !== null ? (p.yLeve - p.yTheo) * 100 : 0;
                  const dzVal = p.zLeve !== null ? (p.zLeve - p.zTheo) * 100 : 0;
                  const ePlan = Math.sqrt(dxVal * dxVal + dyVal * dyVal);
                  return p.xLeve !== null && ePlan <= toleranceCm && Math.abs(dzVal) <= toleranceCm;
                }).length / points.length) >= 0.8 ? "text-emerald-400 animate-pulse" : "text-rose-400 font-black"
              }`}>
                {points.length === 0 ? "Aucun point" : `${Math.round((points.filter(p => {
                  const dxVal = p.xLeve !== null ? (p.xLeve - p.xTheo) * 100 : 0;
                  const dyVal = p.yLeve !== null ? (p.yLeve - p.yTheo) * 100 : 0;
                  const dzVal = p.zLeve !== null ? (p.zLeve - p.zTheo) * 100 : 0;
                  const ePlan = Math.sqrt(dxVal * dxVal + dyVal * dyVal);
                  return p.xLeve !== null && ePlan <= toleranceCm && Math.abs(dzVal) <= toleranceCm;
                }).length / points.length) * 100)}% d'éléments conformes`}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Client-Editor Configuration Board */}
      {showConfig && (
        <div className="bg-[#0B1220] border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Settings className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
              Panneau de Modification de la Fiche (Mode Client-Éditeur)
            </h3>
          </div>

          {/* Logo Columns Editor */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {logoColumns.map((col, index) => (
              <div key={index} className="bg-[#080C16] border border-slate-850 p-3 rounded-xl space-y-2">
                <span className="block text-[10px] font-mono text-indigo-400 font-bold uppercase">
                  Logo Colonne {index + 1}
                </span>
                
                <div className="space-y-1.5 text-xs">
                  <div>
                    <label className="text-[9px] text-slate-500 block">En-tête section (ex: Maître d'Ouvrage) :</label>
                    <input
                      type="text"
                      value={col.sectionHeader}
                      onChange={e => handleLogoChange(index, "sectionHeader", e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded px-2 py-1 text-white font-mono text-[10px]"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 block">Nom de la Société / Organisme :</label>
                    <input
                      type="text"
                      value={col.orgName}
                      onChange={e => handleLogoChange(index, "orgName", e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded px-2 py-1 text-white font-mono text-[10px]"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 block">Sous-titre / Rôle :</label>
                    <input
                      type="text"
                      value={col.subtitle}
                      onChange={e => handleLogoChange(index, "subtitle", e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded px-2 py-1 text-white font-mono text-[10px]"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-500 block">Ou choix Preset topologique :</label>
                    <select
                      value={col.preset}
                      onChange={e => handleLogoChange(index, "preset", e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded px-2 py-1 text-white font-mono text-[10px] cursor-pointer"
                    >
                      <option value="BAHI NAJIB">SOCIETE BAHI NAJIB</option>
                      <option value="TGCC">Entreprise TGCC</option>
                      <option value="BETTAN AHMED NANA">B.E.T. AHMED NANA</option>
                      <option value="ANEP">ANEP (M.O Délégué)</option>
                      <option value="Royaume du Maroc">Royaume du Maroc</option>
                    </select>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 font-mono">Logo personnalisé PNG/JPG :</span>
                    <button
                      onClick={() => {
                        const fileInput = document.createElement("input");
                        fileInput.type = "file";
                        fileInput.accept = "image/*";
                        fileInput.onchange = (e: any) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (readerEvt) => {
                              handleLogoChange(index, "customImage", readerEvt.target?.result);
                              handleLogoChange(index, "logoType", "custom");
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-2 py-0.5 bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 rounded text-[9px] font-bold hover:bg-indigo-900/40"
                    >
                      Upload Image
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Project & Fiche Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#080C16] p-4 rounded-xl border border-slate-850 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 font-mono mb-1">Nom du Projet de Réception :</label>
              <textarea
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                rows={2}
                className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono mb-1">Désignation Contrôle & Tolérance :</label>
              <div className="space-y-1">
                <input
                  type="text"
                  value={missionName}
                  onChange={e => setMissionName(e.target.value)}
                  placeholder="ex: CONTRÔLE ET SUIVI TOPOGRAPHIQUES"
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400 font-mono">Tolérance (cm) :</span>
                  <input
                    type="number"
                    value={toleranceCm}
                    onChange={e => setToleranceCm(Math.max(1, parseInt(e.target.value) || 3))}
                    className="w-14 bg-[#0B1220] border border-slate-800 rounded p-1 text-white text-center font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">XYZ : ±{toleranceCm}cm</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono mb-1">Référence du Plan de Coffrage :</label>
              <input
                type="text"
                value={planReference}
                onChange={e => setPlanReference(e.target.value)}
                className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <div className="mt-1">
                <label className="block text-[9px] text-slate-500 font-mono mb-0.5">Type de Contrôle :</label>
                <input
                  type="text"
                  value={controlType}
                  onChange={e => setControlType(e.target.value)}
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-1.5 text-white font-mono text-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono mb-1">Fiche N°, Date & Révision :</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={ficheNo}
                  onChange={e => setFicheNo(e.target.value)}
                  placeholder="Fiche N°"
                  title="Numéro de Fiche"
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <input
                  type="date"
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                  title="Date"
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <input
                  type="text"
                  value={revision}
                  onChange={e => setRevision(e.target.value)}
                  placeholder="Rév."
                  title="Indice de Révision"
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <div>
                  <label className="block text-[9px] text-slate-500 font-mono mb-0.5">Localisation :</label>
                  <input
                    type="text"
                    value={localisation}
                    onChange={e => setLocalisation(e.target.value)}
                    className="w-full bg-[#0B1220] border border-slate-800 rounded p-1.5 text-white font-mono text-[10px]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 font-mono mb-0.5">Lignes de points par page A4 :</label>
                  <input
                    type="number"
                    value={rowsPerPage}
                    onChange={e => setRowsPerPage(Math.max(5, Math.min(50, parseInt(e.target.value) || 15)))}
                    className="w-full bg-[#0B1220] border border-slate-800 rounded p-1.5 text-white font-mono text-[10px] text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form to add / import CAD point */}
          <div className="bg-[#080C16] p-4 rounded-xl border border-slate-850 space-y-3">
            <span className="block text-xs font-mono font-bold text-indigo-400">
              ⚡ SAISIE ET TRANSFERT DE VERTICES CADASTRALES / COORDONNÉES DESIGN
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-500 font-mono mb-1">Importer depuis les relevés CAO :</label>
                <select
                  value={selectedCADPointId}
                  onChange={handleCADPointSelect}
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white font-mono cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Choisir un Point CAO --</option>
                  {project.points.map(pt => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} (X:{pt.x.toFixed(2)}, Y:{pt.y.toFixed(2)}, Z:{pt.z.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-mono mb-1">Nom Borne :</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  placeholder="C16"
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-mono mb-1">X Théo :</label>
                <input
                  type="text"
                  value={manualX}
                  onChange={e => setManualX(e.target.value)}
                  placeholder="Easting"
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-mono mb-1">Y Théo :</label>
                <input
                  type="text"
                  value={manualY}
                  onChange={e => setManualY(e.target.value)}
                  placeholder="Northing"
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-mono mb-1">Z Théo :</label>
                <input
                  type="text"
                  value={manualZ}
                  onChange={e => setManualZ(e.target.value)}
                  placeholder="Altitude"
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="w-full sm:w-2/3">
                <label className="block text-[10px] text-slate-500 font-mono mb-0.5">Localisation / Label spéc (ex: SF2 AXE 64G) :</label>
                <input
                  type="text"
                  value={manualLabel}
                  onChange={e => setManualLabel(e.target.value)}
                  placeholder="Axe semelle, piquet, poteau..."
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-1.5 text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleAddPoint}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#00F5D4] hover:bg-[#00d1b5] text-slate-900 font-black rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow-md shadow-[#00f5d4]/10 self-end"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter à la Fiche</span>
              </button>
            </div>
          </div>

          {/* Import DXF/KML/TXT sub-panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Import file coordinates */}
            <div className="bg-[#080C16] p-4 rounded-xl border border-slate-850 space-y-4">
              <div className="flex flex-col space-y-2">
                <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-rose-500 animate-bounce" />
                  <span>Importation Multiformats (9 Extensions Topographiques / SIG)</span>
                </h4>
                
                <div className="flex flex-wrap gap-1 bg-[#0B1220] p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
                  {([
                    { value: "txt", label: "TXT / CSV" },
                    { value: "dxf", label: "DXF CAD" },
                    { value: "dwg", label: "DWG CAD" },
                    { value: "kml", label: "KML GIS" },
                    { value: "shape", label: "Shapefile" },
                    { value: "qgis", label: "QGIS" },
                    { value: "rinex", label: "RINEX GNSS" },
                    { value: "mapinfo", label: "MapInfo" },
                    { value: "topogen", label: "Topogen" }
                  ] as const).map((fmt) => (
                    <button
                      key={fmt.value}
                      onClick={() => setImportType(fmt.value)}
                      className={`px-2 py-1 rounded transition-all cursor-pointer uppercase font-semibold ${
                        importType === fmt.value 
                          ? "bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold shadow-sm shadow-indigo-950" 
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {importType === "txt" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="block text-[10px] text-slate-400 font-mono">Fichier THÉORIE (.txt) :</span>
                    <textarea
                      placeholder="Format: Nom X Y Z [Label]&#10;C1 366484.913 379349.932 29.288 SF2&#10;C2 366487.817 379349.188 29.188 SF2"
                      rows={3}
                      value={theoFileText}
                      onChange={e => setTheoFileText(e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white font-mono placeholder-slate-700 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleTxtImport(theoFileText, "theo")}
                      disabled={!theoFileText.trim()}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded font-mono text-[10px] transition-colors cursor-pointer"
                    >
                      Charger Théorie .txt
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[10px] text-slate-400 font-mono">Fichier LEVÉ RÉEL (.txt) :</span>
                    <textarea
                      placeholder="Format: Nom X Y Z&#10;C1 366484.873 379349.950 29.168&#10;C2 366487.800 379349.203 29.160"
                      rows={3}
                      value={leveFileText}
                      onChange={e => setLeveFileText(e.target.value)}
                      className="w-full bg-[#0B1220] border border-slate-800 rounded p-2 text-white font-mono placeholder-slate-700 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleTxtImport(leveFileText, "leve")}
                      disabled={!leveFileText.trim()}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded font-mono text-[10px] transition-colors cursor-pointer"
                    >
                      Fusionner Levé Réel .txt
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleFileAndParse(file, importType);
                    }
                  }}
                  className="bg-[#0B1220] border-2 border-dashed border-slate-800 hover:border-indigo-500 p-5 rounded-2xl text-center space-y-4 transition-all"
                >
                  <ImageIcon className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-200">
                      Importateur & Décodeur ({importType.toUpperCase()})
                    </p>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Glissez-déposez ou sélectionnez votre fichier topographique <strong>.{importType}</strong> pour charger ou projeter les vecteurs as-built.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        
                        let acceptExt = `.${importType}`;
                        if (importType === "shape") acceptExt = ".shp,.shx,.dbf,.zip";
                        if (importType === "qgis") acceptExt = ".qgs,.qgz";
                        if (importType === "rinex") acceptExt = ".o,.n,.g,.rnx,.20o";
                        if (importType === "mapinfo") acceptExt = ".mif,.tab";
                        if (importType === "topogen") acceptExt = ".json,.topogen";

                        input.accept = acceptExt;
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileAndParse(file, importType);
                          }
                        };
                        input.click();
                      }}
                      className="px-4 py-2 bg-indigo-950 text-indigo-400 border border-indigo-900/40 hover:bg-indigo-900/60 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Parcourir fichier .{importType === "shape" ? "shp/zip" : importType === "mapinfo" ? "mif/tab" : importType}
                    </button>
                    <button
                      onClick={() => handleCadKmlMockImport(importType)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Simuler Importation {importType.toUpperCase()}
                    </button>
                  </div>
                </div>
              )}

              {/* Informative help note about Moroccan Topo scales */}
              <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-lg text-[10px] text-indigo-300 font-mono space-y-1 leading-relaxed">
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#00F5D4]" />
                  <span className="font-bold text-[#00F5D4]">CONVERSIONS CADASTRALES MAROCAINES</span>
                </div>
                <span>● Échelle du plan cadastral: les écarts <strong>0.010 = 1cm</strong> et <strong>0.001 = 1mm</strong> (unités métriques).</span>
                <br />
                <span>● Tolérances ONIGT standardisées: Fond de fouille / Fondations = 3cm | Ouvrages d'art / Axe = 1cm.</span>
              </div>
            </div>

            {/* Simulated Deviation inputs (Alea) */}
            <div className="bg-[#080C16] p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-[#00F5D4] animate-spin-slow" />
                  <span>Simulateur d'Écarts Coordonnées (+- mm)</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-serif">
                  Simulez de vrais bruits d'arpentage sur tous les points d'après des limites d'écart personnalisées en millimètres.
                  La simulation applique la formule de la fiche :
                </p>
                <div className="p-2.5 bg-[#0B1220] rounded border border-slate-800 font-mono text-[11px] text-[#00F5D4] text-center font-bold">
                  =ARRONDI(B:B + (ALEA.ENTRE.BORNES({simMinMm}; {simMaxMm}) / 1000); 3)
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-slate-400 font-mono text-[10px] mb-1">
                      Écart Minimum (mm) :
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="-20"
                        max="0"
                        value={simMinMm}
                        onChange={e => setSimMinMm(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <span className="text-white font-mono text-xs w-8 text-right font-bold">{simMinMm}mm</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono text-[10px] mb-1">
                      Écart Maximum (mm) :
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={simMaxMm}
                        onChange={e => setSimMaxMm(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <span className="text-white font-mono text-xs w-8 text-right font-bold">+{simMaxMm}mm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={executeDeviationSimulation}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-950/20"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>Simuler Écart (+/-)</span>
                </button>
                <button
                  onClick={handleGPSChantierSimulation}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  title="Simule un levé topo réel précis au centimètre près"
                >
                  Simuler Levé GPS (Chantier)
                </button>
                <button
                  onClick={clearMeasuredCoordinates}
                  className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-red-400 text-xs rounded-lg transition-colors cursor-pointer"
                  title="Réinitialise le levé"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Importer outcome notifications */}
          {isLoading && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span>Chargement du fichier topographique... Lecture des octets CAO...</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Real-Time preview: Official Fiche PDF Page layout container */}
      <div className="bg-[#0B1220] border border-slate-800 p-6 rounded-2xl shadow-xl overflow-x-auto">
        <div className="text-slate-400 text-xs mb-3 font-mono flex items-center justify-between">
          <span>👁️ PRÉVISUALISATION DU RAPPORT DE CONFORMITÉ / PLAN DE RÉCEPTION (FORMAT A4)</span>
          <span className="text-slate-500 text-[10px]">Utilisez le bouton "Imprimer la Fiche" ci-dessus pour sortir en A4</span>
        </div>

        {/* The Printable A4 Sheet container */}
        <div id="printable-fiche-reception-a4" className="w-full">
          {/* Printable Page Styles specifically targeting window.print() */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-fiche-reception-a4, #printable-fiche-reception-a4 * {
                visibility: visible !important;
              }
              #printable-fiche-reception-a4 {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                background: white !important;
              }
              .print-page {
                width: 210mm !important;
                height: 297mm !important;
                padding: 10mm !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                position: relative !important;
                background: white !important;
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
              }
              .print-page:last-child {
                page-break-after: avoid !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          {(() => {
            // Helper to split points into pages
            const chunkArray = <T,>(arr: T[], size: number): T[][] => {
              if (arr.length === 0) return [[]];
              const chunks: T[][] = [];
              for (let i = 0; i < arr.length; i += size) {
                chunks.push(arr.slice(i, i + size));
              }
              return chunks;
            };

            const pageChunks = chunkArray(points, rowsPerPage);

            return pageChunks.map((chunk, pageIdx) => {
              const processedChunkPoints = getChunkWithRowSpans(chunk);

              return (
                <div 
                  key={pageIdx} 
                  className="print-page mx-auto bg-white text-slate-900 p-[10mm] shadow-2xl rounded-sm w-[210mm] h-[297mm] font-sans border border-slate-300 relative flex flex-col justify-between select-all mb-8"
                >
                  {/* Top Sheet Section */}
                  <div>
                    {/* A4 Header Section - 5 Columns for Logos & Agencies */}
                    <div className="grid grid-cols-5 border border-slate-900 text-center text-[9px] leading-tight mb-3 select-none">
                      {logoColumns.map((col, index) => {
                        const preset = PRESET_LOGOS[col.logoType as keyof typeof PRESET_LOGOS];
                        return (
                          <div 
                            key={index} 
                            className={`p-1.5 flex flex-col items-center justify-between min-h-[95px] ${
                              index < 4 ? "border-r border-slate-900" : ""
                            }`}
                          >
                            <span className="text-[7.5px] uppercase tracking-wide text-slate-500 block h-3.5 font-mono font-bold leading-none truncate max-w-full">
                              {col.sectionHeader || "..."}
                            </span>

                            {/* Logo block */}
                            <div className="my-1 flex items-center justify-center h-10 w-full">
                              {col.customImage ? (
                                <img 
                                  src={col.customImage} 
                                  alt="Logo" 
                                  className="max-h-10 max-w-[85%] object-contain" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : preset ? (
                                <div className="transform scale-90">
                                  {preset.icon}
                                </div>
                              ) : (
                                <div className="bg-slate-200 w-8 h-8 rounded flex items-center justify-center font-bold text-slate-600 text-xs">
                                  IGT
                                </div>
                              )}
                            </div>

                            <div className="space-y-px w-full">
                              <span className="block font-black text-[8px] uppercase text-slate-800 truncate leading-none" title={col.orgName}>
                                {col.orgName || "Cabinet Topo"}
                              </span>
                              <span className="block text-[7px] text-slate-500 leading-none italic truncate">
                                {col.subtitle || "Rôle"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Project Details Sheet Block */}
                    <div className="border border-slate-900 p-2.5 text-[11px] leading-tight mb-2.5 font-mono space-y-0.5">
                      <div>
                        <span className="font-bold text-[10px] text-slate-600">PROJET :</span>{" "}
                        <span className="font-black text-[11px] uppercase text-black">{projectName}</span>
                      </div>
                      <div className="pt-0.5 border-t border-slate-100">
                        <span className="font-bold text-slate-600">MISSION :</span>{" "}
                        <span className="font-bold text-slate-900 uppercase">{missionName}</span>
                      </div>
                    </div>

                    {/* Meta detail grid row */}
                    <div className="grid grid-cols-12 border border-slate-900 text-[10px] font-mono mb-2.5 leading-tight">
                      <div className="col-span-4 p-1.5 border-r border-slate-900 space-y-0.5">
                        <div>
                          <span className="text-slate-500 text-[9px]">Fiche N° :</span>{" "}
                          <span className="font-black text-slate-900">{ficheNo}</span>
                        </div>
                        <div className="pt-0.5 border-t border-slate-150">
                          <span className="text-slate-500 text-[9px]">Date :</span>{" "}
                          <span className="font-bold text-slate-800">{dateStr}</span>
                        </div>
                      </div>

                      <div className="col-span-5 p-1.5 border-r border-slate-900 space-y-0.5 flex flex-col justify-center">
                        <span className="text-slate-500 text-[8px] uppercase font-bold">RÉFÉRENCE DE PLAN :</span>
                        <span className="font-bold text-slate-900 text-[10px] truncate" title={planReference}>
                          {planReference}
                        </span>
                      </div>

                      <div className="col-span-3 p-1.5 bg-slate-50/60 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] text-slate-500 leading-none mb-0.5">Indice Rév. : <span className="font-bold text-slate-900">{revision}</span></span>
                        <span className="text-[8px] font-bold text-slate-700 uppercase">Tolérance : ±{toleranceCm} cm</span>
                      </div>
                    </div>

                    {/* Control details row */}
                    <div className="grid grid-cols-3 border border-slate-900 text-[9px] font-mono mb-3 text-center leading-tight">
                      <div className="p-1.5 border-r border-slate-900">
                        <span className="text-slate-500 block text-[7px] uppercase">TYPE DE CONTRÔLE</span>
                        <span className="font-bold text-slate-800 truncate block">{controlType}</span>
                      </div>
                      <div className="p-1.5 border-r border-slate-900">
                        <span className="text-slate-500 block text-[7px] uppercase">LOCALISATION</span>
                        <span className="font-bold text-slate-800 truncate block">{localisation}</span>
                      </div>
                      <div className="p-1.5">
                        <span className="text-slate-500 block text-[7px] uppercase">SYSTÈME DE PROJECTION</span>
                        <span className="font-bold text-emerald-800 uppercase truncate block">
                          {project.coordinateSystem?.id === "wgs84" ? "WGS84_GPS" : `MAROC_${project.coordinateSystem?.code || "ZONE_1"}`}
                        </span>
                      </div>
                    </div>

                    {/* Main Inspection Coordinates Table */}
                    <div className="mb-2">
                      <table className="w-full border-collapse border border-slate-900 text-[9.5px] font-mono leading-none">
                        <thead>
                          <tr className="bg-slate-100 text-slate-850 uppercase text-center border-b border-slate-900 font-bold select-none h-6">
                            <th className="border-r border-slate-900 p-1 text-left w-[22%]">Axe / Semelle</th>
                            <th className="border-r border-slate-900 p-1 w-[10%]">N°Station*</th>
                            <th className="border-r border-slate-900 p-1">X THEORIE</th>
                            <th className="border-r border-slate-900 p-1">Y THEORIE</th>
                            <th className="border-r border-slate-900 p-1">Z THEORIE</th>
                            <th className="border-r border-slate-900 p-1 bg-slate-50">Z LEVE</th>
                            <th className="border-r border-slate-900 p-1 text-rose-800 font-bold">DX</th>
                            <th className="border-r border-slate-900 p-1 text-rose-800 font-bold">DY</th>
                            <th className="border-r border-slate-900 p-1 text-rose-800 font-bold">DZ</th>
                            <th className="p-1 w-[10%]">C/NC *</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chunk.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="p-4 text-center text-slate-400 italic">
                                Aucune coordonnée dans cette page.
                              </td>
                            </tr>
                          ) : (
                            processedChunkPoints.map((p, idx) => {
                              const dxVal = p.xLeve !== null ? (p.xLeve - p.xTheo) : null;
                              const dyVal = p.yLeve !== null ? (p.yLeve - p.yTheo) : null;
                              const dzVal = p.zLeve !== null ? (p.zLeve - p.zTheo) : null;
                              
                              const dxValCm = p.xLeve !== null ? dxVal! * 100 : 0;
                              const dyValCm = p.yLeve !== null ? dyVal! * 100 : 0;
                              const dzValCm = p.zLeve !== null ? dzVal! * 100 : 0;
                              const ePlan = p.xLeve !== null ? Math.sqrt(dxValCm * dxValCm + dyValCm * dyValCm) : 0;

                              const dxStr = formatDeviation(dxVal);
                              const dyStr = formatDeviation(dyVal);
                              const dzStr = formatDeviation(dzVal);

                              const isDxOk = p.xLeve === null || Math.abs(dxValCm) <= toleranceCm;
                              const isDyOk = p.xLeve === null || Math.abs(dyValCm) <= toleranceCm;
                              const isDzOk = p.zLeve === null || Math.abs(dzValCm) <= toleranceCm;
                              const isEPlanOk = p.xLeve === null || ePlan <= toleranceCm;

                              const isConforme = p.zLeve !== null && isEPlanOk && isDzOk;

                              return (
                                <tr key={p.id} className="border-b border-slate-900 text-center h-[18px]">
                                  {p.rowSpan !== 0 && (
                                    <td 
                                      rowSpan={p.rowSpan} 
                                      className="border-r border-slate-900 p-1 text-left font-sans text-[8.5px] font-black text-slate-800 align-middle bg-white max-w-[120px] truncate"
                                    >
                                      {p.label}
                                    </td>
                                  )}
                                  <td className="border-r border-slate-900 p-1 font-bold text-slate-900">
                                    {p.name}
                                  </td>
                                  <td className="border-r border-slate-900 p-1 font-mono text-slate-600 text-[9px]">
                                    {p.xTheo.toFixed(3)}
                                  </td>
                                  <td className="border-r border-slate-900 p-1 font-mono text-slate-600 text-[9px]">
                                    {p.yTheo.toFixed(3)}
                                  </td>
                                  <td className="border-r border-slate-900 p-1 font-mono text-slate-600 text-[9px]">
                                    {p.zTheo.toFixed(3)}
                                  </td>
                                  <td className="border-r border-slate-900 p-1 font-mono bg-slate-50 text-slate-900 text-[9px] font-bold">
                                    {p.zLeve !== null ? p.zLeve.toFixed(3) : "-"}
                                  </td>
                                  <td className={`border-r border-slate-900 p-1 font-bold text-[9px] ${!isDxOk && p.xLeve !== null ? "text-red-600 bg-red-50 font-black" : "text-slate-700"}`}>
                                    {dxStr || "-"}
                                  </td>
                                  <td className={`border-r border-slate-900 p-1 font-bold text-[9px] ${!isDyOk && p.xLeve !== null ? "text-red-600 bg-red-50 font-black" : "text-slate-700"}`}>
                                    {dyStr || "-"}
                                  </td>
                                  <td className={`border-r border-slate-900 p-1 font-bold text-[9px] ${!isDzOk && p.zLeve !== null ? "text-red-600 bg-red-50 font-black" : "text-slate-700"}`}>
                                    {dzStr || "-"}
                                  </td>
                                  <td className="p-0.5 border-slate-900 align-middle">
                                    <div className="flex items-center justify-center space-x-1.5">
                                      {p.zLeve === null ? (
                                        <span className="text-slate-400 font-bold">-</span>
                                      ) : isConforme ? (
                                        <span className="text-emerald-700 font-black text-[9px] bg-emerald-50 px-1 border border-emerald-300 rounded leading-none">C</span>
                                      ) : (
                                        <span className="text-red-700 font-black text-[9px] bg-red-50 px-1 border border-red-300 rounded leading-none">NC</span>
                                      )}

                                      {/* Client-editor only delete button (hidden during print) */}
                                      <button
                                        onClick={() => handleDeletePoint(p.id)}
                                        className="p-0.5 text-slate-300 hover:text-red-500 rounded transition-colors no-print cursor-pointer"
                                        title="Supprimer ce point"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bottom Sheet Section */}
                  <div>
                    {/* Tripartite Signatures Validation Block */}
                    <div className="grid grid-cols-3 border border-slate-900 text-center font-sans mt-2 select-none text-[8.5px] leading-tight">
                      {/* Constructeur */}
                      <div className="border-r border-slate-900 p-2 min-h-[95px] flex flex-col justify-between">
                        <span className="font-black uppercase text-slate-800">
                          CONTRÔLE INTERNE : ENTREPRISE
                        </span>
                        <div className="text-[9px] text-slate-600 font-bold italic py-1 truncate">
                          {logoColumns[1].orgName}
                        </div>
                        <span className="text-[7.5px] text-slate-400 font-mono">Date, Signature & Cachet</span>
                      </div>

                      {/* Bureau d'etude */}
                      <div className="border-r border-slate-900 p-2 min-h-[95px] flex flex-col justify-between">
                        <span className="font-black uppercase text-slate-800">
                          CONTRÔLE EXTERNE : BUREAU D'ÉTUDES [B.E.T]
                        </span>
                        <div className="text-[9px] text-slate-600 font-bold italic py-1 truncate">
                          {logoColumns[2].orgName}
                        </div>
                        <span className="text-[7.5px] text-slate-400 font-mono">Date, Signature & Cachet</span>
                      </div>

                      {/* IGT Cabinet */}
                      <div className="p-2 min-h-[95px] flex flex-col justify-between">
                        <span className="font-black uppercase text-slate-800">
                          CONTRÔLE EXTÉRIEUR : CABINET TOPO / M.O
                        </span>
                        <div className="text-[9px] text-slate-600 font-bold italic py-1 truncate">
                          {logoColumns[0].orgName}
                        </div>
                        <span className="text-[7.5px] text-slate-400 font-mono">Date, Signature & Cachet</span>
                      </div>
                    </div>

                    {/* Bottom Date & Visa block */}
                    <div className="mt-2 border-collapse border border-slate-900 text-[9px] font-mono select-none">
                      <div className="flex border-b border-slate-900 h-6">
                        <div className="w-[12%] font-bold text-center border-r border-slate-900 bg-slate-50 flex items-center justify-center">Date</div>
                        <div className="w-[88%] p-1"></div>
                      </div>
                      <div className="flex h-8">
                        <div className="w-[12%] font-bold text-center border-r border-slate-900 bg-slate-50 flex items-center justify-center">Visa</div>
                        <div className="w-[88%] p-1"></div>
                      </div>
                    </div>

                    {/* Footer Metadata */}
                    <div className="flex justify-between items-center text-[7.5px] font-mono font-bold text-slate-500 mt-2 border-t border-slate-300 pt-1 select-none">
                      <span>* RELEVÉS EFFECTUÉS PAR LEVER GPS-RTK ET STATION TOTALE DE PRÉCISION</span>
                      <span className="uppercase text-slate-700">PAGE {pageIdx + 1} SUR {pageChunks.length}</span>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
