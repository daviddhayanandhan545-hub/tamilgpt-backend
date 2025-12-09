export default async function handler(req, res) {
    if (req.method === "OPTIONS") {
        return res.status(204)
            .setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*")
            .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
            .setHeader("Access-Control-Allow-Headers", "Content-Type")
            .end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "POST only allowed" });
    }

    const allowed = process.env.ALLOWED_ORIGIN || "*";
    res.setHeader("Access-Control-Allow-Origin", allowed);

    try {
        const body = req.body || await readBody(req);
        const { messages, model } = body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "messages array required" });
        }

        const payload = {
            model: model || "gpt-4o-mini",
            messages,
            max_tokens: 800,
            temperature: 0.2
        };

        const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const text = await r.text();
        if (!r.ok) return res.status(502).json({ error: text });

        return res.json(JSON.parse(text));

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => data += chunk);
        req.on("end", () => {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(e); }
        });
    });
}
