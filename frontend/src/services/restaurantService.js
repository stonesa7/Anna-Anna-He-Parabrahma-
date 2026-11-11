const API_URL = "/indiarestros-api";

// Maharashtra cities
export const maharashtraCities = [
{ name: "All Maharashtra", value: "all" },
{ name: "Mumbai", value: "mumbai" },
{ name: "Pune", value: "pune" },
{ name: "Nagpur", value: "nagpur" },
{ name: "Nashik", value: "nashik" },
{ name: "Thane", value: "thane" },
{ name: "Kolhapur", value: "kolhapur" },
{ name: "Solapur", value: "solapur" },
{ name: "Amravati", value: "amravati" },
{ name: "Nanded", value: "nanded" },
{ name: "Satara", value: "satara" }
];

// Fetch restaurants from a city
const fetchCityRestaurants = async (city) => {
const params = new URLSearchParams({
city,
limit: "20"
});


const response = await fetch(`${API_URL}/restaurants?${params}`);

if (!response.ok) {
    throw new Error(`Unable to fetch restaurants from ${city}`);
}

const data = await response.json();
return data.results || [];


};

// Fetch restaurants
export const fetchRestaurants = async (city = "mumbai") => {
try {
if (city !== "all") {
return await fetchCityRestaurants(city);
}


    const results = await Promise.allSettled(
        maharashtraCities
            .filter((item) => item.value !== "all")
            .map((item) => fetchCityRestaurants(item.value))
    );

    const allRestaurants = results
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value);

    return Array.from(
        new Map(
            allRestaurants.map((restaurant) => [
                restaurant.id,
                restaurant
            ])
        ).values()
    );

} catch (error) {
    console.error("Restaurant API Error:", error);
    throw error;
}


};

// Fetch individual restaurant details
export const fetchRestaurantDetails = async (id) => {
const response = await fetch(
`${API_URL}/restaurants/${encodeURIComponent(id)}`
);


if (!response.ok) {
    throw new Error("Unable to fetch restaurant details");
}

return await response.json();


};

// Fetch restaurant menu
export const fetchRestaurantMenu = async (id) => {
const response = await fetch(
`${API_URL}/restaurants/${encodeURIComponent(id)}/menu`
);


if (!response.ok) {
    throw new Error("Unable to fetch restaurant menu");
}

return await response.json();


};
