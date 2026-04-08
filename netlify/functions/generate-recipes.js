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
     * Используем актуальную модель gemini-2.5-flash-preview-09-2025.
     * Эта модель оптимизирована для быстрой генерации контента и работы с JSON.
     */
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const systemPrompt = `You are a professional chef. Generate exactly ${recipeCount} creative recipes using these ingredients: ${ingredients}. 
    Response MUST be a valid JSON array of objects. 
    Each object structure: {"name": "Recipe Name", "description": "Short summary", "time": "Cooking time", "ingredients": ["item 1", "item 2"], "instructions": ["step 1", "step 2"]}.
    Do not include any markdown formatting or triple backticks. Return ONLY the JSON.`;

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
