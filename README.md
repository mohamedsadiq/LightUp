## LightUp : AI-Powered Annotations for every page on the web.

<p align="center">
  <img src="assets/intro.png" width="100%" height="100%" alt="LightUp Logo">
</p>

## ✨  Meet LightUp
Seamless AI assistance that lives in your browser. No new tabs. No context switching. No interruptions. Just highlight any text and instantly get AI-powered insights.





## ✨ Features

- **Smart Text Analysis**: Get instant explanations for complex text passages

- **Multiple Modes**:
  - 🔍 Explain - Detailed explanations of text
  - 📝 Summarize - Quick summaries of longer content
  - 📊 Analyze - Deep analysis of selected content
  - 🌐 Translate - Translate text into different languages
- **Follow-up Questions**: Ask additional questions about the analyzed content to dive deeper
- **Flexible AI Backend**:
  - Use OpenAI's GPT models
  - Connect to your local LLM (supports llama.cpp, LM Studio, Text Generation WebUI)
  - Google Gemini Models
    - Gemini Pro
    - Gemini Pro Vision
    - Gemini 1.0 Pro
    - Gemini 1.5 Pro
    - Gemini 1.5 Flash
  
## 🌙 Dark Mode
LightUp also supports a dark mode to reduce eye strain and provide a comfortable browsing experience in low-light environments. You can easily switch between light and dark themes based on your preference.




## 📥 Download

Download the latest version of LightUp from our [Releases page](https://github.com/lightup/releases). Choose the appropriate version for your browser and follow the installation instructions below.


## 🚀 Getting Started

## LightUp User Guide

### Installation for users

1. Download the Extension
  - Go to the LightUp Releases
  - Download the latest release ZIP file (lightup-vX.X.X.zip)

2. Install in Chrome/Brave
   - Open Chrome/Brave and go to chrome://extensions/
   - Enable "Developer mode" in the top right corner
   - Drag and drop the downloaded ZIP file into the extensions page
OR click "Load unpacked" and select the unzipped folder.


### Configuration

1. Pin the Extension
   - Click the puzzle piece icon in your browser toolbar
   - Find LightUp and click the pin icon to keep it easily accessible
   - Right-click the LightUp icon and choose "Options" to go directly to Settings
  
2. Choose your preferred AI backend:
   - Local LLM (requires running local serverlocal-llm-download)
   - OpenAI API (requires API key)
   - Google Gemini (requires Gemini API key and model selection)

3. Save your settings

## 🔧 Usage

1. Select any text on a webpage
2. A LightUp popup will appear
3. Get instant AI-powered insights
4. Ask follow-up questions for deeper understanding

## Switching Modes

If you want to change the mode, click on the LightUp icon in the toolbar to switch between different modes. This allows you to easily toggle between explaining, summarizing, analyzing, and translating text as per your needs.


### Installation for Developers

1. Clone this repository:
```bash
git clone https://github.com/mohamedsadiq/LightUp
cd lightup-extension
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

### Building for Production

```bash
pnpm build
# or
npm run build
```

## 🛠️ Development

This extension is built with:
- [Plasmo Framework](https://docs.plasmo.com/)
- React + TypeScript
- Framer Motion for animations



## 📝 License


This project is licensed under the Apache 2.0 License - see the [LICENSE]([https://github.com/apache/.github/blob/main/LICENSE](https://github.com/mohamedsadiq/LightUp?tab=Apache-2.0-1-ov-file)) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with [Plasmo](https://docs.plasmo.com/)
- Powered by OpenAI/Local LLM 

---

<p align="center">
  Made by [Moe Sadiq](https://twitter.com/sadiq_moo)  
</p>
