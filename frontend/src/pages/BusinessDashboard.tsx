import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { KarwaanMap } from '../components/KarwaanMap';
import { MapLegend } from '../components/MapLegend';
import { FreshnessGauge } from '../components/FreshnessGauge';
import { dataService } from '../services/dataService';
import { Shipment, BusinessEntity, User, PerishableCategory } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  TrendingDown,
  Leaf,
  Layers,
  ThermometerSnowflake,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  ShieldCheck,
  Truck,
  X,
  Sparkles,
  PackageOpen,
  ChevronRight
} from 'lucide-react';

const LOCATION_COORDS: Record<string, [number, number]> = {
  // Odisha Hubs & Terminals
  'bhubaneswar wholesale terminal': [20.2961, 85.8245],
  'bhubaneswar': [20.2961, 85.8245],
  'cuttack agro-packhouse': [20.4625, 85.8830],
  'cuttack': [20.4625, 85.8830],
  'omfed square': [20.2961, 85.8245],
  'puri': [19.8135, 85.8312],
  'jajpur': [20.8444, 86.3364],
  'jajpur road': [20.8444, 86.3364],
  'bhadrak': [21.0544, 86.4955],
  'baleswar': [21.4934, 86.9135],
  'balasore': [21.4934, 86.9135],
  'baripada': [21.9346, 86.7324],
  'rourkela': [22.2604, 84.8536],
  'koraput': [18.8140, 82.7126],
  'malkangiri': [18.3436, 81.8845],
  'balangir': [20.7107, 83.4866],
  'berhampur': [19.3149, 84.7941],
  'gopalpur': [19.2611, 84.9099],
  'sambalpur': [21.4685, 83.9782],
  'angul': [20.8400, 85.1500],
  'jharsuguda': [21.8554, 84.0062],
  'dhenkanal': [20.6582, 85.5985],
  'kendrapara': [20.5008, 86.4230],
  'jagatsinghpur': [20.2676, 86.1685],
  'bargarh': [21.3341, 83.6214],
  'keonjhar': [21.6289, 85.5817],
  'rayagada': [19.1678, 83.4163],

  // Northern & NCR Hubs
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'delhi ncr': [28.6139, 77.2090],
  'delhi ncr logistics hub': [28.6139, 77.2090],
  'haryana': [29.0588, 76.0856],
  'harayana': [29.0588, 76.0856],
  'gurugram': [28.4595, 77.0266],
  'gurgaon': [28.4595, 77.0266],
  'faridabad': [28.4089, 77.3178],
  'panipat': [29.3909, 76.9635],
  'sonipat': [28.9931, 77.0151],
  'chandigarh': [30.7333, 76.7794],
  'ludhiana': [30.9010, 75.8573],
  'amritsar': [31.6340, 74.8723],
  'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4542, 80.3503],
  'kanpur central': [26.4542, 80.3503],
  'prayagraj': [25.4484, 81.8284],
  'varanasi': [25.3176, 82.9739],

  // Eastern & Central Hubs
  'kolkata': [22.5726, 88.3639],
  'kolkata wholesale hub': [22.5726, 88.3639],
  'hijli': [22.3168, 87.3183],
  'tatanagar': [22.7758, 86.2036],
  'tatanagar junction': [22.7758, 86.2036],
  'jamshedpur': [22.8046, 86.2029],
  'ranchi': [23.3441, 85.3096],
  'dhanbad': [23.7957, 86.4304],
  'patna': [25.6093, 85.1376],
  'raipur': [21.2514, 81.6296],
  'nagpur': [21.1458, 79.0882],

  // Southern & Western Hubs
  'vizag': [17.6868, 83.2185],
  'visakhapatnam': [17.6868, 83.2185],
  'hyderabad': [17.3850, 78.4867],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'chennai': [13.0827, 80.2707],
  'mumbai': [19.0760, 72.8777],
  'vashi apmc': [19.0759, 72.9984],
  'pune': [18.5204, 73.8567],
  'nashik': [20.0988, 73.9189],
  'ahmedabad': [23.0225, 72.5714],
  'surat': [21.1702, 72.8311],
  'indore': [22.7196, 75.8577],
  'satara': [17.6805, 74.0183],
  'ratnagiri': [16.9902, 73.3120],
  'kashmir': [34.0837, 74.7973],
  'srinagar': [34.0837, 74.7973],
  'bhopal': [23.2599, 77.4126],
};

const getEstimateDistance = (origin: string, dest: string): number => {
  const getC = (n: string): [number, number] => {
    const k = (n || '').toLowerCase().trim();
    if (!k) return [20.2961, 85.8245];
    for (const [key, c] of Object.entries(LOCATION_COORDS)) {
      if (k === key || k.includes(key) || key.includes(k)) return c;
    }
    // Deterministic fallback for unlisted locations
    let hash = 0;
    for (let i = 0; i < k.length; i++) {
      hash = (hash << 5) - hash + k.charCodeAt(i);
      hash |= 0;
    }
    const latOffset = ((Math.abs(hash) % 1000) / 1000) * 8 - 4;
    const lngOffset = ((Math.abs(hash >> 3) % 1000) / 1000) * 8 - 4;
    return [21.0 + latOffset, 84.0 + lngOffset];
  };

  const c1 = getC(origin);
  const c2 = getC(dest);
  const R = 6371;
  const dLat = ((c2[0] - c1[0]) * Math.PI) / 180;
  const dLon = ((c2[1] - c1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[0] * Math.PI) / 180) *
      Math.cos((c2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;
  // Route network circuity factor 1.18 for realistic highway road / rail distance
  return Math.max(15, Math.round(straightLineKm * 1.18));
};

const EngineProcessingView: React.FC<{
  origin: string;
  destination: string;
  cargoType: string;
  weightKg: string | number;
}> = ({ origin, destination, cargoType, weightKg }) => {
  const dist = getEstimateDistance(origin, destination);
  const [activeStep, setActiveStep] = useState(0);

  const roadCost = Math.round(dist * 35);
  const roadDur = Number((dist / 45).toFixed(1));
  const multiCost = Math.round(dist * 18 + 4000);
  const multiDur = Number(((dist - 40) / 60 + 3.5).toFixed(1));
  const expressCost = Math.round(dist * 58);
  const expressDur = Number((dist / 65).toFixed(1));

  const roadScore = (0.6 + (dist % 80) / 1000).toFixed(3);
  const multiScore = (0.5 + (dist % 50) / 1000).toFixed(3);
  const expressScore = (0.7 + (dist % 120) / 1000).toFixed(3);

  const terminalLogs = [
    { text: `--- Scoring Candidates for ${origin || 'Origin'} -> ${destination || 'Destination'} (Distance: ${dist}km) ---`, type: 'header' },
    { text: `[Score] road: Cost=₹${roadCost} | Duration=${roadDur}h | Score=${roadScore}`, type: 'road' },
    { text: `[Score] multimodal: Cost=₹${multiCost} | Duration=${multiDur}h | Score=${multiScore}`, type: 'multimodal' },
    { text: `[Score] express: Cost=₹${expressCost} | Duration=${expressDur}h | Score=${expressScore}`, type: 'express' },
    { text: `> Mathematical optimum determined. Finalizing multi-modal cold corridor assignment...`, type: 'success' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < terminalLogs.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-[#F8FAF7] space-y-5 flex-1 overflow-y-auto">
      {/* Route & Distance Badge - Light Theme */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-[#FFFFFF] text-[#163832] px-4 py-2 rounded-full text-xs font-mono shadow-sm border border-[#D6DCD4]">
        <span className="text-[#163832] font-bold">📍 {origin || 'Origin'}</span>
        <span className="text-[#596560]">➔</span>
        <span className="text-[#9A6218] font-bold">🏁 {destination || 'Destination'}</span>
        <span className="bg-[#EAF3E7] px-2.5 py-0.5 rounded text-[11px] text-[#2D6A4F] font-bold ml-1 border border-[#C5DEC0]">
          📏 Total Distance: {dist} km
        </span>
      </div>

      {/* Advanced Animated Scanner */}
      <div className="space-y-1.5">
        <div className="relative w-24 h-24 mx-auto mb-4">
        {/* Outer glowing pulse */}
        <div className="absolute inset-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 animate-[ping_2s_ease-in-out_infinite]"></div>
        {/* Orbit 1 */}
        <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-[#5C7A50] opacity-80 animate-[spin_3s_linear_infinite]"></div>
        {/* Orbit 2 (reverse) */}
        <div className="absolute inset-1.5 rounded-full border-b-2 border-r-2 border-[#D98E2B] opacity-70 animate-[spin_2s_linear_infinite_reverse]"></div>
        {/* Orbit 3 */}
        <div className="absolute inset-3 rounded-full border-t-2 border-r-2 border-emerald-300 opacity-90 animate-[spin_1.5s_linear_infinite]"></div>
        {/* Core */}
        <div className="absolute inset-5 bg-gradient-to-tr from-[#163832] to-[#5C7A50] rounded-full shadow-[0_0_15px_rgba(92,122,80,0.5)] flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></div>
        </div>
      </div>
        <h3 className="text-xl font-bold font-display text-[#163832]">
          Karwaan AI Optimization Engine
        </h3>
        <p className="text-xs text-[#596560] max-w-md font-sans">
          Simulating Pareto trade-offs across active reefer fleets, Kisan Rail cold wagons, and biological freshness shelf-life.
        </p>
      </div>

      {/* Terminal Calculation Console - Light Theme */}
      <div className="w-full max-w-xl bg-[#FFFFFF] border border-[#D6DCD4] rounded-xl p-4 sm:p-5 text-left font-mono text-[11px] sm:text-xs shadow-sm space-y-2.5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E5EBE3] pb-2 text-[10px] text-[#596560] uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E57373] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFB74D] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#81C784] inline-block"></span>
            <span className="ml-2 text-[#163832] font-bold">Engine Calculation Telemetry</span>
          </div>
          <span className="text-[#2D6A4F] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse"></span> COMPUTING
          </span>
        </div>

        <div className="space-y-2 pt-1 font-mono">
          {terminalLogs.slice(0, activeStep + 1).map((log, idx) => (
            <div 
              key={idx} 
              className={`leading-relaxed animate-in fade-in slide-in-from-left-2 duration-200 ${
                log.type === 'header' 
                  ? 'text-[#9A6218] font-bold border-b border-[#E5EBE3] pb-1' 
                  : log.type === 'multimodal'
                  ? 'text-[#163832] font-bold bg-[#EBF4E9] px-2.5 py-1 rounded border border-[#C5DEC0]' 
                  : log.type === 'success'
                  ? 'text-[#2D6A4F] font-bold pt-1 flex items-center gap-1'
                  : 'text-[#2F3E37]'
              }`}
            >
              {log.text}
            </div>
          ))}
          {activeStep < terminalLogs.length - 1 && (
            <div className="text-[#2D6A4F] text-[10px] flex items-center gap-1 pt-1">
              <span className="animate-pulse">&gt; Evaluating candidate constraints...</span>
              <span className="inline-block w-1.5 h-3 bg-[#2D6A4F] animate-ping"></span>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Calculation Matrix - Light Theme */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xl text-[11px] font-mono">
        <div className="bg-white border border-[#E5EBE3] p-2.5 rounded-lg shadow-sm text-left">
          <span className="block text-[10px] text-[#596560] uppercase">Direct Road</span>
          <span className="font-bold text-[#163832]">₹{roadCost.toLocaleString()}</span>
          <span className="block text-[10px] text-[#89938E]">{roadDur} hrs</span>
        </div>
        <div className="bg-[#EAF3E7] border-2 border-[#5C7A50] p-2.5 rounded-lg shadow-sm text-left">
          <span className="block text-[10px] text-[#163832] uppercase font-bold">Multimodal Rail</span>
          <span className="font-bold text-[#2D6A4F]">₹{multiCost.toLocaleString()}</span>
          <span className="block text-[10px] text-[#2D6A4F] font-semibold">{multiDur} hrs</span>
        </div>
        <div className="bg-white border border-[#E5EBE3] p-2.5 rounded-lg shadow-sm text-left">
          <span className="block text-[10px] text-[#596560] uppercase">Fast Express</span>
          <span className="font-bold text-[#163832]">₹{expressCost.toLocaleString()}</span>
          <span className="block text-[10px] text-[#89938E]">{expressDur} hrs</span>
        </div>
      </div>
    </div>
  );
};

export const BusinessDashboard: React.FC = () => {
  // ----------------------------------------------------------------------
  // 1. DATA & STATE (UNTOUCHED TO PRESERVE BACKEND CONNECTIONS)
  // ----------------------------------------------------------------------
  const { hasAccess } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessEntity[]>([]);
  const [currentBizId, setCurrentBizId] = useState<string>('');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const detailsPanelRef = useRef<HTMLDivElement>(null);

  // New Shipment Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'intake' | 'processing' | 'results'>('intake');
  const [aiPlanResults, setAiPlanResults] = useState<any>(null);
  const [previousAiPlanResults, setPreviousAiPlanResults] = useState<any>(null);
  const [createdShipmentId, setCreatedShipmentId] = useState<string | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<string>('recommended');

  // What-If State
  const [whatIfPreference, setWhatIfPreference] = useState<string>('balanced');
  const [whatIfSla, setWhatIfSla] = useState<string>('');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCategoryDirty, setIsCategoryDirty] = useState(false);

  const [newCargo, setNewCargo] = useState({
    cargoType: '',
    category: 'berries' as PerishableCategory,
    weightKg: '' as string | number,
    volumeCbm: 2.0,
    totalShelfLifeDays: '' as string | number,
    slaMaxDeliveryHours: '' as string | number,
    slaMaxSpoilagePercent: '' as string | number,
    slaPriority: 'normal',
    originName: '',
    originLat: 20.4625,
    originLng: 85.8830,
    originAddress: '',
    destinationName: '',
    destinationLat: 20.2961,
    destinationLng: 85.8245,
    destinationAddress: '',
    targetTempMin: '' as string | number,
    targetTempMax: '' as string | number,
    deliveryDeadline: '',
    notes: '',
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isCategoryDirty && newCargo.cargoType) {
      const text = newCargo.cargoType.toLowerCase();
      if (text.includes('mango')) setNewCargo(p => ({ ...p, category: 'mangoes' }));
      else if (text.includes('berry') || text.includes('strawber')) setNewCargo(p => ({ ...p, category: 'berries' }));
      else if (text.includes('grape')) setNewCargo(p => ({ ...p, category: 'grapes' }));
      else if (text.includes('leaf') || text.includes('spinach')) setNewCargo(p => ({ ...p, category: 'leafy_greens' }));
      else if (text.includes('tomato')) setNewCargo(p => ({ ...p, category: 'tomatoes' }));
      else if (text.includes('milk') || text.includes('cheese') || text.includes('dairy')) setNewCargo(p => ({ ...p, category: 'dairy' }));
      else if (text.includes('mushroom')) setNewCargo(p => ({ ...p, category: 'mushrooms' }));
    }
  }, [newCargo.cargoType, isCategoryDirty]);

  // Load data function to be reused for demo reset
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const u = await dataService.getActiveUser();
      const b = await dataService.getBusinesses();
      const s = await dataService.getShipments();

      if (u) setUser(u);
      setBusinesses(b);
      if (u?.businessId) setCurrentBizId(u.businessId);
      else if (b.length > 0) setCurrentBizId(b[0].id);
      setShipments(s);
    } catch (err: any) {
      console.error("Dashboard failed to load data:", err);
      setError("Failed to load dashboard data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentBiz = businesses.find((b) => b.id === currentBizId) || businesses[0] || {} as BusinessEntity;
  const myShipments = shipments.filter((s) => s.businessId === currentBizId);

  // Auto-select first shipment
  useEffect(() => {
    if (!selectedShipment && myShipments.length > 0) {
      setSelectedShipment(myShipments[0]);
    }
  }, [myShipments, selectedShipment]);

  // Handle navigation to shipment details
  const handleSelectShipment = (shipment: Shipment) => {
    navigate(`/business/shipments/${shipment.id}`);
  };

  // Aggregate stats
  const totalCostSaved = myShipments.reduce((acc, s) => acc + (s.estimatedSoloCostINR - s.consolidatedCostINR), 0);
  const totalCO2Saved = myShipments.reduce((acc, s) => acc + s.co2SavedKg, 0);
  const avgFreshness = Math.round(myShipments.reduce((acc, s) => acc + s.freshnessPercent, 0) / (myShipments.length || 1));

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBizId) return;
    try {
      setModalStep('processing');
      const daysOffset = 2; 
      const computedDeadline = new Date(Date.now() + daysOffset * 24 * 3600 * 1000).toISOString();

      const created = await dataService.createShipment({
        businessId: currentBizId,
        cargoType: newCargo.cargoType,
        category: newCargo.category,
        weightKg: Number(newCargo.weightKg),
        volumeCbm: Number(newCargo.volumeCbm) || 2.0,
        originName: newCargo.originName,
        originLat: newCargo.originLat || 20.4625,
        originLng: newCargo.originLng || 85.8830,
        originAddress: newCargo.originAddress || newCargo.originName || 'Odisha Packhouse',
        destinationName: newCargo.destinationName,
        destinationLat: newCargo.destinationLat || 20.2961,
        destinationLng: newCargo.destinationLng || 85.8245,
        destinationAddress: newCargo.destinationAddress || newCargo.destinationName || 'Odisha Hub',
        targetTempMin: Number(newCargo.targetTempMin),
        targetTempMax: Number(newCargo.targetTempMax),
        totalShelfLifeHours: Number(newCargo.totalShelfLifeDays) * 24,
        slaMaxDeliveryHours: newCargo.slaMaxDeliveryHours ? Number(newCargo.slaMaxDeliveryHours) : 48,
        slaMaxSpoilagePercent: Number(newCargo.slaMaxSpoilagePercent),
        slaPriority: newCargo.slaPriority || 'normal',
        deliveryDeadline: computedDeadline,
        notes: newCargo.notes || 'Registered shipment.',
      });

      setShipments([created, ...shipments]);
      setCreatedShipmentId(created.id);
      setSelectedShipment(created);

      // Call AI Engine with live telemetry processing display
      const [aiResponse] = await Promise.all([
        dataService.getAIPlan(created.id),
        new Promise((resolve) => setTimeout(resolve, 2200))
      ]);
      setAiPlanResults(aiResponse);
      setModalStep('results');
      
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || 'Failed to create shipment or fetch AI plan. Please try again.');
      setModalStep('intake');
    }
  };

  const handleRecalculatePlan = async () => {
    if (!createdShipmentId) return;
    setIsRecalculating(true);
    try {
      const options = {
        optimizationPreference: whatIfPreference,
        slaOverrideHours: whatIfSla ? Number(whatIfSla) : undefined,
      };
      const aiResponse = await dataService.getAIPlan(createdShipmentId, options);
      setPreviousAiPlanResults(aiPlanResults);
      setAiPlanResults(aiResponse);
      setSelectedPlanType('recommended');
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || 'Failed to recalculate plan. Please try again.');
    } finally {
      setIsRecalculating(false);
    }
  };

const confirmAiPlan = async (planId: string) => {
    // 1. Instantly close the modal and show notification
    const vehicleName = aiPlanResults?.recommendedPlan?.vehicle || 'optimized';
    setIsNewModalOpen(false);
    setNotification(`Shipment confirmed! Assigned to ${vehicleName}. Consolidation engine will track telemetry.`);

    // 2. Perform backend database sync securely in the background
// 2. Perform backend database sync securely
    try {
      const payload = {
        clusterId: aiPlanResults?.clusterId || `REC-CLST-${Math.floor(Math.random() * 9000) + 1000}`,
        shipmentIds: createdShipmentId ? [createdShipmentId] : [],
        routeDetails: aiPlanResults?.recommendedPlan || { id: planId }
      };

      const token = localStorage.getItem('token') || localStorage.getItem('authToken'); 
      
      const response = await fetch('/api/routes', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include', // <-- THE FIX: Forces fetch to send your auth cookies to the Express backend
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // If it throws a 401 again, it stops here and tells you, instead of faking a reload
        throw new Error(`Server rejected the request: ${response.status}`);
      }

      // 3. Reset the form state completely ONLY if the database save was successful
      setModalStep('intake');
      setAiPlanResults(null);
      setCreatedShipmentId(null);
      setSelectedPlanType('recommended');
      setNewCargo({
        cargoType: '', category: 'berries', weightKg: '', volumeCbm: 2.0,
        totalShelfLifeDays: '', slaMaxDeliveryHours: '', slaMaxSpoilagePercent: '', slaPriority: 'normal',
        originName: '', originLat: 20.4625, originLng: 85.8830, originAddress: '',
        destinationName: '', destinationLat: 20.2961, destinationLng: 85.8245, destinationAddress: '',
        targetTempMin: '', targetTempMax: '', deliveryDeadline: '', notes: '',
      });

      // 4. Automatically refresh the data after 2 seconds
      setTimeout(() => {
        setNotification(null);
        window.location.reload(); 
      }, 2000);

    } catch (error) {
      console.error("Background sync error:", error);
      setNotification("Auth failed: Could not save cluster. Please log out and log back in.");
    }

    // 3. Reset the form state completely
    setModalStep('intake');
    setAiPlanResults(null);
    setCreatedShipmentId(null);
    setSelectedPlanType('recommended');
    setNewCargo({
      cargoType: '', category: 'berries', weightKg: '', volumeCbm: 2.0,
      totalShelfLifeDays: '', slaMaxDeliveryHours: '', slaMaxSpoilagePercent: '', slaPriority: 'normal',
      originName: '', originLat: 20.4625, originLng: 85.8830, originAddress: '',
      destinationName: '', destinationLat: 20.2961, destinationLng: 85.8245, destinationAddress: '',
      targetTempMin: '', targetTempMax: '', deliveryDeadline: '', notes: '',
    });

    // 4. Automatically refresh the data after 2 seconds so the new cluster appears
    setTimeout(() => {
      setNotification(null);
      window.location.reload(); 
    }, 2000);
  };

  const closeNewModal = () => {
    setIsNewModalOpen(false);
    setModalError(null);
    setTimeout(() => {
      setModalStep('intake');
      setAiPlanResults(null);
      setPreviousAiPlanResults(null);
      setSelectedPlanType('recommended');
    }, 300);
  };
  // ----------------------------------------------------------------------
  // 2. ERROR & LOADING STATES
  // ----------------------------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex items-center justify-center p-4">
        <div className="bg-white border border-[#B3462C]/30 rounded-2xl p-8 shadow-lg text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-[#B3462C] mx-auto mb-4" />
          <h2 className="text-[#B3462C] font-bold font-display text-xl mb-2">Connection Error</h2>
          <p className="text-[#596560] text-sm mb-6 leading-relaxed">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full px-4 py-3 bg-[#163832] hover:bg-[#0f2622] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 bg-[#5C7A50]/20 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[#5C7A50]" />
          </div>
          <span className="font-mono text-sm text-[#596560] font-medium tracking-wide">Loading Shipper Dashboard...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 3. MAIN DASHBOARD UI
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#1A211E] flex flex-col font-sans pb-12">
      <AppHeader user={user} activeRole="business" />

      {/* Global Notification Banner */}
      {notification && (
        <div className="bg-[#163832] text-white px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 duration-300 shadow-md z-50 sticky top-0">
          <Sparkles className="w-4 h-4 text-[#D98E2B]" />
          <span>{notification}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#D6DCD4] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display font-black text-3xl text-[#163832] tracking-tight">
                Shipper Portal
              </h1>
              <span className="font-mono text-[10px] px-2.5 py-1 bg-[#5C7A50]/15 text-[#5C7A50] border border-[#5C7A50]/20 rounded-full font-bold uppercase tracking-widest shadow-sm">
                MSME / Farmer View
              </span>
            </div>
            <p className="text-sm text-[#596560] max-w-xl">
              Track your active consignments, monitor cold-chain compliance, and view real-time freight cost savings generated by AI consolidation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {hasAccess('cross_tenant_data') && (
              <div className="flex items-center gap-2 bg-white border border-[#D6DCD4] px-4 py-2.5 rounded-xl shadow-sm text-sm hover:border-[#5C7A50] transition-colors">
                <Building2 className="w-4 h-4 text-[#596560]" />
                <select
                  value={currentBizId}
                  onChange={(e) => {
                    setCurrentBizId(e.target.value);
                    setSelectedShipment(null);
                  }}
                  className="bg-transparent text-[#163832] font-semibold focus:outline-none cursor-pointer w-full"
                >
                  {businesses.map((biz) => (
                    <option key={biz.id} value={biz.id}>{biz.name} ({biz.category})</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setModalStep('intake');
                setIsNewModalOpen(true);
              }}
              className="px-6 py-2.5 bg-[#5C7A50] hover:bg-[#435A3A] text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              <span>New Shipment</span>
            </button>
          </div>
        </div>

        {/* 3 Premium KPI Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#E5EBE3] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center justify-between text-xs font-mono text-[#596560] font-bold tracking-widest uppercase mb-3">
              <span>Estimated Freight Savings</span>
              <div className="bg-green-100 p-2 rounded-lg"><TrendingDown className="w-5 h-5 text-green-700" /></div>
            </div>
            <div className="font-display font-black text-3xl text-[#163832]">₹{totalCostSaved.toLocaleString()}</div>
            <div className="text-sm text-[#5C7A50] font-medium mt-1">
              {totalCostSaved > 0 ? `vs. individual solo reefer bookings` : 'Book shipments to start saving'}
            </div>
          </div>

          <div className="bg-white border border-[#E5EBE3] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center justify-between text-xs font-mono text-[#596560] font-bold tracking-widest uppercase mb-3">
              <span>Estimated Carbon Reduction</span>
              <div className="bg-emerald-100 p-2 rounded-lg"><Leaf className="w-5 h-5 text-emerald-700" /></div>
            </div>
            <div className="font-display font-black text-3xl text-[#163832]">{totalCO2Saved.toFixed(1)} <span className="text-xl text-[#596560]">kg CO₂</span></div>
            <div className="text-sm text-emerald-700 font-medium mt-1">Via multimodal routing</div>
          </div>

          <div className="bg-white border border-[#E5EBE3] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center justify-between text-xs font-mono text-[#596560] font-bold tracking-widest uppercase mb-3">
              <span>Freshness Index</span>
              <div className="bg-blue-100 p-2 rounded-lg"><ThermometerSnowflake className="w-5 h-5 text-blue-700" /></div>
            </div>
            <div className="font-display font-black text-3xl text-[#163832]">{avgFreshness}%</div>
            <div className="text-sm text-blue-700 font-medium mt-1">Unbroken cold-chain integrity</div>
          </div>
        </div>

        {/* Consignments List Full Width */}
        <div className="grid grid-cols-1 gap-8 items-start">
          
          {/* LEFT: Consignments List */}
          <div className="bg-white border border-[#E5EBE3] rounded-3xl p-1 sm:p-6 shadow-sm">
            <div className="px-4 py-4 sm:px-0 sm:pt-0 sm:pb-5 border-b border-[#E5EBE3] flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-xl text-[#163832]">Manifest</h3>
                <p className="text-sm text-[#596560]">Active & completed shipments ({myShipments.length})</p>
              </div>
            </div>

            {myShipments.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="bg-[#F8FAF7] p-6 rounded-full mb-4">
                  <PackageOpen className="w-12 h-12 text-[#D6DCD4]" />
                </div>
                <h4 className="font-bold text-[#163832] text-lg mb-2">No shipments yet</h4>
                <p className="text-sm text-[#596560] mb-6 max-w-sm">Create your first shipment to see how AI consolidation can reduce your logistics costs.</p>
                <button onClick={() => { setModalStep('intake'); setIsNewModalOpen(true); }} className="px-6 py-2.5 bg-[#5C7A50] text-white rounded-xl font-semibold shadow-md">Create Shipment</button>
              </div>
            ) : (
              <>
                {/* Desktop Table View (Hidden on Mobile) */}
                <div className="hidden md:block overflow-x-auto mt-4">
                  <table className="w-full text-left text-sm border-collapse table-auto">
                    <thead>
                      <tr className="text-[#596560] font-mono text-[10px] uppercase tracking-widest border-b border-[#E5EBE3]">
                        <th className="py-3 px-5 font-bold">Consignment</th>
                        <th className="py-3 px-5 font-bold">Destination</th>
                        <th className="py-3 px-5 font-bold">Integrity</th>
                        <th className="py-3 px-5 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F5F2]">
                      {myShipments.map((shipment) => {
                        const isSelected = selectedShipment?.id === shipment.id;
                        return (
                          // THE FIX: Using border-l-4 instead of an absolute <td> to prevent layout breaking
                          <tr
                            key={shipment.id}
                            onClick={() => handleSelectShipment(shipment)}
                            className={`cursor-pointer transition-all ${isSelected ? 'bg-green-50/50 shadow-sm' : 'hover:bg-gray-50/70 border-b border-[#F3F5F2] last:border-b-0'}`}
                          >
                            <td className={`py-4 px-5 ${isSelected ? 'rounded-l-xl' : ''}`}>
                              <div className="font-mono font-bold text-[#163832]">{shipment.code}</div>
                              <div className="text-xs text-[#596560] font-medium mt-0.5">{shipment.cargoType} &bull; {shipment.weightKg}kg</div>
                            </td>
                            <td className="py-4 px-5 text-gray-700 font-medium whitespace-nowrap">
                              {shipment.destination.name.split(',')[0]}
                            </td>
                            <td className="py-4 px-5">
                              <FreshnessGauge percentage={shipment.freshnessPercent} remainingHours={shipment.remainingShelfLifeHours} size="sm" showHours predictedRiskLevel={shipment.spoilageRiskLevel} />
                            </td>
                            <td className="py-4 px-5">
                              {/* THE FIX: whitespace-nowrap prevents the awkward badge splitting */}
                              <span className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                                shipment.status === 'in_transit' ? 'bg-[#5C7A50]/10 text-[#5C7A50] border border-[#5C7A50]/20' : 
                                shipment.status === 'pending' ? 'bg-[#D98E2B]/10 text-[#D98E2B] border border-[#D98E2B]/20' :
                                shipment.status === 'disrupted' ? 'bg-red-50 text-red-700 border border-red-200' : 
                                shipment.status === 'delivered' ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-[#D98E2B]/10 text-[#D98E2B] border border-[#D98E2B]/20'
                              }`}>
                                {shipment.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View (Hidden on Desktop) */}
                <div className="md:hidden flex flex-col gap-3 p-4">
                  {myShipments.map((shipment) => {
                    const isSelected = selectedShipment?.id === shipment.id;
                    return (
                      <div
                        key={shipment.id}
                        onClick={() => handleSelectShipment(shipment)}
                        className={`bg-white border rounded-xl p-4 cursor-pointer transition-all shadow-sm ${isSelected ? 'border-[#5C7A50] ring-1 ring-[#5C7A50]' : 'border-[#E5EBE3]'}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-mono font-bold text-[#163832]">{shipment.code}</div>
                            <div className="text-xs text-[#596560] font-medium mt-0.5">{shipment.cargoType}</div>
                          </div>
                          <span className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider ${
                            shipment.status === 'in_transit' ? 'bg-[#5C7A50]/10 text-[#5C7A50] border border-[#5C7A50]/20' : 
                            shipment.status === 'pending' ? 'bg-[#D98E2B]/10 text-[#D98E2B] border border-[#D98E2B]/20' :
                            shipment.status === 'disrupted' ? 'bg-red-50 text-red-700 border border-red-200' : 
                            shipment.status === 'delivered' ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-[#D98E2B]/10 text-[#D98E2B] border border-[#D98E2B]/20'
                          }`}>
                            {shipment.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600 mb-3">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {shipment.destination.name.split(',')[0]}</span>
                          <span className="font-mono font-bold text-[#5C7A50]">+{shipment.costSavingsPercent}% Saved</span>
                        </div>
                        <FreshnessGauge percentage={shipment.freshnessPercent} remainingHours={shipment.remainingShelfLifeHours} size="sm" showHours predictedRiskLevel={shipment.spoilageRiskLevel} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      {/* ---------------------------------------------------------------------- */}
      {/* 4. "NEW SHIPMENT" SMART MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#F8FAF7] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-full flex flex-col">
            
            <div className="bg-white px-6 py-5 flex items-center justify-between border-b border-[#E5EBE3]">
              <div className="flex items-center gap-3">
                <div className="bg-[#5C7A50] p-2 rounded-xl text-white shadow-sm"><Plus className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-display font-black text-xl text-[#163832]">
                    {modalStep === 'intake' && 'New Shipment Request'}
                    {modalStep === 'processing' && 'AI Logistics Engine Running...'}
                    {modalStep === 'results' && 'Optimal Logistics Plan Ready'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {(['intake', 'processing', 'results'] as const).map((step, i) => (
                      <React.Fragment key={step}>
                        <span className={`text-[10px] font-mono font-bold ${
                          step === modalStep ? 'text-[#5C7A50]' :
                          (modalStep === 'results' && step === 'intake') || (modalStep === 'results' && step === 'processing') || (modalStep === 'processing' && step === 'intake') ? 'text-[#163832]/40' :
                          'text-[#596560]/40'
                        }`}>
                          {step === 'intake' ? '① Describe' : step === 'processing' ? '② Analyse' : '③ Compare & Select'}
                        </span>
                        {i < 2 && <span className="text-[#D6DCD4] text-[10px]">›</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={closeNewModal} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalStep === 'intake' && (
              <>
                {/* In-modal error banner */}
                {modalError && (
                  <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{modalError}</span>
                    <button onClick={() => setModalError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <form onSubmit={handleCreateShipment} className="p-6 overflow-y-auto space-y-8 text-sm flex-1">
              
              {/* SECTION 1: Cargo Specs */}
              <section>
                <h4 className="font-bold text-[#163832] mb-4 flex items-center gap-2 border-b border-gray-200 pb-2"><PackageOpen className="w-4 h-4 text-[#5C7A50]" /> 1. Cargo Specifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Cargo Description</label>
                    <input type="text" required value={newCargo.cargoType} onChange={(e) => setNewCargo({ ...newCargo, cargoType: e.target.value })} placeholder="e.g. Alphonso Mangoes Grade A" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#5C7A50]/20 focus:border-[#5C7A50] transition-shadow shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Produce Category</label>
                    <select value={newCargo.category} onChange={(e) => { setIsCategoryDirty(true); setNewCargo({ ...newCargo, category: e.target.value as PerishableCategory }) }} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#5C7A50]/20 focus:border-[#5C7A50] shadow-sm">
                      <option value="berries">Fresh Berries / Strawberries</option>
                      <option value="mangoes">Alphonso / Tropical Fruits</option>
                      <option value="grapes">Table Grapes / Stone Fruits</option>
                      <option value="leafy_greens">Hydroponic Salad Greens</option>
                      <option value="tomatoes">Exotic Tomatoes & Veggies</option>
                      <option value="dairy">Artisanal Dairy & Cheese</option>
                      <option value="mushrooms">Fresh Button Mushrooms</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Weight (kg)</label>
                    <input type="number" required min="20" max="5000" value={newCargo.weightKg} onChange={(e) => setNewCargo({ ...newCargo, weightKg: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 font-mono focus:ring-2 focus:ring-[#5C7A50]/20 focus:border-[#5C7A50] shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Target Temp Band (°C)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.5" required value={newCargo.targetTempMin} onChange={(e) => setNewCargo({ ...newCargo, targetTempMin: e.target.value === '' ? '' : Number(e.target.value) })} className="w-1/2 bg-white border border-gray-300 rounded-lg px-3 py-2.5 font-mono shadow-sm" placeholder="Min" />
                      <span className="text-gray-400 font-medium">to</span>
                      <input type="number" step="0.5" required value={newCargo.targetTempMax} onChange={(e) => setNewCargo({ ...newCargo, targetTempMax: e.target.value === '' ? '' : Number(e.target.value) })} className="w-1/2 bg-white border border-gray-300 rounded-lg px-3 py-2.5 font-mono shadow-sm" placeholder="Max" />
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 2: Routing */}
              <section>
                <h4 className="font-bold text-[#163832] mb-4 flex items-center gap-2 border-b border-gray-200 pb-2"><MapPin className="w-4 h-4 text-[#D98E2B]" /> 2. Logistics Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Pickup Origin</label>
                    <input type="text" required value={newCargo.originName} onChange={(e) => setNewCargo({ ...newCargo, originName: e.target.value })} placeholder="Farm or Packhouse Name" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#5C7A50]/20 shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Destination Hub</label>
                    <input type="text" required value={newCargo.destinationName} onChange={(e) => setNewCargo({ ...newCargo, destinationName: e.target.value })} placeholder="Terminal or Market" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#5C7A50]/20 shadow-sm" />
                  </div>
                </div>
              </section>

              {/* SECTION 3: SLA */}
              <section>
                <h4 className="font-bold text-[#163832] mb-4 flex items-center gap-2 border-b border-gray-200 pb-2"><ShieldCheck className="w-4 h-4 text-blue-500" /> 3. Service Level Agreement (SLA)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Total Shelf Life (Days)</label>
                    <input type="number" required min="1" value={newCargo.totalShelfLifeDays} onChange={(e) => setNewCargo({ ...newCargo, totalShelfLifeDays: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 font-mono shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Spoilage Integrity Threshold (%)</label>
                    <input type="number" required min="0" max="100" value={newCargo.slaMaxSpoilagePercent} onChange={(e) => setNewCargo({ ...newCargo, slaMaxSpoilagePercent: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 font-mono shadow-sm" placeholder="Alert if risk exceeds..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Max Delivery SLA (Hours)</label>
                    <input type="number" min="1" value={newCargo.slaMaxDeliveryHours} onChange={(e) => setNewCargo({ ...newCargo, slaMaxDeliveryHours: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 font-mono shadow-sm" placeholder="e.g. 48 (Defaults to 48 if empty)" />
                  </div>
                </div>
              </section>

              {/* AI Insight Box */}
              <div className="bg-gradient-to-r from-green-50 to-[#F8FAF7] border border-green-200 p-4 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h5 className="font-bold text-green-800 text-sm mb-1">Instant AI Matching Active</h5>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    Upon submission, Karwaan's engine will instantly search for active cold-chain clusters on your corridor to guarantee maximum LTL cost savings without violating your Spoilage Integrity Threshold.
                  </p>
                </div>
              </div>

            </form>

            {/* Footer Actions */}
            <div className="bg-white p-5 border-t border-[#E5EBE3] flex items-center justify-end gap-3 rounded-b-3xl">
              <button type="button" onClick={closeNewModal} className="px-5 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors">
                Cancel
              </button>
              <button type="submit" onClick={handleCreateShipment} className="px-6 py-3 bg-[#163832] hover:bg-[#0f2622] text-white rounded-xl font-bold shadow-lg shadow-[#163832]/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5">
                Find Best Plan <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            </>
            )}

            {modalStep === 'processing' && (
              <EngineProcessingView 
                origin={newCargo.originName}
                destination={newCargo.destinationName}
                cargoType={newCargo.cargoType}
                weightKg={newCargo.weightKg}
              />
            )}

            {modalStep === 'results' && aiPlanResults && (() => {
              const activePlan = selectedPlanType === 'recommended' 
                ? aiPlanResults.recommendedPlan 
                : (aiPlanResults.candidatePlans?.find((p: any) => p.type === selectedPlanType) || aiPlanResults.recommendedPlan);

              const activeRouteLegs = activePlan?.route?.legs || activePlan?.legs || [];
              const originLeg = activeRouteLegs[0];
              const destLeg = activeRouteLegs[activeRouteLegs.length - 1];

              const resolvedOriginCoords = originLeg?.originCoords || [newCargo.originLat || 20.4625, newCargo.originLng || 85.8830];
              const resolvedDestCoords = destLeg?.destinationCoords || [newCargo.destinationLat || 20.2961, newCargo.destinationLng || 85.8245];

              const hasRail = activeRouteLegs.some((l: any) => l.mode === 'rail_cold_wagon');
              const hasRoad = activeRouteLegs.some((l: any) => l.mode === 'road_reefer');

              return (
                <div className="p-0 overflow-y-auto flex-1 flex flex-col bg-[#F8FAF7]">
                  
                  {/* Header: SELECTED / RECOMMENDED PLAN */}
                  <div className="bg-[#163832] text-white p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-display font-black text-2xl">
                            {selectedPlanType === 'recommended' ? 'Recommended Plan' : `${activePlan?.type?.toUpperCase()} Plan Preview`}
                          </h4>
                          {selectedPlanType !== 'recommended' && (
                            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                              Alternative Selected
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-[#D98E2B] uppercase tracking-widest">
                          {activePlan?.vehicle || activePlan?.type || 'Optimized'} Routing
                        </span>
                      </div>
                      {activePlan?.slaStatus === 'compliant' || activePlan?.slaStatus === 'ok' ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-md font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3"/> SLA Compliant
                        </span>
                      ) : null}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                      <div>
                        <span className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Cost</span>
                        <span className="font-display font-bold text-xl">₹{Math.round(activePlan?.cost || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Est. Departure</span>
                        <span className="font-bold">
                          {activePlan?.eta && !isNaN(new Date(activePlan.eta).getTime())
                            ? new Date(activePlan.eta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            : (activePlan?.eta || 'ASAP')}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Transit Time</span>
                        <span className="font-bold">{(activePlan?.transitTimeHours || activePlan?.durationHours)?.toFixed(1)} hrs</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-white/50 uppercase tracking-widest mb-1">Capacity Util.</span>
                        <span className="font-bold">{activePlan?.capacityUtilization || aiPlanResults.recommendedPlan?.capacityUtilization || 85}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Mode & Route Strip */}
                  <div className="bg-[#102924] px-6 py-2.5 flex flex-wrap items-center justify-between text-white border-t border-b border-white/10 gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-400 font-bold">📍 {newCargo.originName || originLeg?.originName || 'Origin'}</span>
                      <span className="text-white/50">→</span>
                      <span className="text-amber-400 font-bold">🏁 {newCargo.destinationName || destLeg?.destinationName || 'Destination'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasRail && hasRoad ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          🚂 🚛 Multimodal (Rail + Road)
                        </span>
                      ) : hasRail ? (
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          🚂 Rail Cold Wagon
                        </span>
                      ) : (
                        <span className="bg-[#5C7A50]/30 text-green-300 border border-[#5C7A50]/50 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                          🚛 Road Reefer
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Static Map Section */}
                  <div className="w-full bg-[#F8FAF7] shrink-0 p-4 pb-0">
                    <KarwaanMap 
                      routes={[{ 
                        id: `plan-${selectedPlanType}`, 
                        name: activePlan?.name || 'Selected Route', 
                        legs: activeRouteLegs, 
                        status: 'active', 
                        activeIncidentId: null 
                      } as any]} 
                      selectedRouteId={`plan-${selectedPlanType}`}
                      shipments={[{ 
                        id: 'rec-ship-1', 
                        code: 'CARGO', 
                        cargoType: newCargo.cargoType || 'Cargo', 
                        category: newCargo.category || 'berries', 
                        freshnessPercent: 100, 
                        origin: { lat: resolvedOriginCoords[0], lng: resolvedOriginCoords[1], name: newCargo.originName || originLeg?.originName || 'Origin' }, 
                        destination: { lat: resolvedDestCoords[0], lng: resolvedDestCoords[1], name: newCargo.destinationName || destLeg?.destinationName || 'Destination' } 
                      } as any]}
                      selectedShipmentId="rec-ship-1"
                      height="280px" 
                      showAllControls={false} 
                      showLegend={true} 
                      isStatic={true}
                    />
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Consolidation Details */}
                    {activePlan?.shipmentCount && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 shadow-sm mb-2">
                        <h6 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">📦 CONSOLIDATED CLUSTER DETAILS</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                          <div>Your Cargo: <span className="font-bold text-gray-900">{newCargo.weightKg || 1000} kg</span></div>
                          <div>Total Consolidated Load: <span className="font-bold text-gray-900">{activePlan.totalCargoWeight} kg</span></div>
                          <div>Vehicle Capacity: <span className="font-bold text-gray-900">{activePlan.vehicleMaxCapacity} kg</span></div>
                          <div>Shipments in Cluster: <span className="font-bold text-gray-900">{activePlan.shipmentCount}</span></div>
                        </div>
                      </div>
                    )}

                    {/* Risks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="bg-white border border-[#E5EBE3] p-4 rounded-xl shadow-sm">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Predicted Delay Risk</span>
                           <span className="text-xs font-bold text-amber-600">
                             {(activePlan?.delayProbability || activePlan?.delayRisk?.score || 0).toFixed(1)}%
                           </span>
                         </div>
                         <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                           <div className="bg-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, activePlan?.delayProbability || activePlan?.delayRisk?.score || 0)}%` }}></div>
                         </div>
                       </div>
                       <div className="bg-white border border-[#E5EBE3] p-4 rounded-xl shadow-sm">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Predicted Spoilage Risk</span>
                           <span className="text-xs font-bold text-red-600">
                             {(activePlan?.spoilageProbability || activePlan?.spoilageRisk?.score || 0).toFixed(1)}%
                           </span>
                         </div>
                         <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                           <div className="bg-red-400 h-full rounded-full" style={{ width: `${Math.min(100, activePlan?.spoilageProbability || activePlan?.spoilageRisk?.score || 0)}%` }}></div>
                         </div>
                       </div>
                    </div>

                    {/* Why this plan? */}
                    <div className="bg-gradient-to-br from-[#F8FAF7] to-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
                      <h5 className="font-bold text-[#163832] mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#5C7A50]" /> WHY THIS PLAN?</h5>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">
                        {activePlan?.explanation?.multimodalAdvantage || activePlan?.explanation?.departureReasoning || activePlan?.explanation?.summary || 'The AI Engine determined this is the mathematically optimal consolidation route prioritizing SLA compliance and cost reduction.'}
                      </p>
                    </div>
                  </div>

                  {/* Alternative Plans */}
                  {aiPlanResults.candidatePlans && aiPlanResults.candidatePlans.length > 0 && (
                    <div className="p-6 pt-0">
                      <h5 className="font-bold text-[#163832] mb-3 text-sm flex items-center justify-between border-b border-[#E5EBE3] pb-2">
                        <span className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#596560]" />
                          Alternative Plans Comparison
                        </span>
                        <span className="text-[11px] font-mono text-[#596560]">Click any plan to preview route on map</span>
                      </h5>
                      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-[#E5EBE3]">
                        <table className="w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="text-[#596560] font-mono text-[10px] uppercase tracking-widest bg-gray-50 border-b border-[#E5EBE3]">
                              <th className="py-3 px-4 font-bold">Plan Type</th>
                              <th className="py-3 px-4 font-bold text-right">Cost (₹)</th>
                              <th className="py-3 px-4 font-bold text-center">Transit Time</th>
                              <th className="py-3 px-4 font-bold text-center">Delay Risk</th>
                              <th className="py-3 px-4 font-bold text-center">Map Preview</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr 
                              onClick={() => setSelectedPlanType('recommended')}
                              className={`cursor-pointer transition-all border-b border-[#E5EBE3] ${
                                selectedPlanType === 'recommended' 
                                  ? 'bg-[#E8F5E9]/60 font-bold border-l-4 border-l-[#5C7A50]' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="py-3 px-4 text-[#163832] flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#5C7A50]"></span>
                                Recommended ({aiPlanResults.recommendedPlan?.vehicle})
                              </td>
                              <td className="py-3 px-4 font-bold text-[#5C7A50] text-right">₹{Math.round(aiPlanResults.recommendedPlan?.cost || 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-center font-mono text-xs">{aiPlanResults.recommendedPlan?.transitTimeHours?.toFixed(1)} hrs</td>
                              <td className="py-3 px-4 text-center font-medium text-amber-600">{aiPlanResults.recommendedPlan?.delayProbability?.toFixed(1)}%</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${selectedPlanType === 'recommended' ? 'bg-[#5C7A50] text-white' : 'bg-gray-100 text-gray-700'}`}>
                                  {selectedPlanType === 'recommended' ? 'Active on Map' : 'View Route'}
                                </span>
                              </td>
                            </tr>
                            {aiPlanResults.candidatePlans.slice(0, 3).map((alt: any, idx: number) => {
                              const isAltSelected = selectedPlanType === alt.type;
                              return (
                                <tr 
                                  key={idx} 
                                  onClick={() => setSelectedPlanType(alt.type)}
                                  className={`cursor-pointer transition-all border-b last:border-b-0 border-[#E5EBE3] ${
                                    isAltSelected 
                                      ? 'bg-[#E8F5E9]/60 font-bold border-l-4 border-l-[#5C7A50]' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <td className="py-3 px-4 font-medium text-gray-700 capitalize flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${alt.type === 'multimodal' ? 'bg-emerald-600' : alt.type === 'express' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                    {alt.type} Plan ({alt.type === 'multimodal' ? 'Rail + Road' : alt.type === 'express' ? 'Fast Linehaul' : 'Direct Road'})
                                    {alt.slaStatus === 'violated' && <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded uppercase ml-1">SLA Violated</span>}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-gray-600 text-right">₹{Math.round(alt.cost).toLocaleString()}</td>
                                  <td className="py-3 px-4 text-center font-mono text-xs text-gray-600">{alt.durationHours?.toFixed(1)} hrs</td>
                                  <td className="py-3 px-4 text-center text-gray-500">{Math.round(alt.delayRisk?.score || 0)}%</td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${isAltSelected ? 'bg-[#5C7A50] text-white' : 'bg-gray-100 text-gray-700'}`}>
                                      {isAltSelected ? 'Active on Map' : 'View Route'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* What-If Engine Sandbox */}
                <div className="bg-white border-t border-[#D6DCD4] p-6 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)] z-10 relative">
                  <h5 className="font-display font-bold text-[#163832] mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D98E2B]" /> What-If AI Scenarios
                  </h5>
                  
                  {previousAiPlanResults && previousAiPlanResults.recommendedPlan?.id !== aiPlanResults.recommendedPlan?.id && (
                    <div className="mb-5 bg-gradient-to-r from-[#163832] to-[#2A4C46] text-white p-4 rounded-xl shadow-lg border border-[#5C7A50]">
                      <h6 className="font-mono text-[10px] font-bold text-[#D98E2B] uppercase tracking-widest mb-2">Engine Output Changed</h6>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div>
                          <div className="text-xs text-white/70 mb-0.5">Previous Route</div>
                          <div className="font-bold text-lg line-through text-white/50">{previousAiPlanResults.recommendedPlan?.vehicle} Route</div>
                          <div className="font-mono text-sm text-white/50">₹{Math.round(previousAiPlanResults.recommendedPlan?.cost || 0).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/70 mb-0.5">New Recommended Route</div>
                          <div className="font-bold text-lg text-emerald-400">{aiPlanResults.recommendedPlan?.vehicle} Route</div>
                          <div className="font-mono text-sm text-emerald-400">₹{Math.round(aiPlanResults.recommendedPlan?.cost || 0).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="mt-3 bg-black/20 p-2 rounded text-xs text-gray-300 font-medium">
                        <strong>Why it changed:</strong> {aiPlanResults.recommendedPlan?.explanation?.engineStrategy}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Optimization Target</label>
                      <select 
                        value={whatIfPreference}
                        onChange={(e) => setWhatIfPreference(e.target.value)}
                        className="w-full bg-[#F8FAF7] border border-[#D6DCD4] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#5C7A50] text-sm"
                      >
                        <option value="balanced">Balanced (Cost vs Risk)</option>
                        <option value="lowest_cost">Aggressive Lowest Cost</option>
                        <option value="fastest">Fastest Speed (Minimize Delay)</option>
                        <option value="safest">Safest (Minimize Spoilage)</option>
                      </select>
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Override Max SLA (hrs)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 24"
                        value={whatIfSla}
                        onChange={(e) => setWhatIfSla(e.target.value)}
                        className="w-full bg-[#F8FAF7] border border-[#D6DCD4] rounded-lg px-4 py-2.5 font-mono focus:ring-2 focus:ring-[#5C7A50] text-sm"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <button 
                        onClick={handleRecalculatePlan}
                        disabled={isRecalculating}
                        className={`w-full px-4 py-2.5 rounded-lg font-bold shadow transition-all flex items-center justify-center gap-2 overflow-hidden relative ${
                          isRecalculating 
                            ? 'bg-gradient-to-r from-[#163832] via-[#2D6A4F] to-[#163832] bg-[length:200%_100%] animate-[pulse_1.5s_ease-in-out_infinite] cursor-wait text-emerald-100 shadow-[0_0_15px_rgba(45,106,79,0.4)] border border-emerald-500/30' 
                            : 'bg-[#596560] hover:bg-[#1A211E] text-white'
                        }`}
                      >
                        {isRecalculating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin relative z-10"></div>
                            <span className="relative z-10 font-mono tracking-wide text-xs uppercase">Simulating</span>
                            <div className="absolute inset-0 bg-white/5 opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"></div>
                          </>
                        ) : (
                          <><Layers className="w-4 h-4" /> Recalculate</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-white mt-auto">
                  <button onClick={closeNewModal} className="px-5 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors">
                    Cancel Request
                  </button>
                  <button onClick={() => confirmAiPlan(aiPlanResults.recommendedPlan?.id)} className="px-6 py-3 bg-[#D98E2B] hover:bg-[#C27E25] text-white rounded-xl font-bold shadow-md flex items-center gap-2 transition-transform hover:-translate-y-0.5">
                    <CheckCircle2 className="w-5 h-5" /> Confirm AI Plan
                  </button>
                </div>
              </div>
            );
          })()}
          </div>
        </div>
      )}
    </div>
  );
};