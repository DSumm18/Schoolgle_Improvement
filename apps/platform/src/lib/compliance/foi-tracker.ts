export interface FoiRequestApiRow {
  id: string;
  reference?: string | null;
  requester_name: string;
  requester_email?: string | null;
  subject?: string | null;
  description?: string | null;
  information_requested?: string | null;
  date_received: string;
  deadline?: string | null;
  deadline_date?: string | null;
  status?: "received" | "in_progress" | "responded" | "refused" | null;
  response_date?: string | null;
  refusal_reason?: string | null;
  notes?: string | null;
}

export interface FoiRequestViewModel {
  id: string;
  reference: string;
  requester_name: string;
  requester_email?: string;
  subject: string;
  description: string;
  date_received: string;
  deadline: string;
  status: "received" | "in_progress" | "responded" | "refused";
  response_date?: string;
  refusal_reason?: string;
  notes?: string;
}

export function normalizeFoiRequest(
  request: FoiRequestApiRow,
): FoiRequestViewModel {
  const description =
    request.description || request.information_requested || "FOI request";
  return {
    id: request.id,
    reference: request.reference || request.id.slice(0, 8).toUpperCase(),
    requester_name: request.requester_name,
    requester_email: request.requester_email || undefined,
    subject: request.subject || description,
    description,
    date_received: request.date_received,
    deadline: request.deadline || request.deadline_date || request.date_received,
    status: request.status || "received",
    response_date: request.response_date || undefined,
    refusal_reason: request.refusal_reason || undefined,
    notes: request.notes || undefined,
  };
}
