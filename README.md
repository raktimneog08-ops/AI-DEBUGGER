# CodeFixer - AI Debugging Assistant

CodeFixer is a lightweight, frontend-only web application that serves as your personal expert AI debugging assistant. Powered by the Google Gemini API, it helps you find bugs, explains errors, and rewrites code adhering to modern best practices.

## 🚀 Features

- **Real-time AI Responses**: Integrates with the Google Gemini API (gemini-2.5-flash) to stream responses in real-time.
- **Syntax Highlighting**: Automatically formats and highlights code blocks using [Highlight.js](https://highlightjs.org/).
- **Markdown Support**: Interprets markdown in the AI's responses for rich text formatting using [Marked.js](https://marked.js.org/).
- **Code Copying**: Easily copy returned code solutions directly to your clipboard.
- **Secure Local Storage**: Your Gemini API key is securely saved locally in your browser's `localStorage`.
- **Responsive UI**: A modern, clean, and responsive design optimized for developers.

## 🛠️ Technologies Used

- **HTML5 / CSS3 / Vanilla JavaScript**
- **Google Gemini 2.5 Flash API** for generating intelligent debugging responses.
- **Marked.js** for Markdown parsing.
- **Highlight.js** for code syntax highlighting.
- **DOMPurify** for sanitizing generated HTML.
- **FontAwesome** for icons.
- **Google Fonts** (Outfit, Fira Code) for typography.

## 📋 Getting Started

### Prerequisites

To use CodeFixer, you will need a valid **Google Gemini API Key**. You can obtain one by visiting [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Usage

Since CodeFixer is a frontend-only web app, there's no complex backend setup required:

1. Clone or download this repository.
2. Open the directory containing the project.
3. Simply double-click on `index.html` to open it in your favorite web browser.
4. On the left sidebar, paste your **Google Gemini API Key** into the settings panel.
5. In the main chat area, paste the broken code, an error message, or describe the problem you're facing.
6. Press the **Send** button or `Enter` to receive debugging help from the AI!

## 📂 Project Structure

- `index.html`: The main structural layout of the web app.
- `style.css`: The styling file governing the app's modern and responsive design.
- `script.js`: Contains all the application logic, API communication, and DOM manipulation.
- `favicon.png`: The favicon image.

## 🔒 Privacy & Security

Your Google Gemini API Key is never sent to any servers other than Google's secure API endpoints. It is kept securely in your browser's local storage (`localStorage`) and used entirely client-side.

## 📜 License

This project is fully open source. Feel free to use, modify, and distribute it.
