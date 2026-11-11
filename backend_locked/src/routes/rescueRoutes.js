/**
 * FoodLoop AI (Anna) - Rescue Food Routes
 * =======================================
 * Dedicated endpoints for displaying, filtering, and listing surplus food
 * with discounts to reduce food waste.
 * 
 * Features:
 * - Display surplus items with original vs discounted price
 * - Filter by category, urgency (shelf-life), and discount percentage
 * - AI Hook: When a restaurant lists surplus food, it queries the Python ML
 *   demand prediction service to estimate expected sales volume and give advice.
 */

const express = require("express");
const router = express.Router();
const FoodItem = require("../models/FoodItem");
const { getDBStatus } = require("../config/db");
const initialData = require("../data/initialData.json");

// URL of the Python ML demand prediction microservice
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";

/**
 * Helper to call the Python ML demand prediction service
 */
async function queryMLDemandPrediction(itemData) {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemData)
        });
        if (response.ok) {
            const data = await response.json();
            return data.data;
        }
    } catch (err) {
        // ML service offline or unreachable - return null gracefully
        console.warn(`[RESCUE FOOD] ML service unreachable: ${err.message}`);
    }
    return null;
}

/**
 * GET /api/rescue/items
 * Retrieve all active surplus food items.
 * Query params (optional):
 *   ?category=Bakery
 *   ?sortBy=urgency (sort by shelfLifeHoursLeft ascending)
 *   ?sortBy=discount (sort by discountPercent descending)
 *   ?maxPrice=100
 */
router.get("/items", async (req, res) => {
    try {
        const { category, sortBy, maxPrice } = req.query;

        if (getDBStatus()) {
            let filter = { isSurplus: true, availableQuantity: { $gt: 0 } };
            if (category) filter.category = category;
            if (maxPrice) filter.discountedPrice = { $lte: Number(maxPrice) };

            let sortQuery = {};
            if (sortBy === "urgency") sortQuery.shelfLifeHoursLeft = 1; // shortest shelf-life first
            else if (sortBy === "discount") sortQuery.discountPercent = -1; // highest discount first

            const items = await FoodItem.find(filter).sort(sortQuery).populate("restaurant", "name address city rating");
            return res.json({
                success: true,
                count: items.length,
                source: "mongodb",
                data: items
            });
        }

        // In-Memory Fallback
        let items = initialData.foodItems.filter(item => item.isSurplus === true && item.availableQuantity > 0);

        if (category) {
            items = items.filter(item => item.category.toLowerCase() === category.toLowerCase());
        }
        if (maxPrice) {
            items = items.filter(item => item.discountedPrice <= Number(maxPrice));
        }

        // Attach restaurant info
        items = items.map(item => {
            const rest = initialData.restaurants.find(r => r.id === item.restaurantId);
            return {
                ...item,
                restaurantName: rest ? rest.name : "Partner Restaurant",
                restaurantAddress: rest ? rest.address : "Pune",
                savingsAmount: item.originalPrice - item.discountedPrice
            };
        });

        if (sortBy === "urgency") {
            items.sort((a, b) => a.shelfLifeHoursLeft - b.shelfLifeHoursLeft);
        } else if (sortBy === "discount") {
            items.sort((a, b) => b.discountPercent - a.discountPercent);
        }

        return res.json({
            success: true,
            count: items.length,
            source: "in-memory",
            data: items
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/rescue/items/:id
 * Retrieve details for a single surplus food deal.
 */
router.get("/items/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (getDBStatus()) {
            const item = await FoodItem.findOne({ _id: id, isSurplus: true }).populate("restaurant");
            if (!item) return res.status(404).json({ success: false, error: "Surplus item not found." });
            return res.json({ success: true, source: "mongodb", data: item });
        }

        const item = initialData.foodItems.find(i => i.id === id && i.isSurplus === true);
        if (!item) return res.status(404).json({ success: false, error: "Surplus item not found." });

        const rest = initialData.restaurants.find(r => r.id === item.restaurantId);
        return res.json({
            success: true,
            source: "in-memory",
            data: {
                ...item,
                restaurantName: rest ? rest.name : "Partner Restaurant",
                restaurantAddress: rest ? rest.address : "Pune",
                savingsAmount: item.originalPrice - item.discountedPrice
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/rescue/items
 * Restaurant lists a new surplus food item.
 * Connects to AI Demand Prediction model for instant sales forecast and guidance!
 */
router.post("/items", async (req, res) => {
    try {
        const {
            restaurantId,
            name,
            category,
            description,
            originalPrice,
            discountPercent,
            shelfLifeHoursLeft,
            availableQuantity,
            isVegetarian
        } = req.body;

        if (!name || !originalPrice || !discountPercent) {
            return res.status(400).json({
                success: false,
                error: "Validation error: 'name', 'originalPrice', and 'discountPercent' are required."
            });
        }

        const numericOriginal = Number(originalPrice);
        const numericDiscount = Number(discountPercent);
        const discountedPrice = Math.round(numericOriginal * (1 - numericDiscount / 100));
        const shelfHours = Number(shelfLifeHoursLeft || 4);
        const stockQty = Number(availableQuantity || 10);

        // 1. Query the AI Demand Prediction Model
        const mlPayload = {
            item_name: name,
            category: category || "Main Course",
            original_price: numericOriginal,
            discount_percent: numericDiscount,
            discounted_price: discountedPrice,
            shelf_life_hours_left: shelfHours,
            hour_of_day: new Date().getHours(),
            day_of_week: new Date().getDay(),
            historical_average_demand: 20
        };

        const aiPrediction = await queryMLDemandPrediction(mlPayload);

        // Formulate smart guidance for the restaurant owner
        let aiRecommendation = null;
        if (aiPrediction) {
            const predUnits = aiPrediction.predicted_units;
            let advice = "";
            if (predUnits >= stockQty) {
                advice = `High demand expected (${predUnits} units). You are likely to sell out all ${stockQty} portions!`;
            } else {
                advice = `Moderate demand predicted (${predUnits} units). Consider increasing discount to ${Math.min(70, numericDiscount + 15)}% to prevent waste before closing.`;
            }

            aiRecommendation = {
                predicted_sales_units: predUnits,
                confidence_range: aiPrediction.confidence_range,
                advice
            };
        } else {
            aiRecommendation = {
                predicted_sales_units: null,
                advice: "AI service currently offline. Item listed successfully with manual pricing."
            };
        }

        // 2. Save Item (MongoDB or In-Memory)
        if (getDBStatus()) {
            const newItem = await FoodItem.create({
                restaurant: restaurantId || null,
                name,
                category: category || "Main Course",
                description: description || "Delicious fresh surplus meal at discounted price.",
                originalPrice: numericOriginal,
                discountPercent: numericDiscount,
                discountedPrice,
                shelfLifeHoursLeft: shelfHours,
                availableQuantity: stockQty,
                isVegetarian: isVegetarian !== undefined ? isVegetarian : true,
                isSurplus: true
            });

            return res.status(201).json({
                success: true,
                message: "Surplus food listed successfully!",
                source: "mongodb",
                data: newItem,
                ai_recommendation: aiRecommendation
            });
        }

        // In-Memory store
        const newItem = {
            id: `food_${Date.now()}`,
            restaurantId: restaurantId || "rest_1",
            name,
            category: category || "Main Course",
            description: description || "Delicious fresh surplus meal at discounted price.",
            originalPrice: numericOriginal,
            discountPercent: numericDiscount,
            discountedPrice,
            shelfLifeHoursLeft: shelfHours,
            availableQuantity: stockQty,
            isVegetarian: isVegetarian !== undefined ? isVegetarian : true,
            isSurplus: true,
            createdAt: new Date().toISOString()
        };

        initialData.foodItems.push(newItem);

        return res.status(201).json({
            success: true,
            message: "Surplus food listed successfully!",
            source: "in-memory",
            data: newItem,
            ai_recommendation: aiRecommendation
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/rescue/stats
 * Platform-wide surplus food impact metrics.
 */
router.get("/stats", (req, res) => {
    const surplusItems = initialData.foodItems.filter(i => i.isSurplus);
    const totalSurplusPortions = surplusItems.reduce((acc, it) => acc + (it.availableQuantity || 0), 0);
    const averageDiscount = Math.round(
        surplusItems.reduce((acc, it) => acc + (it.discountPercent || 0), 0) / (surplusItems.length || 1)
    );

    return res.json({
        success: true,
        data: {
            active_surplus_deals: surplusItems.length,
            portions_ready_for_rescue: totalSurplusPortions,
            average_discount_percent: `${averageDiscount}%`,
            estimated_co2_saved_kg: (totalSurplusPortions * 1.5).toFixed(1),
            community_money_saved_inr: surplusItems.reduce(
                (acc, it) => acc + (it.originalPrice - it.discountedPrice) * (it.availableQuantity || 1), 0
            )
        }
    });
});

module.exports = router;
