import { GoogleGenAI, Type } from "@google/genai";
import { Message, MessageRole, UploadedFile, EvaluationResult } from "../types";

const API_KEY = process.env.API_KEY || '';

// System instruction for the CHAT interaction
const CHAT_SYSTEM_INSTRUCTION = `
You are the VAVE Strategic Business AI Assistant.

ROLE:
You assist in evaluating new business inquiries (RFPs) using the VAVE Strategic Framework (Fame, Fun, Money, Strategy).

INSTRUCTIONS:
1. **GENERAL CHAT**: If the user asks what you do, explain clearly: "I analyze project documents to extract key data and evaluate strategic fit based on the VAVE metrics."
2. **FILE ANALYSIS**: When files are provided, start with a complete 1-sentence summary of the project. If critical info (Budget, Timeline, Scope) is missing, ask 1-2 direct clarifying questions.
3. **STYLE**: Be professional, direct, and efficient. Always use complete sentences.
`;

// System instruction for the REPORT GENERATION
const GENERATION_SYSTEM_INSTRUCTION = `
You are the VAVE Strategic Business AI Assistant. Generate a JSON evaluation based on the VAVE Framework.

VAVE FRAMEWORK:
1. **NB Info Grid**: Extract concise data for the 6-box grid.
2. **Metrics**: Evaluate FAME, FUN, MONEY, STRATEGY.
   - **CRITICAL**: Provide RAW scores from 1.0 to 5.0 for each metric.
   - **DO NOT** calculate the total yourself.

Analyze all conversation history and uploaded files.
`;

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const sendMessageToGemini = async (
  history: Message[],
  newUserMessage: string,
  files: UploadedFile[]
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const parts: any[] = [];

    if (files.length > 0) {
        files.forEach(file => {
            const base64Data = file.data.split(',')[1] || file.data;
            parts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: base64Data
                }
            });
        });
    }

    let contextPrompt = "";
    if (history.length > 0) {
        contextPrompt += "Previous conversation context:\n";
        history.forEach(msg => {
            contextPrompt += `${msg.role === MessageRole.USER ? 'User' : 'AI'}: ${msg.text}\n`;
        });
        contextPrompt += "\nCurrent User Input:\n";
    }

    parts.push({
        text: contextPrompt + newUserMessage
    });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        temperature: 0.2, // Kept low as requested
        // maxOutputTokens removed to prevent cutoff
      }
    });

    return response.text || "I analyzed the content.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error communicating with the AI service. Please ensure your API key is valid.";
  }
};

export const generateFinalEvaluation = async (
  history: Message[],
  files: UploadedFile[]
): Promise<EvaluationResult> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Generate a final structured evaluation JSON.
      
      For 'nbInfo':
      - Map strictly to: Client & Type, Project Basics, Scope, Pitch Deliverables, Fees, Time Frame.
      - Use concise bullet points.
      
      For 'metrics':
      - Provide raw scores (1.0 to 5.0) for Fame, Fun, Money, Strategy.
    `;

    const parts: any[] = [];
     if (files.length > 0) {
        files.forEach(file => {
            const base64Data = file.data.split(',')[1] || file.data;
            parts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: base64Data
                }
            });
        });
    }

    let contextHistory = "";
    history.forEach(msg => {
        contextHistory += `${msg.role}: ${msg.text}\n`;
    });

    parts.push({ text: contextHistory + "\n" + prompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        systemInstruction: GENERATION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                details: {
                    type: Type.OBJECT,
                    properties: {
                        clientName: { type: Type.STRING },
                        projectName: { type: Type.STRING },
                        type: { type: Type.STRING },
                        location: { type: Type.STRING },
                        budget: { type: Type.STRING },
                        timeline: { type: Type.STRING },
                        scope: { type: Type.STRING },
                        deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
                        summary: { type: Type.STRING },
                    }
                },
                metrics: {
                    type: Type.OBJECT,
                    properties: {
                        fame: { type: Type.NUMBER },
                        fun: { type: Type.NUMBER },
                        money: { type: Type.NUMBER },
                        strategy: { type: Type.NUMBER },
                        total: { type: Type.NUMBER },
                        recommendation: { type: Type.STRING, enum: ["GO", "NO-GO", "DISCUSS"] }
                    }
                },
                nbInfo: {
                    type: Type.OBJECT,
                    properties: {
                        clientAndType: {
                            type: Type.OBJECT,
                            properties: {
                                projectName: { type: Type.STRING },
                                type: { type: Type.STRING },
                                businessModel: { type: Type.STRING }
                            }
                        },
                        projectBasics: {
                            type: Type.OBJECT,
                            properties: {
                                exhibitionType: { type: Type.STRING },
                                topic: { type: Type.STRING },
                                size: { type: Type.STRING },
                                location: { type: Type.STRING },
                                locationType: { type: Type.STRING },
                                experienceLevel: { type: Type.STRING }
                            }
                        },
                        scope: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        pitchDeliverables: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        fees: {
                            type: Type.OBJECT,
                            properties: {
                                pitchFee: { type: Type.STRING },
                                productionFee: { type: Type.STRING },
                                agencyFee: { type: Type.STRING }
                            }
                        },
                        timeFrame: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                },
                missingInfo: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        }
      }
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText) as EvaluationResult;

    // --- SCORING LOGIC: SIMPLE AVERAGE (1-5 Scale) ---
    
    // Helper to safely extract a float from any input (string/number)
    const safeScore = (val: any): number => {
        if (typeof val === 'number') return Math.min(Math.max(val, 1), 5);
        
        // Try to extract number from string "4.5 / 5"
        const str = String(val);
        const match = str.match(/(\d+(\.\d+)?)/);
        if (match) {
            const parsed = parseFloat(match[0]);
            if (!isNaN(parsed)) return Math.min(Math.max(parsed, 1), 5);
        }
        return 1.0; // Default safe score
    };

    // 1. Sanitize inputs to strict 1-5 range
    const rawScores = {
        fame: safeScore(result.metrics.fame),
        fun: safeScore(result.metrics.fun),
        money: safeScore(result.metrics.money),
        strategy: safeScore(result.metrics.strategy)
    };
    
    // Overwrite metrics with clean numbers
    result.metrics.fame = rawScores.fame;
    result.metrics.fun = rawScores.fun;
    result.metrics.money = rawScores.money;
    result.metrics.strategy = rawScores.strategy;

    // 2. Calculate Simple Sum
    const sum = 
        rawScores.fame + 
        rawScores.fun + 
        rawScores.money + 
        rawScores.strategy;
    
    // 3. Calculate Simple Average
    // Divisor is 4 (Number of metrics)
    let average = sum / 4;

    // 4. Failsafe clamp
    average = Math.min(average, 5.0);

    result.metrics.total = Number(average.toFixed(2));
    
    // 5. Set Recommendation
    if (result.metrics.total >= 3.0) {
        result.metrics.recommendation = 'GO';
    } else if (result.metrics.total >= 2.5) {
        result.metrics.recommendation = 'DISCUSS';
    } else {
        result.metrics.recommendation = 'NO-GO';
    }

    return result;

  } catch (error) {
    console.error("Evaluation Generation Error:", error);
    throw error;
  }
}