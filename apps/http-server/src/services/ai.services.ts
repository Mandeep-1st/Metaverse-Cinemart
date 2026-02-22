import { MovieModel } from "../models/movies.model";
import { ApiError } from "../utils/apiError";

export class AiService {

    /**
     * OPTION 1: Suggest another movie like this
     * Logic: Combines movie metadata + user's specific feeling -> AI Recommendation
     */
    static async getTailoredRecommendation(tmdbId: number, userFeedback: string) {
        // 1. Fetch Context
        const movie = await MovieModel.findOne({ tmdb_id: tmdbId });
        if (!movie) throw new ApiError(404, "Movie context not found");

        const context = `
            Title: ${movie.title}
            Director: ${movie.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown'}
            Genres: ${movie.genres?.map(g => g.name).join(", ")}
            Plot: ${movie.overview}
        `;

        // 2. Construct System Prompt
        const systemPrompt = `
            You are a highly knowledgeable film curator. 
            A user just watched the movie described below and gave specific feedback.
            
            MOVIE CONTEXT:
            ${context}

            USER FEEDBACK:
            "${userFeedback}"

            TASK:
            Recommend exactly ONE other movie that fits this specific feedback.
            Explain WHY you chose it in 2 sentences.
            
            FORMAT:
            Return valid JSON only: { "movieTitle": "string", "reason": "string" }
        `;

        // 3. Call AI
        return await this.callLLM(systemPrompt, userFeedback);
    }

    /**
     * OPTION 2: What about this movie? (Contextual Chat)
     * Logic: Chat with the AI specifically about the movie's plot, cast, or details.
     */
    static async chatAboutMovie(tmdbId: number, userQuestion: string) {
        // 1. Fetch Context
        const movie = await MovieModel.findOne({ tmdb_id: tmdbId });
        if (!movie) throw new ApiError(404, "Movie context not found");

        const context = `
            Title: ${movie.title}
            Cast: ${movie.credits?.cast?.slice(0, 5).map(c => c.name).join(", ")}
            Director: ${movie.credits?.crew?.find(c => c.job === 'Director')?.name}
            Plot: ${movie.overview}
            Release Date: ${movie.details?.release_date}
        `;

        // 2. Construct System Prompt
        const systemPrompt = `
            You are an expert on the movie "${movie.title}".
            Use the metadata below to answer the user's question accurately.
            If the answer isn't in the metadata, use your general knowledge but mention you are recalling it.
            Keep answers concise and engaging.

            METADATA:
            ${context}
        `;

        // 3. Call AI
        return await this.callLLM(systemPrompt, userQuestion);
    }

    /**
     * OPTION 3: Do simple chat
     * Logic: General casual conversation, potentially keeping movie themes.
     */
    static async generalChat(userMessage: string) {
        const systemPrompt = `
            You are a friendly cinema companion in a virtual movie lounge.
            You love discussing films, directing styles, and acting.
            Keep the conversation casual, fun, and brief.
        `;

        return await this.callLLM(systemPrompt, userMessage);
    }

    // --- PRIVATE UTILS ---

    private static async callLLM(systemPrompt: string, userMessage: string) {
        const API_KEY = process.env.SERVER_VAR_GEMINI_API_KEY;
        if (!API_KEY) {
            console.error("GEMINI_API_KEY is missing in .env");
            return { role: "ai", content: "Configuration Error: AI Key missing." };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: `${systemPrompt}\n\nUSER MESSAGE:\n${userMessage}` }]
                    }]
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("AI API Error:", data);
                return { role: "ai", content: "I'm having trouble thinking right now." };
            }

            // Extract text from Gemini response structure
            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

            // Clean up JSON formatting if the AI added markdown code blocks (common in JSON mode)
            const cleanText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

            // Try to parse if it looks like JSON (for the suggestion route)
            try {
                if (cleanText.startsWith("{")) {
                    return JSON.parse(cleanText);
                }
            } catch (e) {
                // If not JSON, just return the text
            }

            return { role: "ai", content: cleanText };

        } catch (error) {
            console.error("AI Service Failure:", error);
            throw new ApiError(500, "Failed to communicate with AI service");
        }
    }
}