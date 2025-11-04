# Speaking Arabic - Belajar Komunikasi Bahasa Arab

An AI-powered web application for learning Arabic language through interactive translation, grammar analysis, and pronunciation practice. This app helps Indonesian speakers translate sentences to Arabic with detailed explanations, grammatical analysis (nahwu/sharaf), and text-to-speech functionality.

## Features

### 🔄 Dual-Mode Translation System
- **Translate Mode**: Fast translation from Indonesian to Arabic with word-by-word explanations
- **Ask Mode**: Conversational Q&A for follow-up questions about grammar, vocabulary, and language rules

### 📚 Keyword Analysis
- Automatic extraction of important keywords from translations
- Detailed grammatical analysis (nahwu/sharaf) for each keyword:
  - **For verbs (fi'il)**: Root word, madhi (past), mudhari' (present/future), amr (imperative) forms
  - **For nouns (isim)**: Singular and plural forms, plural type classification
- Searchable keyword library with persistent storage

### 🎤 Voice Input
- Speech-to-text for Indonesian input using Web Speech API
- Continuous recording with real-time transcription
- Browser compatibility check (Chrome, Edge, Safari)

### 🔊 Arabic Pronunciation
- Text-to-speech for Arabic text with native pronunciation
- Audio caching system (50 items, 1-hour TTL) to reduce API calls
- Click any Arabic text to hear its pronunciation

### 💬 Multi-Session Chat
- Multiple conversation sessions with auto-generated titles
- Persistent chat history stored locally
- Session management with sidebar navigation

### 🎯 User-Friendly Features
- Responsive design (mobile & desktop)
- Dark theme UI optimized for reading
- Arabic text with complete harakat (diacritical marks)
- Latin transliteration for pronunciation guidance
- No server required - runs entirely in the browser

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **AI/ML**: Google Gemini 2.5 Flash (via @google/genai SDK)
- **TTS**: Gemini 2.5 Flash Preview TTS (Kore voice)
- **State Management**: React Hooks + Custom localStorage hook
- **Styling**: Tailwind CSS (utility classes)
- **Deployment**: Netlify

## Prerequisites

- **Node.js** (v16 or higher recommended)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

## Setup and Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd speak-arabic
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure API Key

You have two options for providing the Gemini API key:

**Option A: Environment Variable (Recommended for development)**

Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY=your_api_key_here
```

**Option B: User-Provided Key (Runtime)**

Skip the `.env.local` file and the app will prompt users to enter their API key through the UI. The key will be stored in the browser's localStorage.

### 4. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build and Deployment

### Build for production

```bash
npm run build
```

This generates optimized static files in the `dist/` directory.

### Preview production build

```bash
npm run preview
```

### Deploy to Netlify

The project is pre-configured for Netlify deployment:

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `GEMINI_API_KEY` (optional)

The `netlify.toml` file includes SPA redirect configuration for client-side routing.

## How to Use

### Getting Started

1. **Enter your Gemini API Key** (if not set via environment variable)
2. **Start a new conversation** by clicking "Percakapan Baru" or selecting an example

### Translate Mode

1. Type an Indonesian sentence in the input field (or use voice input)
2. Click send or press Enter
3. View the Arabic translation with:
   - Full sentence translation with harakat
   - Transliteration in Latin characters
   - Word-by-word explanation
   - Extracted keywords with grammatical details
4. Click any Arabic text to hear its pronunciation
5. Click keyword cards to view detailed grammatical explanations

### Ask Mode

1. After sending your first translation, switch to "Mode Tanya"
2. Ask follow-up questions about grammar, vocabulary, or Arabic language rules
3. Receive detailed explanations in Indonesian with Markdown formatting

### Managing Keywords

1. Navigate to "Daftar Kata Kunci" from the sidebar
2. Search keywords by Indonesian, Arabic, or transliteration
3. Click on any keyword card to expand detailed grammar information
4. Clear all keywords using the "Hapus Semua" button

## Project Structure

```
speak-arabic/
├── components/          # Reusable UI components
│   ├── ChatMessage.tsx  # Message display component
│   ├── KeywordCard.tsx  # Keyword display with expandable details
│   ├── KeywordList.tsx  # List of keywords
│   ├── Sidebar.tsx      # Navigation sidebar
│   └── icons.tsx        # SVG icon components
├── pages/              # Page-level components
│   ├── ChatPage.tsx    # Main translation interface
│   └── KeywordsPage.tsx # Keywords library page
├── services/           # External API integrations
│   ├── geminiService.ts # Google AI/Gemini API client
│   └── audioCache.ts    # TTS audio caching service
├── hooks/              # Custom React hooks
│   └── useLocalStorage.ts # Persistent state hook
├── utils/              # Utility functions
│   ├── audioUtils.ts   # Audio processing utilities
│   ├── voiceUtils.ts   # Voice recognition utilities
│   └── idGenerator.ts  # Unique ID generation
├── App.tsx             # Root component
├── types.ts            # TypeScript type definitions
└── index.tsx           # Application entry point
```

## API Key Security

- API keys stored in localStorage are only accessible to your browser
- Keys are never sent to any server except Google's Gemini API
- For production deployments, use environment variables to avoid exposing keys in client-side code
- Consider implementing a backend proxy for API calls in production environments

## Browser Compatibility

- **Voice Input**: Chrome, Edge, Safari (requires Web Speech API support)
- **General Usage**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Recommended**: Chrome or Edge for full feature support

## Disclaimer

This application is designed as an AI-powered learning tool. While the AI provides helpful translations and grammar explanations:

- Answers may not always be 100% accurate
- Always verify information with qualified Arabic language teachers
- Especially important for religious texts and contexts
- Use this as a supplementary learning tool, not a replacement for formal education

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

[Add your license information here]

## Acknowledgments

- Powered by [Google Gemini AI](https://ai.google.dev/)
- Built with [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- Deployed on [Netlify](https://www.netlify.com/)
