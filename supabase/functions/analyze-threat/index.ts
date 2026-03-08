import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { log } = await req.json();
    if (!log) {
      return new Response(JSON.stringify({ error: "Missing log data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a cybersecurity threat analyst AI. Analyze the following security log entry and classify the threat.

You MUST respond using the provided tool. Analyze the log carefully:
- Classify the threat type (e.g., brute_force, sql_injection, malware, ransomware, phishing, ddos, port_scan, data_exfiltration, privilege_escalation, unauthorized_access, reconnaissance, zero_day, insider_threat, cryptojacking)
- Assign severity: critical, high, medium, or low
- Provide a concise technical explanation of what happened
- Suggest 2-4 specific, actionable mitigation steps`;

    const logContext = `Log Entry:
Source: ${log.source || "unknown"}
Level: ${log.log_level || "unknown"}
Message: ${log.message || ""}
Source IP: ${log.source_ip || "unknown"}
Hostname: ${log.hostname || "unknown"}
Pattern Matched: ${log.pattern_matched || "none"}
Raw Log: ${log.raw_log || log.message || ""}
Timestamp: ${log.created_at || "unknown"}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: logContext },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "classify_threat",
                description:
                  "Classify a security threat based on log analysis",
                parameters: {
                  type: "object",
                  properties: {
                    threat_type: {
                      type: "string",
                      description:
                        "The classified threat type, e.g. brute_force, sql_injection, malware, ddos, etc.",
                    },
                    severity: {
                      type: "string",
                      enum: ["critical", "high", "medium", "low"],
                      description: "The severity level of the threat",
                    },
                    explanation: {
                      type: "string",
                      description:
                        "Technical explanation of the threat and what was detected",
                    },
                    mitigation: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "List of 2-4 specific mitigation steps to address the threat",
                    },
                  },
                  required: [
                    "threat_type",
                    "severity",
                    "explanation",
                    "mitigation",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "classify_threat" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in AI response");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-threat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
