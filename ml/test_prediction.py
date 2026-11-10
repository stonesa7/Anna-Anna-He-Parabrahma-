"""
FoodLoop AI (Anna) - Test Suite for Demand Prediction
=====================================================
Automated verification tests ensuring the model produces logical,
consistent, and resilient predictions.
"""

import os
import sys

# Set standard UTF-8 stream handling for Windows compatibility
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure ml/src is in Python path
base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(base_dir, "src"))

from predict import predict_demand

def test_demand_predictions():
    print("=" * 60)
    print(" Running FoodLoop AI Demand Prediction Automated Tests")
    print("=" * 60)

    # -------------------------------------------------------------
    # Test 1: Single Item Lunch Rush Prediction
    # -------------------------------------------------------------
    print("\n[TEST 1] Single item prediction during lunch rush (13:00)...")
    lunch_item = {
        "item_name": "Chicken Biryani",
        "category": "Main Course",
        "original_price": 240,
        "discount_percent": 30,
        "day_of_week": 2, # Wednesday
        "hour_of_day": 13, # Lunch rush
        "shelf_life_hours_left": 5,
        "historical_average_demand": 28
    }
    result = predict_demand(lunch_item)
    pred_units = result[0]["predicted_units"]
    print(f"  Item: {lunch_item['item_name']}")
    print(f"  Predicted Units: {pred_units}")
    print(f"  Confidence Range: {result[0]['confidence_range']}")
    assert pred_units > 0, "Predicted units must be greater than 0"
    print("  [PASS] TEST 1 PASSED!")

    # -------------------------------------------------------------
    # Test 2: Discount Elasticity Test
    # Higher discounts should result in equal or higher predicted sales
    # -------------------------------------------------------------
    print("\n[TEST 2] Verifying discount elasticity (Low Discount vs High Discount)...")
    low_discount_item = {
        "item_name": "Paneer Tikka Roll",
        "category": "Snacks",
        "original_price": 120,
        "discount_percent": 20,
        "day_of_week": 1,
        "hour_of_day": 17,
        "shelf_life_hours_left": 6,
        "historical_average_demand": 22
    }
    high_discount_item = {
        "item_name": "Paneer Tikka Roll",
        "category": "Snacks",
        "original_price": 120,
        "discount_percent": 60, # 60% surplus discount
        "day_of_week": 1,
        "hour_of_day": 17,
        "shelf_life_hours_left": 6,
        "historical_average_demand": 22
    }
    pred_low = predict_demand(low_discount_item)[0]["predicted_units"]
    pred_high = predict_demand(high_discount_item)[0]["predicted_units"]
    print(f"  At 20% Discount -> Predicted: {pred_low} units")
    print(f"  At 60% Discount -> Predicted: {pred_high} units")
    assert pred_high >= pred_low, "High discount must predict equal or higher demand than low discount"
    print("  [PASS] TEST 2 PASSED!")

    # -------------------------------------------------------------
    # Test 3: Weekend vs Weekday Boost
    # Weekend orders should be equal or higher than weekday orders
    # -------------------------------------------------------------
    print("\n[TEST 3] Verifying weekend traffic boost...")
    weekday_item = {
        "item_name": "Samosa Box (4 pcs)",
        "category": "Snacks",
        "original_price": 80,
        "discount_percent": 40,
        "day_of_week": 1, # Tuesday
        "hour_of_day": 16,
        "shelf_life_hours_left": 4,
        "historical_average_demand": 25
    }
    weekend_item = {
        "item_name": "Samosa Box (4 pcs)",
        "category": "Snacks",
        "original_price": 80,
        "discount_percent": 40,
        "day_of_week": 6, # Sunday
        "hour_of_day": 16,
        "shelf_life_hours_left": 4,
        "historical_average_demand": 25
    }
    pred_weekday = predict_demand(weekday_item)[0]["predicted_units"]
    pred_weekend = predict_demand(weekend_item)[0]["predicted_units"]
    print(f"  Weekday (Tuesday) -> Predicted: {pred_weekday} units")
    print(f"  Weekend (Sunday)  -> Predicted: {pred_weekend} units")
    assert pred_weekend >= pred_weekday, "Weekend demand should equal or exceed weekday demand"
    print("  [PASS] TEST 3 PASSED!")

    # -------------------------------------------------------------
    # Test 4: Handling New/Unseen Menu Item Gracefully
    # -------------------------------------------------------------
    print("\n[TEST 4] Robustness test: Predicting for an unseen new item...")
    unseen_item = {
        "item_name": "Special Festival Thali", # Not in training vocabulary
        "category": "Main Course",
        "original_price": 280,
        "discount_percent": 35,
        "day_of_week": 5,
        "hour_of_day": 19,
        "shelf_life_hours_left": 3,
        "historical_average_demand": 15
    }
    result_unseen = predict_demand(unseen_item)
    pred_unseen = result_unseen[0]["predicted_units"]
    print(f"  Item: {unseen_item['item_name']}")
    print(f"  Predicted Units: {pred_unseen}")
    assert pred_unseen > 0, "Unseen item should still receive a reasonable baseline prediction"
    print("  [PASS] TEST 4 PASSED!")

    # -------------------------------------------------------------
    # Test 5: Batch Prediction
    # -------------------------------------------------------------
    print("\n[TEST 5] Verifying multi-item batch prediction...")
    batch_items = [
        {"item_name": "Chocolate Croissant", "category": "Bakery", "original_price": 95, "discount_percent": 50},
        {"item_name": "Veg Burger Combo", "category": "Snacks", "original_price": 130, "discount_percent": 30},
        {"item_name": "Dal Tadka with Rice", "category": "Main Course", "original_price": 140, "discount_percent": 40}
    ]
    batch_results = predict_demand(batch_items)
    print(f"  Processed {len(batch_results)} batch items:")
    for res in batch_results:
        print(f"  * {res['item_name']:<22}: {res['predicted_units']} units (range {res['confidence_range']['min']}-{res['confidence_range']['max']})")
    assert len(batch_results) == 3, "Batch result length must match input count"
    print("  [PASS] TEST 5 PASSED!")

    print("\n" + "=" * 60)
    print(" ALL TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_demand_predictions()
