import { GoogleGenAI } from "@google/genai";
import { ExtractedData } from "../types";

// Declare process to avoid TypeScript errors when accessing env in client-side code
declare const process: any;

const getClient = () => {
  // Access API key from environment variable process.env.API_KEY as per Google GenAI guidelines
  // The API key must be obtained exclusively from this variable.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is not set in environment variables");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const parsePDFText = async (pdfText: string): Promise<ExtractedData> => {
  const ai = getClient();
  const prompt = `
    You are a LIMS Specification Expert. Extract specification data from the provided text from a pharmaceutical specification document.
    
    Return ONLY a valid JSON object strictly matching this schema:
    {
      "productName": string | null,
      "productCode": string | null,
      "effectiveDate": string | null, // Format YYYY-MM-DD
      "extractedTests": [
        {
          "name": string, // The raw name of the test found in the doc
          "text": string|null, // Any text specification (e.g. "White powder")
          "min": number|null, // Numeric min limit
          "max": number|null, // Numeric max limit
          "unit": string|null // Unit of measure
        }
      ]
    }

    Rules:
    - If a spec is "Not more than 0.5%", max is 0.5, unit is "%".
    - If a spec is "90.0 - 110.0%", min is 90.0, max is 110.0.
    - If a spec is text-based (e.g., description), put it in 'text'.
    - Do not invent data.

    Input Text:
    ${pdfText.substring(0, 30000)} // Truncate to avoid token limits if massive
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as ExtractedData;
  } catch (error) {
    console.error("Gemini Parse Error", error);
    throw error;
  }
};