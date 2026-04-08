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
        body: JSON.stringify({ error: { message: 'API key is not configured in Netlify environment variables.' } }) 
      };
    }

    // Используем актуальную модель gemini-2.5-flash-preview-09-2025
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const systemPrompt = `You are an expert chef. Generate ${recipeCount} creative and delicious recipes based ONLY on the following ingredients: ${ingredients}. 
    Return the response as a valid JSON array of objects. 
    Each object must have: "name", "description", "time", "ingredients" (array of strings), and "instructions" (array of strings). 
    Do not include any extra text or markdown backticks outside of the JSON array.`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google API Error:', data);
      return { 
        statusCode: response.status, 
        body: JSON.stringify(data) 
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Server Error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: { message: error.message } }) 
    };
  }
};
