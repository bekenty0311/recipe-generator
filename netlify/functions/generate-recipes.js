const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Разрешаем только POST запросы
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { ingredients, recipeCount } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: { message: 'API key is missing in Netlify environment variables.' } }) 
      };
    }

    /**
     * Используем gemini-2.0-flash — современную и быструю модель.
     * Она отлично справляется со структурированным выводом JSON.
     */
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `You are a professional chef. Generate exactly ${recipeCount} creative recipes using these ingredients: ${ingredients}. 
    Response MUST be a valid JSON array of objects. 
    Each object structure: {"name": "Recipe Name", "description": "Short summary", "time": "Cooking time", "ingredients": ["item 1", "item 2"], "instructions": ["step 1", "step 2"]}.
    IMPORTANT: Return ONLY the JSON array. No markdown formatting, no backticks, no extra text.`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google API Error Response:', data);
      return { 
        statusCode: response.status, 
        body: JSON.stringify(data) 
      };
    }

    // Проверка на наличие данных в ответе
    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
      throw new Error("AI returned empty content");
    }

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Server-side exception:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: { message: error.message } }) 
    };
  }
};
