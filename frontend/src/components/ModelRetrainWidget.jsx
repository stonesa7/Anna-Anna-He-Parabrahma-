import React, { useState, useEffect } from 'react';

export default function ModelRetrainWidget() {
  const [modelInfo, setModelInfo] = useState({
    total_samples: 4000,
    mae: 2.36,
    r2: 0.9255,
    top_factors: [
      { factor: 'historical_average_demand', impact_percent: 44.0 },
      { factor: 'hour_of_day', impact_percent: 26.1 },
      { factor: 'discount_percent', impact_percent: 8.7 }
    ]
  });

  // Sales Logging Form State
  const [itemName, setItemName] = useState('Veg Biryani');
  const [category, setCategory] = useState('Main Course');
  const [originalPrice, setOriginalPrice] = useState(180);
  const [discountPercent, setDiscountPercent] = useState(50);
  const [shelfLife, setShelfLife] = useState(3);
  const [unitsSold, setUnitsSold] = useState(38);

  const [logLoading, setLogLoading] = useState(false);
  const [retrainLoading, setRetrainLoading] = useState(false);
  const [logMessage, setLogMessage] = useState(null);
  const [retrainSuccess, setRetrainSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/demand/model-info');
      const data = await res.json();
      if (data.success) {
        setModelInfo(prev => ({ ...prev, total_samples: data.total_samples }));
      }
    } catch (e) {
      // Keep defaults if offline
    }
  };

  const handleLogSale = async (e) => {
    e.preventDefault();
    setLogLoading(true);
    setLogMessage(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:5000/api/demand/log-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: itemName,
          category,
          original_price: Number(originalPrice),
          discount_percent: Number(discountPercent),
          shelf_life_hours_left: Number(shelfLife),
          units_sold: Number(unitsSold),
          hour_of_day: new Date().getHours(),
          day_of_week: new Date().getDay()
        })
      });

      const data = await res.json();
      if (data.success) {
        setLogMessage(`✓ Logged sale of ${unitsSold} units of ${itemName}! Total training dataset is now ${data.total_dataset_records} records.`);
        setModelInfo(prev => ({ ...prev, total_samples: data.total_dataset_records }));
      } else {
        setError(data.error || 'Failed to log sale data.');
      }
    } catch (err) {
      setError('Could not reach backend or ML service. Make sure backend and ML servers are running.');
    } finally {
      setLogLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetrainLoading(true);
    setRetrainSuccess(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:5000/api/demand/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (data.success && data.metrics) {
        setModelInfo(prev => ({
          ...prev,
          total_samples: data.metrics.total_samples,
          mae: data.metrics.mae,
          r2: data.metrics.r2,
          top_factors: data.metrics.top_factors || prev.top_factors
        }));
        setRetrainSuccess(`🎉 Random Forest model retrained successfully with ${data.metrics.total_samples} samples! New MAE: ±${data.metrics.mae} units, R²: ${(data.metrics.r2 * 100).toFixed(1)}% variance explained.`);
      } else {
        setError(data.error || 'Retraining failed.');
      }
    } catch (err) {
      setError('Failed to retrain. Ensure Python ML service is running on port 5001.');
    } finally {
      setRetrainLoading(false);
    }
  };

  return (
    <section className="section-container" id="retrain-section">
      <div className="section-header">
        <span className="section-badge">🧠 CONTINUOUS MACHINE LEARNING</span>
        <h2>Self-Learning Platform & Dynamic Retraining</h2>
        <p>In a real-world platform, real sales feedback is continuously collected from restaurant partners to dynamically retrain the Random Forest model.</p>
      </div>

      {/* Model Health Cards */}
      <div className="model-stats-grid">
        <div className="stat-card">
          <div className="stat-value">{modelInfo.total_samples}</div>
          <div className="stat-label">Training Records in Dataset</div>
          <div className="stat-sub">Includes realistic & user-logged sales</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{(modelInfo.r2 * 100).toFixed(1)}%</div>
          <div className="stat-label">Model Accuracy (R² Score)</div>
          <div className="stat-sub">Proportion of variance explained</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">±{modelInfo.mae}</div>
          <div className="stat-label">Average Error (MAE)</div>
          <div className="stat-sub">Predictions are off by only ~2 portions</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">100 Trees</div>
          <div className="stat-label">Ensemble Regressor</div>
          <div className="stat-sub">Scikit-learn RandomForest</div>
        </div>
      </div>

      {/* Two Column Layout: Log Sales + Retrain Actions */}
      <div className="retrain-columns">
        {/* Column 1: Log Real Sales */}
        <div className="tool-card">
          <h3>📝 Step 1: Log Restaurant Sales Data</h3>
          <p className="tool-subtitle">Add actual daily sales numbers from your restaurant kitchen into the training dataset:</p>

          <form onSubmit={handleLogSale} className="log-form">
            <div className="form-group">
              <label>Food Item Name:</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="text-input"
                placeholder="e.g. Veg Biryani"
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Category:</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-input">
                  <option value="Main Course">Main Course</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Salads">Salads</option>
                </select>
              </div>

              <div className="form-group">
                <label>Original Price (₹):</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="text-input"
                  min="10"
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Discount Offered (%):</label>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="text-input"
                  min="0"
                  max="90"
                  required
                />
              </div>

              <div className="form-group">
                <label>Shelf-Life Left (hrs):</label>
                <input
                  type="number"
                  value={shelfLife}
                  onChange={(e) => setShelfLife(e.target.value)}
                  className="text-input"
                  min="1"
                  max="24"
                  required
                />
              </div>
            </div>

            <div className="form-group highlight-input">
              <label>🎯 Actual Units Sold Today (Ground Truth):</label>
              <input
                type="number"
                value={unitsSold}
                onChange={(e) => setUnitsSold(e.target.value)}
                className="text-input big-input"
                min="0"
                required
              />
            </div>

            <button type="submit" disabled={logLoading} className="log-btn">
              {logLoading ? 'Logging Data...' : '💾 Save Sale to Training Dataset'}
            </button>
          </form>

          {logMessage && <div className="success-banner">{logMessage}</div>}
        </div>

        {/* Column 2: Trigger Dynamic Retraining */}
        <div className="tool-card retrain-cta-card">
          <h3>⚡ Step 2: Dynamically Retrain AI Model</h3>
          <p className="tool-subtitle">
            Train all 100 decision trees on the updated dataset. The model will immediately adapt to your restaurant's unique customer demand!
          </p>

          <div className="retrain-benefits">
            <div className="benefit-item">✓ Adapts to seasonal trends & customer adoption</div>
            <div className="benefit-item">✓ Swaps model in-memory with zero server downtime</div>
            <div className="benefit-item">✓ Re-evaluates test metrics (MAE, RMSE, R²) instantly</div>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retrainLoading}
            className="big-retrain-btn"
          >
            {retrainLoading ? (
              <span>🔄 Retraining 100 Trees on {modelInfo.total_samples} records...</span>
            ) : (
              <span>🚀 Retrain Model with Latest Data</span>
            )}
          </button>

          {retrainSuccess && (
            <div className="success-banner retrain-success-box">
              {retrainSuccess}
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          <div className="feature-importance-box">
            <h4>📊 Top Demand Factors Influencing Model:</h4>
            {modelInfo.top_factors && modelInfo.top_factors.slice(0, 3).map((f, i) => (
              <div key={i} className="importance-row">
                <span>{i + 1}. {f.factor}</span>
                <strong>{f.impact_percent}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
