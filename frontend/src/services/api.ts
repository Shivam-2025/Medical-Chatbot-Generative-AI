// services/api.ts

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  answer: string; // ✅ instead of "content"
  sources: { title?: string; page?: number; snippet?: string }[];
}

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"; // 🔗 FastAPI server
export const API_KEY = import.meta.env.VITE_API_KEY || "supersecretkey123";
async function handleResponse(res: Response) {
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Request failed: ${res.status} - ${errText}`);
  }
  return res.json();
}

/** Send chat message (non-streaming) */
export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(req),
  });
  return handleResponse(res);
}

/** Source reference from retrieved documents */
export interface SourceRef {
  title?: string;
  page?: number;
  snippet?: string;
  paragraph?: string;
}

/** Send chat message as a stream (SSE) */
export async function sendChatStream(
  conversationId: string,
  message: string,
  onChunk: (chunk: string) => void,
  onSources?: (sources: SourceRef[]) => void,
  onError?: (error: string) => void
): Promise<void> {
  const req: ChatRequest = {
    message,
    conversation_id: conversationId,
  };

  const res = await fetch(`${BASE_URL}/api/chat?stream=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Stream request failed: ${res.status} - ${errText}`);
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Decode incremental chunks
    buffer += decoder.decode(value, { stream: true });

    // Split Server-Sent Event messages by double newline
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      if (!part.trim()) continue;

      // Handle multi-line SSE data (join all `data: ` prefixed lines)
      const dataLines = part
        .split("\n")
        .filter((l) => l.startsWith("data: "))
        .map((l) => l.slice(6));

      if (dataLines.length === 0) continue;
      const data = dataLines.join("\n");

      try {
        const event = JSON.parse(data) as {
          type: "sources" | "token" | "done" | "error";
          data?: any;
        };

        switch (event.type) {
          case "sources":
            if (onSources && Array.isArray(event.data)) {
              onSources(event.data);
            }
            break;

          case "token":
            if (typeof event.data === "string" && event.data) {
              onChunk(event.data);
            }
            break;

          case "error":
            if (onError && typeof event.data === "string") {
              onError(event.data);
            } else if (typeof event.data === "string") {
              console.error("[SSE Error]", event.data);
            }
            break;

          case "done":
            // Stream finished — nothing to do
            break;

          default:
            // Unknown event type — log and ignore
            console.warn("[SSE] Unknown event type:", event);
            break;
        }
      } catch {
        // Non-JSON fallback (legacy compatibility)
        if (data !== "[DONE]") {
          onChunk(data);
        }
      }
    }
  }
}



/** Upload one PDF */
export async function uploadPdf(file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("file", file); // ✅ single file

  const res = await fetch(`${BASE_URL}/upload_pdf`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

/** Start a new conversation */
export async function startNewChat(): Promise<{ conversation_id: string }> {
  const res = await fetch(`${BASE_URL}/new_chat`, {
    method: "POST",
  });
  return handleResponse(res);
}

export interface DocumentInfo {
  name: string;
  size: number;
  modified: number;
}

/** List all uploaded PDFs */
export async function listDocuments(): Promise<DocumentInfo[]> {
  const res = await fetch(`${BASE_URL}/documents`, {
    method: "GET",
  });
  return handleResponse(res);
}

/** Delete an uploaded PDF */
export async function deleteDocument(filename: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/documents/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

/** Check backend connectivity with longer timeout (LLM calls can be slow) */
export async function checkBackendStatus(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8s timeout — LLM calls can block for a while
    const res = await fetch(`${BASE_URL}/`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(id);
    return res.ok;
  } catch (err) {
    return false;
  }
}
