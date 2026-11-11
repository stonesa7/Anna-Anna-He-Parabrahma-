import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const API_URL = "http://localhost:5000/api/rescue";

function RescueFood() {
    const { addToCart, totalItems } = useCart();

    const [foods, setFoods] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCity, setSelectedCity] = useState("All");

    useEffect(() => {
        const fetchRescueData = async () => {
            try {
                setLoading(true);
                setError("");

                const [foodResponse, orgResponse] = await Promise.all([
                    fetch(`${API_URL}/food`),
                    fetch(`${API_URL}/organizations`)
                ]);

                if (!foodResponse.ok || !orgResponse.ok) {
                    throw new Error("Unable to fetch rescue food data.");
                }

                const foodData = await foodResponse.json();
                const orgData = await orgResponse.json();

                setFoods(foodData.data || []);
                setOrganizations(orgData.data || []);

            } catch (err) {
                console.error("Rescue API Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRescueData();
    }, []);

    const handleAddToCart = (food) => {
        const success = addToCart({
            itemId: `rescue-${food.id}`,
            name: food.name,
            price: Number(food.price),
            originalPrice: Number(food.originalPrice),
            image: food.image,
            sourceType: "rescue",
            sourceName: food.donor,
            city: food.city,
            address: food.address
        });

        if (success) {
            alert(`${food.name} added to your cart!`);
        } else {
            alert("Unable to add this item to your cart.");
        }
    };

    const filteredFoods = foods.filter((food) => {
        const available = food.status === "available";
        const matchesCity =
            selectedCity === "All" || food.city === selectedCity;

        return available && matchesCity;
    });

    const cities = [
        "All",
        ...new Set(foods.map((food) => food.city).filter(Boolean))
    ];

    if (loading) {
        return (
            <div className="rescue-loading">
                <h2>🌱 Finding surplus food near you...</h2>
            </div>
        );
    }

    return (
        <div className="rescue-page">

            {/* HERO SECTION */}
            <section className="rescue-hero">

                <div>
                    <span className="rescue-badge">
                        🌱 SAVE FOOD • SAVE MONEY
                    </span>

                    <h1>Rescue Food</h1>

                    <p>
                        Good food deserves another chance.
                        Discover delicious surplus food at special prices
                        and help reduce food waste.
                    </p>

                    <Link to="/checkout" className="rescue-cart-btn">
                        🛒 View Cart ({totalItems})
                    </Link>
                </div>

                <div className="rescue-hero-icon">
                    🌍
                </div>

            </section>

            {/* BENEFITS */}
            <section className="rescue-benefits">

                <div className="rescue-benefit-card">
                    <span>♻️</span>
                    <h3>Reduce Food Waste</h3>
                    <p>Give surplus food a second chance.</p>
                </div>

                <div className="rescue-benefit-card">
                    <span>💰</span>
                    <h3>Save Money</h3>
                    <p>Enjoy food at discounted prices.</p>
                </div>

                <div className="rescue-benefit-card">
                    <span>💗</span>
                    <h3>Make an Impact</h3>
                    <p>Help build a sustainable food system.</p>
                </div>

            </section>

            {/* FOOD LISTINGS */}
            <section className="rescue-listings">

                <div className="rescue-section-heading">
                    <div>
                        <h2>Available Rescue Food 🥗</h2>
                        <p>Fresh surplus food at special prices.</p>
                    </div>

                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    >
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city === "All" ? "All Cities" : city}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="rescue-error">
                        {error}
                        <p>Make sure your backend server is running.</p>
                    </div>
                )}

                {!error && filteredFoods.length === 0 && (
                    <p className="rescue-empty">
                        No available rescue food found in this city.
                    </p>
                )}

                <div className="rescue-food-grid">

                    {filteredFoods.map((food) => {

                        const discount = food.originalPrice > 0
                            ? Math.round(
                                ((food.originalPrice - food.price) /
                                    food.originalPrice) * 100
                            )
                            : 0;

                        return (
                            <div className="rescue-food-card" key={food.id}>

                                <div className="rescue-image-container">

                                    <img
                                        src={food.image}
                                        alt={food.name}
                                        onError={(e) => {
                                            e.currentTarget.src =
                                                "https://placehold.co/500x300?text=Rescue+Food";
                                        }}
                                    />

                                    <span className="discount-badge">
                                        {discount}% OFF
                                    </span>

                                </div>

                                <div className="rescue-food-content">

                                    <span className="food-category">
                                        {food.category}
                                    </span>

                                    <h3>{food.name}</h3>

                                    <p>{food.description}</p>

                                    <div className="rescue-prices">
                                        <strong>₹{food.price}</strong>
                                        <del>₹{food.originalPrice}</del>
                                    </div>

                                    <p>
                                        🏪 {food.donor}
                                    </p>

                                    <p>
                                        📍 {food.city}, {food.address}
                                    </p>

                                    <p>
                                        ⏰ Expires: {food.expiryTime}
                                    </p>

                                    <p>
                                        📦 Available: {food.quantity}
                                    </p>

                                    <button
                                        className="rescue-add-btn"
                                        onClick={() => handleAddToCart(food)}
                                    >
                                        + Add to Cart
                                    </button>

                                </div>

                            </div>
                        );
                    })}

                </div>

            </section>

            {/* ORGANIZATIONS */}
            <section className="rescue-organizations">

                <div className="rescue-section-heading">
                    <div>
                        <h2>Our Partner Organizations 🤝</h2>
                        <p>
                            Organizations helping us reduce food waste
                            and support communities.
                        </p>
                    </div>
                </div>

                <div className="organization-grid">

                    {organizations.map((org) => (

                        <div className="organization-card" key={org.id}>

                            <div className="organization-icon">
                                🏢
                            </div>

                            <h3>{org.name}</h3>

                            <p>📍 {org.city}</p>

                            <p>✉️ {org.contact}</p>

                            {org.verified && (
                                <span className="verified-badge">
                                    ✓ Verified Organization
                                </span>
                            )}

                        </div>

                    ))}

                </div>

            </section>

        </div>
    );
}

export default RescueFood;