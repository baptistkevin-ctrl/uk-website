/**
 * Order Tracking Utilities
 *
 * Status timeline, simulated driver data, and ETA helpers
 * for live order tracking in the UK grocery store.
 */

export const ORDER_STATUSES = [
  { key: "pending", label: "Order Placed", icon: "ShoppingBag" },
  { key: "confirmed", label: "Order Confirmed", icon: "CheckCircle" },
  { key: "processing", label: "Being Picked & Packed", icon: "Package" },
  { key: "dispatched", label: "Out for Delivery", icon: "Truck" },
  { key: "delivered", label: "Delivered", icon: "Home" },
] as const;

export type OrderStatusKey = (typeof ORDER_STATUSES)[number]["key"];

export const STATUS_DESCRIPTIONS: Record<OrderStatusKey, string> = {
  pending: "Your order has been received and is awaiting confirmation.",
  confirmed: "Your order has been confirmed and payment processed.",
  processing: "Your items are being picked and packed at the store.",
  dispatched: "Your order is on its way to your delivery address.",
  delivered: "Your order has been delivered. Enjoy!",
};

/** Driver profiles — placeholder until real driver management is integrated */
export const DEMO_DRIVERS = [
  { name: "Driver", rating: 4.9, vehicle: "Delivery Van", photo: "/icons/icon.svg", phone: "" },
  { name: "Driver", rating: 4.8, vehicle: "Delivery Van", photo: "/icons/icon.svg", phone: "" },
  { name: "Driver", rating: 4.9, vehicle: "Delivery Van", photo: "/icons/icon.svg", phone: "" },
  { name: "Driver", rating: 4.7, vehicle: "Delivery Van", photo: "/icons/icon.svg", phone: "" },
] as const;

/** Common UK postcode area centroids for location simulation */
const UK_POSTCODE_COORDS: Record<string, { lat: number; lng: number }> = {
  EC: { lat: 51.5155, lng: -0.0922 },
  WC: { lat: 51.5165, lng: -0.1200 },
  W:  { lat: 51.5150, lng: -0.1750 },
  SW: { lat: 51.4700, lng: -0.1640 },
  SE: { lat: 51.4820, lng: -0.0530 },
  N:  { lat: 51.5520, lng: -0.1040 },
  NW: { lat: 51.5400, lng: -0.1760 },
  E:  { lat: 51.5310, lng: -0.0350 },
  BR: { lat: 51.3910, lng: 0.0260 },
  CR: { lat: 51.3720, lng: -0.0980 },
  DA: { lat: 51.4410, lng: 0.1490 },
  EN: { lat: 51.6520, lng: -0.0810 },
  HA: { lat: 51.5790, lng: -0.3420 },
  IG: { lat: 51.5690, lng: 0.0750 },
  KT: { lat: 51.3780, lng: -0.2920 },
  RM: { lat: 51.5570, lng: 0.1840 },
  SM: { lat: 51.3600, lng: -0.1920 },
  TW: { lat: 51.4460, lng: -0.3360 },
  UB: { lat: 51.5460, lng: -0.4420 },
  M:  { lat: 53.4808, lng: -2.2426 },
  B:  { lat: 52.4862, lng: -1.8904 },
  L:  { lat: 53.4084, lng: -2.9916 },
  LS: { lat: 53.8008, lng: -1.5491 },
  S:  { lat: 53.3811, lng: -1.4701 },
  BS: { lat: 51.4545, lng: -2.5879 },
  EH: { lat: 55.9533, lng: -3.1883 },
  G:  { lat: 55.8642, lng: -4.2518 },
  CF: { lat: 51.4816, lng: -3.1791 },
};

/**
 * Returns the index of a status in the order progression.
 * -1 if status is not found (e.g. "cancelled").
 */
export function getStatusIndex(status: string): number {
  return ORDER_STATUSES.findIndex((s) => s.key === status);
}

/**
 * Checks whether `checkStatus` has been completed relative to
 * the order's current `status`.
 *
 * A status is "completed" when the order's current status index
 * is greater than or equal to the checked status index.
 */
export function isStatusCompleted(currentStatus: string, checkStatus: string): boolean {
  const currentIdx = getStatusIndex(currentStatus);
  const checkIdx = getStatusIndex(checkStatus);
  if (currentIdx === -1 || checkIdx === -1) return false;
  return currentIdx >= checkIdx;
}

/**
 * Determines estimated delivery time from the order date and
 * optional delivery slot. Falls back to "within 2 hours" if
 * no slot is provided.
 */
export function getEstimatedDeliveryTime(
  orderDate: string,
  slot?: { date: string; from: string; to: string }
): string {
  if (slot) {
    return `${slot.date} between ${slot.from} - ${slot.to}`;
  }
  const created = new Date(orderDate);
  const eta = new Date(created.getTime() + 2 * 60 * 60 * 1000);
  return eta.toISOString();
}

/** Formats an ETA in minutes into a human-readable string */
export function formatETA(minutes: number): string {
  if (minutes < 1) return "Arriving now";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
}

/**
 * Extracts the postcode area prefix from a UK postcode string.
 * e.g. "SW1A 1AA" → "SW", "M1 1AA" → "M"
 */
export function extractPostcodeArea(postcode: string): string {
  const cleaned = postcode.replace(/\s+/g, "").toUpperCase();
  const match = cleaned.match(/^([A-Z]{1,2})/);
  return match ? match[1] : "";
}

/**
 * Returns approximate coordinates for a UK postcode area.
 * Falls back to central London if the area is unknown.
 */
export function getPostcodeCoords(postcode: string): { lat: number; lng: number } {
  const area = extractPostcodeArea(postcode);
  return UK_POSTCODE_COORDS[area] ?? { lat: 51.5074, lng: -0.1278 };
}

/**
 * Simulates a driver location near a given delivery postcode.
 * Adds a small random offset to represent the driver's position
 * while en route.
 */
export function simulateDriverLocation(deliveryPostcode: string): {
  lat: number;
  lng: number;
  heading: number;
} {
  const base = getPostcodeCoords(deliveryPostcode);
  return {
    lat: base.lat + (Math.random() - 0.5) * 0.02,
    lng: base.lng + (Math.random() - 0.5) * 0.02,
    heading: Math.round(Math.random() * 360),
  };
}

/**
 * Picks a deterministic demo driver based on the order ID.
 * This ensures the same driver is shown for the same order
 * across requests (consistent UX).
 */
export function getDemoDriver(orderId: string) {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = (hash * 31 + orderId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % DEMO_DRIVERS.length;
  const driver = DEMO_DRIVERS[idx];
  return {
    name: driver.name,
    phone: driver.phone,
    photo: driver.photo,
    vehicle: driver.vehicle,
    rating: driver.rating,
  };
}

/**
 * Generates a simulated ETA between 10–30 minutes with
 * traffic level and arrival time.
 */
export function simulateETA(): {
  minutes: number;
  arrivalTime: string;
  distance: string;
  trafficLevel: "low" | "moderate" | "heavy";
} {
  const minutes = Math.floor(Math.random() * 21) + 10;
  const arrival = new Date(Date.now() + minutes * 60 * 1000);

  const distanceKm = (minutes * 0.5 + Math.random() * 2).toFixed(1);
  const distanceMiles = (parseFloat(distanceKm) * 0.621371).toFixed(1);

  const trafficLevels: Array<"low" | "moderate" | "heavy"> = ["low", "moderate", "heavy"];
  const trafficIdx = minutes <= 15 ? 0 : minutes <= 22 ? 1 : 2;

  return {
    minutes,
    arrivalTime: arrival.toISOString(),
    distance: `${distanceMiles} miles`,
    trafficLevel: trafficLevels[trafficIdx],
  };
}

/**
 * Moves a coordinate slightly toward a target destination.
 * Used by the simulate endpoint to show driver movement.
 */
export function moveToward(
  current: { lat: number; lng: number },
  target: { lat: number; lng: number },
  stepFraction: number = 0.1
): { lat: number; lng: number; heading: number } {
  const jitter = () => (Math.random() - 0.5) * 0.001;

  const newLat = current.lat + (target.lat - current.lat) * stepFraction + jitter();
  const newLng = current.lng + (target.lng - current.lng) * stepFraction + jitter();

  const headingRad = Math.atan2(target.lng - current.lng, target.lat - current.lat);
  const heading = ((headingRad * 180) / Math.PI + 360) % 360;

  return {
    lat: newLat,
    lng: newLng,
    heading: Math.round(heading),
  };
}
