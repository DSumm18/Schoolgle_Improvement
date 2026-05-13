export type ProductGuideStep = {
  id: string;
  title: string;
  caption: string;
  detail: string;
  actionLabel?: string;
  visualLabel: string;
  highlight: "setup" | "survey" | "review" | "generate" | "seating" | "export";
};

export type ProductGuideScene = {
  id: string;
  title: string;
  durationSeconds: number;
  voiceover: string;
  caption: string;
  visual: string;
};

export type ProductHowToGuide = {
  appName: string;
  audience: string;
  route: string;
  durationSeconds: number;
  outcome: string;
  beforeYouStart: string[];
  steps: ProductGuideStep[];
  goodLooksLike: string[];
  commonIssues: Array<{
    issue: string;
    fix: string;
  }>;
  scenes: ProductGuideScene[];
};
