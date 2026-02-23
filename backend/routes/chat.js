const express = require("express");
const router = express.Router();
const {
    createSession,
    updateSessionTimestamp,
    insertMessage,
    getRecentMessages,
    getAllMessages,
} = require("../db");
const { getAssistantResponse } = require("../services/llm");

// POST /api/chat - Send a message and get assistant response
router.post("/", async (req, res, next) => {
    try {
        const { sessionId, message } = req.body;

        if (!sessionId || typeof sessionId !== "string") {
            return res.status(400).json({ error: "sessionId is required and must be a string" });
        }

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({ error: "message is required and must be a non-empty string" });
        }

        const trimmedMessage = message.trim();

        createSession(sessionId);
        insertMessage(sessionId, "user", trimmedMessage);
        updateSessionTimestamp(sessionId);

        // Fetch last 10 messages (5 pairs) for context
        const recentMessages = getRecentMessages(sessionId, 10);

        // Remove the current user message from history since we pass it separately
        const chatHistory = recentMessages.slice(0, -1);

        const assistantReply = await getAssistantResponse(chatHistory, trimmedMessage);

        insertMessage(sessionId, "assistant", assistantReply);
        updateSessionTimestamp(sessionId);

        return res.json({
            sessionId: sessionId,
            reply: assistantReply,
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/chat/:sessionId - Get full chat history for a session
router.get("/:sessionId", (req, res, next) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({ error: "sessionId is required" });
        }

        const messages = getAllMessages(sessionId);

        return res.json({ sessionId, messages });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

