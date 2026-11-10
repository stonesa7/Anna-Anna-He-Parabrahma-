/**
 * FoodLoop AI (Anna - Anna He Parabrahma)
 * Main Node.js and Express application entry point.
 */

// Load environment variables immediately before all other imports
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDB, getDBStatus } = require("./config/db");

const demandRoutes = require("./routes/demandRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const orderRoutes = require("./routes/orderRoutes");
const rescueRoutes = require("./routes/rescueRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize database connection
connectDB();

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        project: "FoodLoop AI (Anna)",
        message: "FoodLoop AI backend is running!",
        database: getDBStatus()
            ? "connected"
            : "development_in_memory",
        timestamp: new Date().toISOString()
    });
});

// Mount API routes
app.use("/api/demand", demandRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/rescue", rescueRoutes);
app.use("/api/payments", paymentRoutes);

// 404 Handler
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

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log("====================================================");
        console.log(`FoodLoop AI backend running on http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
        console.log(`Restaurants:  http://localhost:${PORT}/api/restaurants`);
        console.log(`Orders:       http://localhost:${PORT}/api/orders`);
        console.log(`Rescue Food:  http://localhost:${PORT}/api/rescue/items`);
        console.log(`Payments:     http://localhost:${PORT}/api/payments`);
        console.log(`Payment Config: http://localhost:${PORT}/api/payments/config`);
        console.log(`Demand ML:    http://localhost:${PORT}/api/demand`);
        console.log("====================================================");
    });
}

module.exports = app;