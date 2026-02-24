require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const chatRoutes = require("./routes/chat");
const sessionRoutes = require("./routes/sessions");
const { getDatabase } = require("./db");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database on startup
getDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Rate limiting: 30 requests per minute per IP
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
});
app.use(limiter);

// Routes
app.use("/api/sessions", sessionRoutes);
app.use("/api/chat", chatRoutes);

// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

// Serve frontend static files in production
const frontendPath = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get("*", (_req, res) => {
        res.sendFile(path.join(frontendPath, "index.html"));
    });
}

// Global error handler
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: statusCode === 500
            ? "An internal server error occurred. Please try again later."
            : err.message,
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
