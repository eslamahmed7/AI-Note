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
    const { message, chat_id, language } = await req.json();
    const activeApiKey = atob("QVEuQWI4Uk42S0pJNmlFMWJ4c1EwSWxSckxLeDVwOHNoY1lCaVU1VjVBSVNtVkprMF9aQkE=");

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message" }),
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
- استخدم الأدوات المتاحة لإنشاء الملاحظات أو المهام أو المجلدات إذا طلب منك المستخدم ذلك.
- إذا لم تجد معلومات في الملاحظات، أخبر المستخدم وقدم إجابة عامة`
      : `You are an intelligent assistant acting as the user's "Second Brain". Your task is to answer questions based on the user's notes and your general knowledge.

User's knowledge base (their notes):
${notesContext || "No relevant notes found for your question."}

Instructions:
- Answer in English
- Base your answers on the user's notes when possible
- Mention which notes you're referencing
- Use the available tools to create notes, tasks, or folders if the user requests it.
- If no relevant notes found, inform the user and provide a general answer`;

    // Call Google Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${activeApiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: "create_note",
                description: "Create a new note. Use this when the user asks to create a note, save a thought, or write something down.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING", description: "Title of the note." },
                    content: { type: "STRING", description: "Content of the note." }
                  },
                  required: ["title", "content"]
                }
              },
              {
                name: "create_task",
                description: "Create a new task or to-do item.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING", description: "Title of the task." },
                    description: { type: "STRING", description: "Details of the task." },
                    priority: { type: "STRING", description: "Priority level: low, medium, high, or urgent.", enum: ["low", "medium", "high", "urgent"] }
                  },
                  required: ["title"]
                }
              },
              {
                name: "create_folder",
                description: "Create a new folder to organize notes.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING", description: "Name of the folder." }
                  },
                  required: ["name"]
                }
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const part = geminiData.candidates?.[0]?.content?.parts?.[0];
    let assistantMessage = part?.text || "";
    const functionCall = part?.functionCall;
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0;

    let actionResponse = null;

    if (functionCall) {
      const { name, args } = functionCall;
      
      try {
        if (name === "create_note") {
          await supabase.from("notes").insert({
            user_id: user.id,
            title: args.title || "",
            content: args.content || "",
            note_type: "text"
          });
          actionResponse = { type: "create_note", payload: args };
          assistantMessage = language === "ar" ? "✅ تم إنشاء الملاحظة بنجاح." : "✅ Note created successfully.";
        } else if (name === "create_task") {
          await supabase.from("tasks").insert({
            user_id: user.id,
            title: args.title || "",
            description: args.description || "",
            priority: args.priority || "medium",
            status: "todo"
          });
          actionResponse = { type: "create_task", payload: args };
          assistantMessage = language === "ar" ? "✅ تمت إضافة المهمة بنجاح." : "✅ Task added successfully.";
        } else if (name === "create_folder") {
          await supabase.from("folders").insert({
            user_id: user.id,
            name: args.name || (language === "ar" ? "مجلد جديد" : "New Folder"),
          });
          actionResponse = { type: "create_folder", payload: args };
          assistantMessage = language === "ar" ? "✅ تم إنشاء المجلد بنجاح." : "✅ Folder created successfully.";
        }
      } catch (dbErr) {
        console.error("DB Error executing function:", dbErr);
        assistantMessage = language === "ar" ? "❌ حدث خطأ أثناء تنفيذ الأمر." : "❌ Error executing the command.";
      }
    }

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
        action: actionResponse
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        message: "حدث خطأ أثناء معالجة طلبك. يرجى التحقق من مفتاح Gemini API في الإعدادات.",
        error: String(error),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
