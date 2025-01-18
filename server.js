require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.post('/api/generate-habits', async (req, res) => {
    const { goals } = req.body;

    const prompt = `As a world-renowned life coach who has helped millions of people from different areas of life, please generate habits for the following goals, considering priority levels and time commitments. Format the response as a JSON object, grouped by area of life. Each area should have a maximum of 5 habits in total, regardless of the number of goals:

${goals.map(g => `${g.area} (${g.priority} priority, ${g.time ? g.time + ' minutes daily' : 'no time specified'}):
Goal: ${g.goal}`).join('\n\n')}

Please provide specific, actionable habits tailored to each goal and its constraints. Your advice should be motivational and inspiring, drawing from your vast experience in helping people transform their lives. Remember, limit the total habits per area to 5, even if there are multiple goals.

Format the response as follows:
{
  "AreaOfLife1": [
    "Habit 1",
    "Habit 2",
    ...
  ],
  "AreaOfLife2": [
    "Habit 1",
    "Habit 2",
    ...
  ],
  ...
}`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch habits from AI');
        }

        const data = await response.json();
        const habits = JSON.parse(data.choices[0].message.content);

        res.json(habits);
    } catch (error) {
        console.error('Error generating habits:', error);
        res.status(500).json({ error: 'Failed to generate habits' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

