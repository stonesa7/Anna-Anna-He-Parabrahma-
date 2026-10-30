/**
 * FoodLoop AI (Anna — Anna He Parabrahma) - Backend Server
 * ========================================================
 * Main Node.js & Express application entry point.
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const demandRoutes = require("./routes/demandRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        project: "FoodLoop AI (Anna)",
        message: "FoodLoop AI backend is running cleanly!",
        timestamp: new Date().toISOString()
    });
});

// Demand prediction API routes
app.use("/api/demand", demandRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("[SERVER ERROR]", err);
    res.status(500).json({
        success: false,
        error: "Internal server error occurred."
    });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(` FoodLoop AI backend running on http://localhost:${PORT}`);
        console.log(` Demand API available at: http://localhost:${PORT}/api/demand`);
        console.log(` Health check: http://localhost:${PORT}/api/health`);
        console.log(`====================================================`);
    });
}

module.exports = app;

