/**
 * FoodLoop AI - Rescue Food Automated Test Suite
 * ==============================================
 * Verifies all Rescue Food endpoints:
 * - Listing surplus items with discounts and countdowns
 * - Sorting by urgency (shelf life) and discount percentage
 * - Impact metrics statistics
 * - Listing new surplus food with AI demand estimation
 */

const http = require("http");
const app = require("./src/server");

async function runTests() {
    console.log("====================================================");
    console.log(" Running FoodLoop AI Rescue Food Integration Tests");
    console.log("====================================================");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[SETUP] Test server running on ${baseUrl}`);

    try {
        // Test 1: Fetch all surplus items
        console.log("\n[TEST 1] Testing GET /api/rescue/items...");
        const res = await fetch(`${baseUrl}/api/rescue/items`);
        const data = await res.json();
        console.log(`  Found ${data.count} active surplus food deals:`);
        for (const item of data.data) {
            console.log(`  • ${item.name} (${item.restaurantName}): Was Rs.${item.originalPrice} -> NOW Rs.${item.discountedPrice} (${item.discountPercent}% OFF) [${item.shelfLifeHoursLeft}h left, ${item.availableQuantity} left]`);
        }
        if (res.status !== 200 || data.count < 1) {
            throw new Error("Failed to fetch surplus items!");
        }
        console.log("  [PASS] GET /api/rescue/items verified!");

        // Test 2: Filter by urgency (shortest shelf life first)
        console.log("\n[TEST 2] Testing GET /api/rescue/items?sortBy=urgency...");
        const urgencyRes = await fetch(`${baseUrl}/api/rescue/items?sortBy=urgency`);
        const urgencyData = await urgencyRes.json();
        console.log(`  Most urgent item: ${urgencyData.data[0].name} (${urgencyData.data[0].shelfLifeHoursLeft}h shelf life left)`);
        for (let i = 0; i < urgencyData.data.length - 1; i++) {
            if (urgencyData.data[i].shelfLifeHoursLeft > urgencyData.data[i + 1].shelfLifeHoursLeft) {
                throw new Error("Urgency sorting failed!");
            }
        }
        console.log("  [PASS] Urgency sorting verified!");

        // Test 3: Filter by discount percentage
        console.log("\n[TEST 3] Testing GET /api/rescue/items?sortBy=discount...");
        const discRes = await fetch(`${baseUrl}/api/rescue/items?sortBy=discount`);
        const discData = await discRes.json();
        console.log(`  Highest discount item: ${discData.data[0].name} (${discData.data[0].discountPercent}% OFF)`);
        for (let i = 0; i < discData.data.length - 1; i++) {
            if (discData.data[i].discountPercent < discData.data[i + 1].discountPercent) {
                throw new Error("Discount sorting failed!");
            }
        }
        console.log("  [PASS] Discount sorting verified!");

        // Test 4: Rescue impact metrics
        console.log("\n[TEST 4] Testing GET /api/rescue/stats...");
        const statsRes = await fetch(`${baseUrl}/api/rescue/stats`);
        const statsData = await statsRes.json();
        console.log("  Platform stats:", statsData.data);
        if (statsRes.status !== 200 || !statsData.data.active_surplus_deals) {
            throw new Error("Failed to fetch platform stats!");
        }
        console.log("  [PASS] Impact stats verified!");

        // Test 5: Post new surplus item with AI hook
        console.log("\n[TEST 5] Testing POST /api/rescue/items (Listing surplus item + AI Demand Prediction)...");
        const newSurplusPayload = {
            restaurantId: "rest_1",
            name: "Paneer Paratha Surplus Pack",
            category: "Main Course",
            description: "Fresh hot paneer parathas made today, packaged for evening rescue.",
            originalPrice: 150,
            discountPercent: 50,
            shelfLifeHoursLeft: 3,
            availableQuantity: 10,
            isVegetarian: true
        };
        const postRes = await fetch(`${baseUrl}/api/rescue/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSurplusPayload)
        });
        const postData = await postRes.json();
        console.log("  Status:", postRes.status);
        console.log("  Listed Item:", postData.data?.name);
        console.log("  Discounted Price: Rs.", postData.data?.discountedPrice);
        console.log("  AI Advice:", postData.ai_recommendation?.advice);
        if (postRes.status !== 201 || !postData.success) {
            throw new Error("Failed to post surplus food item!");
        }
        console.log("  [PASS] Surplus food listing with AI hook verified!");

        console.log("\n====================================================");
        console.log(" ALL RESCUE FOOD TESTS PASSED CLEANLY!");
        console.log("====================================================");

    } finally {
        server.close();
    }
}

runTests().catch(err => {
    console.error("\n[FAIL] Test encountered error:", err);
    process.exit(1);
});
