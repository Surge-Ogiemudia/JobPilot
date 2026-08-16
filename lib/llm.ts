import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

interface LLMService {
  complete(prompt: string, system?: string): Promise<string>;
  completeJSON<T>(prompt: string, schema?: string): Promise<T>;
}

class GeminiService implements LLMService {
  private model: GenerativeModel;
  private jsonModel: GenerativeModel;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.jsonModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });
  }

  async complete(prompt: string, system?: string): Promise<string> {
    const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
    const result = await this.model.generateContent(fullPrompt);
    return result.response.text();
  }

  async completeJSON<T>(prompt: string, schema?: string): Promise<T> {
    const fullPrompt = schema
      ? `${prompt}\n\nRespond with valid JSON matching this schema:\n${schema}`
      : prompt;
    const result = await this.jsonModel.generateContent(fullPrompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
  }
}

// Singleton — swap the class here to change providers
const apiKey = process.env.GEMINI_API_KEY;

let _llm: LLMService | null = null;

export function getLLM(): LLMService {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  if (!_llm) _llm = new GeminiService(apiKey);
  return _llm;
}

export type { LLMService };
