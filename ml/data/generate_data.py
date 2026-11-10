"""
FoodLoop AI (Anna) - Synthetic Data Generator for Demand Prediction
===================================================================
This script generates a realistic historical dataset representing surplus food
sales in restaurants and food businesses.

Why synthetic data?
Since this is a new model development phase, synthetic data allows us to simulate
realistic food surplus scenarios (discounts, meal times, shelf life urgency)
before connecting live point-of-sale (POS) data streams.
"""

import os
import numpy as np
import pandas as pd

def generate_demand_dataset(num_records: int = 3500, random_seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic restaurant surplus sales records.
    
    Parameters:
        num_records (int): Number of historical transactions to generate.
        random_seed (int): Seed for reproducible random numbers.
        
    Returns:
        pd.DataFrame: A clean DataFrame containing features and target 'units_sold'.
    """
    np.random.seed(random_seed)

    # Food catalogue with typical baseline properties
    menu_items = [
        {"item_name": "Veg Biryani", "category": "Main Course", "base_price": 180, "base_demand": 24},
        {"item_name": "Chicken Biryani", "category": "Main Course", "base_price": 240, "base_demand": 28},
        {"item_name": "Paneer Butter Masala", "category": "Main Course", "base_price": 200, "base_demand": 20},
        {"item_name": "Dal Tadka with Rice", "category": "Main Course", "base_price": 140, "base_demand": 18},
        {"item_name": "Paneer Tikka Roll", "category": "Snacks", "base_price": 120, "base_demand": 22},
        {"item_name": "Samosa Box (4 pcs)", "category": "Snacks", "base_price": 80, "base_demand": 25},
        {"item_name": "Veg Burger Combo", "category": "Snacks", "base_price": 130, "base_demand": 19},
        {"item_name": "Chocolate Croissant", "category": "Bakery", "base_price": 95, "base_demand": 15},
        {"item_name": "Blueberry Muffin", "category": "Bakery", "base_price": 85, "base_demand": 14},
        {"item_name": "Fresh Fruit Bowl", "category": "Salads", "base_price": 110, "base_demand": 12},
    ]

    records = []

    for _ in range(num_records):
        # 1. Randomly pick a food item
        item = menu_items[np.random.choice(len(menu_items))]
        item_name = item["item_name"]
        category = item["category"]
        original_price = float(item["base_price"])
        base_demand = item["base_demand"]

        # 2. Temporal features: day of week (0=Mon, 6=Sun) and hour of day (11 to 22)
        day_of_week = int(np.random.randint(0, 7))
        is_weekend = 1 if day_of_week in [5, 6] else 0
        hour_of_day = int(np.random.randint(11, 23))

        # 3. Surplus food discounting features
        # Restaurants discount surplus food between 20% and 70% to clear stock
        discount_percent = float(np.random.choice([20, 30, 40, 50, 60, 70]))
        discounted_price = round(original_price * (1.0 - discount_percent / 100.0), 2)

        # 4. Freshness / Urgency feature: hours of shelf-life remaining (2 to 14 hours)
        shelf_life_hours_left = int(np.random.randint(2, 15))

        # 5. Realistic demand drivers:
        # - Peak Meal Hours: Lunch (12-14) and Dinner (19-21) have highest traffic
        is_lunch_peak = 1.35 if 12 <= hour_of_day <= 14 else 1.0
        is_dinner_peak = 1.45 if 19 <= hour_of_day <= 21 else 1.0
        time_multiplier = max(is_lunch_peak, is_dinner_peak)

        # - Weekend boost: 20% more customer orders on weekends
        weekend_multiplier = 1.20 if is_weekend else 1.0

        # - Discount elasticity: higher discounts noticeably increase customer adoption
        # e.g., 50% discount boosts demand by ~35%
        discount_multiplier = 1.0 + (discount_percent / 100.0) * 0.70

        # - Urgency / Shelf-life effect: extreme urgency (2-3 hrs left) combined with
        # steep discounts creates flash-sale volume
        urgency_multiplier = 1.15 if (shelf_life_hours_left <= 3 and discount_percent >= 50) else 1.0

        # 6. Target calculation with realistic noise
        expected_demand = (
            base_demand
            * time_multiplier
            * weekend_multiplier
            * discount_multiplier
            * urgency_multiplier
        )

        # Add Gaussian noise (simulating unpredictable day-to-day fluctuations)
        noise = np.random.normal(0, 2.5)
        units_sold = int(max(0, round(expected_demand + noise)))

        records.append({
            "item_name": item_name,
            "category": category,
            "original_price": original_price,
            "discount_percent": discount_percent,
            "discounted_price": discounted_price,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "hour_of_day": hour_of_day,
            "shelf_life_hours_left": shelf_life_hours_left,
            "historical_average_demand": base_demand,
            "units_sold": units_sold
        })

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "food_demand_data.csv")

    print(f"[INFO] Generating synthetic FoodLoop demand data...")
    dataset = generate_demand_dataset(num_records=4000, random_seed=42)

    # Save to CSV
    dataset.to_csv(output_path, index=False)
    print(f"[SUCCESS] Dataset saved to: {output_path}")
    print(f"[INFO] Shape: {dataset.shape} (rows, columns)")
    print("\nSample records:")
    print(dataset.head(5))

