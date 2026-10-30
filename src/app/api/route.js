import { NextResponse } from 'next/server';
const Groq = require("groq-sdk");

function getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is missing. Add it to your .env.local file before using the chat API.");
    }

    return new Groq({ apiKey });
}

// Call Groq LLaMA chat API
async function getGroqChatCompletion(content) {
    const groq = getGroqClient();

    return groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: content
            }
        ],
        model: "llama-3.3-70b-versatile"
    });
}

// Process the response for clean code
async function getCleanCode(content) {
    const chatCompletion = await getGroqChatCompletion(content);
    let message = chatCompletion.choices[0]?.message?.content || "";

    // Extract code inside ``` blocks
    const codeMatch = message.match(/```(?:jsx|js)?([\s\S]*?)```/);
    if (codeMatch) {
        message = codeMatch[1].trim();
    }

    // Remove single-line comments
    message = message.replace(/^\s*\/\/.*$/gm, "").trim();

    // Remove multi-line comments
    message = message.replace(/\/\*[\s\S]*?\*\//g, "").trim();

    return message;
}

// Handle both GET and POST requests
async function handleRequest(request) {
    const { searchParams } = new URL(request.url);
    const contentParam = searchParams.get('content');
    const codeParam = searchParams.get('code');

    if (codeParam) {
        // Return clean code as plain text
        const response = await getCleanCode(codeParam);
        return new NextResponse(response, {
            headers: { "Content-Type": "text/plain" }
        });
    }

    const response = await getGroqChatCompletion(contentParam || "Hi, how are you?");
    const message = response.choices[0]?.message?.content || "";
    return NextResponse.json({ message });
}

export async function GET(request) {
    try {
        return await handleRequest(request);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred while generating a response." },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        return await handleRequest(request);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred while generating a response." },
            { status: 500 }
        );
    }
}
