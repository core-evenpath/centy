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

{"type":"text","text":"...","suggestions":["suggestion 1","suggestion 2","suggestion 3"]}
— For general conversation. ALWAYS include 2-3 suggestions.`;
