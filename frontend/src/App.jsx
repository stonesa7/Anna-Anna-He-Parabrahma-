import './App.css'

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          🌿 ANNA
          <span>Anna He Purna Brahma</span>
        </div>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="#order">Order Food</a>
          <a href="#rescue">Rescue Food</a>
          <a href="#about">About</a>
        </div>

        <button className="login-btn">Sign In</button>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <span className="tagline">AI POWERED FOOD PLATFORM</span>

          <h1>
            Good Food.
            <br />
            <span>Brighter Tomorrows.</span>
          </h1>

          <p>
            Order delicious meals, rescue surplus food and help
            build a world where no food goes to waste.
          </p>

          <div className="hero-buttons">
            <button className="order-btn">Order Food</button>
            <button className="rescue-btn">Rescue Food</button>
          </div>

          <p className="hero-note">
            Good Food • No Waste • Happier People
          </p>
        </div>

        <div className="hero-image">
          <img
  src="/anna-food.png"
  alt="Traditional Indian food platter"
  className="hero-food-image"
/>
        </div>
      </section>

      <section className="features" id="about">
        <div>
          <h2>🍽️ Order Food</h2>
          <p>Freshly prepared meals from your favourite restaurants.</p>
        </div>

        <div>
          <h2>🌱 Rescue Food</h2>
          <p>Discover quality surplus food at special prices.</p>
        </div>

        <div>
          <h2>🤖 AI Powered</h2>
          <p>Smart demand prediction to prevent food waste.</p>
        </div>
      </section>

      <section className="impact">
        <h2>Every Meal Makes a Difference</h2>
        <p>Technology with a purpose. Food with a future.</p>

        <div className="impact-stats">
          <div><h3>10K+</h3><p>Meals Rescued</p></div>
          <div><h3>500+</h3><p>Happy Customers</p></div>
          <div><h3>100+</h3><p>Partner Restaurants</p></div>
          <div><h3>50+</h3><p>NGOs Supported</p></div>
        </div>
      </section>
    </div>
  )
}

export default App