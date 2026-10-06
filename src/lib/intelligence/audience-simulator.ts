export type AudiencePersona =
  | "investor"
  | "executive"
  | "customer"
  | "technical-reviewer"
  | "student"
  | "lecturer"
  | "regulator"
  | "general";

export interface AudienceSimulationRequest {
  persona: AudiencePersona;
  objective: string;
  claims: string[];
}

export interface AudienceSimulation {
  likelyQuestions: string[];
  risks: string[];
  desiredProof: string[];
}

export function simulateAudience(
  request: AudienceSimulationRequest,
): AudienceSimulation {
  const proofByPersona: Record<AudiencePersona, string[]> = {
    investor: ["market evidence", "traction", "unit economics", "defensibility"],
    executive: ["business impact", "risk", "cost", "implementation path"],
    customer: ["benefits", "proof", "ease of adoption", "price/value"],
    "technical-reviewer": ["architecture", "benchmarks", "limitations", "reproducibility"],
    student: ["definitions", "examples", "visual explanations", "practice questions"],
    lecturer: ["learning outcomes", "evidence", "structure", "assessment alignment"],
    regulator: ["compliance", "audit trail", "risk controls", "source provenance"],
    general: ["context", "plain-language explanation", "examples", "takeaway"],
  };

  return {
    likelyQuestions: [
      `Why does this matter to a ${request.persona}?`,
      "What evidence supports the strongest claim?",
      "What is the main action or takeaway?",
    ],
    risks: request.claims.length > 8 ? ["too many competing claims"] : [],
    desiredProof: proofByPersona[request.persona],
  };
}
