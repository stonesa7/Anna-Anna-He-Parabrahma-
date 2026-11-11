import { useEffect, useState } from "react";
import {
    Link,
    useParams,
    useNavigate
} from "react-router-dom";

import { useCart } from "../context/CartContext";

import {
    fetchRestaurantDetails,
    fetchRestaurantMenu
} from "../services/restaurantService";


function RestaurantDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    // Shared Cart Context
    const {
        addToCart,
        totalItems,
        subtotal
    } = useCart();

    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load restaurant details and menu
    useEffect(() => {

        const loadRestaurant = async () => {

            try {
                setLoading(true);
                setError("");

                const [restaurantData, menuData] = await Promise.all([
                    fetchRestaurantDetails(id),
                    fetchRestaurantMenu(id)
                ]);

                console.log("Restaurant:", restaurantData);
                console.log("Menu:", menuData);

                const restaurantInfo =
                    restaurantData.restaurant ||
                    restaurantData.data ||
                    restaurantData;

                setRestaurant(restaurantInfo);

                const menuSections = menuData.sections || [];

                setMenu(
                    Array.isArray(menuSections)
                        ? menuSections
                        : []
                );

            } catch (err) {

                console.error("Restaurant Error:", err);

                setError(
                    err.message || "Unable to load restaurant."
                );

            } finally {
                setLoading(false);
            }
        };

        loadRestaurant();

    }, [id]);


    // Safely display API values
    const displayValue = (value) => {

        if (value === null || value === undefined) {
            return "";
        }

        if (
            typeof value === "string" ||
            typeof value === "number"
        ) {
            return String(value);
        }

        if (typeof value === "boolean") {
            return value ? "Yes" : "No";
        }

        if (typeof value === "object") {

            if (value.v !== undefined) {
                return displayValue(value.v);
            }

            if (value.value !== undefined) {
                return displayValue(value.value);
            }

            if (value.name !== undefined) {
                return displayValue(value.name);
            }
        }

        return "";
    };


    // Format restaurant address
    const getAddress = (address) => {

        if (!address) {
            return "Address unavailable";
        }

        if (typeof address === "string") {
            return address;
        }

        return [
            address.street,
            address.locality,
            address.city,
            address.district,
            address.state,
            address.pincode
        ]
            .map(displayValue)
            .filter(Boolean)
            .join(", ") || "Address unavailable";
    };


    // Get restaurant photo
    const getImageUrl = (imageData) => {

        if (!imageData) {
            return "";
        }

        let imageUrl = "";

        if (typeof imageData === "string") {

            imageUrl = imageData;

        } else if (typeof imageData === "object") {

            imageUrl =
                imageData.src_url ||
                imageData.url ||
                imageData.src ||
                "";
        }

        if (!imageUrl) {
            return "";
        }

        if (imageUrl.startsWith("//")) {
            return `https:${imageUrl}`;
        }

        if (imageUrl.startsWith("/")) {
            return `https://indiarestros.com${imageUrl}`;
        }

        return imageUrl;
    };


    // Add food to the COMMON cart and open checkout
    const handleAddToCart = (food, sectionName) => {

        const price = Number(
            typeof food.price === "object"
                ? food.price?.v
                : food.price
        );

        if (
            !Number.isFinite(price) ||
            price < 0 ||
            !food.name
        ) {
            alert("Price unavailable for this food item.");
            return;
        }

        const foodName = displayValue(food.name);

        const success = addToCart({

            itemId: `${id}-${sectionName}-${foodName}`,

            name: foodName,

            price: price,

            sourceType: "restaurant",

            sourceName: displayValue(restaurant.name),

            restaurantId: id,

            image: getImageUrl(food.photo || food.image)

        });

        if (success) {

            console.log("Added to shared cart:", foodName);

            // Open common checkout dashboard
            navigate("/checkout");

        } else {

            alert("Unable to add this item to cart.");

        }
    };


    // Loading screen
    if (loading) {

        return (
            <div className="details-page">
                <h2>Loading restaurant details...</h2>
            </div>
        );
    }


    // Error screen
    if (error) {

        return (
            <div className="details-page">

                <h2>Unable to load restaurant details</h2>

                <p>{error}</p>

                <Link to="/order" className="back-link">
                    ← Back to Restaurants
                </Link>

            </div>
        );
    }


    // Restaurant not found
    if (!restaurant) {

        return (
            <div className="details-page">

                <h2>Restaurant not found.</h2>

                <Link to="/order" className="back-link">
                    ← Back to Restaurants
                </Link>

            </div>
        );
    }


    // Restaurant rating
    const rating =
        restaurant.ratings?.external?.[0]?.value ??
        restaurant.rating_external?.value;

    const ratingCount =
        restaurant.ratings?.external?.[0]?.count ??
        restaurant.rating_external?.count;


    // Restaurant photo
    const firstPhoto = restaurant.photos?.[0];

    const photo =
        getImageUrl(firstPhoto) ||
        getImageUrl(restaurant.photo) ||
        "https://placehold.co/900x400?text=Restaurant";


    return (

        <div className="details-page">

            <Link to="/order" className="back-link">
                ← Back to Restaurants
            </Link>


            {/* Restaurant Information */}
            <div className="details-header">

                <img
                    src={photo}
                    alt={
                        displayValue(restaurant.name) ||
                        "Restaurant"
                    }
                    className="restaurant-detail-image"

                    onError={(e) => {

                        e.currentTarget.onerror = null;

                        e.currentTarget.src =
                            "https://placehold.co/900x400?text=Restaurant";

                    }}
                />


                <div className="restaurant-info">

                    <h1>
                        {displayValue(restaurant.name) ||
                            "Restaurant Name"}
                    </h1>


                    <p>
                        🍽️ {
                            displayValue(restaurant.cuisines) ||
                            "Cuisine unavailable"
                        }
                    </p>


                    <p>
                        📍 {getAddress(restaurant.address)}
                    </p>


                    {rating != null && (

                        <p>
                            ⭐ {displayValue(rating)}

                            {ratingCount != null
                                ? ` (${displayValue(ratingCount)} reviews)`
                                : ""}
                        </p>

                    )}


                    {restaurant.cost_for_two != null && (

                        <p>
                            💰 ₹{displayValue(restaurant.cost_for_two)}
                            {" "}for two
                        </p>

                    )}


                    <p>

                        {restaurant.open_now === true
                            ? "🟢 Open Now"
                            : restaurant.open_now === false
                                ? "🔴 Currently Closed"
                                : "Opening hours unavailable"}

                    </p>


                    {restaurant.phone && (

                        <p>
                            📞 {displayValue(restaurant.phone)}
                        </p>

                    )}

                </div>

            </div>


            {/* Menu Section */}
            <div className="menu-container">

                <h2 className="menu-title">
                    Explore Our Menu 🍽️
                </h2>


                {/* Shared Cart Summary */}
                <Link
                    to="/checkout"
                    className="cart-notification"
                >

                    🛒 Cart: {totalItems} items

                    {" | "}

                    Total: ₹{subtotal.toFixed(2)}

                    {" | View Cart →"}

                </Link>


                {menu.length > 0 ? (

                    <div className="menu-grid">

                        {menu.map((section, index) => (

                            <div
                                className="menu-section"
                                key={section.name || index}
                            >

                                <h3>
                                    {displayValue(section.name) ||
                                        "Menu Section"}
                                </h3>


                                {Array.isArray(section.items) &&

                                    section.items.map((food, foodIndex) => (

                                        <div
                                            className="menu-item"
                                            key={food.id || foodIndex}
                                        >

                                            <div className="food-info">

                                                <h4>
                                                    {displayValue(food.name) ||
                                                        "Food Item"}
                                                </h4>


                                                <p className="food-description">

                                                    {displayValue(food.desc) ||
                                                        "No description available."}

                                                </p>


                                                <p className="food-price">

                                                    ₹{
                                                        displayValue(food.price) ||
                                                        "Price unavailable"
                                                    }

                                                </p>


                                                <span className="food-type">

                                                    {food.veg === true
                                                        ? "🟢 Vegetarian"
                                                        : food.veg === false
                                                            ? "🔴 Non-Vegetarian"
                                                            : ""}

                                                </span>


                                                <button
                                                    type="button"
                                                    className="add-menu-btn"

                                                    onClick={() =>
                                                        handleAddToCart(
                                                            food,
                                                            section.name
                                                        )
                                                    }

                                                    disabled={
                                                        food.price === null ||
                                                        food.price === undefined ||
                                                        !Number.isFinite(
                                                            Number(
                                                                typeof food.price === "object"
                                                                    ? food.price?.v
                                                                    : food.price
                                                            )
                                                        )
                                                    }
                                                >

                                                    + Add to Cart

                                                </button>

                                            </div>

                                        </div>

                                    ))

                                }

                            </div>

                        ))}

                    </div>

                ) : (

                    <p className="no-menu">
                        Menu information is currently unavailable.
                    </p>

                )}

            </div>

        </div>

    );

}

export default RestaurantDetails;