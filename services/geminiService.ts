
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getTeamStructureSuggestions = async (companySize: string, industry: string, focus: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Sugira uma estrutura de equipe de qualidade ideal para uma empresa de porte ${companySize} no setor de ${industry} com foco em ${focus}. Forneça uma lista de papéis e suas principais responsabilidades.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING },
            description: { type: Type.STRING },
            responsibilities: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedLevel: { type: Type.STRING }
          },
          required: ["role", "description", "responsibilities", "suggestedLevel"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};

export const generateJobDescription = async (role: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere uma descrição de cargo detalhada para um "${role}" em uma equipe de qualidade, incluindo requisitos técnicos e comportamentais.`,
  });
  return response.text;
};
