import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    fetchRestaurants,
    maharashtraCities
} from "../services/restaurantService";

function OrderFood() {
const [restaurants, setRestaurants] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [search, setSearch] = useState("");
const [selectedCity, setSelectedCity] = useState("all");
const [sortBy, setSortBy] = useState("rating");
const [retryCount, setRetryCount] = useState(0);


// Fetch restaurants whenever the selected city changes
useEffect(() => {
    const loadRestaurants = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await fetchRestaurants(selectedCity);

            setRestaurants(data);
        } catch (err) {
            console.error("Restaurant loading error:", err);
            setError("Unable to load restaurants. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    loadRestaurants();
}, [selectedCity, retryCount]);

// Search restaurants
const filteredRestaurants = restaurants.filter((restaurant) => {
    const query = search.toLowerCase().trim();

    return (
        restaurant.name?.toLowerCase().includes(query) ||
        restaurant.locality?.toLowerCase().includes(query) ||
        restaurant.city?.toLowerCase().includes(query) ||
        restaurant.cuisines?.some((cuisine) =>
            cuisine.toLowerCase().includes(query)
        )
    );
});

// Sort restaurants
const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    if (sortBy === "rating") {
        return (
            (b.rating_external?.value || 0) -
            (a.rating_external?.value || 0)
        );
    }

    if (sortBy === "cost") {
        return (
            (a.cost_for_two ?? Infinity) -
            (b.cost_for_two ?? Infinity)
        );
    }

    return 0;
});

// Loading screen
if (loading) {
    return (
        <div className="loading-message">
            <h2>🍽️ Discovering delicious food...</h2>
            <p>Finding restaurants across Maharashtra.</p>
        </div>
    );
}

// Error screen
if (error) {
    return (
        <div className="error-message">
            <h2>Something went wrong!</h2>
            <p>{error}</p>

            <button onClick={() => setRetryCount((count) => count + 1)}>
                Try Again
            </button>
        </div>
    );
}

return (
    <div className="restaurant-page">

        {/* Hero Section */}
        <div className="restaurant-hero">
            <h1>Discover Great Food Across Maharashtra 🍽️</h1>

            <p>
                From Mumbai to Nagpur, discover amazing restaurants
                with ANNA.
            </p>

            <input
                type="text"
                className="restaurant-search"
                placeholder="Search restaurants, cuisines or locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        {/* Restaurant Content */}
        <div className="restaurant-content">

            {/* Filters */}
            <div className="restaurant-controls">

                <div>
                    <label htmlFor="city-filter">
                        📍 Select Location
                    </label>

                    <select
                        id="city-filter"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    >
                        {maharashtraCities.map((city) => (
                            <option
                                key={city.value}
                                value={city.value}
                            >
                                {city.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="sort-filter">
                        Sort By
                    </label>

                    <select
                        id="sort-filter"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="rating">Highest Rated</option>
                        <option value="cost">Lowest Cost</option>
                    </select>
                </div>

            </div>

            {/* Restaurant Heading */}
            <div className="restaurant-heading">
                <h2>
                    {selectedCity === "all"
                        ? "Restaurants Across Maharashtra"
                        : `Restaurants in ${
                            maharashtraCities.find(
                                (city) => city.value === selectedCity
                            )?.name
                        }`}
                </h2>

                <p>{sortedRestaurants.length} restaurants found</p>
            </div>

            {/* Restaurant Cards */}
            <div className="restaurant-grid">

                {sortedRestaurants.map((restaurant) => (
                    <div
                        className="restaurant-card"
                        key={restaurant.id}
                    >

                        {/* Restaurant Image */}
                        {restaurant.photo ? (
                            <img
                                src={restaurant.photo}
                                alt={restaurant.name}
                                className="restaurant-image"
                                loading="lazy"
                            />
                        ) : (
                            <div className="no-image">
                                🍽️ Image unavailable
                            </div>
                        )}

                        {/* Restaurant Information */}
                        <div className="restaurant-details">

                            <h3>{restaurant.name}</h3>

                            <p className="restaurant-cuisine">
                                {restaurant.cuisines?.join(", ") ||
                                    "Cuisine unavailable"}
                            </p>

                            <p>
                                📍 {restaurant.locality || "Location unavailable"},
                                {" "}{restaurant.city || ""}
                            </p>

                            <p>
                                ⭐ {restaurant.rating_external?.value ?? "N/A"}
                                {" "}
                                ({restaurant.rating_external?.count ?? 0} reviews)
                            </p>

                            <p>
                                💰 ₹{restaurant.cost_for_two ?? "N/A"} for two
                            </p>

                            <p>
                                {restaurant.open_now === true
                                    ? "🟢 Open now"
                                    : restaurant.open_now === false
                                        ? "🔴 Closed"
                                        : "Opening status unavailable"}
                            </p>

                            {/* Open external restaurant page in a new tab */}
                            {restaurant.url && (
                                <Link
    to={`/restaurant/${encodeURIComponent(restaurant.id)}`}
    className="view-menu"
>
    View Menu →
</Link>
                            )}

                        </div>
                    </div>
                ))}

            </div>

            {/* No Results */}
            {sortedRestaurants.length === 0 && (
                <div className="no-results">
                    <h3>No restaurants found 😕</h3>
                    <p>Try another city or search term.</p>
                </div>
            )}

        </div>
    </div>
);


}

export default OrderFood;
