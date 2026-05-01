// Clerk: AI sort tasks via Lovable AI Gateway (with structured tool calling)
// CORS: allow all so the SPA can call this from preview + published.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Clerk, a dry and confident personal chief of staff. You do three things:

1. EXTRACT individual tasks from the user's raw input — even if it's a run-on sentence with no commas or punctuation. The user may write naturally without separating tasks. Identify each distinct action or to-do as a separate task.

2. SORT each extracted task into the correct column based on urgency and timing.

3. EXTRACT structured fields from each task — date, time, location, and category — directly from the natural language. No special syntax required from the user.

---

COLUMN RULES:
- today: urgent, time-sensitive, needs to happen now, or overdue
- tomorrow: explicitly tomorrow, or exactly 1 day away
- upcoming: this week, named day 2–6 days away, or has a specific future date
- someday: no deadline, aspirational, low priority, vague future

DAY CALCULATION RULES:
- Use the FULL DATE provided to calculate days away precisely
- "tomorrow" or 1 day away → tomorrow
- A named day 2 days away (e.g. Saturday when today is Thursday) → upcoming
- A named day 3–6 days away → upcoming
- A named day that is today → today
- A named day that already passed this week → today (treat as overdue)
- "this weekend" when weekend is 2+ days away → upcoming
- "someday", "one day", "eventually", "at some point" → someday
- No deadline mentioned, no urgency signal → someday

TASK EXTRACTION RULES:
- Split compound sentences into individual tasks
- Each task should be one actionable item
- Preserve the user's original wording as closely as possible
- Do not merge separate tasks together

---

FIELD EXTRACTION RULES:

dueDate — extract any date or day reference:
- Specific dates: "May 11th" → "May 11", "June 3rd" → "Jun 3"
- Named days: "Friday" → "Friday", "next Thursday" → "next Thu"
- Relative: "this weekend" → "This weekend", "end of month" → "End of month"
- If no date mentioned → return ""

taskTime — extract any time reference using these rules:
- Specific times: "9am" → "9:00 AM", "2:30" → "2:30 PM", "14:00" → "2:00 PM"
- Fuzzy times — use the user's exact words, do not invent a specific time:
  "morning" or "in the morning" → "Morning"
  "afternoon" → "Afternoon"
  "evening" → "Evening"
  "night" or "tonight" → "Night"
  "lunchtime" or "at lunch" → "Lunchtime"
  "fiveish" or "around 5" → "~5 PM"
  "eightish" → "~8 AM" (apply AM/PM rules below)
  "EOD" or "end of day" → "EOD"
  "noon" → "12:00 PM"
- AM/PM inference when not specified:
  Hours 6–11 with no context → AM (e.g. "call at 9" → "9:00 AM")
  Hour 12 → PM (noon)
  Hours 1–5 with no context → PM (e.g. "meeting at 3" → "3:00 PM")
  Hours 7–9 with evening/night context → PM
  Truly ambiguous (e.g. "call at 8" with no context) → append "?" flag: "8:00 AM?"
- If no time mentioned → return ""

location — extract any place reference:
- Named places: "at Walmart" → "Walmart", "at Target" → "Target"
- Descriptive places: "at the office" → "Office", "at Dave's place" → "Dave's place"
- Schools, hospitals, restaurants: extract the name
- Vague locations like "at home" → "Home"
- No @ syntax required from the user — infer from prepositions (at, in, near, by)
- If no location mentioned → return ""

category — infer the most likely category from context:
- "Work": reports, meetings, clients, emails, presentations, deadlines, colleagues, office
- "Family": kids, school, spouse, parents, siblings, relatives, pickup, dropoff
- "Health": gym, run, workout, doctor, dentist, medication, exercise, appointment
- "Finance": bills, bank, payments, taxes, budget, credit card, invoice
- "Personal": gifts, friends, hobbies, shopping, errands with no work context
- "Home": cleaning, repairs, groceries, household chores, garden, garage
- If truly unclear → return ""

---

REASON RULES:
- 1–2 sentences max
- Dry, confident, occasionally wry
- Speak like a smart colleague who knows the user
- Reference urgency, procrastination, emotional weight when relevant
- Never say "signal detected", "matrix", "quadrant", or "prioritized"
- Good examples:
  "You've been putting this off. It's due soon. Do it first."
  "Tomorrow's problem. Not today's."
  "No deadline. Someday where dreams live."
  "This one has teeth. Today."
  "Saturday is two days out. Keep it on the horizon."
  "Morning errand. Batch it with the rest."`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();

    // Accept either raw input string or array of titles (backwards compatible)
    let rawInput: string;
    if (typeof body.input === "string") {
      rawInput = body.input.trim();
    } else if (Array.isArray(body.titles) && body.titles.length) {
      rawInput = body.titles.join(", ");
    } else {
      return new Response(JSON.stringify({ error: "input or titles required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rawInput) {
      return new Response(JSON.stringify({ error: "empty input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Use browser timezone if sent, otherwise fall back to UTC
    const timezone = typeof body.timezone === "string" && body.timezone
      ? body.timezone
      : "UTC";

    // Full date string so AI can calculate days away precisely
    const fullDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone,
    });

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
            content: `Extract individual tasks from the following input, sort each one, and extract all available fields:\n\n"${rawInput}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "sort_tasks",
              description: "Extract tasks from raw input, sort each into a column, and extract structured fields.",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: {
                          type: "string",
                          description: "The task title, preserving the user's original wording",
                        },
                        col: {
                          type: "string",
                          enum: ["today", "tomorrow", "upcoming", "someday"],
                          description: "Which column this task belongs in",
                        },
                        reason: {
                          type: "string",
                          description: "1-2 sentence dry, confident reasoning for the column choice",
                        },
                        dueDate: {
                          type: "string",
                          description: "Date extracted from the task in natural form e.g. 'May 11', 'Friday', 'Next Thu'. Empty string if none.",
                        },
                        taskTime: {
                          type: "string",
                          description: "Time extracted from the task e.g. '9:00 AM', 'Morning', '~5 PM', '3:00 PM?'. Empty string if none.",
                        },
                        location: {
                          type: "string",
                          description: "Location extracted from the task e.g. 'Walmart', 'Office', 'Lincoln Elementary'. Empty string if none.",
                        },
                        category: {
                          type: "string",
                          description: "Inferred category: Work, Family, Health, Finance, Personal, Home. Empty string if unclear.",
                        },
                      },
                      required: ["title", "col", "reason", "dueDate", "taskTime", "location", "category"],
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

    // Diagnostic: log just the extracted fields per task so regressions show up
    // in edge logs without dumping the full AI payload.
    console.log(
      "[sort-tasks] extracted:",
      JSON.stringify(
        (parsed.tasks ?? []).map((t: any) => ({
          title: t.title,
          col: t.col,
          taskTime: t.taskTime,
          dueDate: t.dueDate,
          location: t.location,
          category: t.category,
        }))
      )
    );

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
