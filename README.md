# 🌟 LightUp: Your AI Companion in the Browser

<p align="center">
  <img src="assets/intro.png" width="80%" alt="LightUp Logo">
</p>

## 🌈 Meet LightUp
**Effortless AI assistance** that integrates seamlessly into your browser. No more tab switching or context loss. Simply highlight text and receive AI-driven insights instantly.

<p align="center">
  <img src="assets/lightup.png" width="80%" alt="LightUp popup">
</p>

## 🌟 Features

- **🔍 Smart Text Analysis**: Instantly decode complex text passages with ease.
- **🛠️ Multiple Modes**:
  - **Explain**: Get detailed explanations of text or code.
  - **Summarize**: Receive quick summaries of lengthy content.
  - **Analyze**: Dive deep into content with comprehensive analysis.
- **💬 Follow-up Questions**: Engage further with the content through additional queries.
- **🔗 Flexible AI Backend**:
  - Leverage OpenAI's GPT models.
  - Connect to your local LLM (supports llama.cpp, LM Studio, Text Generation WebUI).
  - Utilize Gemini for advanced text processing (API key required).

## 📥 Download

Grab the latest version of LightUp from our [Releases page](https://github.com/lightup/releases). Select the version that suits your browser and follow the installation guide below.

## 🚀 Getting Started

### LightUp User Guide

#### Installation for Users

1. **Download the Extension**
   - Visit the LightUp Releases.
   - Download the latest release ZIP file (lightup-vX.X.X.zip).

2. **Install in Chrome/Brave**
   - Open Chrome/Brave and navigate to `chrome://extensions/`.
   - Enable "Developer mode" in the top right corner.
   - Drag and drop the downloaded ZIP file into the extensions page or click "Load unpacked" and select the unzipped folder.

#### Configuration

1. **Pin the Extension**
   - Click the puzzle piece icon in your browser toolbar.
   - Locate LightUp and click the pin icon for easy access.
   - Right-click the LightUp icon and select "Options" to access Settings.

2. **Select Your AI Backend**:
   - Local LLM (requires running local server) [Download Local LLM](https://example.com/local-llm-download)
   - Gemini (API key required) [Get Gemini API Key](https://example.com/gemini-api-key)
   - OpenAI API (API key required) [Get OpenAI API Key](https://example.com/openai-api-key)

3. **Save Your Settings**

## 🔧 Usage

1. Highlight any text on a webpage.
2. A LightUp popup will appear.
3. Receive instant AI-powered insights.
4. Pose follow-up questions for deeper understanding.

## 🔄 Switching Modes

To change modes, click the LightUp icon in the toolbar. Effortlessly toggle between explaining, summarizing, analyzing, and translating text to suit your needs.

### Installation for Developers

1. **Clone this Repository**:
   ```bash
   git clone https://github.com/your-username/lightup-extension
   cd lightup-extension
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Run the Development Server**:
   ```bash
   pnpm dev
   ```

### Building for Production
