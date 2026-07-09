import "server-only";
import { GoogleAuth } from "google-auth-library";
import { env } from "./env";

let auth: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  if (!auth) {
    // Reads the service account from GOOGLE_APPLICATION_CREDENTIALS.
    auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  }
  return auth;
}

export type GeminiTool = {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  }>;
};
export type GeminiContent = { role: "user" | "model"; parts: Array<Record<string, unknown>> };
export type GeminiFunctionCall = { name: string; args: Record<string, unknown> };

/** Call Gemini on Vertex AI with the service account. */
export async function callGemini(opts: {
  system: string;
  contents: GeminiContent[];
  tools?: GeminiTool[];
}): Promise<{ text: string; functionCalls: GeminiFunctionCall[] }> {
  const client = await getAuth().getClient();
  const token = (await client.getAccessToken()).token;
  if (!token) throw new Error("Vertex: could not obtain access token");

  const loc = env.gcpLocation;
  const base = loc === "global" ? "https://aiplatform.googleapis.com" : `https://${loc}-aiplatform.googleapis.com`;
  const url = `${base}/v1/projects/${env.gcpProject}/locations/${loc}/publishers/google/models/${env.gcpModel}:generateContent`;

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: opts.contents,
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
  };
  if (opts.tools) body.tools = opts.tools;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; functionCall?: { name: string; args?: Record<string, unknown> } }> } }>;
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(`Vertex ${res.status}: ${j?.error?.message ?? "error"}`);

  const parts = j.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p) => p.text)
    .filter((t): t is string => Boolean(t))
    .join("")
    .trim();
  const functionCalls = parts
    .filter((p) => p.functionCall)
    .map((p) => ({ name: p.functionCall!.name, args: p.functionCall!.args ?? {} }));
  return { text, functionCalls };
}
