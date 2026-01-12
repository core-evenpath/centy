/**
 * Restaurant & Dining Category Schema
 * 
 * Complete schema definition for restaurant/dining businesses.
 */

import { CategorySchema } from './types';

export const RESTAURANT_DINING_SCHEMA: CategorySchema = {
    schema_version: "3.1",
    category_id: "restaurant_dining",
    category_label: "Restaurant & Dining",

    expertise_schema: {
        core_identity: {
            business_function: {
                type: "enum",
                required: true,
                label: "Business Type",
                options: [
                    { value: "fine_dining_restaurant", label: "Fine Dining Restaurant" },
                    { value: "casual_dining_restaurant", label: "Casual Dining Restaurant" },
                    { value: "quick_service_restaurant", label: "Quick Service Restaurant (QSR)" },
                    { value: "cloud_kitchen", label: "Cloud Kitchen" },
                    { value: "cafe_coffee_shop", label: "Café / Coffee Shop" },
                    { value: "bakery_confectionery", label: "Bakery & Confectionery" },
                    { value: "dessert_parlor", label: "Dessert Parlor" },
                    { value: "food_truck_street_food", label: "Food Truck / Street Food" },
                    { value: "bar_pub_brewery", label: "Bar / Pub / Brewery" },
                    { value: "catering_service", label: "Catering Service" }
                ]
            },
            sub_category_tags: {
                type: "multi_select",
                required: true,
                label: "Business Tags",
                options: [
                    { value: "family_restaurant", label: "Family Restaurant" },
                    { value: "couple_friendly", label: "Couple Friendly" },
                    { value: "tourist_friendly", label: "Tourist Friendly" },
                    { value: "local_favorite", label: "Local Favorite" },
                    { value: "budget_friendly", label: "Budget Friendly" },
                    { value: "premium_experience", label: "Premium Experience" },
                    { value: "fast_casual", label: "Fast Casual" },
                    { value: "experience_driven", label: "Experience Driven" },
                    { value: "artisanal", label: "Artisanal" },
                    { value: "chef_led", label: "Chef Led" },
                    { value: "heritage_brand", label: "Heritage Brand" }
                ]
            }
        },

        cuisine_profile: {
            primary_cuisines: {
                type: "multi_select",
                required: true,
                label: "Primary Cuisines",
                options: [
                    { value: "indian", label: "Indian" },
                    { value: "north_indian", label: "North Indian" },
                    { value: "south_indian", label: "South Indian" },
                    { value: "chinese", label: "Chinese" },
                    { value: "italian", label: "Italian" },
                    { value: "mexican", label: "Mexican" },
                    { value: "japanese", label: "Japanese" },
                    { value: "thai", label: "Thai" },
                    { value: "continental", label: "Continental" },
                    { value: "mediterranean", label: "Mediterranean" },
                    { value: "middle_eastern", label: "Middle Eastern" },
                    { value: "american", label: "American" },
                    { value: "asian_fusion", label: "Asian Fusion" },
                    { value: "street_food", label: "Street Food" },
                    { value: "multi_cuisine", label: "Multi-Cuisine" }
                ]
            },
            secondary_cuisines: {
                type: "multi_select",
                required: false,
                label: "Secondary Cuisines"
            },
            signature_items: {
                type: "list",
                required: false,
                label: "Signature Dishes",
                item_schema: {
                    name: { type: "string", label: "Dish Name" },
                    category: { type: "string", label: "Category" },
                    is_best_seller: { type: "boolean", label: "Best Seller" },
                    is_chef_special: { type: "boolean", label: "Chef Special" }
                }
            }
        },

        service_model: {
            service_modes: {
                type: "multi_select",
                required: true,
                label: "Service Modes",
                options: [
                    { value: "dine_in", label: "Dine-in" },
                    { value: "takeaway", label: "Takeaway" },
                    { value: "delivery", label: "Delivery" },
                    { value: "pickup", label: "Pickup" },
                    { value: "preorder", label: "Pre-order" }
                ]
            },
            ordering_methods: {
                type: "multi_select",
                required: false,
                label: "Ordering Methods",
                options: [
                    { value: "table_service", label: "Table Service" },
                    { value: "counter_service", label: "Counter Service" },
                    { value: "self_service", label: "Self Service" },
                    { value: "qr_menu", label: "QR Menu" },
                    { value: "online_ordering", label: "Online Ordering" }
                ]
            },
            average_service_time_minutes: {
                type: "number",
                required: false,
                label: "Avg Service Time (mins)"
            }
        },

        meal_coverage: {
            meal_times: {
                type: "multi_select",
                required: true,
                label: "Meal Times",
                options: [
                    { value: "breakfast", label: "Breakfast" },
                    { value: "brunch", label: "Brunch" },
                    { value: "lunch", label: "Lunch" },
                    { value: "snacks", label: "Snacks" },
                    { value: "dinner", label: "Dinner" },
                    { value: "late_night", label: "Late Night" }
                ]
            },
            menu_type: {
                type: "enum",
                required: false,
                label: "Menu Type",
                options: [
                    { value: "a_la_carte", label: "À la carte" },
                    { value: "fixed_menu", label: "Fixed Menu" },
                    { value: "tasting_menu", label: "Tasting Menu" },
                    { value: "buffet", label: "Buffet" }
                ]
            }
        },

        dietary_and_customization: {
            dietary_options: {
                type: "multi_select",
                required: false,
                label: "Dietary Options",
                options: [
                    { value: "vegetarian", label: "Vegetarian" },
                    { value: "non_vegetarian", label: "Non-Vegetarian" },
                    { value: "vegan", label: "Vegan" },
                    { value: "eggitarian", label: "Eggitarian" },
                    { value: "gluten_free", label: "Gluten Free" },
                    { value: "keto", label: "Keto" },
                    { value: "healthy_options", label: "Healthy Options" }
                ]
            },
            spice_levels_supported: {
                type: "multi_select",
                required: false,
                label: "Spice Levels",
                options: [
                    { value: "mild", label: "Mild" },
                    { value: "medium", label: "Medium" },
                    { value: "spicy", label: "Spicy" },
                    { value: "extra_spicy", label: "Extra Spicy" }
                ]
            },
            customization_supported: {
                type: "boolean",
                required: false,
                label: "Customization Available"
            }
        },

        experience_and_ambiance: {
            ambiance: {
                type: "multi_select",
                required: false,
                label: "Ambiance",
                options: [
                    { value: "cozy", label: "Cozy" },
                    { value: "casual", label: "Casual" },
                    { value: "romantic", label: "Romantic" },
                    { value: "luxury", label: "Luxury" },
                    { value: "modern", label: "Modern" },
                    { value: "rustic", label: "Rustic" },
                    { value: "minimal", label: "Minimal" },
                    { value: "vibrant", label: "Vibrant" },
                    { value: "family_friendly", label: "Family Friendly" },
                    { value: "work_friendly", label: "Work Friendly" }
                ]
            },
            music_and_entertainment: {
                type: "multi_select",
                required: false,
                label: "Music & Entertainment",
                options: [
                    { value: "background_music", label: "Background Music" },
                    { value: "live_music", label: "Live Music" },
                    { value: "dj", label: "DJ" },
                    { value: "karaoke", label: "Karaoke" },
                    { value: "sports_screening", label: "Sports Screening" },
                    { value: "none", label: "None" }
                ]
            },
            seating_options: {
                type: "multi_select",
                required: false,
                label: "Seating Options",
                options: [
                    { value: "indoor", label: "Indoor" },
                    { value: "outdoor", label: "Outdoor" },
                    { value: "rooftop", label: "Rooftop" },
                    { value: "balcony", label: "Balcony" },
                    { value: "private_room", label: "Private Room" },
                    { value: "communal_seating", label: "Communal Seating" }
                ]
            }
        },

        pricing_and_positioning: {
            price_range: {
                type: "enum",
                required: false,
                label: "Price Range",
                options: [
                    { value: "budget", label: "Budget (₹)" },
                    { value: "mid_range", label: "Mid-Range (₹₹)" },
                    { value: "premium", label: "Premium (₹₹₹)" },
                    { value: "luxury", label: "Luxury (₹₹₹₹)" }
                ]
            },
            average_cost_for_two: {
                type: "currency",
                required: false,
                label: "Average Cost for Two"
            },
            value_proposition: {
                type: "multi_select",
                required: false,
                label: "Value Proposition",
                options: [
                    { value: "large_portions", label: "Large Portions" },
                    { value: "quality_ingredients", label: "Quality Ingredients" },
                    { value: "authentic_flavors", label: "Authentic Flavors" },
                    { value: "fast_service", label: "Fast Service" },
                    { value: "affordable_pricing", label: "Affordable Pricing" },
                    { value: "premium_experience", label: "Premium Experience" }
                ]
            }
        },

        special_features: {
            reservation_policy: {
                type: "enum",
                required: false,
                label: "Reservation Policy",
                options: [
                    { value: "not_required", label: "Not Required" },
                    { value: "recommended", label: "Recommended" },
                    { value: "mandatory", label: "Mandatory" }
                ]
            },
            group_and_event_support: {
                type: "multi_select",
                required: false,
                label: "Events Support",
                options: [
                    { value: "birthday_parties", label: "Birthday Parties" },
                    { value: "corporate_events", label: "Corporate Events" },
                    { value: "private_events", label: "Private Events" },
                    { value: "large_groups", label: "Large Groups" },
                    { value: "custom_menu_events", label: "Custom Menu Events" }
                ]
            },
            alcohol_service: {
                type: "enum",
                required: false,
                label: "Alcohol Service",
                options: [
                    { value: "not_served", label: "Not Served" },
                    { value: "beer_wine", label: "Beer & Wine Only" },
                    { value: "full_bar", label: "Full Bar" }
                ]
            }
        },

        delivery_and_marketplaces: {
            delivery_supported: {
                type: "boolean",
                required: false,
                label: "Delivery Available"
            },
            delivery_partners: {
                type: "multi_select",
                required: false,
                label: "Delivery Partners",
                options: [
                    { value: "zomato", label: "Zomato" },
                    { value: "swiggy", label: "Swiggy" },
                    { value: "uber_eats", label: "Uber Eats" },
                    { value: "doordash", label: "DoorDash" },
                    { value: "deliveroo", label: "Deliveroo" },
                    { value: "own_delivery", label: "Own Delivery" }
                ]
            },
            cloud_kitchen_brand: {
                type: "boolean",
                required: false,
                label: "Cloud Kitchen Brand"
            }
        },

        trust_and_quality: {
            certifications: {
                type: "multi_select",
                required: false,
                label: "Certifications",
                options: [
                    { value: "fssai", label: "FSSAI Licensed" },
                    { value: "halal", label: "Halal Certified" },
                    { value: "organic", label: "Organic Certified" },
                    { value: "vegan_certified", label: "Vegan Certified" },
                    { value: "michelin", label: "Michelin Rated" }
                ]
            },
            customer_ratings: {
                type: "object",
                required: false,
                label: "Customer Ratings",
                properties: {
                    average_rating: { type: "number", label: "Average Rating" },
                    review_count: { type: "number", label: "Review Count" },
                    rating_platform: { type: "string", label: "Platform" }
                }
            },
            awards_and_mentions: {
                type: "list",
                required: false,
                label: "Awards & Mentions"
            }
        },

        llm_usage_context: {
            allowed_topics: [
                "menu_items",
                "pricing",
                "opening_hours",
                "location",
                "delivery_options",
                "ambiance",
                "dietary_preferences",
                "popular_dishes",
                "reservations"
            ],
            restricted_topics: [
                "medical_claims",
                "guaranteed_outcomes",
                "false_discounts"
            ],
            response_style: {
                tone: "warm_food_focused",
                verbosity: "medium",
                upsell_allowed: true
            }
        }
    }
};

export default RESTAURANT_DINING_SCHEMA;
