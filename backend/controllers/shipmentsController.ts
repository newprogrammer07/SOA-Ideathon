import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { shipments, businesses, temperatureLogEntries } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { riskPredictionService } from '../services/riskPrediction';
import { maskCommercialData } from '../middleware/fieldMasking';
import { getShipmentRouteInfo, dynamicLocationsCache, getLocationCoords, calculateShipmentEconomics } from '../services/locationHelper';

// Seed-data compatibility shims for missing older database fields
const SEED_DEFAULT_CATEGORY = 'berries';
const SEED_DEFAULT_WEIGHT_KG = 1000;
const SEED_DEFAULT_VOLUME_CBM = 2.5;
const SEED_DEFAULT_HUMIDITY_PERCENT = 85;
const SEED_DEFAULT_ESTIMATED_SOLO_COST_INR = 15000;
const SEED_DEFAULT_CONSOLIDATED_COST_INR = 12000;
const SEED_DEFAULT_COST_SAVINGS_PERCENT = 20;
const SEED_DEFAULT_CO2_SAVED_KG = 50;

export const getShipments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user.role;
    const businessId = (req as any).user.businessId;

    let query = db.select({
      shipment: shipments,
      business: businesses,
    }).from(shipments)
      .innerJoin(businesses, eq(shipments.businessId, businesses.id));

    if (userRole === 'business') {
      if (!businessId) {
        return res.status(403).json({ success: false, error: 'Business ID not linked to this account.' });
      }
      query = query.where(eq(shipments.businessId, businessId)) as any;
    }

    const results = await query;
    
    // For each shipment, optionally fetch recent temp logs (in a real app, do a left join or batch fetch)
    const formattedShipments = await Promise.all(results.map(async ({ shipment, business }) => {
      const logs = await db.select().from(temperatureLogEntries).where(eq(temperatureLogEntries.shipmentId, shipment.id)).orderBy(desc(temperatureLogEntries.timestamp)).limit(20);
      
      const routeInfo = getShipmentRouteInfo(shipment.id, shipment.cargoType, shipment.origin || undefined, shipment.destination || undefined);
      
      const weight = shipment.weightKg != null ? shipment.weightKg : SEED_DEFAULT_WEIGHT_KG;
      const economics = calculateShipmentEconomics(weight, [routeInfo.origin.lat, routeInfo.origin.lng], [routeInfo.destination.lat, routeInfo.destination.lng]);

      // Pad to perfectly match the frontend 'Shipment' type
      return {
        ...shipment,
        code: shipment.id,
        businessName: business.name,
        category: SEED_DEFAULT_CATEGORY,
        weightKg: weight,
        volumeCbm: SEED_DEFAULT_VOLUME_CBM,
        origin: routeInfo.origin,
        destination: routeInfo.destination,
        targetTempRange: { min: shipment.targetTempMin, max: shipment.targetTempMax },
        humidityPercent: SEED_DEFAULT_HUMIDITY_PERCENT,
        dispatchTime: shipment.createdAt,
        deliveryDeadline: new Date(new Date(shipment.createdAt).getTime() + (shipment.slaMaxDeliveryHours || 48) * 3600000).toISOString(),
        status: shipment.status,
        estimatedSoloCostINR: economics.estimatedSoloCostINR,
        consolidatedCostINR: economics.consolidatedCostINR,
        costSavingsPercent: economics.costSavingsPercent,
        co2SavedKg: economics.co2SavedKg,
        consolidationReason: economics.consolidationReason,
        temperatureHistory: logs.map(l => ({
          timestamp: l.timestamp.toISOString(),
          temp: l.temp,
          location: l.location,
        })),
        slaConstraint: {
          maxDeliveryHours: shipment.slaMaxDeliveryHours,
          maxSpoilagePercent: shipment.slaMaxSpoilagePercent,
          priority: shipment.slaPriority,
        }
      };
    }));

    res.status(200).json(maskCommercialData(userRole, formattedShipments));
  } catch (error) {
    next(error);
  }
};

export const getShipmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userRole = (req as any).user.role;
    const businessId = (req as any).user.businessId;

    const result = await db.select({
      shipment: shipments,
      business: businesses,
    }).from(shipments)
      .innerJoin(businesses, eq(shipments.businessId, businesses.id))
      .where(eq(shipments.id, id))
      .limit(1);

    if (result.length === 0) return res.status(404).json({ error: 'Shipment not found' });

    const { shipment, business } = result[0];

    if (userRole === 'business' && shipment.businessId !== businessId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const logs = await db.select().from(temperatureLogEntries).where(eq(temperatureLogEntries.shipmentId, shipment.id)).orderBy(desc(temperatureLogEntries.timestamp)).limit(20);

    const routeInfo = getShipmentRouteInfo(shipment.id, shipment.cargoType, shipment.origin || undefined, shipment.destination || undefined);

    const weight = shipment.weightKg != null ? shipment.weightKg : SEED_DEFAULT_WEIGHT_KG;
    const economics = calculateShipmentEconomics(weight, [routeInfo.origin.lat, routeInfo.origin.lng], [routeInfo.destination.lat, routeInfo.destination.lng]);

    const formatted = {
      ...shipment,
      code: shipment.id,
      businessName: business.name,
      category: SEED_DEFAULT_CATEGORY,
      weightKg: weight,
      volumeCbm: SEED_DEFAULT_VOLUME_CBM,
      origin: routeInfo.origin,
      destination: routeInfo.destination,
      targetTempRange: { min: shipment.targetTempMin, max: shipment.targetTempMax },
      humidityPercent: SEED_DEFAULT_HUMIDITY_PERCENT,
      dispatchTime: shipment.createdAt,
      deliveryDeadline: new Date(new Date(shipment.createdAt).getTime() + (shipment.slaMaxDeliveryHours || 48) * 3600000).toISOString(),
      status: shipment.status,
      estimatedSoloCostINR: economics.estimatedSoloCostINR,
      consolidatedCostINR: economics.consolidatedCostINR,
      costSavingsPercent: economics.costSavingsPercent,
      co2SavedKg: economics.co2SavedKg,
      consolidationReason: economics.consolidationReason,
      temperatureHistory: logs.map(l => ({
        timestamp: l.timestamp.toISOString(),
        temp: l.temp,
        location: l.location,
      })),
      slaConstraint: {
        maxDeliveryHours: shipment.slaMaxDeliveryHours,
        maxSpoilagePercent: shipment.slaMaxSpoilagePercent,
        priority: shipment.slaPriority,
      }
    };

    res.status(200).json(maskCommercialData(userRole, formatted));
  } catch (error) {
    next(error);
  }
};

export const createShipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = (req as any).user.businessId;
    if (!businessId) {
      return res.status(403).json({ error: 'Business ID not linked to this account.' });
    }

    const {
      cargoType, targetTempMin, targetTempMax, totalShelfLifeHours,
      weightKg, volumeCbm, slaMaxDeliveryHours, slaMaxSpoilagePercent, slaPriority,
      category, originName, originLat, originLng, originAddress,
      destinationName, destinationLat, destinationLng, destinationAddress, deliveryDeadline
    } = req.body;

    // Basic Validation
    if (!cargoType || targetTempMin === undefined || targetTempMax === undefined) {
      return res.status(400).json({ error: 'Missing required fields: cargoType, targetTempMin, targetTempMax' });
    }
    if (isNaN(Number(targetTempMin)) || isNaN(Number(targetTempMax))) {
      return res.status(400).json({ error: 'targetTempMin and targetTempMax must be numbers' });
    }
    if (Number(targetTempMin) > Number(targetTempMax)) {
      return res.status(400).json({ error: 'Minimum target temperature cannot be greater than maximum target temperature.' });
    }
    if (weightKg !== undefined && (isNaN(Number(weightKg)) || Number(weightKg) <= 0)) {
      return res.status(400).json({ error: 'Weight must be a positive number.' });
    }
    if (totalShelfLifeHours !== undefined && (isNaN(Number(totalShelfLifeHours)) || Number(totalShelfLifeHours) <= 0)) {
      return res.status(400).json({ error: 'Total shelf life must be a positive number.' });
    }
    if (slaMaxDeliveryHours !== undefined && (isNaN(Number(slaMaxDeliveryHours)) || Number(slaMaxDeliveryHours) <= 0)) {
      return res.status(400).json({ error: 'SLA max delivery hours must be a positive number.' });
    }

    const shelfLife = Number(totalShelfLifeHours) || 120; // fallback if not provided

    const newShipment = await db.insert(shipments).values({
      id: `SHP-${Math.floor(Math.random() * 100000)}`,
      businessId,
      cargoType,
      targetTempMin: Number(targetTempMin),
      targetTempMax: Number(targetTempMax),
      currentTemp: Number(targetTempMin),
      totalShelfLifeHours: shelfLife,
      remainingShelfLifeHours: shelfLife,
      freshnessPercent: 100,
      slaMaxDeliveryHours: slaMaxDeliveryHours ? Number(slaMaxDeliveryHours) : null,
      slaMaxSpoilagePercent: slaMaxSpoilagePercent ? Number(slaMaxSpoilagePercent) : null,
      slaPriority: slaPriority || null,
      createdAt: new Date(),
      weightKg: weightKg ? Number(weightKg) : null,
      origin: originName || null,
      destination: destinationName || null,
    }).returning();

    const shipment = newShipment[0];
    const biz = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);

    const resolvedOrigin = originName ? { name: originName, lat: getLocationCoords(originName)[0], lng: getLocationCoords(originName)[1], address: originAddress || '', hubCode: 'DYN-HUB-ORI' } : getShipmentRouteInfo(shipment.id, shipment.cargoType).origin;
    const resolvedDestination = destinationName ? { name: destinationName, lat: getLocationCoords(destinationName)[0], lng: getLocationCoords(destinationName)[1], address: destinationAddress || '', hubCode: 'DYN-HUB-DST' } : getShipmentRouteInfo(shipment.id, shipment.cargoType).destination;
    
    dynamicLocationsCache.set(shipment.id, {
      origin: resolvedOrigin,
      destination: resolvedDestination
    });

    const weight = Number(weightKg) || SEED_DEFAULT_WEIGHT_KG;
    const economics = calculateShipmentEconomics(weight, [resolvedOrigin.lat, resolvedOrigin.lng], [resolvedDestination.lat, resolvedDestination.lng]);

    const formatted = {
      ...shipment,
      code: shipment.id,
      businessName: biz[0]?.name || 'Unknown',
      category: category || SEED_DEFAULT_CATEGORY,
      weightKg: Number(weightKg) || SEED_DEFAULT_WEIGHT_KG,
      volumeCbm: Number(volumeCbm) || SEED_DEFAULT_VOLUME_CBM,
      origin: resolvedOrigin,
      destination: resolvedDestination,
      targetTempRange: { min: shipment.targetTempMin, max: shipment.targetTempMax },
      humidityPercent: SEED_DEFAULT_HUMIDITY_PERCENT,
      dispatchTime: shipment.createdAt,
      deliveryDeadline: deliveryDeadline || new Date(new Date(shipment.createdAt).getTime() + (shipment.slaMaxDeliveryHours || 48) * 3600000).toISOString(),
      status: shipment.status,
      estimatedSoloCostINR: economics.estimatedSoloCostINR,
      consolidatedCostINR: economics.consolidatedCostINR,
      costSavingsPercent: economics.costSavingsPercent,
      co2SavedKg: economics.co2SavedKg,
      consolidationReason: economics.consolidationReason,
      temperatureHistory: [],
      slaConstraint: {
        maxDeliveryHours: shipment.slaMaxDeliveryHours,
        maxSpoilagePercent: shipment.slaMaxSpoilagePercent,
        priority: shipment.slaPriority,
      }
    };

    res.status(201).json({ shipment: formatted });
  } catch (error) {
    next(error);
  }
};

export const updateShipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userRole = (req as any).user.role;
    const businessId = (req as any).user.businessId;

    const existing = await db.select().from(shipments).where(eq(shipments.id, id)).limit(1);
    if (existing.length === 0) return res.status(404).json({ error: 'Shipment not found' });

    if (userRole === 'business' && existing[0].businessId !== businessId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      cargoType, targetTempMin, targetTempMax, totalShelfLifeHours,
      weightKg, volumeCbm, slaMaxDeliveryHours, slaMaxSpoilagePercent, slaPriority,
      origin, destination, status
    } = req.body;

    const updates: any = {};
    if (cargoType !== undefined) {
      if (typeof cargoType !== 'string') return res.status(400).json({ error: 'cargoType must be a string' });
      updates.cargoType = cargoType;
    }
    if (targetTempMin !== undefined) {
      if (isNaN(Number(targetTempMin))) return res.status(400).json({ error: 'targetTempMin must be a number' });
      updates.targetTempMin = Number(targetTempMin);
    }
    if (targetTempMax !== undefined) {
      if (isNaN(Number(targetTempMax))) return res.status(400).json({ error: 'targetTempMax must be a number' });
      updates.targetTempMax = Number(targetTempMax);
    }
    if (weightKg !== undefined) {
      if (isNaN(Number(weightKg))) return res.status(400).json({ error: 'weightKg must be a number' });
      updates.weightKg = Number(weightKg);
    }
    if (origin !== undefined) updates.origin = origin;
    if (destination !== undefined) updates.destination = destination;
    if (totalShelfLifeHours !== undefined) updates.totalShelfLifeHours = Number(totalShelfLifeHours);
    if (status !== undefined) updates.status = status;
    if (slaMaxDeliveryHours !== undefined) updates.slaMaxDeliveryHours = Number(slaMaxDeliveryHours);
    if (slaMaxSpoilagePercent !== undefined) updates.slaMaxSpoilagePercent = Number(slaMaxSpoilagePercent);
    if (slaPriority !== undefined) updates.slaPriority = slaPriority;

    // Reject empty updates map
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const updatedShipment = await db.update(shipments).set(updates).where(eq(shipments.id, id)).returning();

    res.status(200).json({ shipment: updatedShipment[0] });
  } catch (error) {
    next(error);
  }
};

export const appendTemperatureLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { temp, location } = req.body;

    const newLog = await db.insert(temperatureLogEntries).values({
      shipmentId: id,
      temp,
      location: location || 'Unknown',
      timestamp: new Date(),
    }).returning();

    res.status(201).json(newLog[0]);
  } catch (error) {
    next(error);
  }
};

export const getShipmentRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const result = await riskPredictionService.predictSpoilageRisk(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
