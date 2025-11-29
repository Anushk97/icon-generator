const express = require('express');
const cors = require('cors');
const Replicate = require('replicate');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

app.post('/api/generate-icons', async (req, res) => {
  try {
    const { prompt, style, brandColors } = req.body;

    if (!prompt || !style) {
      return res.status(400).json({ error: 'Prompt and style are required' });
    }

    const styleDescription = STYLE_PROMPTS[style];
    if (!styleDescription) {
      return res.status(400).json({ error: 'Invalid style selection' });
    }

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
        // If it's an array, get the first element and convert to string
        imageUrl = String(output[0]);
      } else {
        // If it's a single output, convert to string
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

    res.json({
      success: true,
      icons: results.map(r => ({
        url: r.url,
        prompt: r.prompt
      }))
    });

  } catch (error) {
    console.error('Error generating icons:', error);
    res.status(500).json({ 
      error: 'Failed to generate icons', 
      details: error.message 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
