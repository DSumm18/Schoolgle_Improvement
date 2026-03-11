/**
 * Lettings & Room Booking Engine
 *
 * Manages facility bookings, charge calculations, and income reporting
 * for schools letting their premises to community groups, commercial
 * organisations, and charities.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type BookingStatus =
  | "enquiry"
  | "provisional"
  | "confirmed"
  | "cancelled"
  | "completed";

export type FacilityType =
  | "hall"
  | "sports_hall"
  | "classroom"
  | "field"
  | "playground"
  | "kitchen"
  | "meeting_room"
  | "studio"
  | "other";

export type LetterType =
  | "community"
  | "commercial"
  | "charity"
  | "staff"
  | "internal";

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  locationId?: string; // links to estates_locations
  capacity: number;
  hourlyRate: number; // standard rate in GBP
  communityRate?: number; // reduced for community groups
  charityRate?: number; // reduced for charities
  amenities: string[]; // e.g., "projector", "kitchen access", "parking", "wifi"
  availableSlots: string[]; // e.g., "weekday_evening", "weekend_day", "holiday"
  blockBookingDiscount?: number; // percentage
  organizationId: string;
}

export interface HirerDetails {
  name: string;
  email: string;
  phone: string;
  organization?: string;
  type: LetterType;
}

export interface RecurringConfig {
  frequency: "weekly" | "fortnightly" | "monthly";
  endDate: string;
}

export interface Booking {
  id: string;
  facilityId: string;
  organizationId: string;
  hirer: HirerDetails;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  recurring?: RecurringConfig;
  status: BookingStatus;
  totalCharge: number;
  depositPaid: boolean;
  invoiceSent: boolean;
  safeguardingChecked: boolean; // DBS if working with children
  insuranceCertProvided: boolean;
  riskAssessmentProvided: boolean;
  notes?: string;
  createdAt: string;
}

export interface InvoiceLine {
  description: string;
  amount: number;
}

export interface Invoice {
  lines: InvoiceLine[];
  subtotal: number;
  vat: number;
  grandTotal: number;
}

export interface IncomeReport {
  total: number;
  byFacility: Record<string, number>;
  byMonth: Record<string, number>;
  projectedAnnual: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Parse HH:mm time strings and return the duration in hours.
 */
function calculateHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const diff = endMinutes - startMinutes;
  return diff > 0 ? diff / 60 : 0;
}

/**
 * Get the applicable hourly rate based on hirer type.
 */
function getApplicableRate(facility: Facility, hirerType: LetterType): number {
  switch (hirerType) {
    case "community":
      return facility.communityRate ?? facility.hourlyRate;
    case "charity":
      return facility.charityRate ?? facility.hourlyRate;
    case "staff":
    case "internal":
      return 0; // internal use is free
    case "commercial":
    default:
      return facility.hourlyRate;
  }
}

/**
 * Count the number of occurrences for a recurring booking.
 */
function countRecurringOccurrences(booking: Booking): number {
  if (!booking.recurring) return 1;

  const start = new Date(booking.date);
  const end = new Date(booking.recurring.endDate);
  if (end <= start) return 1;

  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  switch (booking.recurring.frequency) {
    case "weekly":
      return Math.floor(diffDays / 7) + 1;
    case "fortnightly":
      return Math.floor(diffDays / 14) + 1;
    case "monthly":
      return (
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1
      );
    default:
      return 1;
  }
}

// ─── Core Functions ──────────────────────────────────────────────────

/**
 * Calculate the total charge for a booking.
 *
 * Applies hirer-type rate, hours, recurring occurrences, and block
 * booking discount.
 */
export function calculateCharge(facility: Facility, booking: Booking): number {
  const hours = calculateHours(booking.startTime, booking.endTime);
  const rate = getApplicableRate(facility, booking.hirer.type);
  const occurrences = countRecurringOccurrences(booking);
  let total = rate * hours * occurrences;

  // Apply block booking discount for recurring bookings with 4+ sessions
  if (
    booking.recurring &&
    occurrences >= 4 &&
    facility.blockBookingDiscount &&
    facility.blockBookingDiscount > 0
  ) {
    total = total * (1 - facility.blockBookingDiscount / 100);
  }

  return Math.round(total * 100) / 100;
}

/**
 * Check whether a facility is available for a given time slot.
 *
 * Returns true if no confirmed/provisional bookings overlap.
 */
export function checkAvailability(
  facilityId: string,
  date: string,
  startTime: string,
  endTime: string,
  existingBookings: Booking[],
): boolean {
  const activeStatuses: BookingStatus[] = [
    "provisional",
    "confirmed",
    "completed",
  ];

  const [reqStart, reqEnd] = [startTime, endTime].map((t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  });

  return !existingBookings.some((b) => {
    if (b.facilityId !== facilityId) return false;
    if (b.date !== date) return false;
    if (!activeStatuses.includes(b.status)) return false;

    const [bStart, bEnd] = [b.startTime, b.endTime].map((t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    });

    // Overlap check: two intervals overlap unless one ends before the other starts
    return reqStart < bEnd && reqEnd > bStart;
  });
}

/**
 * Generate an invoice for a booking.
 *
 * VAT at 20% is applied for commercial lettings. Charity and community
 * lettings are typically VAT-exempt (simplified here).
 */
export function generateInvoice(booking: Booking, facility: Facility): Invoice {
  const hours = calculateHours(booking.startTime, booking.endTime);
  const rate = getApplicableRate(facility, booking.hirer.type);
  const occurrences = countRecurringOccurrences(booking);

  const lines: InvoiceLine[] = [];

  if (occurrences > 1) {
    lines.push({
      description: `${facility.name} hire - ${hours}hrs x ${occurrences} sessions @ £${rate.toFixed(2)}/hr`,
      amount: rate * hours * occurrences,
    });
  } else {
    lines.push({
      description: `${facility.name} hire - ${hours}hrs @ £${rate.toFixed(2)}/hr`,
      amount: rate * hours,
    });
  }

  // Block booking discount
  if (
    booking.recurring &&
    occurrences >= 4 &&
    facility.blockBookingDiscount &&
    facility.blockBookingDiscount > 0
  ) {
    const discountAmount =
      rate * hours * occurrences * (facility.blockBookingDiscount / 100);
    lines.push({
      description: `Block booking discount (${facility.blockBookingDiscount}%)`,
      amount: -Math.round(discountAmount * 100) / 100,
    });
  }

  const subtotal =
    Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100;

  // VAT only for commercial lettings
  const vatRate = booking.hirer.type === "commercial" ? 0.2 : 0;
  const vat = Math.round(subtotal * vatRate * 100) / 100;
  const grandTotal = Math.round((subtotal + vat) * 100) / 100;

  return { lines, subtotal, vat, grandTotal };
}

/**
 * Calculate lettings income across bookings for a given period.
 */
export function calculateLettingsIncome(
  bookings: Booking[],
  periodStart: string,
  periodEnd: string,
): IncomeReport {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const inPeriod = bookings.filter((b) => {
    const d = new Date(b.date);
    return (
      d >= start &&
      d <= end &&
      (b.status === "confirmed" || b.status === "completed")
    );
  });

  const total = inPeriod.reduce((s, b) => s + b.totalCharge, 0);

  const byFacility: Record<string, number> = {};
  for (const b of inPeriod) {
    byFacility[b.facilityId] = (byFacility[b.facilityId] || 0) + b.totalCharge;
  }

  const byMonth: Record<string, number> = {};
  for (const b of inPeriod) {
    const month = b.date.slice(0, 7); // YYYY-MM
    byMonth[month] = (byMonth[month] || 0) + b.totalCharge;
  }

  // Project annual income from the period's data
  const periodDays = Math.max(
    1,
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const projectedAnnual = Math.round((total / periodDays) * 365 * 100) / 100;

  return { total, byFacility, byMonth, projectedAnnual };
}

/**
 * Calculate utilisation percentage for a facility.
 *
 * Based on the number of booked hours vs total available hours in the
 * period. Available hours are estimated from the facility's available
 * slots configuration.
 */
export function getLettingsUtilisation(
  facility: Facility,
  bookings: Booking[],
  periodStart: string,
  periodEnd: string,
): number {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  // Estimate available hours per week from slot types
  const hoursPerSlot: Record<string, number> = {
    weekday_evening: 3, // 6pm-9pm, 5 days
    weekend_day: 8, // 9am-5pm, 2 days
    weekend_evening: 3, // 6pm-9pm, 2 days
    holiday: 8, // full days during holidays
  };

  let weeklyAvailable = 0;
  for (const slot of facility.availableSlots) {
    if (slot === "weekday_evening") weeklyAvailable += 3 * 5;
    else if (slot === "weekend_day") weeklyAvailable += 8 * 2;
    else if (slot === "weekend_evening") weeklyAvailable += 3 * 2;
    else weeklyAvailable += hoursPerSlot[slot] || 3;
  }

  if (weeklyAvailable === 0) return 0;

  const periodWeeks = Math.max(
    1,
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7),
  );
  const totalAvailable = weeklyAvailable * periodWeeks;

  // Sum booked hours
  const activeStatuses: BookingStatus[] = [
    "provisional",
    "confirmed",
    "completed",
  ];
  const bookedHours = bookings
    .filter(
      (b) =>
        b.facilityId === facility.id &&
        activeStatuses.includes(b.status) &&
        new Date(b.date) >= start &&
        new Date(b.date) <= end,
    )
    .reduce((s, b) => s + calculateHours(b.startTime, b.endTime), 0);

  const utilisation = Math.min(100, (bookedHours / totalAvailable) * 100);
  return Math.round(utilisation * 10) / 10;
}
