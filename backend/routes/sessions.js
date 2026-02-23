const express = require("express");
const router = express.Router();
const { getAllSessions } = require("../db");

// GET /api/sessions - List all sessions
router.get("/", (_req, res, next) => {
    try {
        const sessions = getAllSessions();
        return res.json({ sessions });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
