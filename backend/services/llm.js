const fs = require("fs");
const path = require("path");

const docsPath = path.join(__dirname, "..", "docs.json");
const docs = JSON.parse(fs.readFileSync(docsPath, "utf-8"));

function buildDocsContext() {
    return docs
        .map((doc) => `### ${doc.title}\n${doc.content}`)
        .join("\n\n");
}

function buildSystemPrompt() {
    const docsContext = buildDocsContext();

    return [
        "You are a helpful support assistant.",
        "You must answer questions ONLY using the product documentation provided below.",
        "If the user asks something that is not covered in the documentation, you must respond exactly with:",
        '"Sorry, I don\'t have information about that."',
        "Do not guess, do not make up information, and do not use any external knowledge.",
        "",
        "--- PRODUCT DOCUMENTATION ---",
        docsContext,
        "--- END DOCUMENTATION ---",
    ].join("\n");
}

function buildMessages(chatHistory, userMessage) {
    const messages = [
        { role: "system", content: buildSystemPrompt() },
    ];

    chatHistory.forEach((msg) => {
        messages.push({ role: msg.role, content: msg.content });
    });

    messages.push({ role: "user", content: userMessage });

    return messages;
}

async function callOpenRouter(messages) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "google/gemini-2.0-flash-lite-001",
            messages: messages,
            temperature: 0.3,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`OpenRouter error (${response.status}): ${errorBody}`);
        return null;
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) return null;
    return data.choices[0].message.content.trim();
}

async function callGeminiDirect(messages) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const systemInstruction = messages.find((m) => m.role === "system")?.content || "";
    const conversationMessages = messages.filter((m) => m.role !== "system");

    const contents = conversationMessages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
    }));

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: contents,
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1024,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini direct error (${response.status}): ${errorBody}`);
        return null;
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) return null;
    return data.candidates[0].content.parts[0].text.trim();
}

async function getAssistantResponse(chatHistory, userMessage) {
    const messages = buildMessages(chatHistory, userMessage);

    // Try OpenRouter first, then fall back to direct Gemini API
    let reply = await callOpenRouter(messages);
    if (reply) return reply;

    reply = await callGeminiDirect(messages);
    if (reply) return reply;

    throw new Error(
        "LLM API is unavailable. Ensure OPENROUTER_API_KEY or GEMINI_API_KEY is set correctly in .env"
    );
}

module.exports = { getAssistantResponse };
