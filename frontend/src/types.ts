export type UserRole = 'admin' | 'business' | 'agent';

export interface User {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  businessId?: string;
  businessName?: string;
  assignedRouteId?: string;
  avatarUrl?: string;
  title: string;
}

export type PerishableCategory =
  | 'berries'
  | 'mangoes'
  | 'leafy_greens'
  | 'tomatoes'
  | 'grapes'
  | 'dairy'
  | 'mushrooms'
  | 'cut_flowers'
  | 'citrus';

export type ShipmentStatus =
  | 'pending'
  | 'pending_consolidation'
  | 'consolidated'
  | 'in_transit'
  | 'disrupted'
  | 'delivered';

export type FreshnessRiskLevel = 'optimal' | 'moderate' | 'critical';

export interface TemperatureLogEntry {
  timestamp: string;
  temp: number;
  location?: string | [number, number];
}

export interface SLAConstraint {
  maxDeliveryHours: number;
  maxSpoilagePercent: number;
  priority: string;
}


export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
  address: string;
  hubCode?: string;
}

export interface Hub {
  id: string;
  name: string;
  city: string;
  roadAccess: number;
  railAccess: number;
  coldStorage: number;
  reeferCrossDock: number;
  capacityKg: number;
  latitude: number;
  longitude: number;
  handlingCostPerKg: number;
  coldStorageCostPerKgHr: number;
  hubCode?: string;
}

export interface Shipment {
  id: string;
  code: string; // e.g. "SHP-8821"
  businessId: string;
  businessName: string;
  cargoType: string;
  category: PerishableCategory;
  weightKg: number;
  volumeCbm: number;
  origin: GeoLocation;
  destination: GeoLocation;
  targetTempRange: {
    min: number; // e.g. 2°C
    max: number; // e.g. 6°C
  };
  currentTemp: number; // e.g. 3.8°C
  humidityPercent: number;
  createdAt: string;
  dispatchTime: string;
  deliveryDeadline: string;
  totalShelfLifeHours: number;
  remainingShelfLifeHours: number;
  freshnessPercent: number; // 0 to 100
  status: ShipmentStatus;
  clusterId?: string;
  routeId?: string;
  estimatedSoloCostINR: number;
  consolidatedCostINR: number;
  costSavingsPercent: number;
  co2SavedKg: number;
  activeIncidentId?: string;
  assignedAgent?: string;
  consolidationReason?: string;
  notes?: string;
  temperatureHistory?: TemperatureLogEntry[];
  slaConstraint?: SLAConstraint;
  spoilageRiskScore?: number;
  spoilageRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
  delayRiskScore?: number;
  delayRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export type TransportMode = 'road_reefer' | 'rail_cold_wagon' | 'hub_transfer' | 'local_transport';

export interface RouteLeg {
  id: string;
  legNumber: number;
  mode: TransportMode;
  originName: string;
  destinationName: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  coordinates: [number, number][]; // polyline coordinates
  distanceKm: number;
  durationHours: number;
  vehicleId: string;
  vehicleType: string;
  carrier: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  avgSpeedKmh: number;
  tempMonitored: boolean;
}

export type StopType = 'pickup' | 'consolidation_hub' | 'rail_loading' | 'rail_unloading' | 'delivery';

export interface RouteStop {
  id: string;
  type: StopType;
  name: string;
  coords: [number, number];
  address: string;
  sequence: number;
  scheduledTime: string;
  completedTime?: string;
  isCompleted: boolean;
  shipmentIds: string[];
  actionLabel: string;
  contactPerson?: string;
  contactPhone?: string;
  tempRequirement: string;
  notes?: string;
}

export interface ConsolidationCluster {
  id: string;
  code: string; // e.g. "CLST-MAHA-04"
  name: string;
  originHub: GeoLocation;
  destinationHub: GeoLocation;
  shipmentIds: string[];
  totalWeightKg: number;
  maxCapacityKg: number;
  cargoCategories: PerishableCategory[];
  tempBand: string; // e.g. "2°C to 5°C (Chilled Fruits/Dairy)"
  assignedRouteId: string;
  status: 'assembling' | 'in_transit' | 'disrupted' | 'completed';
  costSavingsPercent: number;
  co2SavedKg: number;
  reeferLoadFactorPercent: number;
  railUtilizationPercent: number;
  slaConstraint?: SLAConstraint;
}

export interface RouteExplanation {
  summary: string;
  multimodalAdvantage: string;
  thermalCompatibility: string;
  timingOptimization: string;
  exclusionNotes?: string;
  rerouteHistory?: {
    timestamp: string;
    trigger: string;
    actionTaken: string;
    previousETA: string;
    newETA: string;
    savedFreshnessHours: number;
  }[];
}

export interface DeliveryRoute {
  id: string;
  code: string; // e.g. "RT-MAHA-904"
  clusterId: string;
  clusterName: string;
  name: string;
  driverAgentId: string;
  driverAgentName: string;
  driverAgentPhone: string;
  vehicleId: string;
  currentLocation?: [number, number];
  currentLocationName: string;
  legs: RouteLeg[];
  stops: RouteStop[];
  status: 'scheduled' | 'in_transit' | 'incident_reported' | 'rerouted' | 'completed';
  explanation: RouteExplanation;
  activeIncidentId?: string;
  lastUpdated: string;
  spoilageRiskScore?: number;
  spoilageRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
  delayRiskScore?: number;
  delayRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export type IncidentType =
  | 'vehicle_breakdown'
  | 'traffic_delay'
  | 'temperature_excursion'
  | 'road_closure'
  | 'other';

export type IncidentSeverity = 'moderate' | 'high' | 'critical';

export interface IncidentReport {
  id: string;
  code: string; // e.g. "INC-4092"
  routeId: string;
  routeCode: string;
  shipmentId: string;
  shipmentCode: string;
  cargoType: string;
  agentId: string;
  agentName: string;
  type: IncidentType;
  severity: IncidentSeverity;
  reportedAt: string;
  locationName: string;
  locationCoords: [number, number];
  notes: string;
  status: 'open' | 'rerouted' | 'resolved';
  spoilageRiskImpactHours: number;
  suggestedAction: string;
  reoptimizedRouteId?: string;
  resolvedAt?: string;
}

export interface BusinessEntity {
  id: string;
  name: string;
  category: string;
  region: string;
  contactEmail: string;
  contactPhone: string;
  activeShipmentsCount: number;
  totalSavingsINR: number;
  totalCO2SavedKg: number;
}

export interface TransportLegOption {
  mode: string;
  capacityUnits: number;
  costPerUnit: number;
  avgDelayMinutes: number;
  reliabilityScore: number;
  onTimePercent: number;
}

export interface RouteCorridor {
  id: string;
  originName: string;
  destinationName: string;
  mode: string;
  historicalReliabilityScore: number;
  avgDelayMinutes: number;
  onTimePercent: number;
}

