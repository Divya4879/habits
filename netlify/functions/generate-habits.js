const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { goals, timestamp } = JSON.parse(event.body);

  const generatePrompt = (goals, timestamp) => {
    const prompt = `As a world-renowned life coach who has helped millions of people from different areas of life, please generate habits for the following goals, considering priority levels and time commitments. Format the response as a JSON object, grouped by area of life. 

${goals.map(g => `${g.area} (${g.priority} priority, ${g.time ? g.time + ' minutes daily' : 'no time specified'}):
Goal: ${g.goal}`).join('\n\n')}

Please provide specific, actionable habits tailored to each goal and its constraints. Your advice should be motivational and inspiring, drawing from your vast experience in helping people transform their lives. 

Consider the following rules:
1. For high priority areas, provide 3-5 habits.
2. For medium priority areas, provide 2-4 habits.
3. For low priority areas, provide 1-3 habits.
4. Ensure that the habits are varied and not repetitive.
5. Take into account the time commitment specified for each area.

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
}

Current timestamp: ${timestamp} (Use this to ensure variety in responses)`;

    return prompt;
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: generatePrompt(goals, timestamp) }],
        max_tokens: 1500,
        temperature: 0.7 // Increase temperature for more variety
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch habits from AI');
    }

    const data = await response.json();
    const habits = JSON.parse(data.choices[0].message.content);

    // Post-process habits to ensure priority-based limits
    const processedHabits = Object.entries(habits).reduce((acc, [area, areaHabits]) => {
      const areaGoal = goals.find(g => g.area.toLowerCase() === area.toLowerCase());
      if (areaGoal) {
        let maxHabits;
        switch (areaGoal.priority) {
          case 'high':
            maxHabits = 5;
            break;
          case 'medium':
            maxHabits = 4;
            break;
          case 'low':
            maxHabits = 3;
            break;
          default:
            maxHabits = 5;
        }
        acc[area] = areaHabits.slice(0, maxHabits);
      }
      return acc;
    }, {});

    return {
      statusCode: 200,
      body: JSON.stringify(processedHabits)
    };
  } catch (error) {
    console.error('Error generating habits:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate habits' })
    };
  }
};