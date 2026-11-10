/**
 * FoodLoop AI - Database Seeder
 * =============================
 * Run this script to populate MongoDB with initial restaurants and menu items:
 *   node src/scripts/seed.js
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const User = require("../models/User");
const initialData = require("../data/initialData.json");

async function seedDatabase() {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/foodloop";
    console.log(`[SEED] Connecting to MongoDB at: ${mongoUri}...`);

    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log("[SEED] MongoDB connection established!");

        console.log("[SEED] Clearing existing collections...");
        await Restaurant.deleteMany({});
        await FoodItem.deleteMany({});
        await User.deleteMany({});

        // 1. Create default demo user
        const demoUser = await User.create({
            name: "Anjali Test User",
            email: "anjali@foodloop.local",
            role: "customer"
        });
        console.log(`[SEED] Created demo customer: ${demoUser.name} (${demoUser.email})`);

        // 2. Insert restaurants and map IDs
        const createdRestaurants = {};
        for (const r of initialData.restaurants) {
            const restDoc = await Restaurant.create({
                name: r.name,
                cuisine: r.cuisine,
                address: r.address,
                city: r.city,
                rating: r.rating,
                contactNumber: r.contactNumber
            });
            createdRestaurants[r.id] = restDoc._id;
            console.log(`[SEED] Added Restaurant: ${restDoc.name}`);
        }

        // 3. Insert food items linked to restaurants
        let itemCount = 0;
        for (const item of initialData.foodItems) {
            const realRestId = createdRestaurants[item.restaurantId];
            if (realRestId) {
                await FoodItem.create({
                    restaurant: realRestId,
                    name: item.name,
                    category: item.category,
                    description: item.description,
                    originalPrice: item.originalPrice,
                    isVegetarian: item.isVegetarian,
                    isSurplus: item.isSurplus,
                    discountPercent: item.discountPercent,
                    discountedPrice: item.discountedPrice,
                    shelfLifeHoursLeft: item.shelfLifeHoursLeft,
                    availableQuantity: item.availableQuantity
                });
                itemCount++;
            }
        }
        console.log(`[SEED] Successfully seeded ${itemCount} food items!`);
        console.log("[SEED] Seeding finished successfully.");

    } catch (err) {
        console.error("[SEED ERROR]", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("[SEED] Disconnected from MongoDB.");
    }
}

seedDatabase();

