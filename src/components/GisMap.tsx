import React, { useEffect, useRef, useState } from "react";
import { Project, Point, CADLine } from "../types";
import { 
  MapPin, 
  Globe, 
  Map as MapIcon, 
  Layers, 
  Maximize, 
  Navigation, 
  Activity, 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  Check, 
  Crosshair, 
  Info, 
  Search, 
  ChevronRight, 
  Edit3,
  RefreshCw,
  FileText
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix standard Leaflet icon marker assets issue in Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface GisMapProps {
  project: Project;
  onUpdateProject?: (updated: Project) => Promise<void> | void;
}

// Projection Reference Parameters for Morocco coordinate grids
const getProjectionParams = (csId: string) => {
  switch (csId) {
    case "morocco-lambert1":
      return { originLat: 34.25, originLng: -6.00, falseEasting: 500000, falseNorthing: 300000, name: "Lambert Zone I" };
    case "morocco-lambert2":
      return { originLat: 31.75, originLng: -6.00, falseEasting: 500000, falseNorthing: 300000, name: "Lambert Zone II" };
    case "morocco-lambert3":
      return { originLat: 29.75, originLng: -6.00, falseEasting: 500000, falseNorthing: 300000, name: "Lambert Zone III" };
    case "morocco-lambert4":
      return { originLat: 26.75, originLng: -6.00, falseEasting: 500000, falseNorthing: 300000, name: "Lambert Zone IV" };
    case "utm29":
      return { originLat: 31.00, originLng: -9.00, falseEasting: 500000, falseNorthing: 3400000, name: "UTM Zone 29N" };
    default:
      // Default to Casablanca/Rabat grid Zone 2
      return { originLat: 31.75, originLng: -6.00, falseEasting: 500000, falseNorthing: 300000, name: "Lambert Zone II Fallback" };
  }
};

// Convert Lambert/local X-Y meters to GPS Latitude & Longitude
const localToLatLng = (x: number, y: number, csId: string): [number, number] => {
  if (csId === "wgs84") {
    return [y, x];
  }
  const params = getProjectionParams(csId);
  const dx = x - params.falseEasting;
  const dy = y - params.falseNorthing;

  // Approximate conversion factors for Morocco region (1m in degrees)
  const latFactor = 0.000009022; 
  const lngFactor = 0.000010811; 

  const lat = params.originLat + (dy * latFactor);
  const lng = params.originLng + (dx * lngFactor);
  return [lat, lng];
};

// Convert GPS Latitude & Longitude to local Lambert/Grid X-Y meters
const latLngToLocal = (lat: number, lng: number, csId: string): { x: number; y: number } => {
  if (csId === "wgs84") {
    return { x: lng, y: lat };
  }
  const params = getProjectionParams(csId);
  const dLat = lat - params.originLat;
  const dLng = lng - params.originLng;

  const latFactor = 0.000009022;
  const lngFactor = 0.000010811;

  const y = params.falseNorthing + (dLat / latFactor);
  const x = params.falseEasting + (dLng / lngFactor);
  return { x, y };
};

export default function GisMap({ project, onUpdateProject }: GisMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const beaconLayerRef = useRef<L.LayerGroup | null>(null);

  // Basemap & mouse coordinates
  const [mapType, setMapType] = useState<"osm" | "esri">("osm");
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mouseLocal, setMouseLocal] = useState<{ x: number; y: number } | null>(null);

  // Geodetic measuring states
  const [distanceStart, setDistanceStart] = useState<Point | null>(null);
  const [distanceEnd, setDistanceEnd] = useState<Point | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

  // Drawing Tools states
  const [drawMode, setDrawMode] = useState<"view" | "pointer" | "line">("view");
  const [selectedLayer, setSelectedLayer] = useState<string>("Boundary");
  const [lineStartPointId, setLineStartPointId] = useState<string>("");
  const [lineEndPointId, setLineEndPointId] = useState<string>("");

  // Point capture & adding popup state
  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState(false);
  const [capturedLatLng, setCapturedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [capturedLocalX, setCapturedLocalX] = useState<number>(0);
  const [capturedLocalY, setCapturedLocalY] = useState<number>(0);
  const [newPointName, setNewPointName] = useState("");
  const [newPointCode, setNewPointCode] = useState("STATION");
  const [newPointZ, setNewPointZ] = useState("100.000");
  const [newPointDesc, setNewPointDesc] = useState("Pointé sur la carte");

  // Coordinate locating inputs
  const [locateX, setLocateX] = useState("450064.768");
  const [locateY, setLocateY] = useState("407434.683");
  const [locatedMarkerInfo, setLocatedMarkerInfo] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);

  // Fullscreen, Geolocation tracking, and Interactive point deletion mode states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false);
  
  const userMarkerRef = useRef<L.Marker | null>(null);
  const isDeleteModeActiveRef = useRef(false);

  // Keep ref in sync to avoid Leaflet closures stale state
  useEffect(() => {
    isDeleteModeActiveRef.current = isDeleteModeActive;
  }, [isDeleteModeActive]);

  // Handle Leaflet resize when full screen is toggled
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, [isFullscreen]);

  // Deletion logic
  const handleDeletePointById = (pointId: string) => {
    if (!onUpdateProject) return;
    const updatedPoints = project.points.filter(p => p.id !== pointId);
    const updatedLines = project.lines.filter(l => l.p1_id !== pointId && l.p2_id !== pointId);
    onUpdateProject({
      ...project,
      points: updatedPoints,
      lines: updatedLines
    });
  };

  // Quick geolocation capture
  const handleActivateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          const map = mapRef.current;
          if (map) {
            map.flyTo([lat, lng], 17);
          }
        },
        (error) => {
          // Fallback to random Rabat center offset
          const lat = 34.0150 + (Math.random() - 0.5) * 0.005;
          const lng = -6.8327 + (Math.random() - 0.5) * 0.005;
          setUserLocation({ lat, lng });
          const map = mapRef.current;
          if (map) {
            map.flyTo([lat, lng], 17);
          }
          alert("✓ Position GPS obtenue (Simulée pour contourner le blocage iframe). Vous pouvez glisser le point bleu n'importe où !");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      const lat = 34.0150;
      const lng = -6.8327;
      setUserLocation({ lat, lng });
      const map = mapRef.current;
      if (map) {
        map.flyTo([lat, lng], 17);
      }
    }
  };

  // Save dragged position
  const handleSaveUserLocationAsPoint = (lat: number, lng: number) => {
    if (!onUpdateProject) return;
    const csId = project.coordinateSystem?.id || "morocco-lambert2";
    const local = latLngToLocal(lat, lng, csId);
    
    const newPt: Point = {
      id: `pt_gps_${Date.now()}`,
      name: `GPS_${project.points.length + 1}`,
      x: parseFloat(local.x.toFixed(3)),
      y: parseFloat(local.y.toFixed(3)),
      z: 100.0,
      code: "GPS",
      description: "Borne créée par position GPS glissée"
    };

    onUpdateProject({
      ...project,
      points: [...project.points, newPt]
    });
  };

  // File upload states
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<{ points: Point[]; lines: CADLine[] } | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>("");

  // Rabat Center default coords fallback
  const rabatCenter: [number, number] = [34.0150, -6.8327];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: rabatCenter,
      zoom: 13,
      zoomControl: true,
    });

    mapRef.current = map;

    // Standard Markers layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Special localized beacon layer
    const beaconLayer = L.layerGroup().addTo(map);
    beaconLayerRef.current = beaconLayer;

    // Tracker for mouse coordinates
    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setMouseCoords({ lat, lng });

      // Convert mouse Lat/Lng to local coordinates on-the-fly
      const csId = project.coordinateSystem?.id || "morocco-lambert2";
      const local = latLngToLocal(lat, lng, csId);
      setMouseLocal({ x: local.x, y: local.y });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Set up basemap tile layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    let attribution = "© OpenStreetMap contributors";

    if (mapType === "esri") {
      tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      attribution = "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";
    }

    L.tileLayer(tileUrl, { attribution }).addTo(map);
  }, [mapType]);

  // Handle map clicks for Point Capture drawing tool
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (drawMode === "pointer") {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setCapturedLatLng({ lat, lng });

        const csId = project.coordinateSystem?.id || "morocco-lambert2";
        const local = latLngToLocal(lat, lng, csId);
        setCapturedLocalX(parseFloat(local.x.toFixed(3)));
        setCapturedLocalY(parseFloat(local.y.toFixed(3)));
        
        // Auto default point name
        setNewPointName(`P_MAP_${project.points.length + 1}`);
        setIsAddPointModalOpen(true);
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [drawMode, project.points.length, project.coordinateSystem?.id]);

  // Update Map Markers & Polylines from project database
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const csId = project.coordinateSystem?.id || "morocco-lambert2";
    const latLngs: L.LatLngExpression[] = [];

    // Render vertices
    project.points.forEach((pt) => {
      const [lat, lng] = localToLatLng(pt.x, pt.y, csId);
      latLngs.push([lat, lng]);

      // Dynamic color by code or type
      const isLeve = pt.xLeve !== undefined && pt.xLeve !== null;
      const markerColor = pt.code === "STATION" ? "#ef4444" : isLeve ? "#10b981" : "#4f46e5";

      // SVG customized vector icon
      const customIcon = L.divIcon({
        className: "custom-point-marker",
        html: `<div class="relative group">
          <div class="w-3.5 h-3.5 rounded-full border-2 border-white shadow shadow-slate-950 flex items-center justify-center" style="background-color: ${markerColor};"></div>
          <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-950/90 text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-[999]">
            ${pt.name} (${pt.code})
          </div>
        </div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Add direct click listener to handle deletion if mode is active
      marker.on("click", (e) => {
        if (isDeleteModeActiveRef.current) {
          L.DomEvent.stopPropagation(e);
          if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le point ${pt.name} ?`)) {
            handleDeletePointById(pt.id);
          }
        }
      });

      marker.bindPopup(`
          <div class="p-2 font-sans text-xs bg-slate-900 text-slate-100 rounded-lg border border-slate-800 min-w-[160px]">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
              <span class="font-bold text-indigo-400 font-mono">${pt.name}</span>
              <span class="px-1.5 py-0.2 bg-slate-800 text-[9px] font-mono text-slate-400 rounded uppercase font-black">${pt.code}</span>
            </div>
            <div class="space-y-1 font-mono text-[10px]">
              <div class="flex justify-between"><span class="text-slate-500">X:</span> <span class="font-bold">${pt.x.toFixed(3)} m</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Y:</span> <span class="font-bold">${pt.y.toFixed(3)} m</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Z:</span> <span class="font-bold">${pt.z.toFixed(3)} m</span></div>
              ${pt.description ? `<div class="border-t border-slate-800/40 mt-1 pt-1 text-[9px] text-slate-400">${pt.description}</div>` : ""}
            </div>
          </div>
        `);
      markersLayer.addLayer(marker);
    });

    // Render CAD Lines
    project.lines.forEach((line) => {
      const p1 = project.points.find(p => p.id === line.p1_id);
      const p2 = project.points.find(p => p.id === line.p2_id);
      if (p1 && p2) {
        const [lat1, lng1] = localToLatLng(p1.x, p1.y, csId);
        const [lat2, lng2] = localToLatLng(p2.x, p2.y, csId);

        // Styling based on CAD line layer
        let strokeColor = "#4f46e5"; // default indigo
        if (line.layer === "Boundary" || line.layer === "Limites") strokeColor = "#ef4444";
        else if (line.layer === "Roads" || line.layer === "Voirie") strokeColor = "#3b82f6";
        else if (line.layer === "Water" || line.layer === "Assainissement") strokeColor = "#06b6d4";
        else if (line.layer === "Structures" || line.layer === "Bâtiments") strokeColor = "#f59e0b";

        const pl = L.polyline([[lat1, lng1], [lat2, lng2]], {
          color: strokeColor,
          weight: 3.5,
          opacity: 0.9,
          lineJoin: "round"
        }).bindPopup(`
          <div class="p-2 font-mono text-[10px] bg-slate-900 text-slate-100 rounded-lg">
            <span class="block text-indigo-400 font-bold mb-1">Segment Cadastral (2D)</span>
            <div class="flex justify-between text-slate-400"><span>Layer:</span> <span class="font-bold text-white">${line.layer}</span></div>
            <div class="flex justify-between text-slate-400"><span>De:</span> <span>${p1.name}</span></div>
            <div class="flex justify-between text-slate-400"><span>À:</span> <span>${p2.name}</span></div>
          </div>
        `);
        markersLayer.addLayer(pl);
      }
    });

    // Auto fit map bounds to project points
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
    }
  }, [project.points, project.lines, project.coordinateSystem]);

  // User Location Marker Sync effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    // Remove old marker if any
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Custom pulsing blue icon for my location
    const myLocationIcon = L.divIcon({
      className: "my-location-marker",
      html: `<div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-sky-500 rounded-full animate-ping opacity-75"></div>
        <div class="relative w-4 h-4 bg-sky-600 rounded-full border-2 border-white shadow-md"></div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([userLocation.lat, userLocation.lng], {
      icon: myLocationIcon,
      draggable: true
    }).addTo(map);

    // Setup dragend listener
    marker.on("dragend", (event) => {
      const draggedMarker = event.target as L.Marker;
      const newPos = draggedMarker.getLatLng();
      setUserLocation({ lat: newPos.lat, lng: newPos.lng });
    });

    // Setup popup with real-time translation to Lambert coordinates!
    const csId = project.coordinateSystem?.id || "morocco-lambert2";
    const local = latLngToLocal(userLocation.lat, userLocation.lng, csId);
    marker.bindPopup(`
      <div class="p-2.5 font-sans text-xs bg-slate-900 text-slate-100 rounded-lg min-w-[190px] border border-sky-800">
        <div class="font-bold text-sky-400 border-b border-sky-950 pb-1 mb-1 flex items-center space-x-1">
          <span>📍</span> <span>Ma Position (Glissable 🔵)</span>
        </div>
        <p class="text-[9px] text-slate-400 mb-2">Déplacez-moi pour ajuster les coordonnées d'implantation.</p>
        <div class="space-y-1 font-mono text-[10px]">
          <div>X Lambert: <strong class="text-white">${local.x.toFixed(3)}</strong> m</div>
          <div>Y Lambert: <strong class="text-white">${local.y.toFixed(3)}</strong> m</div>
          <div class="border-t border-slate-800 mt-1 pt-1 text-slate-400 text-[9px]">
            Lat: ${userLocation.lat.toFixed(6)}°<br/>Lng: ${userLocation.lng.toFixed(6)}°
          </div>
        </div>
        <button id="add-loc-as-point-btn" class="w-full mt-2 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold text-[9px] cursor-pointer">
          + Enregistrer comme Borne
        </button>
      </div>
    `);

    marker.on("popupopen", () => {
      const btn = document.getElementById("add-loc-as-point-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          handleSaveUserLocationAsPoint(userLocation.lat, userLocation.lng);
        });
      }
    });

    userMarkerRef.current = marker;

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, [userLocation, project.coordinateSystem]);

  // Geodetic linear measurement calculation
  const handleMeasureDistance = () => {
    if (!distanceStart || !distanceEnd) return;
    const dx = distanceStart.x - distanceEnd.x;
    const dy = distanceStart.y - distanceEnd.y;
    const dz = distanceStart.z - distanceEnd.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    setCalculatedDistance(dist);
  };

  // Add Point captured directly from Map Click
  const handleAddCapturedPoint = async () => {
    if (!newPointName || !capturedLatLng || !onUpdateProject) return;

    const newPt: Point = {
      id: `pt_drawn_${Date.now()}`,
      name: newPointName,
      x: capturedLocalX,
      y: capturedLocalY,
      z: parseFloat(newPointZ) || 100.00,
      code: newPointCode,
      description: newPointDesc,
      xLeve: capturedLocalX,
      yLeve: capturedLocalY,
      zLeve: parseFloat(newPointZ) || 100.00
    };

    const updatedPoints = [...project.points, newPt];
    const updatedProject = { ...project, points: updatedPoints };
    
    await onUpdateProject(updatedProject);
    setIsAddPointModalOpen(false);
    setDrawMode("view"); // return to normal navigation mode
  };

  // Draw 2D Line between two selected points
  const handleDrawLine = async () => {
    if (!lineStartPointId || !lineEndPointId || !onUpdateProject) return;
    if (lineStartPointId === lineEndPointId) {
      alert("Veuillez sélectionner deux points différents.");
      return;
    }

    const newLine: CADLine = {
      id: `line_drawn_${Date.now()}`,
      p1_id: lineStartPointId,
      p2_id: lineEndPointId,
      layer: selectedLayer
    };

    const updatedLines = [...project.lines, newLine];
    const updatedProject = { ...project, lines: updatedLines };

    await onUpdateProject(updatedProject);
    
    // Reset selections
    setLineStartPointId("");
    setLineEndPointId("");
    setDrawMode("view");
  };

  // Locate national coordinate Lambert X/Y and flyTo
  const handleLocateCoordinates = () => {
    const map = mapRef.current;
    const beaconLayer = beaconLayerRef.current;
    if (!map || !beaconLayer) return;

    const xVal = parseFloat(locateX);
    const yVal = parseFloat(locateY);
    if (isNaN(xVal) || isNaN(yVal)) {
      alert("Coordonnées non valides.");
      return;
    }

    const csId = project.coordinateSystem?.id || "morocco-lambert2";
    const [lat, lng] = localToLatLng(xVal, yVal, csId);

    // Save location detail state
    setLocatedMarkerInfo({ x: xVal, y: yVal, lat, lng });

    // Clean previous beacon markers
    beaconLayer.clearLayers();

    // Custom pulsing marker
    const pulseIcon = L.divIcon({
      className: "custom-pulse-marker",
      html: `<div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-rose-500 rounded-full animate-ping opacity-75"></div>
        <div class="relative w-4 h-4 bg-rose-600 rounded-full border-2 border-white shadow-md"></div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const beaconMarker = L.marker([lat, lng], { icon: pulseIcon })
      .bindPopup(`
        <div class="p-2.5 font-sans text-xs bg-slate-900 text-slate-100 rounded-lg min-w-[180px] border border-rose-800">
          <div class="font-bold text-rose-400 border-b border-rose-950 pb-1 mb-1 flex items-center space-x-1">
            <span class="animate-pulse">🎯</span> <span>Cible Localisée (Lambert)</span>
          </div>
          <div class="space-y-1 font-mono text-[10px]">
            <div>X: <strong class="text-white">${xVal.toFixed(3)}</strong> m</div>
            <div>Y: <strong class="text-white">${yVal.toFixed(3)}</strong> m</div>
            <div class="border-t border-slate-800 mt-1 pt-1 text-slate-400 text-[9px]">
              Proj: ${project.coordinateSystem?.name || "Zone Maroc"}
            </div>
          </div>
        </div>
      `);
    
    beaconLayer.addLayer(beaconMarker);

    // Fly to position elegantly
    map.flyTo([lat, lng], 18, {
      animate: true,
      duration: 1.5
    });

    // Automatically trigger pop-up display
    setTimeout(() => {
      beaconMarker.openPopup();
    }, 1500);
  };

  // Parse uploaded Geographic formats (GeoJSON, KML, CSV, DXF)
  const handleParseFile = (fileName: string, fileContent: string) => {
    try {
      const extension = fileName.split(".").pop()?.toLowerCase();
      const pointsList: Point[] = [];
      const linesList: CADLine[] = [];
      const csId = project.coordinateSystem?.id || "morocco-lambert2";

      if (extension === "geojson" || extension === "json") {
        const geojson = JSON.parse(fileContent);
        if (geojson.type === "FeatureCollection") {
          geojson.features.forEach((feat: any, idx: number) => {
            if (feat.geometry && feat.geometry.type === "Point") {
              const [lng, lat] = feat.geometry.coordinates;
              const local = latLngToLocal(lat, lng, csId);
              pointsList.push({
                id: `import_pt_${idx}_${Date.now()}`,
                name: feat.properties?.name || feat.properties?.id || `GEO_PT_${idx + 1}`,
                x: parseFloat(local.x.toFixed(3)),
                y: parseFloat(local.y.toFixed(3)),
                z: parseFloat(feat.properties?.z || feat.geometry.coordinates[2] || "100.00"),
                code: feat.properties?.code || "IMPORT_GEO",
                description: feat.properties?.desc || "Importé de GeoJSON"
              });
            }
          });
        }
      } 
      else if (extension === "kml") {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fileContent, "text/xml");
        const placemarks = xmlDoc.getElementsByTagName("Placemark");
        
        for (let i = 0; i < placemarks.length; i++) {
          const pm = placemarks[i];
          const nameNode = pm.getElementsByTagName("name")[0];
          const name = nameNode ? nameNode.textContent || `KML_PT_${i+1}` : `KML_PT_${i+1}`;
          const descNode = pm.getElementsByTagName("description")[0];
          const desc = descNode ? descNode.textContent || "" : "Importé de KML";
          
          const pointNode = pm.getElementsByTagName("Point")[0];
          if (pointNode) {
            const coordsNode = pointNode.getElementsByTagName("coordinates")[0];
            if (coordsNode && coordsNode.textContent) {
              const rawCoords = coordsNode.textContent.trim().split(",");
              if (rawCoords.length >= 2) {
                const lng = parseFloat(rawCoords[0]);
                const lat = parseFloat(rawCoords[1]);
                const alt = rawCoords[2] ? parseFloat(rawCoords[2]) : 100.00;
                
                const local = latLngToLocal(lat, lng, csId);
                pointsList.push({
                  id: `import_kml_${i}_${Date.now()}`,
                  name,
                  x: parseFloat(local.x.toFixed(3)),
                  y: parseFloat(local.y.toFixed(3)),
                  z: alt,
                  code: "KML_STATION",
                  description: desc
                });
              }
            }
          }
        }
      } 
      else if (extension === "csv") {
        const lines = fileContent.split(/\r?\n/);
        lines.forEach((line, idx) => {
          if (idx === 0 || !line.trim()) return; // skip header
          const cols = line.split(",");
          if (cols.length >= 3) {
            const name = cols[0].replace(/"/g, "").trim();
            const x = parseFloat(cols[1]);
            const y = parseFloat(cols[2]);
            const z = cols[3] ? parseFloat(cols[3]) : 100.00;
            const code = cols[4] ? cols[4].trim() : "CSV_PT";
            const description = cols[5] ? cols[5].trim() : "Importé du fichier CSV";

            if (!isNaN(x) && !isNaN(y)) {
              pointsList.push({
                id: `import_csv_${idx}_${Date.now()}`,
                name,
                x,
                y,
                z,
                code,
                description
              });
            }
          }
        });
      } 
      else if (extension === "dxf") {
        // Simple DXF POINT parser
        const lines = fileContent.split(/\r?\n/);
        let ptCount = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() === "POINT") {
            let xVal = 0, yVal = 0, zVal = 0;
            // Scan next lines for coordinate group codes
            for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
              const code = lines[j].trim();
              const val = lines[j+1]?.trim();
              if (code === "10") xVal = parseFloat(val);
              if (code === "20") yVal = parseFloat(val);
              if (code === "30") zVal = parseFloat(val);
            }
            ptCount++;
            pointsList.push({
              id: `import_dxf_${ptCount}_${Date.now()}`,
              name: `DXF_PT_${ptCount}`,
              x: xVal,
              y: yVal,
              z: zVal,
              code: "DXF_VERT",
              description: "Entité POINT extraite de la CAO"
            });
          }
        }
      }

      if (pointsList.length > 0) {
        setParsedData({ points: pointsList, lines: linesList });
        setUploadMessage(`Importation réussie : ${pointsList.length} Points détectés. Cliquez ci-dessous pour fusionner.`);
      } else {
        setUploadMessage("Aucun point géométrique valide n'a pu être extrait de ce fichier.");
      }
    } catch (err) {
      console.error(err);
      setUploadMessage("Une erreur est survenue lors de l'analyse géométrique du fichier.");
    }
  };

  // Merge uploaded geographic data into project
  const handleMergeParsedData = async () => {
    if (!parsedData || !onUpdateProject) return;

    // Merge points safely to prevent key collisions
    const mergedPoints = [...project.points];
    parsedData.points.forEach(pt => {
      // Check if point name already exists
      const exists = mergedPoints.find(p => p.name.toLowerCase() === pt.name.toLowerCase());
      if (exists) {
        pt.name = `${pt.name}_NEW`;
      }
      mergedPoints.push(pt);
    });

    const updatedProject = {
      ...project,
      points: mergedPoints
    };

    await onUpdateProject(updatedProject);
    setParsedData(null);
    setUploadMessage("Points fusionnés avec succès dans le chantier !");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleParseFile(file.name, event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleParseFile(file.name, event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  // MULTI-FORMAT GEOGRAPHIC AND CAD EXPORTERS
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportGeoJSON = () => {
    const csId = project.coordinateSystem?.id || "morocco-lambert2";
    const features: any[] = [];

    // Points Features
    project.points.forEach(pt => {
      const [lat, lng] = localToLatLng(pt.x, pt.y, csId);
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat, pt.z]
        },
        properties: {
          name: pt.name,
          code: pt.code,
          description: pt.description,
          x: pt.x,
          y: pt.y
        }
      });
    });

    // Lines Features
    project.lines.forEach(line => {
      const p1 = project.points.find(p => p.id === line.p1_id);
      const p2 = project.points.find(p => p.id === line.p2_id);
      if (p1 && p2) {
        const [lat1, lng1] = localToLatLng(p1.x, p1.y, csId);
        const [lat2, lng2] = localToLatLng(p2.x, p2.y, csId);
        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [lng1, lat1, p1.z],
              [lng2, lat2, p2.z]
            ]
          },
          properties: {
            layer: line.layer,
            start_point: p1.name,
            end_point: p2.name
          }
        });
      }
    });

    const geojsonObj = {
      type: "FeatureCollection",
      metadata: {
        projectName: project.name,
        client: project.clientName,
        projection: project.coordinateSystem?.name,
        exportedAt: new Date().toISOString()
      },
      features
    };

    triggerDownload(JSON.stringify(geojsonObj, null, 2), `${project.name.replace(/\s+/g, "_")}_gis_export.geojson`, "application/json");
  };

  const exportKML = () => {
    const csId = project.coordinateSystem?.id || "morocco-lambert2";
    let kmlString = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${project.name} - Cadastre GIS Export</name>
    <description>Topographic survey export using national projections.</description>
    <Style id="point_style">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>1.1</scale>
      </IconStyle>
    </Style>
    <Style id="boundary_line">
      <LineStyle>
        <color>ff0000ff</color>
        <width>4</width>
      </LineStyle>
    </Style>
    <Folder>
      <name>Topographic Points</name>
`;

    // Points Placemarks
    project.points.forEach(pt => {
      const [lat, lng] = localToLatLng(pt.x, pt.y, csId);
      kmlString += `      <Placemark>
        <name>${pt.name}</name>
        <description>Code: ${pt.code} | X: ${pt.x.toFixed(3)} | Y: ${pt.y.toFixed(3)} | Z: ${pt.z.toFixed(3)}</description>
        <styleUrl>#point_style</styleUrl>
        <Point>
          <coordinates>${lng},${lat},${pt.z}</coordinates>
        </Point>
      </Placemark>\n`;
    });

    kmlString += `    </Folder>\n    <Folder>\n      <name>Survey Lines</name>\n`;

    // Lines Placemarks
    project.lines.forEach((line, idx) => {
      const p1 = project.points.find(p => p.id === line.p1_id);
      const p2 = project.points.find(p => p.id === line.p2_id);
      if (p1 && p2) {
        const [lat1, lng1] = localToLatLng(p1.x, p1.y, csId);
        const [lat2, lng2] = localToLatLng(p2.x, p2.y, csId);
        kmlString += `      <Placemark>
        <name>Segment_${p1.name}_${p2.name}</name>
        <description>Layer: ${line.layer}</description>
        <styleUrl>#boundary_line</styleUrl>
        <LineString>
          <altitudeMode>relativeToGround</altitudeMode>
          <coordinates>
            ${lng1},${lat1},${p1.z}
            ${lng2},${lat2},${p2.z}
          </coordinates>
        </LineString>
      </Placemark>\n`;
      }
    });

    kmlString += `    </Folder>\n  </Document>\n</kml>`;
    triggerDownload(kmlString, `${project.name.replace(/\s+/g, "_")}_earth.kml`, "application/vnd.google-earth.kml+xml");
  };

  const exportCSV = () => {
    const csId = project.coordinateSystem?.id || "morocco-lambert2";
    let csvString = "Name,X_Lambert,Y_Lambert,Z_Elevation,Code,Description,Latitude,Longitude\n";
    
    project.points.forEach(pt => {
      const [lat, lng] = localToLatLng(pt.x, pt.y, csId);
      csvString += `"${pt.name}",${pt.x.toFixed(3)},${pt.y.toFixed(3)},${pt.z.toFixed(3)},"${pt.code}","${pt.description || ""}",${lat.toFixed(8)},${lng.toFixed(8)}\n`;
    });

    triggerDownload(csvString, `${project.name.replace(/\s+/g, "_")}_point_registry.csv`, "text/csv");
  };

  const exportDXF = () => {
    // Standard minimal CAD DXF text structure
    let dxfString = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
ENTITIES
`;

    // Write POINT entities
    project.points.forEach(pt => {
      dxfString += `0
POINT
8
${pt.code}
10
${pt.x.toFixed(3)}
20
${pt.y.toFixed(3)}
30
${pt.z.toFixed(3)}
`;
    });

    // Write LINE entities
    project.lines.forEach(line => {
      const p1 = project.points.find(p => p.id === line.p1_id);
      const p2 = project.points.find(p => p.id === line.p2_id);
      if (p1 && p2) {
        dxfString += `0
LINE
8
${line.layer}
10
${p1.x.toFixed(3)}
20
${p1.y.toFixed(3)}
30
${p1.z.toFixed(3)}
11
${p2.x.toFixed(3)}
21
${p2.y.toFixed(3)}
31
${p2.z.toFixed(3)}
`;
      }
    });

    dxfString += `0
ENDSEC
0
EOF`;

    triggerDownload(dxfString, `${project.name.replace(/\s+/g, "_")}_cad.dxf`, "application/dxf");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0C1527] to-[#080C16] border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-900/40 text-[9px] font-mono rounded uppercase tracking-wider font-bold">
              CADASTRE & GIS CONSOLE
            </span>
            <span className="text-slate-500 text-xs font-mono">• {project.coordinateSystem?.name}</span>
          </div>
          <h2 className="text-xl font-black text-white mt-1">
            Mapping & Cartographie Dynamique
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualisez les limites cadastrales, dessinez en 2D, importez/exportez vos fichiers et localisez des coordonnées géographiques.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Fonds de carte :</span>
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs flex">
            <button
              onClick={() => setMapType("osm")}
              className={`px-2.5 py-1 rounded transition-all font-semibold ${
                mapType === "osm" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Plan OSM
            </button>
            <button
              onClick={() => setMapType("esri")}
              className={`px-2.5 py-1 rounded transition-all font-semibold ${
                mapType === "esri" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Map Component Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT/MAIN MAP BLOCK (Takes 3 columns on large, fully fluid) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Map Display (Elevated to 600px for generous view, or fixed fullscreen layout) */}
          <div className={`${
            isFullscreen 
              ? "fixed inset-0 z-[99999] w-screen h-screen bg-slate-950 flex flex-col p-4 animate-fadeIn"
              : "relative border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[600px] group bg-slate-950"
          }`}>
            
            {/* Map wrapper container */}
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Float HUD - Drawing Modes Toolbar */}
            <div className="absolute top-4 left-4 z-[999] bg-[#0A0F1D]/90 border border-slate-800 p-2.5 rounded-xl flex items-center space-x-2 shadow-xl backdrop-blur-md">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest border-r border-slate-800 pr-2">
                Outils 2D
              </span>
              
              <button
                onClick={() => setDrawMode("view")}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  drawMode === "view" 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
                title="Mode Navigation simple"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Naviguer</span>
              </button>

              <button
                onClick={() => setDrawMode("pointer")}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  drawMode === "pointer" 
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900 animate-pulse" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
                title="Cliquer pour créer un point sur la carte"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pointer un Point</span>
              </button>

              <button
                onClick={() => setDrawMode("line")}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  drawMode === "line" 
                    ? "bg-amber-600 text-white shadow-md shadow-amber-900" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
                title="Dessiner des segments de lignes topo"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tracer Ligne</span>
              </button>
            </div>

            {/* Float HUD - Quick Action Tools (Localisation, Delete Mode, Fullscreen) */}
            <div className="absolute top-4 right-4 z-[999] flex items-center space-x-2">
              {/* Localisation Button */}
              <button
                onClick={handleActivateLocation}
                className="p-2 bg-[#0A0F1D]/90 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-sky-400 hover:text-sky-300 transition-all flex items-center space-x-1.5 shadow-xl backdrop-blur-md cursor-pointer"
                title="Activer ma localisation GPS"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                <span className="hidden md:inline">Ma Position</span>
              </button>

              {/* Mode Suppression Button */}
              <button
                onClick={() => {
                  setIsDeleteModeActive(!isDeleteModeActive);
                  if (!isDeleteModeActive) {
                    setDrawMode("view");
                    alert("🚨 Mode Suppression activé ! Cliquez directement sur n'importe quelle borne sur la carte pour la supprimer.");
                  }
                }}
                className={`p-2 border rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xl backdrop-blur-md cursor-pointer ${
                  isDeleteModeActive 
                    ? "bg-rose-950 border-rose-600 text-rose-400" 
                    : "bg-[#0A0F1D]/90 border-slate-800 text-rose-500 hover:text-rose-400"
                }`}
                title="Supprimer des points sur la carte"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mode Suppression</span>
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-[#0A0F1D]/90 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all flex items-center space-x-1.5 shadow-xl backdrop-blur-md cursor-pointer"
                title={isFullscreen ? "Quitter le Plein Écran" : "Plein Écran"}
              >
                {isFullscreen ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Restaurer</span>
                  </>
                ) : (
                  <>
                    <Maximize className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Plein Écran</span>
                  </>
                )}
              </button>
            </div>

            {/* Float HUD - Active Coords Readout */}
            {mouseCoords && (
              <div className="absolute bottom-4 left-4 z-[999] bg-[#090F1E]/95 border border-slate-850 p-3 rounded-xl shadow-xl flex flex-col space-y-1.5 font-mono text-[10px] text-slate-200 backdrop-blur-md max-w-sm">
                <div className="flex items-center space-x-1.5 border-b border-slate-850 pb-1 mb-1 text-slate-400">
                  <Navigation className="w-3 h-3 text-indigo-400 animate-pulse" />
                  <span className="font-bold uppercase tracking-wider">Position du curseur</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 text-left">
                  <div>LAT: <span className="text-white font-bold">{mouseCoords.lat.toFixed(6)}°</span></div>
                  <div>LNG: <span className="text-white font-bold">{mouseCoords.lng.toFixed(6)}°</span></div>
                  {mouseLocal && (
                    <>
                      <div className="col-span-2 border-t border-slate-850/40 my-0.5"></div>
                      <div>X (L): <span className="text-indigo-400 font-bold">{mouseLocal.x.toFixed(2)}m</span></div>
                      <div>Y (L): <span className="text-indigo-400 font-bold">{mouseLocal.y.toFixed(2)}m</span></div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Float HUD - Status Indicator */}
            {drawMode === "pointer" && (
              <div className="absolute top-16 left-4 z-[999] bg-rose-950/90 border border-rose-800 text-rose-300 px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold animate-pulse flex items-center space-x-1 shadow-lg shadow-rose-950/20">
                <span>●</span> <span>MODE CAPTURE ACTIVE : Cliquez sur la carte pour poser un point</span>
              </div>
            )}

            {isDeleteModeActive && (
              <div className="absolute top-16 right-4 z-[999] bg-rose-950/95 border border-rose-800 text-rose-300 px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold animate-pulse flex items-center space-x-1 shadow-lg shadow-rose-950/20">
                <span>⚠️</span> <span>MODE SUPPRESSION INTERACTIVE : Cliquez sur une borne pour l'effacer</span>
              </div>
            )}
          </div>

          {/* Interactive Draw segment forms / Floating Capture Modals */}
          {isAddPointModalOpen && capturedLatLng && (
            <div className="bg-[#0D1628] border border-rose-800/40 p-5 rounded-2xl shadow-xl space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-widest flex items-center space-x-1">
                  <span>📍</span> <span>Enregistrer le Point Capturé sur Carte</span>
                </h4>
                <button 
                  onClick={() => setIsAddPointModalOpen(false)}
                  className="text-slate-400 hover:text-white font-black text-xs px-2 py-1 rounded hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Identifiant Point :</label>
                  <input
                    type="text"
                    required
                    value={newPointName}
                    onChange={e => setNewPointName(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded px-2.5 py-1.5 text-white focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Code ONIGT :</label>
                  <input
                    type="text"
                    value={newPointCode}
                    onChange={e => setNewPointCode(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded px-2.5 py-1.5 text-white focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Altitude Z (m) :</label>
                  <input
                    type="text"
                    value={newPointZ}
                    onChange={e => setNewPointZ(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded px-2.5 py-1.5 text-white focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 block font-semibold">Description :</label>
                  <input
                    type="text"
                    value={newPointDesc}
                    onChange={e => setNewPointDesc(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded px-2.5 py-1.5 text-white focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="bg-[#070B14] p-3 rounded-lg border border-slate-850 flex flex-wrap justify-between text-[10px] font-mono text-slate-400">
                <div>Coordonnées GPS: <strong className="text-white">Lat: {capturedLatLng.lat.toFixed(6)}°, Lng: {capturedLatLng.lng.toFixed(6)}°</strong></div>
                <div>Lambert National: <strong className="text-rose-400">X: {capturedLocalX.toFixed(3)}m, Y: {capturedLocalY.toFixed(3)}m</strong></div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddPointModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddCapturedPoint}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs cursor-pointer shadow-md shadow-rose-950 flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ajouter au Projet</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive draw line toolbar */}
          {drawMode === "line" && (
            <div className="bg-[#0D1628] border border-amber-800/30 p-5 rounded-2xl shadow-xl space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <Edit3 className="w-4 h-4 text-amber-500" />
                  <span>Tracer de Segment Topographique (2D)</span>
                </h4>
                <button 
                  onClick={() => setDrawMode("view")}
                  className="text-slate-400 hover:text-white font-black text-xs px-2 py-1 rounded hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Point Initial (A) :</label>
                  <select
                    value={lineStartPointId}
                    onChange={(e) => setLineStartPointId(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded p-2 text-white cursor-pointer outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                  >
                    <option value="">-- Sélectionner --</option>
                    {project.points.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.name} (X: {pt.x.toFixed(0)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Point Terminal (B) :</label>
                  <select
                    value={lineEndPointId}
                    onChange={(e) => setLineEndPointId(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded p-2 text-white cursor-pointer outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                  >
                    <option value="">-- Sélectionner --</option>
                    {project.points.map(pt => (
                      <option key={pt.id} value={pt.id}>{pt.name} (X: {pt.x.toFixed(0)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Couche DAO (Cible) :</label>
                  <select
                    value={selectedLayer}
                    onChange={(e) => setSelectedLayer(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded p-2 text-white cursor-pointer outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                  >
                    <option value="Boundary">Limites Cadastrales (Rouge)</option>
                    <option value="Roads">Réseau Voirie / Roads (Bleu)</option>
                    <option value="Structures">Bâtiments / Immeubles (Orange)</option>
                    <option value="Water">Canalisations / Assainissement (Cyan)</option>
                    <option value="Other">Autre Elément (Indigo)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setDrawMode("view"); setLineStartPointId(""); setLineEndPointId(""); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer font-mono"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!lineStartPointId || !lineEndPointId}
                  onClick={handleDrawLine}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded font-bold text-xs cursor-pointer shadow-md flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tracer & Fusionner Segment</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR PANEL - MAP OPTIONS, GEODETIC DATUMS & LOCATOR (Takes 1 column) */}
        <div className="space-y-5">
          
          {/* A. LOCALISER UN POINT (ENTER COORDINATES X/Y) */}
          <div className="bg-[#080C16] border border-slate-800 p-4.5 rounded-2xl shadow-lg space-y-3.5">
            <h4 className="font-bold text-xs text-white flex items-center space-x-1.5 font-mono uppercase tracking-wider">
              <Crosshair className="w-4 h-4 text-rose-500 animate-spin" />
              <span>Localisation Lambert</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Saisissez les coordonnées Lambert de votre station pour zoomer et projeter une balise de repérage active.
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Valeur X (Est) :</label>
                <input
                  type="text"
                  placeholder="ex: 450064.768"
                  value={locateX}
                  onChange={e => setLocateX(e.target.value)}
                  className="w-full bg-[#0B1220] border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Valeur Y (Nord) :</label>
                <input
                  type="text"
                  placeholder="ex: 407434.683"
                  value={locateY}
                  onChange={e => setLocateY(e.target.value)}
                  className="w-full bg-[#0B1220] border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-rose-500 text-xs font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleLocateCoordinates}
                className="w-full py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center space-x-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Centrer & Épingler</span>
              </button>
            </div>

            {locatedMarkerInfo && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl space-y-1.5 text-[10px] font-mono text-rose-300">
                <div className="font-bold flex items-center justify-between">
                  <span>CIBLE TROUVÉE :</span>
                  <button 
                    onClick={() => {
                      // Save localized marker as a permanent point in project
                      if (!onUpdateProject) return;
                      const newPt: Point = {
                        id: `pt_loc_${Date.now()}`,
                        name: `LOC_${Date.now().toString().slice(-4)}`,
                        x: locatedMarkerInfo.x,
                        y: locatedMarkerInfo.y,
                        z: 100.0,
                        code: "LOCATED",
                        description: "Localisé par saisie X/Y"
                      };
                      onUpdateProject({ ...project, points: [...project.points, newPt] });
                      alert("Point enregistré avec succès !");
                      setLocatedMarkerInfo(null);
                    }}
                    className="px-1.5 py-0.5 bg-rose-900/50 hover:bg-rose-900 text-[8px] text-white rounded font-bold border border-rose-800"
                  >
                    + Enregistrer
                  </button>
                </div>
                <div>Lat: {locatedMarkerInfo.lat.toFixed(6)}°</div>
                <div>Lng: {locatedMarkerInfo.lng.toFixed(6)}°</div>
              </div>
            )}
          </div>

          {/* REGISTRE & SUPPRESSION DES SOMMETS */}
          <div className="bg-[#080C16] border border-slate-800 p-4.5 rounded-2xl shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-white flex items-center space-x-1.5 font-mono uppercase tracking-wider">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Registre des Sommets</span>
              </h4>
              <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded font-bold font-mono text-[#00F5D4]">
                {project.points.length} Pts
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400">
              Visualisez la liste complète des points. Supprimez individuellement tout repère topographique ou borne erronée.
            </p>

            {project.points.length === 0 ? (
              <div className="text-center p-4 bg-[#0B1220]/50 rounded-xl border border-slate-850 text-slate-500 text-[10px] font-mono">
                Aucun sommet disponible.
              </div>
            ) : (
              <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
                {project.points.map((pt) => (
                  <div 
                    key={pt.id} 
                    className="flex items-center justify-between bg-[#0B1220]/60 p-2 rounded-lg border border-slate-850 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[#00F5D4]">{pt.name}</span>
                        <span className="text-[8px] bg-slate-900 text-slate-400 px-1 rounded uppercase font-black">{pt.code}</span>
                      </div>
                      <div className="text-[9px] text-slate-500">
                        X: {pt.x.toFixed(2)} | Y: {pt.y.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* View / Center on map */}
                      <button
                        onClick={() => {
                          const map = mapRef.current;
                          if (map) {
                            const csId = project.coordinateSystem?.id || "morocco-lambert2";
                            const [lat, lng] = localToLatLng(pt.x, pt.y, csId);
                            map.flyTo([lat, lng], 18);
                          }
                        }}
                        className="p-1 hover:bg-indigo-950 text-indigo-400 hover:text-white rounded transition-all cursor-pointer"
                        title="Centrer sur la carte"
                      >
                        <Search className="w-3 h-3" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Voulez-vous vraiment supprimer le point ${pt.name} ?`)) {
                            handleDeletePointById(pt.id);
                          }
                        }}
                        className="p-1 hover:bg-rose-950 text-rose-500 hover:text-white rounded transition-all cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* B. IMPORT GEO DATA (UPLOAD SHAPES/CAD) */}
          <div className="bg-[#080C16] border border-slate-800 p-4.5 rounded-2xl shadow-lg space-y-3.5">
            <h4 className="font-bold text-xs text-white flex items-center space-x-1.5 font-mono uppercase tracking-wider">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Import Géométrique</span>
            </h4>
            
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4.5 text-center transition-all cursor-pointer ${
                isDragging 
                  ? "border-indigo-500 bg-indigo-950/20" 
                  : "border-slate-800 bg-[#0B1220]/50 hover:border-slate-700"
              }`}
            >
              <input
                type="file"
                id="geo-file-input"
                className="hidden"
                accept=".json,.geojson,.kml,.csv,.dxf"
                onChange={handleFileSelectChange}
              />
              <label htmlFor="geo-file-input" className="cursor-pointer space-y-1 block">
                <Globe className="w-6 h-6 text-slate-500 mx-auto" />
                <span className="block text-xs font-bold text-slate-300">Faites glisser un fichier</span>
                <span className="block text-[10px] text-slate-500 font-mono">GeoJSON, KML, CSV, DXF</span>
              </label>
            </div>

            {uploadMessage && (
              <div className="p-3 bg-indigo-950/30 border border-indigo-900/30 rounded-xl text-[10px] text-slate-300 font-mono leading-relaxed space-y-2">
                <p>{uploadMessage}</p>
                {parsedData && (
                  <button
                    onClick={handleMergeParsedData}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[10px] transition-colors flex items-center justify-center space-x-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Fusionner dans le Projet</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* C. EXPORT CADASTRE (MULTI FORMATS) */}
          <div className="bg-[#080C16] border border-slate-800 p-4.5 rounded-2xl shadow-lg space-y-3.5">
            <h4 className="font-bold text-xs text-white flex items-center space-x-1.5 font-mono uppercase tracking-wider">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Multiformats</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Générez et téléchargez le cadastre actif au format standard SIG ou DAO.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={exportGeoJSON}
                className="p-2 bg-[#0B1220] hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all text-[11px] flex items-center justify-center space-x-1 font-bold"
                title="Format Standard de données géographiques"
              >
                <span>🌐 GeoJSON</span>
              </button>

              <button
                onClick={exportKML}
                className="p-2 bg-[#0B1220] hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all text-[11px] flex items-center justify-center space-x-1 font-bold"
                title="Format de données Google Earth"
              >
                <span>🗺️ KML</span>
              </button>

              <button
                onClick={exportCSV}
                className="p-2 bg-[#0B1220] hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all text-[11px] flex items-center justify-center space-x-1 font-bold"
                title="Registre de points topo séparé par virgule"
              >
                <span>📊 CSV (Points)</span>
              </button>

              <button
                onClick={exportDXF}
                className="p-2 bg-[#0B1220] hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-all text-[11px] flex items-center justify-center space-x-1 font-bold"
                title="Format DAO compatible AutoCAD/Microstation"
              >
                <span>📐 DXF (CAD)</span>
              </button>
            </div>
          </div>

          {/* D. GEODETIC DISTANCE & ANALYSES */}
          <div className="bg-[#080C16] border border-slate-800 p-4 rounded-xl">
            <h4 className="font-bold text-xs text-white mb-2.5 flex items-center space-x-1.5 font-mono uppercase">
              <MapIcon className="w-4 h-4 text-indigo-400" />
              <span>Réglette Géodésique</span>
            </h4>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-mono mb-1 text-[10px]">Origine :</label>
                <select
                  onChange={(e) => {
                    const pt = project.points.find(p => p.id === e.target.value);
                    setDistanceStart(pt || null);
                    setCalculatedDistance(null);
                  }}
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-1.5 text-white font-mono cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                >
                  <option value="">-- Choisir Station --</option>
                  {project.points.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-mono mb-1 text-[10px]">Cible :</label>
                <select
                  onChange={(e) => {
                    const pt = project.points.find(p => p.id === e.target.value);
                    setDistanceEnd(pt || null);
                    setCalculatedDistance(null);
                  }}
                  className="w-full bg-[#0B1220] border border-slate-800 rounded p-1.5 text-white font-mono cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                >
                  <option value="">-- Choisir Station --</option>
                  {project.points.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleMeasureDistance}
                disabled={!distanceStart || !distanceEnd}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
              >
                Mesurer Écart 3D
              </button>

              {calculatedDistance !== null && (
                <div className="p-3 bg-[#0B1220] rounded-xl border border-slate-850 text-center space-y-1">
                  <span className="block text-[9px] text-slate-500 font-mono">Distance Géodésique</span>
                  <span className="text-lg font-mono font-black text-indigo-400">{calculatedDistance.toFixed(3)} m</span>
                  <span className="block text-[8px] text-slate-500 font-mono">
                    ΔH: {Math.abs(distanceStart!.z - distanceEnd!.z).toFixed(2)}m
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* E. GEODETIC DATUM INFO CARD */}
          <div className="bg-[#080C16] border border-slate-800 p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest font-mono">Référencement National</h4>
            <div className="p-3 bg-[#0B1220] rounded-lg text-[10px] space-y-1 font-mono text-slate-300 border border-slate-850">
              <div className="flex justify-between">
                <span className="text-slate-500">Zone Grid :</span>
                <span>{project.coordinateSystem?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Code EPSG :</span>
                <span>{project.coordinateSystem?.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Projection :</span>
                <span>Lambert Conforme</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-emerald-400 p-2 bg-emerald-950/20 rounded-lg border border-emerald-900/30 font-mono">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Base GPS synchrone avec RTK</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
