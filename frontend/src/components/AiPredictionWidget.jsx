import React, { useState } from 'react';

export default function AiPredictionWidget() {
  const [itemName, setItemName] = useState('Veg Biryani');
  const [category, setCategory] = useState('Main Course');
  const [originalPrice, setOriginalPrice] = useState(180);
  const [discountPercent, setDiscountPercent] = useState(40);
  const [shelfLife, setShelfLife] = useState(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sampleItems = [
    { name: 'Veg Biryani', cat: 'Main Course', price: 180 },
    { name: 'Chicken Biryani', cat: 'Main Course', price: 240 },
    { name: 'Paneer Butter Masala', cat: 'Main Course', price: 200 },
    { name: 'Paneer Tikka Roll', cat: 'Snacks', price: 120 },
    { name: 'Samosa Box (4 pcs)', cat: 'Snacks', price: 80 },
    { name: 'Chocolate Croissant', cat: 'Bakery', price: 95 },
    { name: 'Fresh Fruit Bowl', cat: 'Salads', price: 110 }
  ];

  const handleItemSelect = (e) => {
    const selected = sampleItems.find(it => it.name === e.target.value);
    if (selected) {
      setItemName(selected.name);
      setCategory(selected.cat);
      setOriginalPrice(selected.price);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('http://localhost:5000/api/demand/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: itemName,
          category,
          original_price: Number(originalPrice),
          discount_percent: Number(discountPercent),
          shelf_life_hours_left: Number(shelfLife),
          hour_of_day: new Date().getHours(),
          day_of_week: new Date().getDay(),
          historical_average_demand: 22
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError(data.error || 'Prediction failed. Ensure ML service is running.');
      }
    } catch (err) {
      setError('Could not reach backend or ML service. Please make sure both services are started.');
    } finally {
      setLoading(false);
    }
  };

  const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100));

  return (
    <section className="section-container" id="ai-section">
      <div className="section-header">
        <span className="section-badge">🤖 FOODLOOP AI INTELLIGENCE</span>
        <h2>Demand & Waste Prediction Engine</h2>
        <p>Powered by our Scikit-Learn Random Forest model. Predict customer demand before closing time to eliminate commercial food waste.</p>
      </div>

      <div className="ai-widget-card">
        <form onSubmit={handlePredict} className="ai-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Select Food Item:</label>
              <select value={itemName} onChange={handleItemSelect} className="select-input">
                {sampleItems.map(it => (
                  <option key={it.name} value={it.name}>{it.name} ({it.cat})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Original Menu Price (₹):</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="text-input"
                min="10"
              />
            </div>

            <div className="form-group">
              <label>Surplus Discount %: <strong>{discountPercent}%</strong></label>
              <input
                type="range"
                min="20"
                max="75"
                step="5"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="slider-input"
              />
              <span className="discount-calc">Discounted Price: <strong>₹{discountedPrice}</strong></span>
            </div>

            <div className="form-group">
              <label>Shelf-Life Remaining (Hours): <strong>{shelfLife} hrs</strong></label>
              <input
                type="range"
                min="1"
                max="12"
                value={shelfLife}
                onChange={(e) => setShelfLife(e.target.value)}
                className="slider-input"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="predict-btn">
            {loading ? 'Calculating AI Forecast...' : '⚡ Predict Sales Units & Get Advice'}
          </button>
        </form>

        {error && <div className="error-banner">{error}</div>}

        {result && (
          <div className="ai-result-panel">
            <div className="result-metric-box">
              <div className="metric-number">{result.predicted_units}</div>
              <div className="metric-label">Predicted Portions Likely to Sell</div>
              <div className="confidence-pill">
                Confidence: {result.confidence_range?.min} – {result.confidence_range?.max} units
              </div>
            </div>

            <div className="result-insights">
              <h4>🎯 FoodLoop AI Strategy:</h4>
              <p>
                At a <strong>{discountPercent}% discount (₹{discountedPrice})</strong> with <strong>{shelfLife} hours left</strong>, 
                our Random Forest model forecasts that approximately <strong>{result.predicted_units} portions</strong> will be rescued by customers.
              </p>
              <div className="ai-tip-box">
                💡 <strong>Tip for Kitchens:</strong> {result.predicted_units > 15
                  ? "High customer volume expected! Package portions in advance for quick pickup."
                  : "Consider pushing discount up to 50% during the final 2 hours to clear all remaining stock."
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
