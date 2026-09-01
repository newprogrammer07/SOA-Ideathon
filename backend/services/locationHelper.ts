// Memory cache for dynamic shipment locations
export const dynamicLocationsCache = new Map<string, {
  origin: { name: string; lat: number; lng: number; address: string };
  destination: { name: string; lat: number; lng: number; address: string };
}>();

export const locationCoordsMap: Record<string, [number, number]> = {
  // Odisha Hubs & Terminals
  "bhubaneswar wholesale terminal": [20.2961, 85.8245],
  "bhubaneswar": [20.2961, 85.8245],
  "cuttack agro-packhouse": [20.4625, 85.8830],
  "cuttack": [20.4625, 85.8830],
  "omfed square": [20.2961, 85.8245],
  "puri": [19.8135, 85.8312],
  "jajpur": [20.8444, 86.3364],
  "jajpur road": [20.8444, 86.3364],
  "bhadrak": [21.0544, 86.4955],
  "baleswar": [21.4934, 86.9135],
  "balasore": [21.4934, 86.9135],
  "baripada": [21.9346, 86.7324],
  "rourkela": [22.2604, 84.8536],
  "koraput": [18.8140, 82.7126],
  "malkangiri": [18.3436, 81.8845],
  "balangir": [20.7107, 83.4866],
  "berhampur": [19.3149, 84.7941],
  "gopalpur": [19.2611, 84.9099],
  "sambalpur": [21.4685, 83.9782],
  "angul": [20.8400, 85.1500],
  "jharsuguda": [21.8554, 84.0062],

  // Northern & NCR Hubs
  "delhi": [28.6139, 77.2090],
  "new delhi": [28.6139, 77.2090],
  "delhi ncr logistics hub": [28.6139, 77.2090],
  "kashmir": [34.0837, 74.7973],
  "srinagar": [34.0837, 74.7973],
  "bhopal": [23.2599, 77.4126],
  "haryana": [29.0588, 76.0856],
  "harayana": [29.0588, 76.0856],
  "gurugram": [28.4595, 77.0266],
  "gurgaon": [28.4595, 77.0266],
  "faridabad": [28.4089, 77.3178],
  "panipat": [29.3909, 76.9635],
  "sonipat": [28.9931, 77.0151],
  "chandigarh": [30.7333, 76.7794],
  "ludhiana": [30.9010, 75.8573],
  "amritsar": [31.6340, 74.8723],
  "jaipur": [26.9124, 75.7873],
  "lucknow": [26.8467, 80.9462],
  "kanpur": [26.4542, 80.3503],
  "kanpur central": [26.4542, 80.3503],
  "prayagraj": [25.4484, 81.8284],
  "varanasi": [25.3176, 82.9739],

  // Eastern & Central Hubs
  "kolkata": [22.5726, 88.3639],
  "kolkata wholesale hub": [22.5726, 88.3639],
  "hijli": [22.3168, 87.3183],
  "tatanagar junction": [22.7758, 86.2036],
  "tatanagar": [22.7758, 86.2036],
  "jamshedpur": [22.8046, 86.2029],
  "ranchi": [23.3441, 85.3096],
  "dhanbad": [23.7957, 86.4304],
  "patna": [25.6093, 85.1376],
  "raipur": [21.2514, 81.6296],
  "nagpur": [21.1458, 79.0882],

  // Southern & Western Hubs
  "vizag": [17.6868, 83.2185],
  "visakhapatnam": [17.6868, 83.2185],
  "hyderabad": [17.3850, 78.4867],
  "bengaluru": [12.9716, 77.5946],
  "bangalore": [12.9716, 77.5946],
  "chennai": [13.0827, 80.2707],
  "mumbai": [19.0760, 72.8777],
  "vashi apmc": [19.0759, 72.9984],
  "pune": [18.5204, 73.8567],
  "nashik": [20.0988, 73.9189],
  "ahmedabad": [23.0225, 72.5714],
  "surat": [21.1702, 72.8311],
  "indore": [22.7196, 75.8577]
};

// Case-insensitive coordinate lookup
export function getLocationCoords(name: string): [number, number] {
  if (!name) return [20.2961, 85.8245]; // Safe default: Bhubaneswar
  const cleanName = name.trim().toLowerCase();

  if (locationCoordsMap[cleanName]) {
    return locationCoordsMap[cleanName];
  }

  // Fuzzy substring matching
  for (const [key, coords] of Object.entries(locationCoordsMap)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return coords;
    }
  }

  return [20.2961, 85.8245];
}

// Generate intermediate curvature points for realistic map polyline rendering
export function getRouteLegCoordinates(routeId: string, sequence: number, originName: string, destinationName: string): [number, number][] {
  const orig = getLocationCoords(originName);
  const dest = getLocationCoords(destinationName);

  // Generate 2 natural intermediate spline points to avoid rigid straight lines
  const midLat1 = orig[0] + (dest[0] - orig[0]) * 0.33 + (sequence % 2 === 0 ? 0.05 : -0.05);
  const midLng1 = orig[1] + (dest[1] - orig[1]) * 0.33 + (sequence % 2 === 0 ? -0.05 : 0.05);

  const midLat2 = orig[0] + (dest[0] - orig[0]) * 0.66 + (sequence % 2 === 0 ? -0.03 : 0.03);
  const midLng2 = orig[1] + (dest[1] - orig[1]) * 0.66 + (sequence % 2 === 0 ? 0.03 : -0.03);

  return [
    orig,
    [Number(midLat1.toFixed(4)), Number(midLng1.toFixed(4))],
    [Number(midLat2.toFixed(4)), Number(midLng2.toFixed(4))],
    dest
  ];
}

export function getClusterHubs(clusterId: string) {
  return {
    originHub: { 
      name: 'Bhubaneswar Central Cold Hub', 
      lat: 20.2961, 
      lng: 85.8245, 
      address: 'Industrial Cold Complex, Bhubaneswar, Odisha', 
      hubCode: 'BBS-HUB' 
    },
    destinationHub: { 
      name: 'Regional Delivery & Rail Terminal', 
      lat: 28.6139, 
      lng: 77.2090, 
      address: 'Multimodal Freight Complex', 
      hubCode: 'DST-TRM' 
    }
  };
}

export function getRouteCurrentLocation(routeId: string): { currentLocation: [number, number] | null; currentLocationName: string } {
  return { 
    currentLocation: [20.4625, 85.8830], 
    currentLocationName: 'Cuttack-Bhubaneswar Freight Corridor (NH-16)' 
  };
}

// Dynamically extract real origin & destination from the shipment object
export function getShipmentRouteInfo(shipmentId: string, cargoType?: string, origin?: string, destination?: string) {
  if (dynamicLocationsCache.has(shipmentId)) {
    const cached = dynamicLocationsCache.get(shipmentId)!;
    if ((!origin || cached.origin.name === origin) && (!destination || cached.destination.name === destination)) {
      return cached;
    }
  }

  // Use the actual origin/destination passed in from the database
  const originName = origin && origin.trim() !== '' ? origin : 'Bhubaneswar Wholesale Terminal';
  const destName = destination && destination.trim() !== '' ? destination : 'Delhi NCR Logistics Hub';

  const origCoords = getLocationCoords(originName);
  const destCoords = getLocationCoords(destName);

  const routeInfo = {
    origin: { 
      name: originName, 
      lat: origCoords[0], 
      lng: origCoords[1], 
      address: `${originName}, Cargo Terminal` 
    },
    destination: { 
      name: destName, 
      lat: destCoords[0], 
      lng: destCoords[1], 
      address: `${destName}, Delivery Hub` 
    }
  };

  dynamicLocationsCache.set(shipmentId, routeInfo);
  return routeInfo;
}

export function getEstimateDistance(coords1: [number, number], coords2: [number, number]): number {
  const R = 6371; // km
  const dLat = ((coords2[0] - coords1[0]) * Math.PI) / 180;
  const dLon = ((coords2[1] - coords1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1[0] * Math.PI) / 180) *
      Math.cos((coords2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;
  return Math.max(15, Math.round(straightLineKm * 1.18));
}

export function calculateShipmentEconomics(weightKg: number, originCoords: [number, number], destCoords: [number, number]) {
  const dist = getEstimateDistance(originCoords, destCoords);
  
  // Base rates for solo vs consolidated
  // e.g. Solo truck rate: ₹35/km + ₹2/kg processing
  const estimatedSoloCostINR = Math.round(dist * 35 + weightKg * 2);
  
  // Consolidation is usually 20-35% cheaper depending on distance
  const savingsFactor = 0.15 + (Math.min(dist, 2000) / 2000) * 0.20; // 15% to 35% savings
  const consolidatedCostINR = Math.round(estimatedSoloCostINR * (1 - savingsFactor));
  const costSavingsPercent = Math.round(((estimatedSoloCostINR - consolidatedCostINR) / estimatedSoloCostINR) * 100);
  
  // CO2 savings: ~0.15 kg CO2 per km per 1000kg
  const co2SavedKg = Math.round(dist * 0.15 * (weightKg / 1000) * (savingsFactor * 2));

  return {
    estimatedSoloCostINR,
    consolidatedCostINR,
    costSavingsPercent,
    co2SavedKg,
    consolidationReason: `Grouped with local shipments on the cold corridor. Eradicated deadhead mileage to save ${costSavingsPercent}%.`,
    dist
  };
}