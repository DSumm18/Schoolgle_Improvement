const DEFAULT_KEYWORDS = [
  "abuse",
  "abused",
  "hurt",
  "hurting",
  "scared",
  "self-harm",
  "self harm",
  "suicide",
  "suicidal",
  "kill",
  "die",
  "dying",
  "beaten",
  "hitting",
  "molest",
  "rape",
  "raped",
  "touched",
  "inappropriate",
  "neglect",
  "neglected",
  "starving",
  "hungry",
  "bruise",
  "bruises",
  "cigarette burns",
  "knife",
  "weapon",
  "drugs",
  "alcohol",
  "drunk",
  "trafficking",
  "exploitation",
  "grooming",
  "radicalisation",
  "extremism",
  "fgm",
  "forced marriage",
  "honour based",
  "county lines",
  "gang",
  "sexting",
  "nude",
  "naked",
  "pornography",
  "bully",
  "bullied",
  "bullying",
  "threatened",
  "unsafe",
  "danger",
  "frightened",
  "terrified",
  "cry",
  "crying",
  "depressed",
  "depression",
  "anxiety",
  "panic",
  "eating disorder",
  "anorexia",
  "bulimia",
  "cutting",
  "overdose",
];

export interface SafeguardingFlag {
  questionId: string;
  questionTitle: string;
  responseText: string;
  matchedKeywords: string[];
  severity: "low" | "medium" | "high";
}

export function detectSafeguardingConcerns(
  answers: Array<{
    questionId: string;
    questionTitle: string;
    answerText: string | null;
  }>,
  customKeywords?: string[],
): SafeguardingFlag[] {
  const keywords = customKeywords || DEFAULT_KEYWORDS;
  const flags: SafeguardingFlag[] = [];

  const highSeverity = new Set([
    "abuse",
    "abused",
    "rape",
    "raped",
    "molest",
    "suicide",
    "suicidal",
    "self-harm",
    "self harm",
    "kill",
    "fgm",
    "forced marriage",
    "trafficking",
    "exploitation",
    "grooming",
    "county lines",
    "overdose",
    "knife",
    "weapon",
  ]);

  const mediumSeverity = new Set([
    "hurt",
    "hurting",
    "beaten",
    "hitting",
    "neglect",
    "neglected",
    "bruise",
    "bruises",
    "drugs",
    "cutting",
    "radicalisation",
    "extremism",
    "sexting",
    "pornography",
    "gang",
    "unsafe",
    "danger",
  ]);

  for (const answer of answers) {
    if (!answer.answerText) continue;

    const text = answer.answerText.toLowerCase();
    const matched: string[] = [];

    for (const keyword of keywords) {
      const regex = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i",
      );
      if (regex.test(text)) {
        matched.push(keyword);
      }
    }

    if (matched.length > 0) {
      let severity: "low" | "medium" | "high" = "low";
      if (matched.some((k) => highSeverity.has(k))) {
        severity = "high";
      } else if (matched.some((k) => mediumSeverity.has(k))) {
        severity = "medium";
      }

      flags.push({
        questionId: answer.questionId,
        questionTitle: answer.questionTitle,
        responseText: answer.answerText,
        matchedKeywords: matched,
        severity,
      });
    }
  }

  return flags.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}
