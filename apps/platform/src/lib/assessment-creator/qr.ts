export interface PaperQrPayload {
  version: 1;
  assessmentId: string;
  pupilHash: string;
  pageNumber: number;
}

const PREFIX = "schoolgle-assessment:";

export function createPaperQrPayload(input: Omit<PaperQrPayload, "version">): string {
  return `${PREFIX}${encodeURIComponent(JSON.stringify({ version: 1, ...input }))}`;
}

export function parsePaperQrPayload(value: string): PaperQrPayload | null {
  if (!value.startsWith(PREFIX)) return null;

  try {
    const decoded = JSON.parse(decodeURIComponent(value.slice(PREFIX.length))) as PaperQrPayload;
    if (decoded.version !== 1 || !decoded.assessmentId || !decoded.pupilHash || !decoded.pageNumber) return null;
    return decoded;
  } catch {
    return null;
  }
}
