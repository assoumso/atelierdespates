
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// Note: process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

export const generateProductDescription = async (productName: string, category: string, keywords: string): Promise<{ description: string; tags: string[] }> => {
  try {
    const prompt = `
      Agis comme un expert en marketing B2B.
      Génère une description de produit attrayante et commerciale (environ 50-80 mots) en français pour un produit nommé "${productName}" dans la catégorie "${category}".
      Mots-clés fournis par l'utilisateur : "${keywords}".
      
      Génère également une liste de 3 à 5 tags pertinents.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["description", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating description:", error);
    throw error;
  }
};

export const analyzeMarketTrends = async (products: any[]): Promise<string> => {
  try {
    const productsList = products.map(p => `${p.name} (${p.category}) - ${p.price} FCFA`).join('\n');
    const prompt = `
      Analyse la liste de produits suivante et donne un bref aperçu (en 2-3 phrases) de la diversité du catalogue et une suggestion de catégorie manquante qui pourrait être rentable.
      
      Liste:
      ${productsList}
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Analyse indisponible.";
  } catch (error) {
    console.error("Error analyzing trends:", error);
    return "Erreur lors de l'analyse des tendances.";
  }
};

export const draftSupplierInquiry = async (productName: string, supplierName: string, intent: string): Promise<string> => {
  try {
    const prompt = `
      Rédige un message professionnel court et poli (email) de la part d'un client intéressé par le produit "${productName}" vendu par "${supplierName}".
      Intention spécifique du client : "${intent}".
      Le ton doit être formel et professionnel. Le message doit être prêt à l'envoi.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "Impossible de générer le message.";
  } catch (error) {
    console.error("Error drafting inquiry:", error);
    return "Erreur lors de la génération du message.";
  }
};
