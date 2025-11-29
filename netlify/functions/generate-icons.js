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

// Negative prompts to ensure quality and consistency
const NEGATIVE_PROMPT = "blurry, low quality, pixelated, text, watermark, signature, distorted, ugly, bad anatomy, photorealistic, photo, photograph";

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Helper: Generate a consistent seed based on prompt and style
function generateSeed(prompt, style) {
  let hash = 0;
  const str = `${prompt}-${style}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Helper: Retry logic with exponential backoff
async function retryWithBackoff(fn, maxRetries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Helper: Validate and sanitize input
function validateInput(prompt, style, brandColors) {
  const errors = [];

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    errors.push('Prompt is required and must be a non-empty string');
  }

  if (prompt && prompt.length > 200) {
    errors.push('Prompt must be less than 200 characters');
  }

  if (!style || !STYLE_PROMPTS[style]) {
    errors.push('Invalid style selection');
  }

  if (brandColors && !Array.isArray(brandColors)) {
    errors.push('Brand colors must be an array');
  }

  if (brandColors && brandColors.length > 5) {
    errors.push('Maximum 5 brand colors allowed');
  }

  return errors;
}

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

    // Validate input
    const validationErrors = validateInput(prompt, style, brandColors);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          details: validationErrors
        })
      };
    }

    const styleDescription = STYLE_PROMPTS[style];
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Generate consistent seed for this icon set
    const baseSeed = generateSeed(prompt.trim(), style);

    const colorInstruction = brandColors && brandColors.length > 0
      ? `, using these exact colors: ${brandColors.join(', ')}, maintain color consistency`
      : '';

    console.log(`Generating 4 icons for prompt: "${prompt}" with style ${style}, base seed: ${baseSeed}`);

    // Generate 4 different icons with partial success handling
    const results = [];
    const errors = [];

    for (let index = 0; index < ICON_VARIATIONS.length; index++) {
      const variation = ICON_VARIATIONS[index];
      const iconSeed = baseSeed + index; // Incremental seed for variations

      try {
        const fullPrompt = `${prompt} icon, ${variation}, ${styleDescription}${colorInstruction}, 512x512, icon design, white background, centered, high quality`;

        console.log(`Generating icon ${index + 1}/4 with seed ${iconSeed}...`);

        // Retry logic for individual icon generation
        const output = await retryWithBackoff(async () => {
          return await replicate.run(
            "black-forest-labs/flux-schnell",
            {
              input: {
                prompt: fullPrompt,
                num_outputs: 1,
                aspect_ratio: "1:1",
                output_format: "png",
                output_quality: 90,
                go_fast: true,
                seed: iconSeed
              }
            }
          );
        });

        console.log(`Icon ${index + 1}/4 completed!`);

        // Handle FileOutput/ReadableStream from Replicate v1.x
        let imageUrl;
        if (Array.isArray(output)) {
          imageUrl = String(output[0]);
        } else {
          imageUrl = String(output);
        }

        console.log(`Image URL for icon ${index + 1}:`, imageUrl);

        results.push({
          index: index,
          url: imageUrl,
          prompt: fullPrompt,
          seed: iconSeed
        });

      } catch (error) {
        console.error(`Failed to generate icon ${index + 1}/4:`, error);
        errors.push({
          index: index,
          error: error.message
        });
      }
    }

    // Return partial success if at least 2 icons succeeded
    if (results.length >= 2) {
      console.log(`Generated ${results.length}/4 icons successfully`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          icons: results.sort((a, b) => a.index - b.index).map(r => ({
            url: r.url,
            prompt: r.prompt,
            seed: r.seed
          })),
          partial: results.length < 4,
          errors: errors.length > 0 ? errors : undefined
        })
      };
    } else {
      // Complete failure
      throw new Error(`Failed to generate sufficient icons. Only ${results.length}/4 succeeded.`);
    }

  } catch (error) {
    console.error('Error generating icons:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to generate icons';
    let statusCode = 500;

    if (error.message.includes('API key')) {
      errorMessage = 'API configuration error';
      statusCode = 503;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout - please try again';
      statusCode = 504;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded - please wait a moment';
      statusCode = 429;
    }

    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        details: error.message
      })
    };
  }
};
