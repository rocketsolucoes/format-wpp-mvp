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
  // Novo sistema de formatação dinâmica
  intentMode?: 'general' | 'sales' | 'notice';
  userProfile?: UserFormattingProfile;
}

interface UserFormattingProfile {
  style_level: 'flashy' | 'balanced' | 'clean';
  emoji_mode: 'smart' | 'keep_only' | 'off';
  layout_mode: 'preserve' | 'blocks';
  highlight_mode: 'essential_only' | 'important_words';
}

interface FormatResponse {
  formatted_text: string;
  credits_remaining: number;
  tokens_used: number;
}

/**
 * Constrói o prompt final baseado no perfil do usuário e modo de intenção
 */
function buildFinalPrompt(
  intentMode: 'general' | 'sales' | 'notice',
  profile: UserFormattingProfile
): string {
  // Configurações baseadas no perfil
  const styleConfig = {
    flashy: {
      boldLimit: 'alto',
      italicUsage: 'frequente',
      emphasis: 'muita ênfase visual',
    },
    balanced: {
      boldLimit: 'moderado',
      italicUsage: 'moderado',
      emphasis: 'ênfase equilibrada',
    },
    clean: {
      boldLimit: 'mínimo',
      italicUsage: 'raro',
      emphasis: 'ênfase sutil',
    },
  };

  const emojiConfig = {
    smart: 'Adicione emojis relevantes de forma inteligente para aumentar o engajamento',
    keep_only: 'Mantenha apenas os emojis já presentes no texto original, não adicione novos',
    off: 'Remova todos os emojis do texto',
  };

  const layoutConfig = {
    preserve: 'Preserve a estrutura de parágrafos original do texto',
    blocks: 'Organize o texto em blocos lógicos com quebras de linha estratégicas',
  };

  const highlightConfig = {
    essential_only: 'Destaque apenas informações essenciais (preços, datas, CTAs)',
    important_words: 'Destaque tanto informações essenciais quanto palavras-chave importantes',
  };

  const currentStyle = styleConfig[profile.style_level];

  // Templates COMPLETAMENTE DIFERENTES para cada modo
  let prompt = '';

  if (intentMode === 'general') {
    // MODO GERAL: Amigável, natural, conversacional
    prompt = `Você é um assistente de formatação para WhatsApp com tom amigável e natural.

**SUA MISSÃO:**
Transforme a mensagem em um texto conversacional, fácil de ler e agradável.

**ESTILO:**
- Negritos: ${currentStyle.boldLimit} (use com moderação)
- Itálicos: ${currentStyle.italicUsage}
- Tom: Amigável, caloroso, como se fosse um amigo falando
- Mantenha a naturalidade, evite linguagem de vendas

**EMOJIS:**
${emojiConfig[profile.emoji_mode]}

**LAYOUT:**
${layoutConfig[profile.layout_mode]}

**DESTAQUE:**
${highlightConfig[profile.highlight_mode]}

**REGRAS:**
- Tom conversacional e acolhedor
- Sem pressão ou urgência
- Call-to-action suave, se houver
- Mantenha simplicidade e clareza
- Use formatação WhatsApp: *negrito*, _itálico_

Retorne APENAS o texto reformatado, sem explicações.`;

  } else if (intentMode === 'sales') {
    // MODO VENDAS: MUITO agressivo, persuasivo, técnicas de copywriting
    prompt = `Você é um copywriter expert em vendas por WhatsApp. Use técnicas avançadas de persuasão.

**SUA MISSÃO:**
Transforme esta mensagem em um COPY DE VENDAS DE ALTA CONVERSÃO para WhatsApp.

**TÉCNICAS OBRIGATÓRIAS:**
- Use gatilhos mentais: escassez, urgência, prova social, autoridade
- CTAs FORTES e diretos ("Garanta já", "Últimas unidades", "Oferta termina hoje")
- Destaque BENEFÍCIOS, não características
- Crie senso de perda ("Não perca", "Última chance")
- Use palavras poderosas: Exclusivo, Garantido, Comprovado, Limitado

**ESTILO:**
- Negritos: ${currentStyle.boldLimit === 'alto' ? 'MÁXIMO - destaque preços, benefícios, CTAs' : currentStyle.boldLimit === 'moderado' ? 'ALTO - destaque pontos de venda' : 'MODERADO - destaque o essencial'}
- Itálicos: Use para criar ênfase emocional
- Tom: Entusiasmado, persuasivo, urgente
- Frases curtas e impactantes

**EMOJIS:**
${profile.emoji_mode === 'smart' ? 'Use emojis ESTRATÉGICOS: 🔥💰✨⚡ para criar impacto visual e aumentar conversão' : profile.emoji_mode === 'keep_only' ? 'Mantenha os emojis existentes' : 'Remova emojis'}

**LAYOUT:**
${profile.layout_mode === 'blocks' ? 'Organize em blocos curtos e escaneáveis. Use quebras estratégicas para destacar benefícios.' : 'Mantenha estrutura original mas otimize para escaneabilidade'}

**DESTAQUE:**
${profile.highlight_mode === 'important_words' ? 'Destaque TUDO importante: preços, descontos, benefícios, CTAs, prazos' : 'Destaque APENAS elementos críticos: preço final, desconto, CTA principal'}

**ESTRUTURA IDEAL:**
1. Hook impactante (primeira linha que prende atenção)
2. Problema/Desejo (o que o cliente quer)
3. Solução (seu produto)
4. Benefícios (o que ele ganha)
5. Prova/Autoridade (se houver)
6. Urgência/Escassez
7. CTA forte

**EXEMPLO DE TOM:**
❌ "Temos um produto novo"
✅ "🔥 ÚLTIMAS UNIDADES! Garanta o seu antes que acabe"

Retorne APENAS o texto reformatado em copy persuasivo.`;

  } else if (intentMode === 'notice') {
    // MODO AVISO: Formal, claro, autoritário, oficial
    prompt = `Você é um redator de comunicados oficiais e avisos importantes para WhatsApp.

**SUA MISSÃO:**
Transforme esta mensagem em um AVISO CLARO, FORMAL e AUTORITÁRIO.

**ESTILO:**
- Negritos: ${currentStyle.boldLimit} (use para informações críticas)
- Itálicos: ${currentStyle.italicUsage} (use para termos técnicos ou destaque formal)
- Tom: Formal, direto, profissional, sem informalidades
- Estrutura: Organizada, clara, fácil de entender

**CARACTERÍSTICAS:**
- Linguagem formal e respeitosa
- Informação objetiva e direta
- Sem vendas, sem persuasão
- Autoridade e credibilidade
- Clareza acima de tudo

**EMOJIS:**
${profile.emoji_mode === 'smart' ? 'Use APENAS emojis informativos: ⚠️📢📌ℹ️✅❌ para classificar informações' : profile.emoji_mode === 'keep_only' ? 'Mantenha apenas emojis originais' : 'Sem emojis (máxima formalidade)'}

**LAYOUT:**
${profile.layout_mode === 'blocks' ? 'Organize em blocos lógicos numerados ou com bullet points. Estrutura clara e hierárquica.' : 'Mantenha estrutura original mas garanta clareza'}

**DESTAQUE:**
${profile.highlight_mode === 'important_words' ? 'Destaque: prazos, datas, valores, regras, consequências, ações obrigatórias' : 'Destaque APENAS: informações críticas, prazos finais, ações obrigatórias'}

**ESTRUTURA IDEAL:**
1. Assunto/Título claro
2. Informação principal
3. Detalhes importantes (prazos, valores, regras)
4. Instruções/Próximos passos
5. Contato/Dúvidas (se aplicável)

**EXEMPLO DE TOM:**
❌ "Oi pessoal! Então, vamos ter que..."
✅ "📢 *COMUNICADO IMPORTANTE*\n\nInformamos que..."

Retorne APENAS o texto reformatado em tom oficial.`;
  }

  return prompt;
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

    const { text, styleId, customPrompt, intentMode, userProfile }: FormatRequest = await req.json();

    console.log("Received styleId:", styleId);
    console.log("Received intentMode:", intentMode);
    console.log("Received userProfile:", userProfile);
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
    const proIntentModes = ["sales", "notice"];

    // Validação para o sistema antigo (styleId)
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

    // Validação para o novo sistema (intentMode)
    if (userPlan === "free" && intentMode && proIntentModes.includes(intentMode)) {
      console.log(`Free user ${user.id} attempted to use Pro intent mode: ${intentMode}`);
      return new Response(
        JSON.stringify({
          error: "Os modos Vendas e Aviso são exclusivos do plano Pro. Faça upgrade para acessar todos os modos de formatação.",
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
      // Admin override: prompt customizado
      systemPrompt = customPrompt;
    } else if (intentMode && userProfile) {
      // NOVO SISTEMA: Prompt dinâmico baseado em perfil
      systemPrompt = buildFinalPrompt(intentMode, userProfile);
    } else if (styleId) {
      // SISTEMA ANTIGO: Compatibilidade com prompts fixos do banco
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
      // Fallback padrão
      systemPrompt = "You are a text formatter. Improve the user's text by fixing grammar, improving clarity, and enhancing readability while maintaining the original tone and meaning. Format with proper line breaks for WhatsApp. ONLY return the improved text, nothing else.";
    }

    console.log("Using prompt from:", customPrompt ? "custom" : (intentMode && userProfile) ? "dynamic" : styleId ? "database" : "default");
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
        temperature: 0.1, // Baixa temperatura para consistência
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
        intent_mode: intentMode || null,
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