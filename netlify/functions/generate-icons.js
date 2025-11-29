const Replicate = require('replicate');

const STYLE_PROMPTS = {
  1: "simple flat icon design, minimal, clean lines, solid colors, professional icon style",
  2: "pastel colors, soft gradients, gentle rounded shapes, cute aesthetic, dreamy icon style",
  3: "bubble style, glossy, shiny reflections, translucent, playful, vibrant icon style",
  4: "neon style, glowing edges, dark background, cyberpunk aesthetic, luminous icon style",
  5: "3D rendered, isometric view, depth and shadows, modern professional icon style"
};

const ICON_VARIATIONS = [
  "variation 1, primary subject",
  "variation 2, alternative angle",
  "variation 3, different composition",
  "variation 4, unique perspective"
];

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { prompt, style, brandColors } = JSON.parse(event.body);

    if (!prompt || !style) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt and style are required' })
      };
    }

    const styleDescription = STYLE_PROMPTS[style];
    if (!styleDescription) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid style selection' })
      };
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const colorInstruction = brandColors
      ? `, using color palette: ${brandColors.join(', ')}`
      : '';

    console.log(`Generating 4 icons for prompt: "${prompt}" with style ${style}`);

    // Generate 4 different icons
    const promises = ICON_VARIATIONS.map(async (variation, index) => {
      const fullPrompt = `${prompt} icon, ${variation}, ${styleDescription}${colorInstruction}, 512x512, icon design, white background, centered`;

      console.log(`Generating icon ${index + 1}/4...`);

      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt: fullPrompt,
            num_outputs: 1,
            aspect_ratio: "1:1",
            output_format: "png",
            output_quality: 90,
            go_fast: true
          }
        }
      );

      console.log(`Icon ${index + 1}/4 completed!`);

      // Handle FileOutput/ReadableStream from Replicate v1.x
      let imageUrl;
      if (Array.isArray(output)) {
        imageUrl = String(output[0]);
      } else {
        imageUrl = String(output);
      }

      console.log(`Image URL for icon ${index + 1}:`, imageUrl);

      return {
        index: index,
        url: imageUrl,
        prompt: fullPrompt
      };
    });

    const results = await Promise.all(promises);

    // Sort by index to maintain order
    results.sort((a, b) => a.index - b.index);

    console.log('All 4 icons generated successfully!');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        icons: results.map(r => ({
          url: r.url,
          prompt: r.prompt
        }))
      })
    };

  } catch (error) {
    console.error('Error generating icons:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate icons',
        details: error.message
      })
    };
  }
};
