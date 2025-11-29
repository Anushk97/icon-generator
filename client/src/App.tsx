import React, { useState, useEffect } from 'react';
import './App.css';

interface Icon {
  url: string;
  prompt: string;
}

interface GenerateResponse {
  success: boolean;
  icons: Icon[];
}

const STYLES = [
  { id: 1, name: 'Flat & Minimal', description: 'Clean lines, solid colors, professional' },
  { id: 2, name: 'Pastel Dreams', description: 'Soft gradients, gentle rounded shapes' },
  { id: 3, name: 'Bubble Style', description: 'Glossy, shiny reflections, playful' },
  { id: 4, name: 'Neon Glow', description: 'Glowing edges, cyberpunk aesthetic' },
  { id: 5, name: '3D Isometric', description: 'Depth and shadows, modern professional' }
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(1);
  const [brandColors, setBrandColors] = useState(['', '', '']);
  const [icons, setIcons] = useState<Icon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...brandColors];
    newColors[index] = value;
    setBrandColors(newColors);
  };

  const generateIcons = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setIcons([]);

    try {
      const filteredColors = brandColors.filter(color => color.trim() !== '');

      // Use Netlify functions in production, local server in development
      const apiUrl = process.env.NODE_ENV === 'production'
        ? '/.netlify/functions/generate-icons'
        : (process.env.REACT_APP_API_URL || 'http://localhost:3001/api/generate-icons');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          brandColors: filteredColors.length > 0 ? filteredColors : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate icons');
      }

      const data: GenerateResponse = await response.json();
      setIcons(data.icons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadIcon = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `icon-${prompt.toLowerCase().replace(/\s+/g, '-')}-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading icon:', err);
    }
  };

  const downloadAll = async () => {
    for (let i = 0; i < icons.length; i++) {
      await downloadIcon(icons[i].url, i);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="App">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <header className="App-header">
        <h1>🎨 Icon Generator</h1>
        <p className="subtitle">Generate 4 unique icons in a consistent style</p>
      </header>

      <main className="container">
        <div className="input-section">
          <div className="form-group">
            <label htmlFor="prompt">Icon Set Prompt</label>
            <input
              id="prompt"
              type="text"
              placeholder="e.g., Toys, Food, Travel, Technology"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Style Preset</label>
            <div className="style-grid">
              {STYLES.map(style => (
                <button
                  key={style.id}
                  className={`style-button ${selectedStyle === style.id ? 'selected' : ''}`}
                  onClick={() => setSelectedStyle(style.id)}
                  disabled={loading}
                >
                  <div className="style-name">{style.name}</div>
                  <div className="style-description">{style.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Brand Colors (Optional)</label>
            <p className="helper-text">Enter HEX codes to customize the color palette</p>
            <div className="color-inputs">
              {brandColors.map((color, index) => (
                <div key={index} className="color-input-wrapper">
                  <input
                    type="text"
                    placeholder="#FF5733"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    disabled={loading}
                    maxLength={7}
                  />
                  {color && (
                    <div 
                      className="color-preview" 
                      style={{ backgroundColor: color }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            className="generate-button"
            onClick={generateIcons}
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Generating Icons...' : 'Generate Icons'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>

        {loading && (
          <div className="loading-section">
            <div className="spinner"></div>
            <p>Creating your unique icon set... This may take 30-60 seconds</p>
          </div>
        )}

        {icons.length > 0 && !loading && (
          <div className="results-section">
            <div className="results-header">
              <h2>Your Icon Set</h2>
              <button className="download-all-button" onClick={downloadAll}>
                Download All
              </button>
            </div>
            
            <div className="icon-grid">
              {icons.map((icon, index) => (
                <div key={index} className="icon-card">
                  <img src={icon.url} alt={`Icon ${index + 1}`} />
                  <button
                    className="download-button"
                    onClick={() => downloadIcon(icon.url, index)}
                  >
                    Download PNG
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Powered by FLUX Schnell via Replicate API</p>
      </footer>
    </div>
  );
}

export default App;
