// netlify/functions/generate-recipes.js

exports.handler = async function (event) {
  // Проверяем, что это POST-запрос, иначе выходим
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { ingredients, recipeCount } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "API key is not configured." }) };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const prompt = `
      Create ${recipeCount} different recipes from the following ingredients: ${ingredients}.
      The recipes should be simple, easy to follow, and have step-by-step instructions.
      For each recipe, specify the approximate cooking time.
      Return the response as a JSON array.
      Each object in the array must match the schema.
    `;
    
    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          description: { type: "STRING" },
          time: { type: "STRING" },
          ingredients: { type: "ARRAY", items: { type: "STRING" } },
          instructions: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["name", "description", "time", "ingredients", "instructions"]
      }
    };

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Google API Error:", errorBody);
      return { statusCode: response.status, body: JSON.stringify({ error: `Google API Error: ${errorBody}` }) };
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
