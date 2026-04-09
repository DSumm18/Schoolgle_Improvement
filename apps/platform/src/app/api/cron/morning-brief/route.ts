/**
 * GET /api/cron/morning-brief
 *
 * Vercel cron: runs daily at 06:30 UTC weekdays
 * vercel.json: { "crons": [{ "path": "/api/cron/morning-brief", "schedule": "30 6 * * 1-5" }] }
 *
 * Generates morning briefs for all active organisations, stores them,
 * and delivers via configured channels (in_app, email, TTS).
 *
 * Includes term-time awareness: skips weekends, bank holidays, and school holidays.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assembleBrief } from "@/lib/morning-brief/assembler";
import { generateScript } from "@/lib/morning-brief/script-generator";
import { briefToScript, generateBriefAudio } from "@/lib/morning-brief/tts";
import { sendBriefingEmail } from "@/lib/morning-brief/send-briefing";
import { isSchoolDay, type SchoolHolidayPeriod } from "@/lib/morning-brief/term-time";

// ─── Helpers ────────────────────────────────────────────────────────

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface OrgResult {
  organizationId: string;
  organizationName: string;
  briefId: string | null;
  deliveries: number;
  skipped: boolean;
  skipReason?: string;
  error: string | null;
}

// ─── Per-org processing ─────────────────────────────────────────────

async function processOrganization(org: {
  id: string;
  name: string;
}): Promise<OrgResult> {
  const result: OrgResult = {
    organizationId: org.id,
    organizationName: org.name,
    briefId: null,
    deliveries: 0,
    skipped: false,
    error: null,
  };

  try {
    const supabase = getServiceSupabase();

    // Check term-time for this org
    const { data: settings } = await supabase
      .from("organization_settings")
      .select("value")
      .eq("organization_id", org.id)
      .eq("key", "school_holidays")
      .single();

    const schoolHolidays: SchoolHolidayPeriod[] = settings?.value ?? [];
    const today = new Date();

    if (!(await isSchoolDay(today, schoolHolidays))) {
      result.skipped = true;
      result.skipReason = "Not a school day";
      return result;
    }

    // 1. Assemble brief
    const briefData = await assembleBrief(org.id);

    // 2. Generate AI script
    const dateStr = today.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Get head teacher name from org settings
    const { data: headSetting } = await supabase
      .from("organization_settings")
      .select("value")
      .eq("organization_id", org.id)
      .eq("key", "head_teacher_name")
      .single();

    const headName = headSetting?.value ?? "Head Teacher";

    const script = await generateScript(
      org.name,
      headName,
      dateStr,
      briefData.sections,
    );

    // 3. Store brief
    const { data: stored, error: insertError } = await supabase
      .from("morning_briefs")
      .insert({
        organization_id: org.id,
        generated_at: briefData.generatedAt,
        headline: briefData.headline,
        sections: briefData.sections,
        script_text: script,
      })
      .select("id")
      .single();

    if (insertError || !stored) {
      result.error = `Insert failed: ${insertError?.message}`;
      return result;
    }

    result.briefId = stored.id;

    // 4. Store section rows for trending
    const sectionRows = Object.entries(briefData.sections).map(
      ([key, section]) => ({
        brief_id: stored.id,
        organization_id: org.id,
        section_key: key,
        rag: section.rag,
        item_count: section.count,
        items: section.items,
      }),
    );
    await supabase.from("morning_brief_sections").insert(sectionRows);

    // 5. Find recipients
    const { data: prefs } = await supabase
      .from("morning_brief_preferences")
      .select("user_id, channels, include_audio")
      .eq("organization_id", org.id)
      .eq("enabled", true);

    const recipients = prefs && prefs.length > 0
      ? prefs
      : await getDefaultRecipients(supabase, org.id);

    // 6. Deliver to each user
    for (const recipient of recipients) {
      const channels: string[] = recipient.channels ?? ["in_app"];

      for (const channel of channels) {
        // Record delivery
        await supabase.from("morning_brief_deliveries").insert({
          brief_id: stored.id,
          organization_id: org.id,
          user_id: recipient.user_id,
          channel,
        });
        result.deliveries++;

        // Send email if channel is email
        if (channel === "email") {
          const { data: userProfile } = await supabase
            .from("users")
            .select("email")
            .eq("id", recipient.user_id)
            .single();

          if (userProfile?.email) {
            await sendBriefingEmail({
              to: userProfile.email,
              schoolName: org.name,
              date: dateStr,
              script,
              sections: briefData.sections,
              briefId: stored.id,
            });
          }
        }
      }
    }

    // 7. Optional: generate audio if any recipient wants it
    const wantsAudio = (prefs ?? []).some(
      (p: any) => p.include_audio === true,
    );
    if (wantsAudio) {
      const audioBuffer = await generateBriefAudio(script);
      if (audioBuffer) {
        const fileName = `morning-brief/${org.id}/${stored.id}.mp3`;
        await supabase.storage
          .from("morning-briefs")
          .upload(fileName, audioBuffer, {
            contentType: "audio/mpeg",
            upsert: true,
          });

        const { data: urlData } = supabase.storage
          .from("morning-briefs")
          .getPublicUrl(fileName);

        await supabase
          .from("morning_briefs")
          .update({ audio_url: urlData?.publicUrl })
          .eq("id", stored.id);

        await supabase.from("morning_brief_audio").insert({
          brief_id: stored.id,
          organization_id: org.id,
          storage_path: fileName,
          file_size_bytes: audioBuffer.byteLength,
        });
      }
    }
  } catch (err: any) {
    result.error = err.message ?? String(err);
  }

  return result;
}

async function getDefaultRecipients(
  supabase: ReturnType<typeof getServiceSupabase>,
  orgId: string,
): Promise<Array<{ user_id: string; channels: string[]; include_audio?: boolean }>> {
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", orgId)
    .in("role", ["admin", "headteacher", "slt"]);

  return (members ?? []).map((m: any) => ({
    user_id: m.user_id,
    channels: ["in_app"],
  }));
}

// ─── GET handler ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const supabase = getServiceSupabase();

    // Get all active organisations
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("is_active", true);

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active organizations",
        duration_ms: Date.now() - startTime,
      });
    }

    // Process in batches of 5
    const BATCH_SIZE = 5;
    const results: OrgResult[] = [];

    for (let i = 0; i < orgs.length; i += BATCH_SIZE) {
      const batch = orgs.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((org) => processOrganization(org)),
      );
      results.push(...batchResults);
    }

    return NextResponse.json({
      success: true,
      organizations_processed: results.length,
      organizations_skipped: results.filter((r) => r.skipped).length,
      total_deliveries: results.reduce((s, r) => s + r.deliveries, 0),
      errors: results
        .filter((r) => r.error)
        .map((r) => `[${r.organizationName}] ${r.error}`),
      duration_ms: Date.now() - startTime,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Cron failed", details: err.message },
      { status: 500 },
    );
  }
}
