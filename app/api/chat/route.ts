import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";
const VOYAGE_MODEL = process.env.VOYAGE_MODEL ?? "voyage-law-2";
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;

const SYSTEM_PROMPT = `Sos el asistente jurídico de la Academia Irisarri. Respondés consultas de derecho penal razonando como el Dr. Santiago M. Irisarri. Tono informal, tuteo (vos). Conclusión al principio. Nunca inventar jurisprudencia ni artículos. Si no sabés con certeza, decirlo. Principios clave: "Derecho no es matemáticas", "la validez de los actos es la regla; la nulidad es la excepción", "cada causa es única e irrepetible". Antes de responder: identificar el problema real, la etapa procesal, si la respuesta es certera o depende de variables, y si hay algo que el consultante entiende mal.`;

async function embedText(text: string): Promise<number[]> {
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${VOYAGE_API_KEY}` },
          body: JSON.stringify({ input: text, model: VOYAGE_MODEL }),
        });
    if (!response.ok) throw new Error(`Voyage AI error: ${response.statusText}`);
    const data = await response.json();
    return data.data[0].embedding;
  }

async function buscarEscritos(embedding: number[], limite = 4) {
    const { data, error } = await supabase.rpc("buscar_escritos_similares", {
          query_embedding: embedding, match_count: limite, match_threshold: 0.5,
        });
    if (error) { console.error("RAG error:", error); return []; }
    return data ?? [];
  }

export async function POST(req: NextRequest) {
    try {
          const { message, history } = await req.json();
          if (!message || typeof message !== "string") return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });

          let contextString = "";
          try {
                  const embedding = await embedText(message);
                  const escritos = await buscarEscritos(embedding);
                  if (escritos.length > 0) {
                            contextString = "\n\n---\nESCRITOS RELEVANTES:\n\n" +
                              escritos.map((e: {tipo?: string; filename?: string; contenido?: string}, i: number) =>
                                                       `[${i+1} — ${e.tipo ?? "recurso"} — ${e.filename ?? ""}]\n${e.contenido?.substring(0, 600)}...`
                                                     ).join("\n\n") + "\n---\n";
                          }
                } catch (ragError) { console.error("RAG (continuando sin contexto):", ragError); }

          const messages: Anthropic.MessageParam[] = [
                  ...(history ?? []),
                  { role: "user", content: message + contextString },
                ];

          const response = await anthropic.messages.create({
                  model: CLAUDE_MODEL, max_tokens: 1500, system: SYSTEM_PROMPT, messages,
                });

          const assistantMessage = response.content[0].type === "text" ? response.content[0].text : "";
          return NextResponse.json({ message: assistantMessage, usage: response.usage });
        } catch (error) {
          console.error("Error en /api/chat:", error);
          return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
        }
  }
