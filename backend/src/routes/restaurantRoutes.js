/**
 * FoodLoop AI - Restaurant & Menu Routes
 * =====================================
 * Handles browsing partner restaurants and fetching their menus.
 * 
 * Works with both:
 * 1. Live MongoDB (via Mongoose models)
 * 2. Preloaded In-Memory Data (so testing never fails if DB is offline)
 */

const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const { getDBStatus } = require("../config/db");
const initialData = require("../data/initialData.json");

/**
 * GET /api/restaurants
 * Retrieve list of all registered restaurants.
 * Query params (optional): ?cuisine=Indian&search=Darbar
 */
router.get("/", async (req, res) => {
    try {
        const { cuisine, search } = req.query;

        if (getDBStatus()) {
            // Query live MongoDB
            let filter = {};
            if (cuisine) {
                filter.cuisine = { $regex: cuisine, $options: "i" };
            }
            if (search) {
                filter.name = { $regex: search, $options: "i" };
            }

            const restaurants = await Restaurant.find(filter);
            return res.json({
                success: true,
                count: restaurants.length,
                source: "mongodb",
                data: restaurants
            });
        }

        // In-Memory Fallback
        let list = [...initialData.restaurants];
        if (cuisine) {
            list = list.filter(r => r.cuisine.toLowerCase().includes(cuisine.toLowerCase()));
        }
        if (search) {
            list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
        }

        return res.json({
            success: true,
            count: list.length,
            source: "in-memory",
            data: list
        });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/restaurants/:id
 * Retrieve details of a specific restaurant.
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (getDBStatus()) {
            const restaurant = await Restaurant.findById(id);
            if (!restaurant) {
                return res.status(404).json({ success: false, error: "Restaurant not found." });
            }
            return res.json({ success: true, source: "mongodb", data: restaurant });
        }

        // In-Memory Fallback
        const restaurant = initialData.restaurants.find(r => r.id === id);
        if (!restaurant) {
            return res.status(404).json({ success: false, error: "Restaurant not found." });
        }

        return res.json({ success: true, source: "in-memory", data: restaurant });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/restaurants/:id/menu
 * Retrieve menu items for a specific restaurant.
 * Query params (optional): ?vegetarian=true&surplusOnly=false
 */
router.get("/:id/menu", async (req, res) => {
    try {
        const { id } = req.params;
        const { vegetarian, surplusOnly } = req.query;

        if (getDBStatus()) {
            let filter = { restaurant: id };
            if (vegetarian === "true") filter.isVegetarian = true;
            if (surplusOnly === "true") filter.isSurplus = true;

            const items = await FoodItem.find(filter);
            return res.json({
                success: true,
                count: items.length,
                source: "mongodb",
                data: items
            });
        }

        // In-Memory Fallback
        let items = initialData.foodItems.filter(item => item.restaurantId === id);
        if (vegetarian === "true") {
            items = items.filter(i => i.isVegetarian === true);
        }
        if (surplusOnly === "true") {
            items = items.filter(i => i.isSurplus === true);
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

module.exports = router;

