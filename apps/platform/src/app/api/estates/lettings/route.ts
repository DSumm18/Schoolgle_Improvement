/**
 * Lettings & Room Booking API
 *
 * GET  /api/estates/lettings - List facilities and bookings (demo data)
 * POST /api/estates/lettings - Create a new booking
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  type Facility,
  type Booking,
  type BookingStatus,
  type LetterType,
  calculateCharge,
  checkAvailability,
  calculateLettingsIncome,
  getLettingsUtilisation,
} from "@/lib/lettings-engine";

// ─── Demo Data ───────────────────────────────────────────────────────

const DEMO_ORG = "demo-org-001";

const DEMO_FACILITIES: Facility[] = [
  {
    id: "fac-001",
    name: "Main Hall",
    type: "hall",
    capacity: 200,
    hourlyRate: 30,
    communityRate: 20,
    charityRate: 15,
    amenities: [
      "projector",
      "sound system",
      "kitchen access",
      "parking",
      "wifi",
    ],
    availableSlots: ["weekday_evening", "weekend_day"],
    blockBookingDiscount: 10,
    organizationId: DEMO_ORG,
  },
  {
    id: "fac-002",
    name: "Sports Hall",
    type: "sports_hall",
    capacity: 100,
    hourlyRate: 40,
    communityRate: 25,
    charityRate: 20,
    amenities: ["changing rooms", "showers", "equipment storage", "parking"],
    availableSlots: ["weekday_evening", "weekend_day", "weekend_evening"],
    blockBookingDiscount: 15,
    organizationId: DEMO_ORG,
  },
  {
    id: "fac-003",
    name: "Classroom 1A",
    type: "classroom",
    capacity: 30,
    hourlyRate: 15,
    communityRate: 10,
    charityRate: 8,
    amenities: ["projector", "whiteboard", "wifi"],
    availableSlots: ["weekday_evening", "weekend_day"],
    blockBookingDiscount: 10,
    organizationId: DEMO_ORG,
  },
];

const DEMO_BOOKINGS: Booking[] = [
  {
    id: "bk-001",
    facilityId: "fac-001",
    organizationId: DEMO_ORG,
    hirer: {
      name: "Sarah Mitchell",
      email: "sarah@yogaflow.co.uk",
      phone: "07700 900100",
      organization: "YogaFlow Community",
      type: "community",
    },
    date: "2026-03-12",
    startTime: "18:00",
    endTime: "20:00",
    recurring: { frequency: "weekly", endDate: "2026-06-30" },
    status: "confirmed",
    totalCharge: 576,
    depositPaid: true,
    invoiceSent: true,
    safeguardingChecked: true,
    insuranceCertProvided: true,
    riskAssessmentProvided: true,
    notes: "Yoga mats stored in cupboard 3.",
    createdAt: "2026-02-15T10:00:00Z",
  },
  {
    id: "bk-002",
    facilityId: "fac-002",
    organizationId: DEMO_ORG,
    hirer: {
      name: "Mark Johnson",
      email: "mark@localfc.org",
      phone: "07700 900200",
      organization: "Local FC Youth",
      type: "community",
    },
    date: "2026-03-14",
    startTime: "09:00",
    endTime: "12:00",
    recurring: { frequency: "weekly", endDate: "2026-07-20" },
    status: "confirmed",
    totalCharge: 1147.5,
    depositPaid: true,
    invoiceSent: true,
    safeguardingChecked: true,
    insuranceCertProvided: true,
    riskAssessmentProvided: true,
    notes: "Saturday morning football coaching for U12s.",
    createdAt: "2026-02-20T14:30:00Z",
  },
  {
    id: "bk-003",
    facilityId: "fac-001",
    organizationId: DEMO_ORG,
    hirer: {
      name: "Priya Sharma",
      email: "priya@bdanceworks.com",
      phone: "07700 900300",
      organization: "BD Dance Works",
      type: "commercial",
    },
    date: "2026-03-15",
    startTime: "10:00",
    endTime: "14:00",
    status: "confirmed",
    totalCharge: 120,
    depositPaid: true,
    invoiceSent: true,
    safeguardingChecked: false,
    insuranceCertProvided: true,
    riskAssessmentProvided: true,
    notes: "Dance workshop - no children attending.",
    createdAt: "2026-03-01T09:00:00Z",
  },
  {
    id: "bk-004",
    facilityId: "fac-003",
    organizationId: DEMO_ORG,
    hirer: {
      name: "James Okafor",
      email: "james@scouts5th.org.uk",
      phone: "07700 900400",
      organization: "5th Bradford Scouts",
      type: "charity",
    },
    date: "2026-03-11",
    startTime: "18:30",
    endTime: "20:30",
    recurring: { frequency: "weekly", endDate: "2026-12-15" },
    status: "confirmed",
    totalCharge: 512,
    depositPaid: true,
    invoiceSent: false,
    safeguardingChecked: true,
    insuranceCertProvided: true,
    riskAssessmentProvided: true,
    notes: "Tuesday evening Scouts - DBS verified.",
    createdAt: "2026-01-10T11:00:00Z",
  },
  {
    id: "bk-005",
    facilityId: "fac-002",
    organizationId: DEMO_ORG,
    hirer: {
      name: "Lisa Chen",
      email: "lisa@fitcamp.co.uk",
      phone: "07700 900500",
      organization: "FitCamp Ltd",
      type: "commercial",
    },
    date: "2026-03-13",
    startTime: "19:00",
    endTime: "21:00",
    recurring: { frequency: "weekly", endDate: "2026-06-30" },
    status: "provisional",
    totalCharge: 1280,
    depositPaid: false,
    invoiceSent: true,
    safeguardingChecked: false,
    insuranceCertProvided: false,
    riskAssessmentProvided: false,
    notes: "Awaiting insurance certificate before confirmation.",
    createdAt: "2026-03-05T16:00:00Z",
  },
  {
    id: "bk-006",
    facilityId: "fac-001",
    organizationId: DEMO_ORG,
    hirer: {
      name: "Tom Barker",
      email: "tom@barkerphoto.com",
      phone: "07700 900600",
      organization: "Barker Photography",
      type: "commercial",
    },
    date: "2026-03-22",
    startTime: "09:00",
    endTime: "17:00",
    status: "enquiry",
    totalCharge: 240,
    depositPaid: false,
    invoiceSent: false,
    safeguardingChecked: false,
    insuranceCertProvided: false,
    riskAssessmentProvided: false,
    notes: "One-off photoshoot event. Needs full hall access.",
    createdAt: "2026-03-08T08:30:00Z",
  },
  {
    id: "bk-007",
    facilityId: "fac-003",
    organizationId: DEMO_ORG,
    hirer: {
      name: "Helen Wright",
      email: "helen@artclub.org",
      phone: "07700 900700",
      organization: "Community Art Club",
      type: "community",
    },
    date: "2026-03-13",
    startTime: "18:00",
    endTime: "20:00",
    recurring: { frequency: "fortnightly", endDate: "2026-06-30" },
    status: "confirmed",
    totalCharge: 160,
    depositPaid: true,
    invoiceSent: true,
    safeguardingChecked: true,
    insuranceCertProvided: true,
    riskAssessmentProvided: true,
    createdAt: "2026-02-28T12:00:00Z",
  },
  {
    id: "bk-008",
    facilityId: "fac-001",
    organizationId: DEMO_ORG,
    hirer: {
      name: "David Patel",
      email: "david@patelconsulting.co.uk",
      phone: "07700 900800",
      organization: "Patel Consulting",
      type: "commercial",
    },
    date: "2026-03-20",
    startTime: "09:00",
    endTime: "13:00",
    status: "cancelled",
    totalCharge: 120,
    depositPaid: false,
    invoiceSent: false,
    safeguardingChecked: false,
    insuranceCertProvided: false,
    riskAssessmentProvided: false,
    notes: "Cancelled - venue too small for conference.",
    createdAt: "2026-03-02T15:00:00Z",
  },
];

// ─── Handlers ────────────────────────────────────────────────────────

export const GET = protectedRoute(async () => {
  const periodStart = "2026-03-01";
  const periodEnd = "2026-03-31";

  const income = calculateLettingsIncome(DEMO_BOOKINGS, periodStart, periodEnd);

  const facilitiesWithUtilisation = DEMO_FACILITIES.map((f) => ({
    ...f,
    utilisation: getLettingsUtilisation(
      f,
      DEMO_BOOKINGS,
      periodStart,
      periodEnd,
    ),
  }));

  return apiSuccess({
    facilities: facilitiesWithUtilisation,
    bookings: DEMO_BOOKINGS,
    income,
    period: { start: periodStart, end: periodEnd },
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();

  const {
    facilityId,
    hirerName,
    hirerEmail,
    hirerPhone,
    hirerOrganization,
    hirerType,
    date,
    startTime,
    endTime,
    recurring,
    notes,
  } = body;

  // Validate required fields
  if (
    !facilityId ||
    !hirerName ||
    !hirerEmail ||
    !date ||
    !startTime ||
    !endTime
  ) {
    return apiError("Missing required fields", 400);
  }

  const facility = DEMO_FACILITIES.find((f) => f.id === facilityId);
  if (!facility) {
    return apiError("Facility not found", 404);
  }

  // Check availability
  const available = checkAvailability(
    facilityId,
    date,
    startTime,
    endTime,
    DEMO_BOOKINGS,
  );

  if (!available) {
    return apiError("Time slot is not available", 409);
  }

  const newBooking: Booking = {
    id: `bk-${Date.now()}`,
    facilityId,
    organizationId: auth.organizationId || DEMO_ORG,
    hirer: {
      name: hirerName,
      email: hirerEmail,
      phone: hirerPhone || "",
      organization: hirerOrganization,
      type: (hirerType as LetterType) || "commercial",
    },
    date,
    startTime,
    endTime,
    recurring: recurring || undefined,
    status: "enquiry",
    totalCharge: 0,
    depositPaid: false,
    invoiceSent: false,
    safeguardingChecked: false,
    insuranceCertProvided: false,
    riskAssessmentProvided: false,
    notes,
    createdAt: new Date().toISOString(),
  };

  // Calculate charge
  newBooking.totalCharge = calculateCharge(facility, newBooking);

  return apiSuccess({ booking: newBooking }, 201);
});
