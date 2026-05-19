import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyC5QynVxn5ST9vNBjjZHDNsO3Z5JfOotpM");
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
model.generateContent("hello").then(console.log).catch(console.error);
