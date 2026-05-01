// Clerk: AI sort tasks via Lovable AI Gateway (with structured tool calling)
// CORS: allow all so the SPA can call this from preview + published.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Clerk, a dry and confident personal chief of staff. You do two things:

1. EXTRACT individual tasks from the user's raw input — even if it's a run-on sentence with no commas or punctuation. The user may write naturally without separating tasks. Identify each distinct action or to-do as a separate task.

2. SORT each extracted task into the correct column based on urgency and timing.

Columns:
- today: urgent, time-sensitive, needs to happen now, or overdue
- tomorrow: explicitly tomorrow, or exactly 1 day away
- upcoming: this week, named day 2–6 days away, or has a specific future date
- someday: no deadline, aspirational, low priority, vague future

Day calculation rules:
- Use the FULL DATE provided to calculate days away precisely
- "tomorrow" or "1 day away" → tomorrow
- A named day 2 days away (e.g. Saturday when today is Thursday) → upcoming
- A named day 3–6 days away → upcoming
- A named day that is today → today
- A named day that already passed this week → today (treat as overdue)
- "this weekend" when weekend is 2+ days away → upcoming
- "someday", "one day", "eventually", "at some point" → someday
- No deadline mentioned, no urgency signal → someday

Task extraction rules:
- Split compound sentences into individual tasks
- Each task should be one actionable item
- Preserve the user's original wording as closely as possible
- Do not merge separate tasks together

Reason rules:
- 1–2 sentences max
- Dry, confident, occasionally wry
- Speak like a smart colleague who knows the user
- Reference urgency, procrastination, emotional weight when relevant
- Never say "signal detected", "matrix", "quadrant", or "prioritized"
- Good examples: "You've been putting this off. It's due soon. Do it first." / "Tomorrow's problem. Not today's." / "No deadline. Someday where dreams live." / "This one has teeth. Today." / "Saturday is two days out. Upcoming."`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();

    // Accept either raw input string or array of titles (backwards compatible)
    let rawInput: string;
    if (typeof body.input === "string" && body.input.trim()) {
      rawInput = body.input;
    } else if (Array.isArray(body.titles) && body.titles.length) {
      rawInput = body.titles.join(", ");
    } else {
      return new Response(JSON.stringify({ error: "input or titles required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Use full date string so AI can calculate days away precisely.
    // Prefer the user's browser timezone if provided; fall back to Central time.
    const tz = typeof body.timezone === "string" && body.timezone.trim()
      ? body.timezone
      : "America/Chicago";

    let fullDate: string;
    try {
      fullDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: tz,
      });
    } catch {
      fullDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/Chicago",
      });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT + `\n\nToday is ${fullDate}.`,
          },
          {
            role: "user",
            content: `Extract individual tasks from the following input and sort each one:\n\n"${rawInput}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "sort_tasks",
              description: "Extract individual tasks from raw input and return each sorted with column and reason.",
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
