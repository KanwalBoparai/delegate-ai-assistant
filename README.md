# Delegate AI Assistant

A chatbot widget you can embed on any website.

## Quick Start

1. **Get API Key** - Sign up at [openrouter.ai/keys](https://openrouter.ai/keys) (free)

2. **Configure** - Add your key to `.env`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-xxxxx
   ```

3. **Run**:
   ```bash
   npm install
   npm start
   ```

4. **Open** http://localhost:3000

## Embed on Any Website

Add this script to any HTML page:

```html
<script src="http://localhost:3000/embed.js"></script>
```

## Keyboard Shortcuts

- `Cmd/Ctrl + K` - Open/close chat
- `Cmd/Ctrl + M` - Voice input

## Files

| File | Purpose |
|------|---------|
| `server.js` | API server |
| `chatbot.js` | Chat widget logic |
| `styles.css` | Widget styling |
| `embed.js` | Embed loader |
| `index.html` | Demo page |

## Customize

**Change greeting** - Edit `chatbot.js` line ~470

**Change colors** - Edit CSS variables in `styles.css`

**Change AI behavior** - Edit system prompt in `server.js` line ~42
