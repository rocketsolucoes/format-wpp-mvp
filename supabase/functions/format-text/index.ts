import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FormatRequest {
  text: string;
  styleId?: string;
}

interface FormatResponse {
  formatted_text: string;
  credits_remaining: number;
  tokens_used: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Client com service role para verificar usuário
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Client com o token do usuário para operações que respeitam RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { text, styleId }: FormatRequest = await req.json();

    console.log("Received styleId:", styleId);
    console.log("Text length:", text.length);

    if (!text || text.length < 10) {
      return new Response(
        JSON.stringify({ error: "Text must be at least 10 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Text must be less than 5000 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits_remaining, plan")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profile" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        {
          status: 114,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (profile.plan === "free" && profile.credits_remaining <= 0) {
      return new Response(
        JSON.stringify({ error: "No credits remaining. Please upgrade your plan." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stylePrompts: Record<string, string> = {
      casual: "You are a casual text formatter. Rewrite the user's text in a casual, friendly, conversational style suitable for WhatsApp. Keep it natural and approachable while maintaining clarity. Format with proper line breaks and emojis where appropriate for WhatsApp. ONLY return the rewritten text, nothing else.",
      sales: "You are a persuasive sales text formatter. Rewrite the user's text using high-conversion copywriting techniques suitable for WhatsApp. Use urgency, social proof, clear benefits, and compelling calls-to-action. Highlight prices and benefits with bold formatting and emojis. Format with proper line breaks and emphasis for WhatsApp. ONLY return the rewritten text, nothing else.",
      announcement: "You are an announcement text formatter. Rewrite the user's text as a clear and authoritative notice suitable for WhatsApp. Use direct language, proper structure, and emphasize key information. Organize information clearly with structured formatting. Format with proper line breaks and emojis for WhatsApp readability. ONLY return the rewritten text, nothing else.",
    };

    const systemPrompt = styleId && stylePrompts[styleId]
      ? stylePrompts[styleId]
      : "You are a text formatter. Improve the user's text by fixing grammar, improving clarity, and enhancing readability while maintaining the original tone and meaning. Format with proper line breaks for WhatsApp. ONLY return the improved text, nothing else.";

    console.log("Selected prompt for style:", styleId, "| Using default:", !stylePrompts[styleId]);
    console.log("System prompt (first 100 chars):", systemPrompt.substring(0, 100));

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to format text. Please try again." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const formattedText = openaiData.choices[0]?.message?.content || text;
    const tokensUsed = openaiData.usage?.total_tokens || 0;

    let newCreditsRemaining = profile.credits_remaining;
    if (profile.plan === "free") {
      newCreditsRemaining = Math.max(0, profile.credits_remaining - 1);
      await supabase
        .from("profiles")
        .update({ credits_remaining: newCreditsRemaining })
        .eq("id", user.id);
    }

    const { error: insertError } = await supabase
      .from("formatting_history")
      .insert({
        user_id: user.id,
        input_text: text,
        output_text: formattedText,
        style_id: styleId || null,
        tokens_used: tokensUsed,
      });

    if (insertError) {
      console.error("Failed to save to history:", insertError);
    } else {
      console.log("Successfully saved to history for user:", user.id);
    }

    const response: FormatResponse = {
      formatted_text: formattedText,
      credits_remaining: profile.plan === "pro" || profile.plan === "enterprise" ? -1 : newCreditsRemaining,
      tokens_used: tokensUsed,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in format-text function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});