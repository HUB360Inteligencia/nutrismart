
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import handler from '../api/gemini';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Higher limit for images

// Adapter to match Vercel's req/res signature if needed, 
// but Express req/res are mostly compatible for standard usage.
// VercelRequest adds `query`, `cookies`, `body` which Express has.
// VercelResponse adds `status()`, `send()`, `json()` which Express has.

app.post('/api/gemini', async (req, res) => {
    try {
        // @ts-ignore - mismatch in types between Express and Vercel but runtime compatible
        await handler(req, res);
    } catch (error) {
        console.error('Local Server Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Local API Server running at http://localhost:${PORT}`);
});
