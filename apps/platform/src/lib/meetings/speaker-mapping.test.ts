import { describe, expect, it } from "vitest";

import {
  applySpeakerMap,
  composeTranscriptFullText,
  extractSpeakerLabels,
  parseDeepgramUtterances,
} from "./speaker-mapping";

describe("meeting speaker mapping", () => {
  const chunks = [
    { timestamp: "00:01", speaker: "Speaker 1", text: "Morning all." },
    { timestamp: "00:03", speaker: "Speaker 0", text: "Thanks for joining." },
    { timestamp: "00:05", speaker: "Speaker 1", text: "Let's start." },
  ];

  it("extracts unique speaker labels in numeric order", () => {
    expect(extractSpeakerLabels(chunks)).toEqual(["Speaker 0", "Speaker 1"]);
  });

  it("applies named speakers without changing unmapped speakers", () => {
    expect(applySpeakerMap(chunks, { "Speaker 1": "Sam Taylor" })).toEqual([
      { timestamp: "00:01", speaker: "Sam Taylor", text: "Morning all." },
      { timestamp: "00:03", speaker: "Speaker 0", text: "Thanks for joining." },
      { timestamp: "00:05", speaker: "Sam Taylor", text: "Let's start." },
    ]);
  });

  it("composes transcript text with optional user context", () => {
    expect(
      composeTranscriptFullText(chunks, {
        purpose: "Budget review",
        recordingContext: "Uploaded from Teams.",
        attendeeNotes: "Speaker 0 is the business manager.",
      }),
    ).toContain("RECORDING CONTEXT:\nPurpose: Budget review");
  });

  it("parses Deepgram utterances into timestamped chunks", () => {
    const result = {
      results: {
        utterances: [
          { start: 62.7, speaker: 0, transcript: "First point." },
          { start: 65.1, speaker: 1, transcript: "Second point." },
        ],
      },
    };

    expect(parseDeepgramUtterances(result)).toEqual([
      { timestamp: "01:02", speaker: "Speaker 0", text: "First point." },
      { timestamp: "01:05", speaker: "Speaker 1", text: "Second point." },
    ]);
  });
});
