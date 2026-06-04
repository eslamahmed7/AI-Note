import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, chat_id, language, openai_api_key } = await req.json();

    if (!message || !openai_api_key) {
      return new Response(
        JSON.stringify({ error: "Missing message or API key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's relevant notes using text search
    const { data: notes } = await supabase
      .from("notes")
      .select("id, title, content, note_type, created_at, updated_at, tags:note_tags(tag:tags(name))")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .eq("is_archived", false)
      .textSearch("search_vector", message.split(" ").filter((w: string) => w.length > 2).join(" | "), {
        type: "websearch",
        config: "simple",
      })
      .limit(5);

    // Also do a simple title/content match
    const { data: exactNotes } = await supabase
      .from("notes")
      .select("id, title, content, note_type, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .or(`title.ilike.%${message.substring(0, 50)}%,content.ilike.%${message.substring(0, 50)}%`)
      .limit(3);

    const allNotes = [
      ...(notes || []),
      ...(exactNotes || []).filter(
        (n: { id: string }) => !(notes || []).some((existing: { id: string }) => existing.id === n.id)
      ),
    ].slice(0, 8);

    // Build context from notes
    const notesContext = allNotes
      .map((n: { title?: string; content?: string; note_type?: string; created_at?: string }) =>
        `[ملاحظة: ${n.title || "بدون عنوان"}]\nالنوع: ${n.note_type}\nالتاريخ: ${new Date(n.created_at || "").toLocaleDateString("ar-SA")}\nالمحتوى: ${(n.content || "").substring(0, 500)}`
      )
      .join("\n\n---\n\n");

    const systemPrompt = language === "ar"
      ? `أنت مساعد ذكي ذو علم واسع، تعمل كـ "العقل الثاني" للمستخدم. مهمتك الرد على الأسئلة بناءً على ملاحظات المستخدم ومعرفتك العامة. كن مفيداً ودقيقاً ومختصراً.

قاعدة معرفة المستخدم (ملاحظاته):
${notesContext || "لا توجد ملاحظات متعلقة بسؤالك."}

تعليمات:
- أجب بالعربية دائماً
- استند على ملاحظات المستخدم عند الإجابة
- اذكر المصادر من الملاحظات عند الاقتباس
- إذا لم تجد معلومات في الملاحظات، أخبر المستخدم وقدم إجابة عامة`
      : `You are an intelligent assistant acting as the user's "Second Brain". Your task is to answer questions based on the user's notes and your general knowledge.

User's knowledge base (their notes):
${notesContext || "No relevant notes found for your question."}

Instructions:
- Answer in English
- Base your answers on the user's notes when possible
- Mention which notes you're referencing
- If no relevant notes found, inform the user and provide a general answer`;

    // Call OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openai_api_key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI error:", errText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices?.[0]?.message?.content || "";
    const tokensUsed = openaiData.usage?.total_tokens || 0;

    // Prepare sources
    const sources = allNotes.slice(0, 3).map((n: { id?: string; title?: string; content?: string }) => ({
      note_id: n.id,
      title: n.title || (language === "ar" ? "بدون عنوان" : "Untitled"),
      excerpt: (n.content || "").substring(0, 100),
    }));

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        sources: sources.length > 0 ? sources : null,
        tokens_used: tokensUsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        message: "حدث خطأ أثناء معالجة طلبك. يرجى التحقق من مفتاح OpenAI API.",
        error: String(error),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
