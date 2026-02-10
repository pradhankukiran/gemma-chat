const MODAL_API_BASE =
  process.env.MODAL_API_BASE ||
  "https://pradhankukiran--medgemma-modal-api-fastapi-app.modal.run"

export const runtime = "nodejs"

export async function POST(req) {
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get("endpoint") || "chat_stream"

  const allowed = ["chat", "chat_stream", "chat_image_stream"]
  if (!allowed.includes(endpoint)) {
    return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const body = await req.text()

  const upstream = await fetch(`${MODAL_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })

  if (!upstream.ok) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") || "application/json" },
    })
  }

  // For non-streaming endpoint (/chat warmup), return JSON directly
  if (endpoint === "chat") {
    return new Response(upstream.body, {
      status: 200,
      headers: { "Content-Type": upstream.headers.get("Content-Type") || "application/json" },
    })
  }

  // For streaming endpoints, pipe through as SSE
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
