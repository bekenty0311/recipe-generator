const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { ingredients, recipeCount } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: { message: 'API key is missing in Netlify settings.' } }) 
      };
    }

    // Используем стабильную версию модели
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `You are a chef. Create ${recipeCount} recipes using these ingredients: ${ingredients}. 
    Output ONLY a valid JSON array. Each object: {"name": "...", "description": "...", "time": "...", "ingredients": ["..."], "instructions": ["..."]}. 
    No markdown formatting.`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
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
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: { message: error.message } }) 
    };
  }
};
