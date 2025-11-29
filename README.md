# Icon Generator 🎨

A web application that generates a set of 4 unique icons in a consistent style using AI. Built with React, Node.js, and the Replicate FLUX Schnell API.

## Features

- 🎯 Generate 4 unique icons from a single prompt
- 🎨 5 preset styles: Flat & Minimal, Pastel Dreams, Bubble Style, Neon Glow, 3D Isometric
- 🌈 Optional brand color customization (HEX codes)
- 📥 Download individual icons or all at once as PNG files
- ⚡ Fast generation using FLUX Schnell optimized mode

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Replicate API token ([Get one here](https://replicate.com))

## Setup Instructions

### 1. Clone or navigate to the project directory

```bash
cd icon-generator
```

### 2. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Replicate API token:

```
REPLICATE_API_TOKEN=your_actual_token_here
PORT=3001
```

### 3. Install dependencies

Install backend dependencies:
```bash
npm install
```

Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

### 4. Run the application

#### Option A: Run both servers separately

Terminal 1 (Backend):
```bash
npm start
```

Terminal 2 (Frontend):
```bash
npm run client
```

#### Option B: Run both servers together (Unix/Mac only)
```bash
npm run dev:all
```

### 5. Access the application

Open your browser and go to:
```
http://localhost:3000
```

The backend API runs on:
```
http://localhost:3001
```

## Usage

1. **Enter a prompt**: Describe the theme for your icon set (e.g., "Toys", "Food", "Travel")
2. **Select a style**: Choose from 5 preset styles
3. **Add brand colors (optional)**: Enter up to 3 HEX color codes to customize the palette
4. **Generate**: Click "Generate Icons" and wait 30-60 seconds
5. **Download**: Download individual icons or all at once

## Example Prompts

- "Toys" → teddy bear, toy car, bunny, fidget toy
- "Food" → pizza, burger, ice cream, sushi
- "Travel" → airplane, suitcase, passport, camera
- "Technology" → laptop, smartphone, headphones, smartwatch
- "Nature" → tree, flower, mountain, sun

## Style Presets

1. **Flat & Minimal**: Clean lines, solid colors, professional icon style
2. **Pastel Dreams**: Soft gradients, gentle rounded shapes, cute aesthetic
3. **Bubble Style**: Glossy, shiny reflections, translucent, playful
4. **Neon Glow**: Glowing edges, dark background, cyberpunk aesthetic
5. **3D Isometric**: Depth and shadows, modern professional style

## API Endpoints

### POST `/api/generate-icons`

Generate 4 unique icons based on the provided parameters.

**Request Body:**
```json
{
  "prompt": "Toys",
  "style": 2,
  "brandColors": ["#FF5733", "#33FF57", "#3357FF"]
}
```

**Response:**
```json
{
  "success": true,
  "icons": [
    {
      "url": "https://...",
      "prompt": "..."
    }
  ]
}
```

### GET `/api/health`

Check API health status.

## Technology Stack

- **Frontend**: React, TypeScript, CSS
- **Backend**: Node.js, Express
- **AI Model**: FLUX Schnell via Replicate API
- **Image Generation**: 512x512 PNG images

## Cost Considerations

This app uses the Replicate API which incurs costs per generation. Each icon set generates 4 images. Check [Replicate pricing](https://replicate.com/pricing) for current rates.

## Troubleshooting

### Icons not generating
- Verify your Replicate API token is correct in `.env`
- Check that the backend server is running on port 3001
- Check browser console and terminal for error messages

### CORS errors
- Ensure the backend is running before the frontend
- Verify the API URL in App.tsx matches your backend URL

### Port conflicts
- Change the PORT in `.env` if 3001 is already in use
- Update the API URL in `client/src/App.tsx` accordingly

## License

MIT License - feel free to use and modify as needed.

## Credits

Powered by [FLUX Schnell](https://replicate.com/black-forest-labs/flux-schnell) via Replicate API.
