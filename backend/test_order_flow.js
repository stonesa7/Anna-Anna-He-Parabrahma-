/**
 * FoodLoop AI - Order Food Flow Automated Test Suite
 * ==================================================
 * Verifies all Phase 2 APIs:
 * - Restaurant listings
 * - Menu retrieval
 * - Order placement with validation
 * - Order retrieval and status updates
 */

const http = require("http");
const app = require("./src/server");

async function runTests() {
    console.log("====================================================");
    console.log(" Running FoodLoop AI Order Food Integration Tests");
    console.log("====================================================");

    // Boot ephemeral test server
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[SETUP] Test server running on ${baseUrl}`);

    try {
        // Test 1: Health check
        console.log("\n[TEST 1] Testing GET /api/health...");
        const healthRes = await fetch(`${baseUrl}/api/health`);
        const healthData = await healthRes.json();
        console.log("  Health data:", healthData);
        if (healthRes.status !== 200 || !healthData.success) {
            throw new Error("Health check failed!");
        }
        console.log("  [PASS] GET /api/health verified!");

        // Test 2: Get all restaurants
        console.log("\n[TEST 2] Testing GET /api/restaurants...");
        const restRes = await fetch(`${baseUrl}/api/restaurants`);
        const restData = await restRes.json();
        console.log(`  Found ${restData.count} restaurants.`);
        for (const r of restData.data) {
            console.log(`  • ${r.name} (${r.cuisine}) - ${r.address}`);
        }
        if (restRes.status !== 200 || restData.count < 1) {
            throw new Error("Failed to retrieve restaurants!");
        }
        console.log("  [PASS] GET /api/restaurants verified!");

        // Test 3: Get restaurant menu
        console.log("\n[TEST 3] Testing GET /api/restaurants/rest_1/menu...");
        const menuRes = await fetch(`${baseUrl}/api/restaurants/rest_1/menu`);
        const menuData = await menuRes.json();
        console.log(`  Retrieved ${menuData.count} menu items for Annapurna Pure Veg:`);
        for (const item of menuData.data) {
            console.log(`  * ${item.name} (${item.category}): Rs. ${item.originalPrice}`);
        }
        if (menuRes.status !== 200 || menuData.count < 1) {
            throw new Error("Failed to retrieve restaurant menu!");
        }
        console.log("  [PASS] GET /api/restaurants/:id/menu verified!");

        // Test 4: Validation on invalid order
        console.log("\n[TEST 4] Testing POST /api/orders validation (missing customer info)...");
        const badOrderRes = await fetch(`${baseUrl}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: [] })
        });
        const badOrderData = await badOrderRes.json();
        console.log("  Status:", badOrderRes.status);
        console.log("  Validation error:", badOrderData.error);
        if (badOrderRes.status !== 400) {
            throw new Error("Order validation should have failed with 400!");
        }
        console.log("  [PASS] Order input validation verified!");

        // Test 5: Place a valid order
        console.log("\n[TEST 5] Testing POST /api/orders (Placing valid food order)...");
        const validOrderPayload = {
            customerName: "Anjali Patil",
            customerEmail: "anjali@example.com",
            restaurantId: "rest_1",
            items: [
                { foodItemId: "food_101", name: "Veg Biryani", price: 180, quantity: 2 },
                { foodItemId: "food_102", name: "Paneer Butter Masala", price: 200, quantity: 1 }
            ]
        };
        const orderRes = await fetch(`${baseUrl}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validOrderPayload)
        });
        const orderData = await orderRes.json();
        console.log("  Status:", orderRes.status);
        console.log("  Order ID:", orderData.data?._id);
        console.log("  Total Amount:", orderData.data?.totalAmount);
        console.log("  Payment Status:", orderData.data?.paymentStatus);
        console.log("  Order Status:", orderData.data?.orderStatus);

        // Verify total: 180 * 2 + 200 * 1 = 560
        const expectedTotal = 180 * 2 + 200;
        if (orderData.data?.totalAmount !== expectedTotal) {
            throw new Error(`Total amount expected ${expectedTotal}, got ${orderData.data?.totalAmount}`);
        }
        const createdOrderId = orderData.data?._id;
        console.log("  [PASS] Food order placed and total amount correctly calculated!");

        // Test 6: Retrieve order by ID
        console.log(`\n[TEST 6] Testing GET /api/orders/${createdOrderId}...`);
        const fetchOrderRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}`);
        const fetchOrderData = await fetchOrderRes.json();
        console.log("  Customer:", fetchOrderData.data?.customerName);
        console.log("  Items in order:", fetchOrderData.data?.items?.length);
        if (fetchOrderRes.status !== 200 || !fetchOrderData.success) {
            throw new Error("Failed to fetch order by ID!");
        }
        console.log("  [PASS] Order retrieval verified!");

        // Test 7: Update order status
        console.log(`\n[TEST 7] Testing PATCH /api/orders/${createdOrderId}/status...`);
        const patchRes = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderStatus: "CONFIRMED" })
        });
        const patchData = await patchRes.json();
        console.log("  Updated status:", patchData.data?.orderStatus);
        if (patchData.data?.orderStatus !== "CONFIRMED") {
            throw new Error("Status update failed!");
        }
        console.log("  [PASS] Order status update verified!");

        console.log("\n====================================================");
        console.log(" ALL ORDER FOOD INTEGRATION TESTS PASSED CLEANLY!");
        console.log("====================================================");

    } finally {
        server.close();
    }
}

runTests().catch(err => {
    console.error("\n[FAIL] Test encountered error:", err);
    process.exit(1);
});

