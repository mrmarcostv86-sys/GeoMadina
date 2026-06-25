export interface Point {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  code: string;
  description: string;
  xLeve?: number | null;
  yLeve?: number | null;
  zLeve?: number | null;
}

export interface CADLine {
  id: string;
  p1_id: string;
  p2_id: string;
  layer: string;
}

export interface CADLayer {
  name: string;
  color: string;
  visible: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientName: string;
  surveyorName: string;
  status: "active" | "archived";
  validationStatus?: "pending" | "approved" | "rejected";
  validationComments?: string;
  createdAt: string;
  category?: "voirie" | "batiment" | "cadastral" | "other";
  points: Point[];
  lines: CADLine[];
  layers: CADLayer[];
  boundarySurvey: {
    monumentCount: number;
    pvApproved: boolean;
    reportGenerated: boolean;
    sketchGenerated: boolean;
    monuments: Point[];
  };
  parcelInvestigation: {
    parcelNumber: string;
    history: string;
    currentOwner: string;
    neighbors: string;
    investigationCompleted: boolean;
  };
  coordinateSystem: {
    id: string;
    name: string;
    code: string;
  };
  dtm: {
    tinGenerated: boolean;
    contoursGenerated: boolean;
    contourInterval: number;
    slopeAnalysisCompleted: boolean;
    volumeCalculation: {
      cut: number;
      fill: number;
      baseElevation: number;
    } | null;
  };
  fileHistory: {
    fileName: string;
    fileType: string;
    uploadedAt: string;
  }[];
  receptionConfig?: any;
}

export interface Projection {
  id: string;
  name: string;
  code: string;
  type: string;
  parameters: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  discountFixed: number;
  expirationDate: string;
  usageLimit: number;
  usageCount: number;
}

export interface PlanTemplate {
  id: string;
  name: string;
  category: string;
  cartoucheTitle: string;
  orgName: string;
  logoType: string;
  customImage: string | null;
  hasVegetation: boolean;
  hasBorderGrid: boolean;
  vegetationStyle: "classic" | "dense" | "minimal";
  borderStyle: "simple" | "grid" | "technical";
  notes: string;
  scaleText: string;
  northArrowType: "classic" | "modern" | "compass";
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  lastLogin: string;
  subscription: "Free" | "Basic" | "Professional" | "Enterprise";
  creditBalance: number;
  isBanned: boolean;
}

export interface AdminSettings {
  brandingTitle: string;
  loginSubtitle: string;
  allowRegistration: boolean;
  announcementBanner: string;
  showAnnouncement: boolean;
  primaryColorTheme: string;
  glassmorphismStrength: string;
  mysqlHost: string;
  mysqlPort: number;
  mysqlUser: string;
  mysqlDatabase: string;
  mapTileProvider: string;
  maintenanceMode: boolean;
  enabledModules: {
    cad: boolean;
    gis: boolean;
    terrain: boolean;
    bornage: boolean;
    consultation: boolean;
    plans: boolean;
    reception: boolean;
    ai: boolean;
  };
}
