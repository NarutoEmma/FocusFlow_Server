//server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const APP_SECRET = process.env.APP_SECRET || '';
const PROVIDER = (process.env.PROVIDER || 'groq').toLowerCase();

const PROVIDERS = {
    openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        keyName: 'OPENAI_API_KEY',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        authHeader: (key) => `Bearer ${key}`,
        requestBody: (messages) => ({
            model: PROVIDERS.openai.model,
            messages,
            max_tokens: 400,
            temperature: 0.6,
        }),
        parseReply: (json) => json?.choices?.[0]?.message?.content?.trim() || '',
    },
    groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        keyName: 'GROQ_API_KEY',
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        authHeader: (key) => `Bearer ${key}`,
        requestBody: (messages) => ({
            model: PROVIDERS.groq.model,
            messages,
            max_tokens: 400,
            temperature: 0.6,
        }),
        parseReply: (json) => json?.choices?.[0]?.message?.content?.trim() || '',
    },
};

//validate provider/key
const cfg = PROVIDERS[PROVIDER];
if (!cfg) {
    console.error(`Unsupported PROVIDER="${PROVIDER}". Use "groq" or "openai".`);
    process.exit(1);
}
const apiKey = process.env[cfg.keyName];
if (!apiKey) {
    console.error(`Missing ${cfg.keyName} in .env for provider "${PROVIDER}".`);
    process.exit(1);
}

//summarize modules provided by client
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
function daysLeftFromIso(iso) {
    if (!iso) return null;
    const due = new Date(iso);
    if (isNaN(due.getTime())) return null;
    const today = startOfDay(new Date());
    const end = startOfDay(due);
    return Math.ceil((end.getTime() - today.getTime()) / MS_PER_DAY);
}
function labelFromDaysLeft(n) {
    if (typeof n !== 'number') return 'no due date';
    if (n > 0) return `${n} day${n === 1 ? '' : 's'} left`;
    if (n === 0) return 'due today';
    const a = Math.abs(n);
    return `${a} day${a === 1 ? '' : 's'} overdue`;
}
function summarizeModules(mods = [], limit = 8) {
    if (!Array.isArray(mods) || mods.length === 0) return null;
    const normalized = mods
        .map((m) => {
            const completed = !!m?.completed;
            const days = typeof m?.daysLeft === 'number' ? m.daysLeft : daysLeftFromIso(m?.dueDate);
            const title = (m?.title || 'Untitled').toString().slice(0, 80);
            const label = completed ? 'completed' : labelFromDaysLeft(days);
            const orderKey = completed ? 99999 : (typeof days === 'number' ? days : 9999);
            return { title, label, orderKey };
        })
        .sort((a, b) => a.orderKey - b.orderKey)
        .slice(0, limit);

    return 'User modules: ' + normalized.map(m => `${m.title} (${m.label})`).join('; ');
}

app.post('/api/chat', async (req, res) => {
    try {
        const clientKey = req.header('x-api-key') || '';
        if (APP_SECRET && clientKey !== APP_SECRET) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        //read user name and modules from the request
        const userName = (req.header('x-user-name') || '').trim();
        const modules = Array.isArray(req.body?.modules) ? req.body.modules : null;

        const { message, messages } = req.body;
        const chatMessages = [
            { role: 'system', content:
                    'You are a friendly study assistant named FocusFlow. ' +
                    'Your job is to help students with school work and productivity, regardless of their year or program. ' +
                    'If the user strays away from academic topics, politely steer them back to study-related discussions. ' +
                    'Do not engage in topics unrelated to school work. ' +
                    'If the user mentions an emergency, advise them to contact local emergency services or helplines. ' +
                    'If the user is in the United Kingdom, provide a list of UK emergency helplines.'
            },
        ];

        //add a short personalization message with the current user's name
        if (userName) {
            chatMessages.push({ role: 'system', content: `the user's name is ${userName}, address them by the name when appropriate.` });
        }
        //add modules summary
        const modulesSummary = summarizeModules(modules, 8);
        if (modulesSummary) {
            chatMessages.push({ role: 'system', content: modulesSummary });
        }

        if (Array.isArray(messages)) {
            for (const m of messages) {
                chatMessages.push({
                    role: m.role === 'ai' ? 'assistant' : 'user',
                    content: m.text,
                });
            }
        } else if (message) {
            chatMessages.push({ role: 'user', content: message });
        } else {
            return res.status(400).json({ error: 'No message provided' });
        }

        const resp = await fetch(cfg.url, {
            method: 'POST',
            headers: {
                'Authorization': cfg.authHeader(apiKey),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cfg.requestBody(chatMessages)),
        });
//update
        if (!resp.ok) {
            const text = await resp.text();
            return res.status(resp.status).json({ error: 'Provider error', status: resp.status, details: text });
        }

        const data = await resp.json();
        const assistant = cfg.parseReply(data);
        res.json({ reply: assistant });
    } catch (err) {
        console.error('Chat error:', err?.message || err);
        res.status(500).json({ error: 'Server error', details: err?.message || err });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`AI proxy (${PROVIDER}) running on http://localhost:${port}`));