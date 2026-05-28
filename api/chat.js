// Vercel Serverless Function: api/chat.js
// Proxies client-side requests to Groq to bypass browser CORS restrictions and keep the API key secure.

export default async function handler(req, res) {
    // 1. Enable CORS for external requests (so your WordPress site can access it)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle Preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ error: 'Invalid request: "messages" array is required' });
            return;
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        const GROQ_MODEL = "llama3-70b-8192";
        const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

        const response = await fetch(GROQ_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: messages,
                temperature: 0.7,
                max_tokens: 512,
                top_p: 0.95
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API error response:", errorText);
            res.status(response.status).json({ error: `Groq API error: ${response.statusText}` });
            return;
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
