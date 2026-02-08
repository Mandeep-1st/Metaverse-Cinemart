import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { AiService } from "../services/ai.services";

// POST /ai/suggestion
// Body: { movieId: 123, feedback: "I liked the action but it was too long" }
const getSuggestion = asyncHandler(async (req: any, res: Response) => {
    const { movieId, feedback } = req.body;

    if (!movieId || !feedback) {
        throw new ApiError(400, "Movie ID and Feedback are required");
    }

    const result = await AiService.getTailoredRecommendation(movieId, feedback);

    return res.status(200).json(
        new ApiResponse(200, result, "AI Recommendation generated")
    );
});

// POST /ai/ask-movie
// Body: { movieId: 123, question: "Who played the villain?" }
const askAboutMovie = asyncHandler(async (req: any, res: Response) => {
    const { movieId, question } = req.body;

    if (!movieId || !question) {
        throw new ApiError(400, "Movie ID and Question are required");
    }

    const result = await AiService.chatAboutMovie(movieId, question);

    return res.status(200).json(
        new ApiResponse(200, result, "AI Answer generated")
    );
});

// POST /ai/chat
// Body: { message: "Hi, recommend me a comedy" }
const simpleChat = asyncHandler(async (req: any, res: Response) => {
    const { message } = req.body;

    if (!message) {
        throw new ApiError(400, "Message is required");
    }

    const result = await AiService.generalChat(message);

    return res.status(200).json(
        new ApiResponse(200, result, "AI Chat response")
    );
});

export { getSuggestion, askAboutMovie, simpleChat };