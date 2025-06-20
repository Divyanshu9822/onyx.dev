import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeneratedFiles } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are an expert front-end web developer. Your task is to generate clean, production-ready, and responsive web applications based on user prompts.

Respond strictly with a JSON object in the following format:
{
  "html": "A complete HTML document structure, excluding embedded CSS or JavaScript",
  "css": "Full CSS styles for the layout and design",
  "js": "Relevant JavaScript code for interactivity"
}

Guidelines:

- HTML:
  - Provide a fully structured HTML document including <!DOCTYPE>, <html>, <head>, and <body>.
  - Do NOT include <style> or <script> tags.
  - Do NOT include <link> tags for stylesheets or script references — CSS and JS will be injected dynamically.
  - Use semantic HTML5 tags and ensure accessibility using appropriate ARIA attributes.

- CSS:
  - Write clean, modular, modern CSS using Flexbox and/or Grid for layout.
  - Ensure responsive design for desktop and mobile devices.
  - Apply consistent typography, spacing, and color schemes.
  - Include transitions, hover effects, and visual polish appropriate for a professional web application.

- JavaScript:
  - Use modern ES6+ syntax.
  - Implement meaningful interactivity (e.g., event listeners, smooth scrolling, animations, form logic).
  - Avoid external libraries; use vanilla JS where possible.

Design Expectations:
- Layout and design should follow current UI/UX best practices.
- Prioritize readability, usability, and aesthetics.
- Result should look like a real-world SaaS or marketing website.
- Avoid placeholder text like "Lorem ipsum" — use realistic content when possible.

IMPORTANT:
- Do not include any explanations, markdown, or comments.
- Return ONLY the JSON object in the specified format.`;


export async function generateWebFiles(prompt: string): Promise<GeneratedFiles> {
  if (!GEMINI_API_KEY) {
    throw new Error('Please add your Gemini API key to the .env file. Get your API key from https://makersuite.google.com/app/apikey');
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const chat = model.startChat({
      history: [],
    });

    const result = await chat.sendMessage(`Create a beautiful, production-worthy web application for: ${prompt}`);
    const response = await result.response;
    const responseText = response.text();
    
    const parsedResponse = JSON.parse(responseText);

    if (!parsedResponse.html || !parsedResponse.css || !parsedResponse.js) {
      throw new Error('Invalid response format: missing required fields (html, css, js)');
    }

    return {
      html: parsedResponse.html,
      css: parsedResponse.css,
      js: parsedResponse.js
    };
  } catch (error) {
    console.error('Error generating web files:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('Invalid API key. Please check your Gemini API key in the .env file.');
      }
      throw error;
    }
    throw new Error('Failed to generate web files. Please try again.');
  }
}