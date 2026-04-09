/**
 * POST /api/morning-brief/generate
 *
 * Generates a morning brief for the authenticated user's organisation.
 * Optionally generates TTS audio if include_audio=true.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { assembleBrief } from "@/lib/morning-brief/assembler";
import { generateScript } from "@/lib/morning-brief/script-generator";
import { generateBriefAudio } from "@/lib/morning-brief/tts";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = auth.organizationId;
  if (!orgId) {
    return apiError("No organization context", 400);
  }

  let includeAudio = false;
  try {
    const body = await req.json();
    includeAudio = body?.include_audio === true;
  } catch {
    // No body or malformed — defaults apply
  }

  // Assemble the brief
  const briefData = await assembleBrief(orgId);

  // Generate AI script
  const supabase = createServiceRoleClient();
  const { data: orgData } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const { data: headSetting } = await supabase
    .from("organization_settings")
    .select("value")
    .eq("organization_id", orgId)
    .eq("key", "head_teacher_name")
    .single();

  const schoolName = orgData?.name ?? "Your School";
  const headName = headSetting?.value ?? "Head Teacher";
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const script = await generateScript(schoolName, headName, dateStr, briefData.sections);

  // Persist to database
  const { data: stored, error: insertError } = await supabase
    .from("morning_briefs")
    .insert({
      organization_id: orgId,
      generated_at: briefData.generatedAt,
      headline: briefData.headline,
      sections: briefData.sections,
      script_text: script,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[Morning Brief] Insert error:", insertError);
    return apiError("Failed to store brief", 500);
  }

  const briefId = stored.id;

  // Store per-section rows for trending
  const sectionRows = Object.entries(briefData.sections).map(([key, section]) => ({
    brief_id: briefId,
    organization_id: orgId,
    section_key: key,
    rag: section.rag,
    item_count: section.count,
    items: section.items,
  }));

  await supabase.from("morning_brief_sections").insert(sectionRows);

  // Record delivery
  await supabase.from("morning_brief_deliveries").insert({
    brief_id: briefId,
    organization_id: orgId,
    user_id: auth.userId,
    channel: "in_app",
  });

  // Optional: generate audio
  let audioUrl: string | null = null;
  if (includeAudio) {
    const audioBuffer = await generateBriefAudio(script);
    if (audioBuffer) {
      const fileName = `morning-brief/${orgId}/${briefId}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from("morning-briefs")
        .upload(fileName, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("morning-briefs")
          .getPublicUrl(fileName);
        audioUrl = urlData?.publicUrl ?? null;

        await supabase
          .from("morning_briefs")
          .update({ audio_url: audioUrl })
          .eq("id", briefId);

        await supabase.from("morning_brief_audio").insert({
          brief_id: briefId,
          organization_id: orgId,
          storage_path: fileName,
          file_size_bytes: audioBuffer.byteLength,
        });
      }
    }
  }

  return apiSuccess({
    id: briefId,
    headline: briefData.headline,
    sections: briefData.sections,
    script_text: script,
    audio_url: audioUrl,
    generated_at: briefData.generatedAt,
  });
});
