export interface DirectorBrief {
  topic: string;
  objective?: string;
  audience?: string;
  durationMinutes?: number;
  slideCount?: number;
  tone?: string;
  evidenceLevel?: "light" | "standard" | "research";
  brandConstraints?: string[];
}

export interface PlannedSlide {
  index: number;
  purpose: string;
  title: string;
  message: string;
  visualStrategy:
    | "hero"
    | "diagram"
    | "chart"
    | "timeline"
    | "comparison"
    | "map"
    | "quote"
    | "data"
    | "minimal";
  evidenceNeeded: boolean;
  speakerGoal: string;
}

export interface PresentationPlan {
  thesis: string;
  audienceTakeaway: string;
  narrativeArc: string[];
  slides: PlannedSlide[];
  qualityChecks: string[];
}

export function createDeterministicPresentationPlan(
  brief: DirectorBrief,
): PresentationPlan {
  const count = Math.max(3, Math.min(30, brief.slideCount ?? 8));
  const topic = brief.topic.trim();
  const arc = [
    "establish context and stakes",
    "explain the central insight",
    "support the argument with evidence",
    "translate evidence into implications",
    "close with a memorable action or conclusion",
  ];

  const slides: PlannedSlide[] = Array.from({ length: count }, (_, i) => {
    const first = i === 0;
    const last = i === count - 1;
    const middle = !first && !last;

    return {
      index: i + 1,
      purpose: first ? "opening" : last ? "close" : "development",
      title: first
        ? topic
        : last
          ? "Key takeaway and next step"
          : `${topic}: insight ${i}`,
      message: first
        ? `Frame why ${topic} matters to ${brief.audience ?? "the audience"}.`
        : last
          ? `Synthesize the strongest evidence and connect it to ${brief.objective ?? "the desired outcome"}.`
          : `Advance one distinct claim about ${topic} without repeating adjacent slides.`,
      visualStrategy: first
        ? "hero"
        : last
          ? "minimal"
          : i % 3 === 0
            ? "chart"
            : i % 2 === 0
              ? "diagram"
              : "data",
      evidenceNeeded:
        middle && (brief.evidenceLevel ?? "standard") !== "light",
      speakerGoal: first
        ? "earn attention"
        : last
          ? "create retention and action"
          : "make one claim understandable and credible",
    };
  });

  return {
    thesis: `${topic} should be presented as a coherent argument rather than a collection of generated slides.`,
    audienceTakeaway:
      brief.objective ??
      `Understand the most important implications of ${topic}.`,
    narrativeArc: arc,
    slides,
    qualityChecks: [
      "one dominant idea per slide",
      "no unsupported quantitative claims",
      "visual choice matches information type",
      "titles communicate conclusions, not labels",
      "citations remain traceable to sources",
      "brand and accessibility constraints are respected",
    ],
  };
}
