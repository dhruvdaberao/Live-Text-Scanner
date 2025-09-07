// import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// const API_KEY = process.env.API_KEY;

// if (!API_KEY) {
//   throw new Error("API_KEY environment variable not set");
// }

// const ai = new GoogleGenAI({ apiKey: API_KEY });

// /**
//  * A utility function to call the Gemini API with an automatic retry mechanism.
//  * It uses exponential backoff for rate limit errors (429).
//  */
// const callGeminiWithRetry = async (
//   apiCall: () => Promise<GenerateContentResponse>,
//   maxRetries: number = 2,
//   initialDelay: number = 2000
// ): Promise<GenerateContentResponse> => {
//   for (let attempt = 0; attempt <= maxRetries; attempt++) {
//     try {
//       return await apiCall();
//     } catch (error: any) {
//       const isRateLimitError = error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'));

//       if (isRateLimitError) {
//         if (attempt < maxRetries) {
//           const delay = initialDelay * Math.pow(2, attempt);
//           console.warn(`Gemini API rate limit reached. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
//           await new Promise(resolve => setTimeout(resolve, delay));
//         } else {
//           console.error(`Gemini API rate limit error after ${maxRetries} retries.`, error);
//           throw error;
//         }
//       } else {
//         throw error;
//       }
//     }
//   }
//   // This line should not be reachable, but is required for type safety.
//   throw new Error("Gemini API call failed after all retries.");
// };


// /**
//  * Extracts text from a single image, now with retry logic.
//  */
// export async function extractTextFromImage(base64Image: string): Promise<string> {
//   const apiCall = () => {
//       const imagePart = {
//       inlineData: {
//         mimeType: 'image/jpeg',
//         data: base64Image,
//       },
//     };

//     const textPart = {
//       text: "Extract all visible text from this image. Respond with only the extracted text, preserving line breaks. If no text is found, return an empty response."
//     };
    
//     return ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: { parts: [imagePart, textPart] },
//     });
//   };

//   try {
//     const response = await callGeminiWithRetry(apiCall);
//     return response.text ?? '';
//   } catch (error) {
//     console.error("Error calling Gemini API for text extraction after retries:", error);
//     throw error;
//   }
// }

// /**
//  * Gets an answer from a combined string of text, now with retry logic.
//  */
// export async function getAnswerFromText(question: string): Promise<string> {
//   const apiCall = () => {
//     const contents = `Treat the following text as a question: "${question}"
// Provide a direct and concise answer to that question.
// Follow these formatting rules for your response:
// 1. For general questions, make the most important parts of the answer bold using Markdown (e.g., "**this is important**").
// 2. If the question asks for a code snippet, provide ONLY the code enclosed in a Markdown code block (e.g., \`\`\`language\\ncode here\\n\`\`\`). Do not provide any additional explanations.
// 3. If the question is unclear, return a helpful message.`;

//     return ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: contents,
//     });
//   };

//   try {
//     const response = await callGeminiWithRetry(apiCall);
//     return response.text ?? '';
//   } catch (error) {
//     console.error("Error calling Gemini API for getting an answer after retries:", error);
//     throw error;
//   }
// }






import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Module-level client, to be initialized at runtime.
let ai: GoogleGenAI | null = null;

/**
 * Initializes the Gemini API client with a user-provided key.
 * This must be called before any other API functions.
 * @param apiKey The user's Google Gemini API key.
 */
export function initializeApi(apiKey: string) {
  if (!apiKey) {
    console.error("Attempted to initialize API without a key.");
    ai = null;
    return;
  }
  ai = new GoogleGenAI({ apiKey });
}

/**
 * A utility function to call the Gemini API with an automatic retry mechanism.
 * It uses exponential backoff for rate limit errors (429).
 */
const callGeminiWithRetry = async (
  apiCall: () => Promise<GenerateContentResponse>,
  maxRetries: number = 2,
  initialDelay: number = 2000
): Promise<GenerateContentResponse> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      // Check for both rate limit errors and invalid key errors.
      const isRateLimitError = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
      const isInvalidKeyError = error.message?.includes('API key not valid');

      if (isInvalidKeyError) {
         // Don't retry on invalid key, fail immediately.
         console.error('Gemini API call failed due to an invalid API key.', error);
         throw error;
      }
      
      if (isRateLimitError) {
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.warn(`Gemini API rate limit reached. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(`Gemini API rate limit error after ${maxRetries} retries.`, error);
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  // This line should not be reachable, but is required for type safety.
  throw new Error("Gemini API call failed after all retries.");
};


/**
 * Extracts text from a single image, now using the initialized client.
 */
export async function extractTextFromImage(base64Image: string): Promise<string> {
  if (!ai) {
    throw new Error("API not initialized. Please set your API key first.");
  }

  const apiCall = () => {
      const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    };

    const textPart = {
      text: "Extract all visible text from this image. Respond with only the extracted text, preserving line breaks. If no text is found, return an empty response."
    };
    
    return ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });
  };

  try {
    const response = await callGeminiWithRetry(apiCall);
    return response.text ?? '';
  } catch (error) {
    console.error("Error calling Gemini API for text extraction after retries:", error);
    throw error;
  }
}

/**
 * Gets an answer from a combined string of text, now using the initialized client.
 */
export async function getAnswerFromText(question: string): Promise<string> {
  if (!ai) {
    throw new Error("API not initialized. Please set your API key first.");
  }
  
  const apiCall = () => {
    const contents = `Treat the following text as a question: "${question}"
Provide a direct and concise answer to that question.
Follow these formatting rules for your response:
1. For general questions, make the most important parts of the answer bold using Markdown (e.g., "**this is important**").
2. If the question asks for a code snippet, provide ONLY the code enclosed in a Markdown code block (e.g., \`\`\`language\\ncode here\\n\`\`\`). Do not provide any additional explanations.
3. If the question is unclear, return a helpful message.`;

    return ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });
  };

  try {
    const response = await callGeminiWithRetry(apiCall);
    return response.text ?? '';
  } catch (error) {
    console.error("Error calling Gemini API for getting an answer after retries:", error);
    throw error;
  }
}