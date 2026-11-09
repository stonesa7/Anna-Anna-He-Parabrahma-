import React, { useState, useEffect } from 'react';

export default function ImpactStats() {
  const [stats, setStats] = useState({
    active_surplus_deals: 5,
    portions_ready_for_rescue: 38,
    average_discount_percent: '49%',
    estimated_co2_saved_kg: '57.0',
    community_money_saved_inr: 2455
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/rescue/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch(() => {
        // Fallback to static numbers
      });
  }, []);

  return (
    <section className="impact">
      <h2>Every Meal Makes a Difference</h2>
      <p>Technology with a purpose. Food with a future.</p>

      <div className="impact-stats">
        <div>
          <h3>{stats.portions_ready_for_rescue}+</h3>
          <p>Portions Ready to Rescue</p>
        </div>
        <div>
          <h3>{stats.average_discount_percent}</h3>
          <p>Average Discount</p>
        </div>
        <div>
          <h3>{stats.estimated_co2_saved_kg} kg</h3>
          <p>CO₂ Emissions Prevented</p>
        </div>
        <div>
          <h3>₹{stats.community_money_saved_inr}+</h3>
          <p>Community Money Saved</p>
        </div>
      </div>
    </section>
  );
}
