"""
FoodLoop AI (Anna) - Demand Prediction Model Training
=====================================================
Algorithm: Random Forest Regression (scikit-learn)

Why Random Forest?
- It combines multiple decision trees (ensemble learning).
- It handles both numerical features (price, hour, shelf life) and categorical features (food item, category).
- It is robust against overfitting and captures non-linear relationships (like rush hour peaks).
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline

def train_model(data_path: str, model_save_path: str):
    """
    Train a Random Forest Regressor to predict food item sales demand.
    
    Parameters:
        data_path (str): Path to CSV training dataset.
        model_save_path (str): Output path where trained model will be stored.
    """
    print("=" * 60)
    print(" FoodLoop AI: Demand Prediction Training Pipeline")
    print("=" * 60)

    # -------------------------------------------------------------
    # Step 1: Load and inspect the dataset
    # -------------------------------------------------------------
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Training data not found at {data_path}. Please run generate_data.py first.")

    print(f"\n[1/5] Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"      Total records loaded: {len(df)}")

    # -------------------------------------------------------------
    # Step 2: Define features (X) and target variable (y)
    # -------------------------------------------------------------
    print("\n[2/5] Defining features and target...")
    
    # Categorical features: text descriptions that must be converted to numbers
    categorical_features = ["item_name", "category"]

    # Numerical features: quantitative metrics
    numerical_features = [
        "original_price",
        "discount_percent",
        "discounted_price",
        "day_of_week",
        "is_weekend",
        "hour_of_day",
        "shelf_life_hours_left",
        "historical_average_demand"
    ]

    feature_columns = categorical_features + numerical_features
    target_column = "units_sold"

    X = df[feature_columns]
    y = df[target_column]

    print(f"      Features ({len(feature_columns)}): {feature_columns}")
    print(f"      Target: '{target_column}'")

    # -------------------------------------------------------------
    # Step 3: Split into Training (80%) and Test (20%) sets
    # -------------------------------------------------------------
    # We keep 20% of data hidden from the model during training so we can
    # test how accurately it predicts on unseen data.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )
    print(f"\n[3/5] Splitting data: {len(X_train)} training samples, {len(X_test)} test samples.")

    # -------------------------------------------------------------
    # Step 4: Build Preprocessing and Modeling Pipeline
    # -------------------------------------------------------------
    # We use a ColumnTransformer:
    # - OneHotEncoder converts categorical strings into binary flags (0 or 1).
    #   handle_unknown='ignore' ensures safe predictions even if a new item is encountered.
    # - 'passthrough' keeps numerical features as-is.
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("num", "passthrough", numerical_features),
        ]
    )

    # Random Forest Regressor:
    # - n_estimators=100: builds 100 diverse decision trees
    # - max_depth=12: prevents individual trees from growing too deep (controls overfitting)
    # - min_samples_split=4: requires at least 4 samples to split a leaf
    regressor = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )

    # Scikit-learn Pipeline connects preprocessing directly to the model.
    # This prevents data leakage and makes inference simple (one call to predict).
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", regressor)
    ])

    print("\n[4/5] Training Random Forest Regressor (100 trees)...")
    pipeline.fit(X_train, y_train)
    print("      Model training complete!")

    # -------------------------------------------------------------
    # Step 5: Evaluate model performance on unseen test set
    # -------------------------------------------------------------
    print("\n[5/5] Evaluating performance on test set...")
    y_pred = pipeline.predict(X_test)

    # Metrics explained:
    # 1. MAE (Mean Absolute Error): Average difference in units between predicted and actual.
    #    Example: MAE = 2.0 means our predictions are off by only ~2 food units on average.
    mae = mean_absolute_error(y_test, y_pred)

    # 2. RMSE (Root Mean Squared Error): Penalizes larger errors more heavily.
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    # 3. R2 Score (Coefficient of Determination): Proportion of variance explained.
    #    1.0 is a perfect model; > 0.85 indicates a very strong model.
    r2 = r2_score(y_test, y_pred)

    print("-" * 50)
    print(" Evaluation Metrics on Unseen Test Data:")
    print(f"  • Mean Absolute Error (MAE)  : {mae:.2f} units")
    print(f"  • Root Mean Squared Error    : {rmse:.2f} units")
    print(f"  • R-squared (R2 Score)       : {r2:.4f} ({r2 * 100:.1f}% variance explained)")
    print("-" * 50)

    # Save trained model pipeline artifact
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    joblib.dump(pipeline, model_save_path)
    print(f"\n[SAVED] Trained model saved to: {model_save_path}")

    # Inspect Feature Importances
    # Extract feature names after One-Hot Encoding
    ohe_categories = pipeline.named_steps["preprocessor"].named_transformers_["cat"].get_feature_names_out(categorical_features)
    all_feature_names = list(ohe_categories) + numerical_features
    importances = pipeline.named_steps["regressor"].feature_importances_

    # Sort and display top 8 most influential features
    top_indices = np.argsort(importances)[::-1][:8]
    print("\nTop Influential Demand Factors:")
    for rank, idx in enumerate(top_indices, start=1):
        print(f"  {rank}. {all_feature_names[idx]:<30} : {importances[idx] * 100:.1f}% impact")

    print("\n" + "=" * 60)
    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(r2, 4)
    }

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_file = os.path.join(base_dir, "data", "food_demand_data.csv")
    model_output_file = os.path.join(base_dir, "models", "demand_model.joblib")

    train_model(dataset_file, model_output_file)

