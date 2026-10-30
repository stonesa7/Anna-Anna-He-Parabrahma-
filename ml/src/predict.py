"""
FoodLoop AI (Anna) - Demand Prediction Inference Module
======================================================
This module provides a standalone, reusable prediction function that loads the
trained Random Forest model and predicts demand for one or more food items.
"""

import os
import joblib
import pandas as pd
from typing import Dict, Any, Union, List

# Module-level cache to keep the model loaded in memory for fast API responses
_LOADED_MODEL = None
_DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "models",
    "demand_model.joblib"
)

def get_model(model_path: str = _DEFAULT_MODEL_PATH):
    """
    Retrieve the cached trained model or load it from disk if not yet in memory.
    """
    global _LOADED_MODEL
    if _LOADED_MODEL is None:
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model file not found at: {model_path}. Please run train.py first."
            )
        _LOADED_MODEL = joblib.load(model_path)
    return _LOADED_MODEL

def prepare_input_dataframe(item_data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> pd.DataFrame:
    """
    Validates and enriches input dictionary into the format required by the model.
    """
    if isinstance(item_data, dict):
        item_data = [item_data]

    processed_rows = []
    for item in item_data:
        # Extract features with sensible defaults
        item_name = str(item.get("item_name", "Unknown Item"))
        category = str(item.get("category", "Main Course"))
        original_price = float(item.get("original_price", 150.0))
        discount_percent = float(item.get("discount_percent", 30.0))

        # Calculate discounted price if not explicitly provided
        discounted_price = float(
            item.get("discounted_price", original_price * (1.0 - discount_percent / 100.0))
        )

        day_of_week = int(item.get("day_of_week", 2)) # Default: Wednesday (2)
        is_weekend = int(item.get("is_weekend", 1 if day_of_week in [5, 6] else 0))
        hour_of_day = int(item.get("hour_of_day", 13)) # Default: Lunch hour 13:00
        shelf_life_hours_left = int(item.get("shelf_life_hours_left", 6))
        historical_average_demand = float(item.get("historical_average_demand", 20.0))

        processed_rows.append({
            "item_name": item_name,
            "category": category,
            "original_price": original_price,
            "discount_percent": discount_percent,
            "discounted_price": discounted_price,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "hour_of_day": hour_of_day,
            "shelf_life_hours_left": shelf_life_hours_left,
            "historical_average_demand": historical_average_demand
        })

    return pd.DataFrame(processed_rows)

def predict_demand(item_data: Union[Dict[str, Any], List[Dict[str, Any]]], model_path: str = _DEFAULT_MODEL_PATH) -> List[Dict[str, Any]]:
    """
    Estimate the number of units expected to sell.
    
    Parameters:
        item_data: A dictionary or list of dictionaries containing food item features.
        model_path: Optional path to custom model artifact.
        
    Returns:
        List of prediction result dictionaries.
    """
    model = get_model(model_path)
    df = prepare_input_dataframe(item_data)

    # Predict continuous value using Random Forest
    raw_predictions = model.predict(df)

    results = []
    for idx, raw_val in enumerate(raw_predictions):
        predicted_units = int(max(0, round(raw_val)))
        
        # Estimate confidence interval (+/- 3 units based on model MAE)
        min_units = max(0, predicted_units - 3)
        max_units = predicted_units + 3

        item_name = df.iloc[idx]["item_name"]
        results.append({
            "item_name": item_name,
            "predicted_units": predicted_units,
            "confidence_range": {
                "min": min_units,
                "max": max_units
            },
            "input_features": {
                "category": df.iloc[idx]["category"],
                "original_price": df.iloc[idx]["original_price"],
                "discount_percent": df.iloc[idx]["discount_percent"],
                "discounted_price": df.iloc[idx]["discounted_price"],
                "hour_of_day": int(df.iloc[idx]["hour_of_day"]),
                "day_of_week": int(df.iloc[idx]["day_of_week"]),
                "shelf_life_hours_left": int(df.iloc[idx]["shelf_life_hours_left"])
            }
        })

    return results

if __name__ == "__main__":
    # Quick sanity test
    test_sample = {
        "item_name": "Veg Biryani",
        "category": "Main Course",
        "original_price": 180,
        "discount_percent": 40,
        "day_of_week": 4,      # Friday
        "hour_of_day": 20,     # 8 PM dinner
        "shelf_life_hours_left": 4,
        "historical_average_demand": 24
    }

    prediction = predict_demand(test_sample)
    print("\n[TEST] Sample Prediction Result:")
    print(prediction[0])

