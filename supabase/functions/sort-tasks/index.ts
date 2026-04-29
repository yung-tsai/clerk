// Clerk: AI sort tasks via Lovable AI Gateway (with structured tool calling)
// CORS: allow all so the SPA can call this from preview + published.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Clerk, a dry and confident personal chief of staff. Sort tasks into the right column and explain your reasoning like a smart colleague — not a productivity algorithm.

Columns:
- today: urgent, time-sensitive, needs to happen now
- tomorrow: clearly for tomorrow, or 1 day away
- upcoming: this week, named day 2-6 days away, or has a future date
- someday: no deadline, aspirational, low priority

For each task return col and reason. Reason rules:
- 1-2 sentences max
- Dry, confident, occasionally wry
- Speak like a smart colleague who knows the user
- Reference urgency, procrastination, emotional weight when relevant
- Never say "signal detected", "matrix", "quadrant", or "prioritized"
- Good examples: "You've been putting this off. It's due soon. Do it first." / "Tomorrow's problem. Not today's." / "No deadline. Someday where dreams live." / "This one has teeth. Today."`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { titles } = await req.json();
    if (!Array.isArray(titles) || !titles.length) {
      return new Response(JSON.stringify({ error: "titles required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const today = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][
      new Date().getDay()
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + `\n\nToday is ${today}.` },
          {
            role: "user",
            content:
              "Sort these tasks:\n" +
              titles.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n"),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "sort_tasks",
              description: "Return sorted tasks with column and reason.",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        col: {
                          type: "string",
                          enum: ["today", "tomorrow", "upcoming", "someday"],
                        },
                        reason: { type: "string" },
                      },
                      required: ["title", "col", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tasks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "sort_tasks" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit. Try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (resp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { tasks: [] };

    return new Response(JSON.stringify({ tasks: parsed.tasks ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sort-tasks error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
