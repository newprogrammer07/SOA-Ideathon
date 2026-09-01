import { pgTable, text, timestamp, real, integer, boolean, uuid, varchar, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum('user_role', ['admin', 'business', 'agent']);
export const routeModeEnum = pgEnum('route_mode', ['road_reefer', 'rail_cold_wagon', 'hub_transfer', 'local_transport']);
export const incidentTypeEnum = pgEnum('incident_type', ['vehicle_breakdown', 'temperature_excursion', 'traffic_delay', 'weather_delay', 'hub_congestion', 'customs_delay']);

export const businesses = pgTable('businesses', {
  id: varchar('id', { length: 255 }).primaryKey(), // using varchar to support "BIZ-01" type IDs for ease of mapping to frontend
  name: text('name').notNull(),
  contactInfo: text('contact_info'),
});

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  businessId: varchar('business_id', { length: 255 }).references(() => businesses.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const hubs = pgTable('hubs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  roadAccess: integer('road_access').notNull(),
  railAccess: integer('rail_access').notNull(),
  coldStorage: integer('cold_storage').notNull(),
  reeferCrossDock: integer('reefer_cross_dock').notNull(),
  capacityKg: integer('capacity_kg').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  handlingCostPerKg: real('handling_cost_per_kg').notNull(),
  coldStorageCostPerKgHr: real('cold_storage_cost_per_kg_hr').notNull(),
});

export const vehicles = pgTable('vehicles', {
  id: varchar('id', { length: 255 }).primaryKey(),
  vehicleType: text('vehicle_type').notNull(),
  capacityKg: integer('capacity_kg').notNull(),
  minTempC: integer('min_temp_c').notNull(),
  maxTempC: integer('max_temp_c').notNull(),
  currentLocation: text('current_location').notNull(),
  status: text('status').notNull(),
  costPerKmInr: real('cost_per_km_inr').notNull(),
  reliability: real('reliability').notNull(),
  temperatureControlScore: real('temperature_control_score').notNull(),
});


export const shipments = pgTable('shipments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  businessId: varchar('business_id', { length: 255 }).references(() => businesses.id).notNull(),
  cargoType: text('cargo_type').notNull(),
  targetTempMin: real('target_temp_min').notNull(),
  targetTempMax: real('target_temp_max').notNull(),
  weightKg: integer('weight_kg'),
  origin: text('origin'),
  destination: text('destination'),
  pickupStartHour: integer('pickup_start_hour'),
  pickupEndHour: integer('pickup_end_hour'),
  deliveryDeadlineHr: integer('delivery_deadline_hr'),
  currentTemp: real('current_temp'),
  totalShelfLifeHours: integer('total_shelf_life_hours'),
  remainingShelfLifeHours: integer('remaining_shelf_life_hours'),
  freshnessPercent: real('freshness_percent'),
  slaMaxDeliveryHours: integer('sla_max_delivery_hours'),
  slaMaxSpoilagePercent: real('sla_max_spoilage_percent'),
  slaPriority: varchar('sla_priority', { length: 50 }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


export const temperatureLogEntries = pgTable('temperature_log_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: varchar('shipment_id', { length: 255 }).references(() => shipments.id).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  temp: real('temp').notNull(),
  location: text('location').notNull(),
});

export const consolidationClusters = pgTable('consolidation_clusters', {
  id: varchar('id', { length: 255 }).primaryKey(),
  costSavingsPercent: real('cost_savings_percent').notNull(),
  co2SavedKg: real('co2_saved_kg').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const clusterShipments = pgTable('cluster_shipments', {
  clusterId: varchar('cluster_id', { length: 255 }).references(() => consolidationClusters.id).notNull(),
  shipmentId: varchar('shipment_id', { length: 255 }).references(() => shipments.id).notNull(),
});

export const deliveryRoutes = pgTable('delivery_routes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clusterId: varchar('cluster_id', { length: 255 }).references(() => consolidationClusters.id),
  status: varchar('status', { length: 50 }).notNull(),
  totalCost: real('total_cost').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const routeLegs = pgTable('route_legs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  routeId: varchar('route_id', { length: 255 }).references(() => deliveryRoutes.id).notNull(),
  sequence: integer('sequence').notNull(),
  mode: routeModeEnum('mode').notNull(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  reliabilityScore: real('reliability_score').notNull(),
  onTimePercent: real('on_time_percent').notNull(),
  avgDelayMinutes: real('avg_delay_minutes').notNull(),
});

export const incidentReports = pgTable('incident_reports', {
  id: varchar('id', { length: 255 }).primaryKey(),
  shipmentId: varchar('shipment_id', { length: 255 }).references(() => shipments.id), // Can optionally link to shipment or route
  type: incidentTypeEnum('type').notNull(),
  spoilageRiskImpactHours: real('spoilage_risk_impact_hours').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const vehicleAvailability = pgTable('vehicle_availability', {
  id: varchar('id', { length: 255 }).primaryKey(),
  vehicleId: varchar('vehicle_id', { length: 255 }).references(() => vehicles.id).notNull(),
  date: text('date').notNull(),
  vehicleType: text('vehicle_type').notNull(),
  capacityKg: integer('capacity_kg').notNull(),
  minTempC: integer('min_temp_c').notNull(),
  maxTempC: integer('max_temp_c').notNull(),
  homeLocation: text('home_location').notNull(),
  currentLocation: text('current_location').notNull(),
  availabilityStatus: varchar('availability_status', { length: 50 }).notNull(),
  availableFrom: text('available_from'),
  availableUntil: text('available_until'),
  estimatedCostPerKm: real('estimated_cost_per_km'),
  maintenanceStatus: varchar('maintenance_status', { length: 50 }),
  utilizationRate: real('utilization_rate'),
});
