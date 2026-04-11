import { createServiceRoleClient } from '@/lib/supabase-server';
import { fetchAttendanceStoryData, summariseAvailableConnectors } from './fetcher';
import { generateAttendanceNarrative } from './story-generator';
import type { AttendanceStoryInput, AttendanceStoryOutput } from './types';

/**
 * Generate an attendance story end-to-end:
 *   1. Fetch real data from Supabase (attendance, census, contextual factors, school profile)
 *   2. Build a prompt from those real values
 *   3. Call the LLM via Guardian
 *   4. Persist the result to intelligence_reports
 *
 * Nothing is hardcoded. The system does the work, not me.
 */
export async function generateAttendanceStory(
  input: AttendanceStoryInput,
): Promise<AttendanceStoryOutput> {
  const data = await fetchAttendanceStoryData(input.urn);

  if (data.attendanceRows.length === 0) {
    throw new Error(
      `No attendance data found for URN ${input.urn} — cannot generate story. Either the school is not in the DfE Attendance connector, or the URN is wrong.`,
    );
  }

  const { available, missing } = summariseAvailableConnectors(data);

  const generation = await generateAttendanceNarrative(data, input.organizationId);

  const supabase = createServiceRoleClient();
  const { data: doc, error } = await supabase
    .from('intelligence_reports')
    .insert({
      organization_id: input.organizationId,
      urn: input.urn,
      template_id: 'attendance-story',
      title: `Attendance Story — ${data.school.name}`,
      connector_sources: available,
      narrative: generation.narrative,
      pdf_url: null,
      llm_model: generation.model,
      llm_tokens_used: generation.tokensUsed,
      generated_by: input.userId,
    })
    .select()
    .single();

  if (error || !doc) {
    throw new Error(`Failed to persist intelligence report: ${error?.message ?? 'no data'}`);
  }

  return {
    documentId: doc.id,
    title: doc.title,
    narrative: generation.narrative,
    sourceConnectors: available,
    missingConnectors: missing,
    llmModel: generation.model,
    llmTokensUsed: generation.tokensUsed,
    guardianCategoriesDetected: generation.guardianCategoriesDetected,
  };
}

export * from './types';
export { fetchAttendanceStoryData, summariseAvailableConnectors } from './fetcher';
export { buildAttendancePrompt } from './prompt-builder';
export { generateAttendanceNarrative } from './story-generator';
