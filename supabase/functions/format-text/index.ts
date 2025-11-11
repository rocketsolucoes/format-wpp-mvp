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
  customPrompt?: string;
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { text, styleId, customPrompt }: FormatRequest = await req.json();

    console.log("Received styleId:", styleId);
    console.log("Text length:", text.length);
    console.log("Using custom prompt:", !!customPrompt);

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
      .select("credits_remaining, plan, subscription_tier")
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

    const userPlan = profile.subscription_tier || profile.plan;
    const proStyles = ["sales", "announcement"];

    if (userPlan === "free" && styleId && proStyles.includes(styleId)) {
      console.log(`Free user ${user.id} attempted to use Pro style: ${styleId}`);
      return new Response(
        JSON.stringify({
          error: "This style is exclusive to Pro plan. Please upgrade to access Sales and Official styles.",
          code: "PRO_STYLE_REQUIRED"
        }),
        {
          status: 403,
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

    let systemPrompt: string;

    if (customPrompt) {
      systemPrompt = customPrompt;
    } else if (styleId) {
      const { data: promptData, error: promptError } = await supabaseAdmin
        .from("formatting_prompts")
        .select("prompt")
        .eq("style_id", styleId)
        .eq("is_active", true)
        .maybeSingle();

      if (promptError) {
        console.error("Error fetching prompt:", promptError);
        systemPrompt = "You are a text formatter. Improve the user's text by fixing grammar, improving clarity, and enhancing readability while maintaining the original tone and meaning. Format with proper line breaks for WhatsApp. ONLY return the improved text, nothing else.";
      } else if (promptData) {
        systemPrompt = promptData.prompt;
      } else {
        console.warn("No prompt found for style:", styleId);
        systemPrompt = "You are a text formatter. Improve the user's text by fixing grammar, improving clarity, and enhancing readability while maintaining the original tone and meaning. Format with proper line breaks for WhatsApp. ONLY return the improved text, nothing else.";
      }
    } else {
      systemPrompt = "You are a text formatter. Improve the user's text by fixing grammar, improving clarity, and enhancing readability while maintaining the original tone and meaning. Format with proper line breaks for WhatsApp. ONLY return the improved text, nothing else.";
    }

    console.log("Using prompt from:", customPrompt ? "custom" : styleId ? "database" : "default");
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