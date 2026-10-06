export type ProviderCapability =
  | "text"
  | "image"
  | "video"
  | "embedding"
  | "speech"
  | "search";

export interface ModelDescriptor {
  id: string;
  provider: string;
  capabilities: ProviderCapability[];
  strengths: string[];
  envKey?: string;
}

export const modelRegistry: ModelDescriptor[] = [
  { id: "gpt-4o-mini", provider: "openai", capabilities: ["text"], strengths: ["fast generation", "structured output"], envKey: "OPENAI_API_KEY" },
  { id: "gpt-4o", provider: "openai", capabilities: ["text"], strengths: ["reasoning", "multimodal deck planning"], envKey: "OPENAI_API_KEY" },
  { id: "claude", provider: "anthropic", capabilities: ["text"], strengths: ["long-context synthesis", "editorial review"], envKey: "ANTHROPIC_API_KEY" },
  { id: "gemini", provider: "google", capabilities: ["text"], strengths: ["multimodal analysis", "document synthesis"], envKey: "GOOGLE_GENERATIVE_AI_API_KEY" },
  { id: "together-image", provider: "together", capabilities: ["image"], strengths: ["illustration generation"], envKey: "TOGETHER_AI_API_KEY" },
  { id: "replicate-media", provider: "replicate", capabilities: ["image", "video"], strengths: ["open-model media generation"], envKey: "REPLICATE_API_TOKEN" },
  { id: "elevenlabs", provider: "elevenlabs", capabilities: ["speech"], strengths: ["narration"], envKey: "ELEVENLABS_API_KEY" },
  { id: "tavily", provider: "tavily", capabilities: ["search"], strengths: ["research retrieval"], envKey: "TAVILY_API_KEY" },
];

export function getModelsFor(capability: ProviderCapability) {
  return modelRegistry.filter((model) => model.capabilities.includes(capability));
}

export function isProviderConfigured(model: ModelDescriptor) {
  return !model.envKey || Boolean(process.env[model.envKey]);
}
