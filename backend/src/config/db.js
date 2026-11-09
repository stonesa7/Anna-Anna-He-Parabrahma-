/**
 * FoodLoop AI (Anna) - Database Connection
 * ========================================
 * Configures connection to MongoDB using Mongoose.
 * 
 * Beginner Feature:
 * If MongoDB is not running locally or no MONGO_URI is configured yet,
 * it gracefully switches to in-memory development mode so your server
 * NEVER crashes and you can test APIs immediately.
 */

const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri && !process.env.LOCAL_MONGO) {
        console.log("----------------------------------------------------");
        console.log("[DATABASE NOTICE] No MONGO_URI specified in .env.");
        console.log("Using Development In-Memory Mode with preloaded restaurants!");
        console.log("To connect real MongoDB, add MONGO_URI to backend/.env");
        console.log("----------------------------------------------------");
        return false;
    }

    try {
        const uri = mongoUri || "mongodb://127.0.0.1:27017/foodloop";
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 3000 // Quick timeout to prevent long hangs
        });

        isConnected = true;
        console.log(`[DATABASE] MongoDB connected successfully: ${conn.connection.host}`);
        return true;
    } catch (err) {
        console.log("----------------------------------------------------");
        console.log(`[DATABASE NOTICE] Could not reach MongoDB (${err.message}).`);
        console.log("Running in Development Mode with preloaded FoodLoop restaurants.");
        console.log("----------------------------------------------------");
        isConnected = false;
        return false;
    }
};

const getDBStatus = () => isConnected;

module.exports = { connectDB, getDBStatus };

