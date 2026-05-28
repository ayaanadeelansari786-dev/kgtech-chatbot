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
        console.warn(`[WARNING] Received unsupported method ${req.method} on /api/chat`);
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        // Defensive parsing of request body in case it's passed as a raw string
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (jsonErr) {
                console.error("[ERROR] Failed to parse request body string as JSON:", jsonErr);
                res.status(400).json({ error: "Invalid JSON request body" });
                return;
            }
        }

        const messages = body?.messages;

        if (!messages || !Array.isArray(messages)) {
            console.warn("[WARNING] Request missing valid 'messages' array");
            res.status(400).json({ error: 'Invalid request: "messages" array is required' });
            return;
        }

        // 2. Validate environment variable
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY || GROQ_API_KEY.trim() === "") {
            console.error("[CRITICAL ERROR] GROQ_API_KEY environment variable is not defined or is empty in Vercel!");
            res.status(500).json({ 
                error: "Configuration Error: GROQ_API_KEY is not defined in Vercel Environment Variables. Please set it in your Vercel Project Settings." 
            });
            return;
        }

        const GROQ_MODEL = "llama3-70b-8192";
        const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

        console.log(`[INFO] Proxying request to Groq API. Messages count: ${messages.length}`);

        // 3. Make the API Call to Groq
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

        // 4. Handle API responses
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ERROR] Groq API returned error status ${response.status}:`, errorText);
            
            // Try to extract a clean message if it's JSON
            let cleanError = errorText;
            try {
                const parsed = JSON.parse(errorText);
                cleanError = parsed.error?.message || errorText;
            } catch (e) {}

            res.status(response.status).json({ 
                error: `Groq API Error (${response.status}): ${cleanError}` 
            });
            return;
        }

        const data = await response.json();
        console.log("[INFO] Groq API request completed successfully.");
        res.status(200).json(data);

    } catch (error) {
        console.error("[FATAL ERROR] Serverless function crashed:", error);
        res.status(500).json({ 
            error: `Internal Server Error: ${error.message}` 
        });
    }
}
