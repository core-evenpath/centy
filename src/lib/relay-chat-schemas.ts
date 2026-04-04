export const BLOCK_TYPE_PROMPT = `Available block types for relay widget responses:

CATALOG: type "catalog" (also "rooms", "products", "services", "menu", "listings")
— Product/service cards with name, price, rating, emoji, features, specs

COMPARE: type "compare"
— Side-by-side comparison table for 2-3 items

ACTIVITIES: type "activities" (also "experiences", "classes", "treatments")
— Service/activity list with duration, price, bookable flag

BOOKING: type "book" (also "reserve", "appointment", "inquiry")
— Booking flow with date/guest selection, conversion paths

LOCATION: type "location" (also "directions")
— Address card with directions and map placeholder

CONTACT: type "contact"
— Contact methods list (whatsapp, phone, email, website)

GALLERY: type "gallery" (also "photos")
— Visual grid with emoji placeholders and labels

INFO: type "info" (also "faq", "details")
— Key-value information table

GREETING: type "greeting" (also "welcome")
— Welcome card with brand info and quick actions

PRICING: type "pricing" (also "packages", "plans")
— Tiered pricing table with features

TESTIMONIALS: type "testimonials" (also "reviews")
— Customer review cards with ratings

QUICK ACTIONS: type "quick_actions" (also "menu_actions")
— Action shortcuts grid with emoji + prompt

SCHEDULE: type "schedule" (also "timetable", "slots")
— Time-based availability grid

PROMO: type "promo" (also "offer", "deal")
— Promotional offer cards with discount codes

LEAD CAPTURE: type "lead_capture" (also "form", "inquiry_form")
— Form with text/phone/email/select fields

HANDOFF: type "handoff" (also "connect", "human")
— Human agent handoff options

SKIN QUIZ: type "skin_quiz"
— Step-by-step quiz with selectable options and progress bar
— sampleData: { quizStep: { question, hint, options: [{label, selected}], currentStep, totalSteps } }

CONCERN PICKER: type "concern_picker" (also "concerns")
— 3-column grid of selectable concern cards with icons
— sampleData: { concerns: [{ id, label, icon }] }

PRODUCT DETAIL: type "product_detail" (also "product_page")
— Full product page with image, price, sizes, features, CTA
— sampleData: { productDetail: { id, name, brand, description, price, currency, originalPrice, rating, reviewCount, badge, emoji, color, sizes, features, ctaLabel } }

INGREDIENTS: type "ingredients" (also "ingredient_list")
— Ingredient list with concentrations and certifications
— sampleData: { ingredients: [{ name, role, concentration }], certifications: ["Vegan", "Cruelty-free"] }

SHADE FINDER: type "shade_finder" (also "shade_match")
— Undertone selector with shade match result
— sampleData: { shadeOptions: [{ label, gradient, selected }], shadeMatch: { name, subtitle, swatchGradient } }

ROUTINE BUILDER: type "routine_builder" (also "routine")
— AM/PM skincare routine with steps, prices, bundle discount
— sampleData: { routine: { amSteps: [{name, price}], pmSteps: [{name, price}], totalPrice, discountPercent, skinProfile } }

BUNDLE: type "bundle" (also "bundle_set", "gift_set")
— Curated product set with savings highlight
— sampleData: { bundleData: { title, items: [{name, price}], originalTotal, bundlePrice, badge, color } }

GIFT CARD: type "gift_card"
— Gift card with amount selector and send CTA
— sampleData: { giftCard: { amounts: [25, 50, 100], currency: "$", brandName } }

CART: type "cart" (also "bag", "shopping_bag")
— Shopping cart with items, promo, subtotal/discount/shipping/total breakdown
— sampleData: { cart: { items: [{name, variant, price, emoji}], subtotal, discount, discountLabel, shipping, total, promoCode } }

CHECKOUT: type "checkout" (also "payment")
— Payment method selector with radio cards
— sampleData: { checkout: { total, currency, methods: [{label, subtitle, selected}] } }

ORDER CONFIRMATION: type "order_confirmed" (also "confirmation")
— Green success header with order details
— sampleData: { confirmation: { orderId, items: [{name, price}], total, currency, shipping, estimatedDelivery } }

ORDER TRACKER: type "order_tracker" (also "track_order", "shipment")
— Horizontal progress stepper with carrier info
— sampleData: { tracker: { orderId, steps: ["Placed","Packed","Shipped","Out","Delivered"], currentStep: "Shipped", carrier, estimatedArrival } }

RETURN/EXCHANGE: type "return_exchange" (also "return", "exchange")
— Return flow with reason picker, refund/exchange/credit options
— sampleData: { returnData: { productName, orderId, reasons: [{label, selected}], options: [{label, subtitle}], policyNote } }

QUICK REORDER: type "quick_reorder" (also "reorder")
— Previous order items with one-tap reorder
— sampleData: { reorderData: { items: [{name, price, emoji}], total, currency, daysSinceOrder } }

SUBSCRIPTION: type "subscription" (also "subscribe_save")
— Subscribe & save with frequency options and discount
— sampleData: { subscriptionData: { productName, oneTimePrice, currency, frequencies: [{label, discount, price, selected}], emoji } }

LOYALTY: type "loyalty" (also "rewards", "points")
— Tier progress bar with points and perks grid
— sampleData: { loyaltyData: { tierName, points, nextTier, pointsToNext, progressPercent, perks: [{label, value, emoji}] } }

WISHLIST: type "wishlist" (also "saved_items", "favorites")
— Saved items list with add-to-bag buttons
— sampleData: { wishlistItems: [{ name, price, originalPrice, flag, emoji }] }

REFERRAL: type "referral" (also "refer_friend")
— Give/get referral card with code and share buttons
— sampleData: { referralData: { givesAmount: "$10", getsAmount: "$10", code: "FRIEND10", currency: "$", friendsJoined, totalEarned } }

SOCIAL PROOF: type "social_proof" (also "trust_badges")
— Stats row + badges + certifications
— sampleData: { socialProofData: { stats: [{value, label}], badges: ["Editor's Pick"], certifications: ["Dermatologist Tested"] } }

FEEDBACK: type "feedback_request" (also "review_request")
— Star rating selector for post-purchase feedback
— sampleData: { feedbackData: { productName, deliveredAgo: "3 days ago", rewardPoints: 50 } }

CONSULTATION BOOKING: type "consultation" (also "book_consultation")
— Time slot picker with includes list and book CTA
— sampleData: { bookingData: { title, subtitle, slots: [{time, selected}], includes: ["Skin analysis"], price: "Free" } }

TEXT: type "text"
— Plain text with suggestion chips (default fallback)
— ALWAYS include 2-3 suggestions
`;

export const RELAY_BLOCK_SCHEMAS = `RESPOND ONLY IN JSON. Choose the most appropriate block type:

{"type":"catalog","text":"...","items":[{"id":"...","name":"...","price":0,"currency":"INR","subtitle":"...","emoji":"...","color":"#...","rating":4.5,"reviewCount":100,"features":["..."],"specs":[{"label":"...","value":"..."}]}],"suggestions":["..."]}
— For showing products, services, rooms, menu items, listings. Also use type "rooms" for hotels, "menu" for restaurants, "products" for retail, "services" for service businesses, "listings" for directories.

{"type":"compare","text":"...","items":[...same as catalog items...],"compareFields":[{"label":"...","key":"..."}],"suggestions":["..."]}
— For side-by-side comparison of 2-3 items

{"type":"activities","text":"...","items":[{"id":"...","name":"...","description":"...","icon":"🏷️","price":"₹X,XXX","duration":"X hours","category":"...","bookable":true}],"suggestions":["..."]}
— For listing activities, experiences, classes, treatments. Also use type "classes" for courses, "treatments" for spa/medical.

{"type":"book","text":"...","items":[...catalog items for selection...],"conversionPaths":[{"id":"...","label":"...","icon":"📞","type":"primary","action":"whatsapp"}],"dateMode":"single","guestMode":"counter","headerLabel":"Book Now","selectLabel":"Select","suggestions":["..."]}
— When the user wants to book, reserve, or schedule. Also use type "appointment" for service appointments, "inquiry" for general inquiries.

{"type":"location","text":"...","location":{"name":"...","address":"...","area":"...","directions":[{"icon":"✈️","label":"Airport","detail":"45 min"}]},"suggestions":["..."]}
— For location, directions, how to get there

{"type":"contact","text":"...","methods":[{"type":"whatsapp","label":"WhatsApp","value":"+91...","icon":"💬"},{"type":"phone","label":"Call","value":"+91...","icon":"📞"},{"type":"email","label":"Email","value":"...@...","icon":"📧"}],"suggestions":["..."]}
— For contact information

{"type":"gallery","text":"...","items":[{"emoji":"📸","label":"...","span":1}],"suggestions":["..."]}
— For showing photos/visual gallery

{"type":"info","text":"...","items":[{"label":"...","value":"..."}],"suggestions":["..."]}
— For FAQ, policies, details, key-value information

{"type":"greeting","text":"...","brand":{"name":"...","emoji":"👋","tagline":"...","quickActions":[{"label":"...","prompt":"...","emoji":"..."}]},"suggestions":["..."]}
— For welcome/greeting screens when conversation starts or user says hello. Include 3-4 quickActions.

{"type":"pricing","text":"...","pricingTiers":[{"id":"...","name":"...","price":0,"currency":"INR","unit":"/session","features":["..."],"isPopular":false,"emoji":"..."}],"suggestions":["..."]}
— For pricing plans, packages, or tiered service offerings. Use when visitor asks about prices, rates, or plans.

{"type":"testimonials","text":"...","testimonials":[{"id":"...","name":"...","text":"...","rating":5,"date":"1 week ago","source":"Google"}],"suggestions":["..."]}
— For showing reviews, testimonials, social proof. Use when visitor asks about reviews or quality.

{"type":"quick_actions","text":"...","quickActions":[{"id":"...","label":"...","emoji":"...","prompt":"...","description":"..."}],"suggestions":["..."]}
— For showing action entry points or navigation shortcuts. Use when visitor seems unsure what to ask.

{"type":"schedule","text":"...","schedule":[{"id":"...","time":"10:00 AM","endTime":"11:00 AM","title":"...","instructor":"...","spots":4,"price":"₹500","emoji":"...","isAvailable":true}],"suggestions":["..."]}
— For showing time-based availability, timetable, or slots. Use when visitor asks about schedules or availability.

{"type":"promo","text":"...","promos":[{"id":"...","title":"...","description":"...","discount":"25% OFF","code":"SAVE25","validUntil":"...","emoji":"🎉","ctaLabel":"Claim Offer"}],"suggestions":["..."]}
— For showing current promotions, offers, deals, or discounts.

{"type":"lead_capture","text":"...","fields":[{"id":"...","label":"Your Name","type":"text","placeholder":"...","required":true}],"title":"...","subtitle":"...","suggestions":["..."]}
— For inquiry forms, lead capture, quote requests. Field types: "text", "phone", "email", "select". Use when visitor wants a callback or quote.

{"type":"handoff","text":"...","handoffOptions":[{"id":"...","type":"whatsapp","label":"WhatsApp Us","value":"+91...","icon":"💬","description":"Usually replies within 5 min"}],"title":"...","subtitle":"...","suggestions":["..."]}
— For connecting visitor to a human agent. Option types: "whatsapp", "phone", "callback", "chat". Use when AI cannot resolve the query or visitor explicitly asks for human support.

{"type":"skin_quiz","text":"...","quizStep":{"question":"What's your skin type?","hint":"This helps us recommend the right products","options":[{"label":"Oily","selected":false},{"label":"Dry","selected":false},{"label":"Combination","selected":false},{"label":"Normal","selected":false}],"currentStep":1,"totalSteps":3},"suggestions":["..."]}
— For interactive quizzes, skin assessments, product finders. Use when helping customer find their match.

{"type":"concern_picker","text":"...","concerns":[{"id":"acne","label":"Acne & Breakouts","icon":"🔴"},{"id":"aging","label":"Fine Lines","icon":"✨"},{"id":"dark_spots","label":"Dark Spots","icon":"🌑"}],"suggestions":["..."]}
— For selecting skin concerns, preferences, or categories. Use when narrowing down customer needs.

{"type":"product_detail","text":"...","productDetail":{"id":"...","name":"...","brand":"...","description":"...","price":29,"currency":"$","originalPrice":39,"rating":4.8,"reviewCount":2340,"badge":"BESTSELLER","emoji":"✨","color":"#A2845B","sizes":["30ml","50ml","100ml"],"features":["Hydrating","Non-comedogenic"],"ctaLabel":"Add to Bag"},"suggestions":["..."]}
— For showing a single product in detail with full specs, sizes, and CTA. Use when customer asks about a specific product.

{"type":"ingredients","text":"...","ingredients":[{"name":"Hyaluronic Acid","role":"Deep hydration and plumping","concentration":"2%"},{"name":"Niacinamide","role":"Pore minimizing and brightening","concentration":"5%"}],"certifications":["Vegan","Cruelty-free","Clean Beauty"],"suggestions":["..."]}
— For showing ingredient breakdowns and certifications. Use when customer asks what's in a product.

{"type":"shade_finder","text":"...","shadeOptions":[{"label":"Cool","gradient":"linear-gradient(135deg,#F5D0C5,#E8B4A6)","selected":false},{"label":"Neutral","gradient":"linear-gradient(135deg,#F0C9A0,#DEB887)","selected":true},{"label":"Warm","gradient":"linear-gradient(135deg,#D4A574,#C19660)","selected":false}],"shadeMatch":{"name":"Honey Beige","subtitle":"Neutral · Medium","swatchGradient":"linear-gradient(135deg,#D4A574,#C19660)"},"suggestions":["..."]}
— For shade/color matching tools. Use when customer needs help finding their shade.

{"type":"routine_builder","text":"...","routine":{"amSteps":[{"name":"Gentle Cleanser","price":24},{"name":"Vitamin C Serum","price":38}],"pmSteps":[{"name":"Oil Cleanser","price":28},{"name":"Retinol Serum","price":45}],"totalPrice":135,"discountPercent":15,"skinProfile":"combination"},"suggestions":["..."]}
— For personalized skincare/beauty routines. Use after quiz or when recommending a regimen.

{"type":"bundle","text":"...","bundleData":{"title":"Glow Essentials Set","items":[{"name":"Cleanser","price":24},{"name":"Serum","price":38},{"name":"Moisturizer","price":32}],"originalTotal":94,"bundlePrice":75,"badge":"SAVE 20%","color":"#A2845B"},"suggestions":["..."]}
— For curated product bundles or gift sets with savings. Use when suggesting value sets.

{"type":"gift_card","text":"...","giftCard":{"amounts":[25,50,75,100],"currency":"$","brandName":"Beauty Co","color":"#A2845B"},"suggestions":["..."]}
— For gift card purchase. Use when customer wants to buy a gift.

{"type":"cart","text":"...","cart":{"items":[{"name":"Vitamin C Serum","variant":"30ml","price":38,"emoji":"✨"},{"name":"Moisturizer","variant":"50ml","price":32,"emoji":"💧"}],"subtotal":70,"discount":10,"discountLabel":"GLOW10","shipping":0,"total":60,"promoCode":"GLOW10"},"suggestions":["..."]}
— For showing shopping cart/bag contents with totals. Use when customer asks about their bag or to review items.

{"type":"checkout","text":"...","checkout":{"total":60,"currency":"$","methods":[{"label":"Credit Card","subtitle":"Visa, Mastercard, Amex","selected":true},{"label":"PayPal","subtitle":"Pay securely","selected":false},{"label":"Apple Pay","subtitle":"One-tap checkout","selected":false}]},"suggestions":["..."]}
— For payment method selection. Use when customer proceeds to checkout.

{"type":"order_confirmed","text":"...","confirmation":{"orderId":"ORD-7829","items":[{"name":"Vitamin C Serum","price":"$38"},{"name":"Moisturizer","price":"$32"}],"total":60,"currency":"$","shipping":"Standard (3-5 days)","estimatedDelivery":"Apr 12-14"},"suggestions":["..."]}
— For order confirmation with success state. Use after successful payment.

{"type":"order_tracker","text":"...","tracker":{"orderId":"ORD-7829","orderDate":"Apr 8, 2025","steps":["Placed","Packed","Shipped","Out for Delivery","Delivered"],"currentStep":"Shipped","carrier":"FedEx","estimatedArrival":"Apr 12"},"suggestions":["..."]}
— For tracking order status with progress stepper. Use when customer asks about order status.

{"type":"return_exchange","text":"...","returnData":{"productName":"Vitamin C Serum 30ml","orderId":"ORD-7829","deliveredDate":"Apr 12","reasons":[{"label":"Wrong item","selected":false},{"label":"Damaged","selected":false},{"label":"Changed mind","selected":true}],"options":[{"label":"Refund","subtitle":"5-7 business days"},{"label":"Exchange","subtitle":"Free shipping"},{"label":"Store Credit","subtitle":"Instant + 10% bonus"}],"policyNote":"Free returns within 30 days of delivery"},"suggestions":["..."]}
— For processing returns or exchanges. Use when customer wants to return an item.

{"type":"quick_reorder","text":"...","reorderData":{"items":[{"name":"Gentle Cleanser","price":24,"emoji":"🧴"},{"name":"SPF Moisturizer","price":32,"emoji":"☀️"}],"total":56,"currency":"$","daysSinceOrder":28},"suggestions":["..."]}
— For quick reordering of previous purchases. Use when customer wants to reorder or items may be running low.

{"type":"subscription","text":"...","subscriptionData":{"productName":"Vitamin C Serum","productDesc":"30ml · Award-winning formula","oneTimePrice":38,"currency":"$","frequencies":[{"label":"Every 4 weeks","discount":"Save 20%","price":"$30.40","selected":true},{"label":"Every 6 weeks","discount":"Save 15%","price":"$32.30","selected":false},{"label":"Every 8 weeks","discount":"Save 10%","price":"$34.20","selected":false}],"emoji":"✨"},"suggestions":["..."]}
— For subscribe & save options. Use when customer buys repeatedly or asks about subscriptions.

{"type":"loyalty","text":"...","loyaltyData":{"tierName":"Gold Member","points":2450,"nextTier":"Platinum","pointsToNext":550,"progressPercent":82,"redeemableValue":"$24.50","perks":[{"label":"Points multiplier","value":"2x","emoji":"⚡"},{"label":"Free shipping","value":"Always","emoji":"🚚"},{"label":"Early access","value":"48h","emoji":"🎯"}]},"suggestions":["..."]}
— For loyalty program status and perks. Use when customer asks about points, rewards, or tier status.

{"type":"wishlist","text":"...","wishlistItems":[{"name":"Retinol Serum","price":45,"originalPrice":55,"flag":"SALE","emoji":"✨"},{"name":"Eye Cream","price":38,"emoji":"👁️"}],"suggestions":["..."]}
— For showing saved/wishlisted items. Use when customer asks about saved items or favorites.

{"type":"referral","text":"...","referralData":{"givesAmount":"$10","getsAmount":"$10","code":"FRIEND10","currency":"$","friendsJoined":3,"totalEarned":"$30"},"suggestions":["..."]}
— For referral/invite program. Use when customer asks about referring friends or earning rewards.

{"type":"social_proof","text":"...","socialProofData":{"stats":[{"value":"50K+","label":"Happy customers"},{"value":"4.9","label":"Avg rating"},{"value":"98%","label":"Would recommend"}],"badges":["Editor's Pick 2025","Best of Beauty"],"certifications":["Dermatologist Tested","Hypoallergenic","Leaping Bunny Certified"]},"suggestions":["..."]}
— For trust signals and social proof. Use when customer hesitates or asks about brand credibility.

{"type":"feedback_request","text":"...","feedbackData":{"productName":"Vitamin C Serum","deliveredAgo":"3 days ago","rewardPoints":50},"suggestions":["..."]}
— For post-purchase feedback/review request. Use after delivery confirmation or when checking in.

{"type":"consultation","text":"...","bookingData":{"title":"Virtual Skin Consultation","subtitle":"15 min with a certified esthetician","slots":[{"time":"10:00 AM","selected":false},{"time":"11:30 AM","selected":true},{"time":"2:00 PM","selected":false},{"time":"3:30 PM","selected":false},{"time":"5:00 PM","selected":false},{"time":"6:30 PM","selected":false}],"includes":["Personalized skin analysis","Custom routine plan","Product samples"],"price":"Free"},"suggestions":["..."]}
— For booking consultations or appointments with time slot selection. Use when customer wants expert advice.

{"type":"text","text":"...","suggestions":["suggestion 1","suggestion 2","suggestion 3"]}
— For general conversation. ALWAYS include 2-3 suggestions.`;
