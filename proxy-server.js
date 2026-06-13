const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const LLM_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const LLM_API_KEY = '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';

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`LLM proxy running on http://localhost:${PORT}`);
});
