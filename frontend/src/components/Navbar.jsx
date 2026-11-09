import React from 'react';

export default function Navbar({ activeTab, setActiveTab, cartCount, onOpenCart }) {
  return (
    <nav className="navbar">
      <div className="logo" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
        🍲 ANNA
        <span>Anna He Purna Brahma · FoodLoop AI</span>
      </div>

      <div className="nav-links">
        <button 
          className={`nav-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          Home
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'order' ? 'active' : ''}`}
          onClick={() => setActiveTab('order')}
        >
          🍽️ Order Food
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'rescue' ? 'active' : ''}`}
          onClick={() => setActiveTab('rescue')}
        >
          🌱 Rescue Food
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          🤖 AI Predictor
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="cart-badge-btn" onClick={onOpenCart}>
          🛒 Cart <span className="cart-pill">{cartCount}</span>
        </button>
        <button className="login-btn">Sign In</button>
      </div>
    </nav>
  );
}
