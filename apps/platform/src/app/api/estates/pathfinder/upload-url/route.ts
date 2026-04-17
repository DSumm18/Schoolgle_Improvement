import { randomUUID } from "node:crypto";

import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const BUCKET = "pathfinder-sources";

const ALLOWED_KINDS = new Set(["source", "page"]);
const ALLOWED_EXTS = new Set(["pdf", "png", "jpg", "jpeg", "webp"]);

function sanitiseExtension(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const ext = raw.toLowerCase().replace(/^\./, "").replace(/[^a-z0-9]/g, "");
  return ALLOWED_EXTS.has(ext) ? ext : "";
}

function buildPath(organizationId: string, modelId: string, kind: string, ext: string): string {
  const prefix = kind === "source" ? "source" : `page-${randomUUID().slice(0, 8)}`;
  return `${organizationId}/${modelId}/${prefix}.${ext}`;
}

export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json().catch(() => ({}));
    const kind = typeof body?.kind === "string" ? body.kind : "source";
    if (!ALLOWED_KINDS.has(kind)) {
      return apiError("kind must be 'source' or 'page'", 400);
    }

    const ext = sanitiseExtension(body?.ext);
    if (!ext) {
      return apiError("ext must be one of pdf, png, jpg, jpeg, webp", 400);
    }

    const modelIdRaw = typeof body?.modelId === "string" ? body.modelId.trim() : "";
    const modelId = modelIdRaw || `draft-${randomUUID()}`;

    const path = buildPath(auth.organizationId, modelId, kind, ext);

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("Pathfinder upload-url error:", error);
      return apiError("Failed to issue signed upload URL", 500);
    }

    return apiSuccess({
      bucket: BUCKET,
      path,
      modelId,
      token: data.token,
      signedUrl: data.signedUrl,
    });
  },
  { requiredRole: "caretaker" },
);
