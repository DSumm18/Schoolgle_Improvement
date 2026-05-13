import type { ProductHowToGuide } from "./types";

export const classBuilderHowToGuide: ProductHowToGuide = {
  appName: "Class Builder",
  audience: "School staff",
  route: "/dashboard/toolbox/class-builder",
  durationSeconds: 90,
  outcome:
    "Create a Class Builder survey, collect pupil choices, generate explainable draft classes, and adjust the classroom seating plan.",
  beforeYouStart: [
    "Pupils are uploaded with current year group and class.",
    "The school has checked key fields such as SEND, EHCP, EAL, pupil premium and gender where available.",
    "Staff know whether they are surveying a whole year group or one current class.",
  ],
  steps: [
    {
      id: "choose-cohort",
      title: "Choose the cohort",
      caption: "Select a year group or current class.",
      detail:
        "Class Builder is cohort-aware. A Year 4 survey only shows Year 4 pupils; a class survey only shows pupils in that class.",
      actionLabel: "Choose year or class",
      visualLabel: "Create session panel",
      highlight: "setup",
    },
    {
      id: "create-session",
      title: "Create the survey session",
      caption: "Set the title and target number of draft classes.",
      detail:
        "The session creates a secure pupil survey link. Staff can open, copy or close the session from the dashboard.",
      actionLabel: "Click Create",
      visualLabel: "Session controls",
      highlight: "setup",
    },
    {
      id: "pupil-survey",
      title: "Pupils complete the survey",
      caption: "Pupils choose friends and people they work well with.",
      detail:
        "Pupils cannot choose themselves, cannot duplicate choices, and only see pupils from the session cohort.",
      actionLabel: "Share survey link",
      visualLabel: "Pupil survey screen",
      highlight: "survey",
    },
    {
      id: "review-completion",
      title: "Review completion",
      caption: "Check submitted and waiting pupils.",
      detail:
        "The staff dashboard shows completion status, submitted choices, and lets staff reset a response if needed.",
      actionLabel: "Check responses",
      visualLabel: "Completion table",
      highlight: "review",
    },
    {
      id: "generate-groups",
      title: "Generate draft groups",
      caption: "Create explainable draft classes.",
      detail:
        "The deterministic heuristic prioritises mutual friendships, considers work-well-with links, and checks balance across key fields.",
      actionLabel: "Generate draft groups",
      visualLabel: "Draft groups panel",
      highlight: "generate",
    },
    {
      id: "review-explanation",
      title: "Review the explanation",
      caption: "Look at kept links, isolated pupils and trade-offs.",
      detail:
        "The system suggests a starting point. Staff remain in control and should use professional judgement before agreeing final groups.",
      actionLabel: "Review trade-offs",
      visualLabel: "Explanation cards",
      highlight: "review",
    },
    {
      id: "adjust-seating",
      title: "Adjust classroom seating",
      caption: "Move tables and pupils before locking the plan.",
      detail:
        "The seating planner gives each draft class a classroom canvas. Staff can drag tables around the room and swap pupils between seats.",
      actionLabel: "Drag and lock",
      visualLabel: "Classroom canvas",
      highlight: "seating",
    },
    {
      id: "export-results",
      title: "Export results",
      caption: "Download a CSV record of the outputs.",
      detail:
        "The export helps staff keep an offline copy of choices, draft groups and review evidence.",
      actionLabel: "Export CSV",
      visualLabel: "Export button",
      highlight: "export",
    },
  ],
  goodLooksLike: [
    "All pupils in scope have a submitted or deliberately reset status.",
    "Draft classes are balanced for size and known pupil characteristics.",
    "Mutual friendship choices and trade-offs are visible to staff.",
    "The final seating plan is adjusted by the teacher and locked.",
  ],
  commonIssues: [
    {
      issue: "A pupil cannot see their name.",
      fix: "Check the pupil is in the selected year group or current class for the session.",
    },
    {
      issue: "A pupil picked the wrong name.",
      fix: "Use Reset on the staff dashboard, then ask the pupil to submit again.",
    },
    {
      issue: "The draft grouping does not feel right.",
      fix: "Use the explanation panel to see trade-offs, then adjust groups or seating using staff judgement.",
    },
    {
      issue: "The classroom does not match the room.",
      fix: "Drag tables around the canvas to match the actual classroom layout before locking the plan.",
    },
  ],
  scenes: [
    {
      id: "title",
      title: "Class Builder",
      durationSeconds: 5,
      voiceover:
        "Class Builder helps staff collect pupil preferences and create explainable draft classes for next year.",
      caption: "Collect pupil choices. Build explainable draft classes.",
      visual: "Animated Class Builder title card with pupils, survey and classroom icons.",
    },
    {
      id: "setup",
      title: "Start with the cohort",
      durationSeconds: 12,
      voiceover:
        "Choose whether this is a year group survey or a current class survey. The pupil list is automatically limited to that cohort.",
      caption: "Choose year group or class.",
      visual: "Zoom to the create session panel and highlight survey scope.",
    },
    {
      id: "survey",
      title: "Pupil survey",
      durationSeconds: 14,
      voiceover:
        "Pupils select their own name, then choose up to three friends and up to three pupils they work well with.",
      caption: "Pupils choose friends and work-well-with pupils.",
      visual: "Child-friendly survey mockup with three choice cards.",
    },
    {
      id: "review",
      title: "Monitor completion",
      durationSeconds: 12,
      voiceover:
        "Staff can see who has submitted, who is still waiting, and all the choices made by pupils.",
      caption: "Review submitted and waiting pupils.",
      visual: "Completion dashboard with submitted and waiting counters.",
    },
    {
      id: "generate",
      title: "Generate draft groups",
      durationSeconds: 16,
      voiceover:
        "The system suggests draft classes using mutual friendships, work preferences, class size and key balance information. It explains the trade-offs.",
      caption: "Generate and review the explanation.",
      visual: "Draft groups and explanation cards animate into view.",
    },
    {
      id: "seating",
      title: "Adjust seating",
      durationSeconds: 18,
      voiceover:
        "Teachers can move tables around the classroom canvas and swap pupils between seats before locking the final seating plan.",
      caption: "Move tables. Swap pupils. Lock the plan.",
      visual: "Classroom canvas with draggable tables and pupil cards.",
    },
    {
      id: "finish",
      title: "Export and use",
      durationSeconds: 8,
      voiceover:
        "Export the results and use the plan as a practical starting point for staff discussion.",
      caption: "Export results. Staff remain in control.",
      visual: "Export button and final checklist.",
    },
  ],
};
