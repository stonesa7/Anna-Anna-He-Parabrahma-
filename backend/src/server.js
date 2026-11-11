/**
 * ANNA - Anna He Purna Brahma
 * Backend Server
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

// Initialize Database connection on boot
connectDB();

// Initialize Database connection on boot


// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        project: "FoodLoop AI (Anna)",
        message: "FoodLoop AI backend is running cleanly!",
        database: getDBStatus() ? "connected" : "development_in_memory",
        timestamp: new Date().toISOString()
    });
});

// Mount Routes
app.use("/api/demand", demandRoutes);             // ML Demand Prediction API
app.use("/api/restaurants", restaurantRoutes);   // Restaurant listings & Menus
app.use("/api/orders", orderRoutes);             // Customer Order placement & tracking
app.use("/api/rescue", rescueRoutes);             // Rescue Food (Surplus Deals & AI Hook)
app.use("/api/payments", paymentRoutes);         // PayPal Sandbox Checkout

// Surplus Food and NGO API
app.use("/api/rescue", rescueRoutes);

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

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(` FoodLoop AI backend running on http://localhost:${PORT}`);
        console.log(` • Health check: http://localhost:${PORT}/api/health`);
        console.log(` • Restaurants:  http://localhost:${PORT}/api/restaurants`);
        console.log(` • Orders:       http://localhost:${PORT}/api/orders`);
        console.log(` • Rescue Food:  http://localhost:${PORT}/api/rescue/items`);
        console.log(` • Payments:     http://localhost:${PORT}/api/payments`);
        console.log(` • Demand ML:    http://localhost:${PORT}/api/demand`);
        console.log(`====================================================`);
    });
}

module.exports = app;