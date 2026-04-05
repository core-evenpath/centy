"use client";

import React, { useState } from "react";
import BlockRenderer from "@/components/relay/blocks/BlockRenderer";
import type { RelayBlock } from "@/components/relay/blocks/BlockRenderer";
import type { RelayTheme } from "@/components/relay/blocks/types";
import { DEFAULT_THEME } from "@/components/relay/blocks/types";

interface Props {
  theme?: RelayTheme;
}

interface BlockPreview {
  type: string;
  label: string;
  section: string;
  block: RelayBlock;
}

const SECTIONS = [
  { id: "entry", label: "Entry & Discovery" },
  { id: "browse", label: "Product & Evaluation" },
  { id: "promo", label: "Pricing & Promos" },
  { id: "cart", label: "Cart & Checkout" },
  { id: "post", label: "Post-Purchase" },
  { id: "engage", label: "Engagement & Retention" },
  { id: "support", label: "Support" },
];

const BLOCK_PREVIEWS: BlockPreview[] = [
  // ── Entry & Discovery ──
  {
    type: "greeting",
    label: "Welcome",
    section: "entry",
    block: {
      type: "greeting",
      brand: {
        name: "Your Brand",
        tagline: "Welcome! How can we help you today?",
        emoji: "✦",
      },
      quickActions: [
        { label: "Browse Products", subtitle: "View catalog", icon: "◎" },
        { label: "Track Order", subtitle: "Check status", icon: "▤" },
      ],
      suggestions: ["Browse products", "Help with an order", "Talk to support"],
    },
  },
  {
    type: "skin_quiz",
    label: "Skin Quiz",
    section: "entry",
    block: {
      type: "skin_quiz",
      quizStep: {
        stepNumber: 2,
        totalSteps: 4,
        question: "What's your #1 skin concern?",
        subtitle: "Select all that apply",
        options: [
          { label: "Acne & Breakouts", selected: true },
          { label: "Fine Lines & Wrinkles", selected: false },
          { label: "Dark Spots & Uneven Tone", selected: true },
          { label: "Dryness & Dehydration", selected: false },
          { label: "Large Pores & Oiliness", selected: false },
          { label: "Sensitivity & Redness", selected: false },
        ],
      },
    },
  },
  {
    type: "concern_picker",
    label: "Concern Picker",
    section: "entry",
    block: {
      type: "concern_picker",
      concerns: [
        { id: "acne", label: "Acne & Breakouts", icon: "◯" },
        { id: "aging", label: "Fine Lines", icon: "∿" },
        { id: "dryness", label: "Dryness", icon: "◇" },
        { id: "dullness", label: "Dull Skin", icon: "✧" },
        { id: "pores", label: "Large Pores", icon: "⬡" },
        { id: "sensitivity", label: "Sensitivity", icon: "❋" },
      ],
    },
  },

  // ── Product & Evaluation ──
  {
    type: "product_detail",
    label: "Product Detail",
    section: "browse",
    block: {
      type: "product_detail",
      productDetail: {
        id: "s1",
        name: "Vitamin C Brightening Serum",
        description: "15% L-Ascorbic · Ferulic · 30ml",
        price: 62,
        currency: "USD",
        badge: "Award Winner",
        rating: 4.7,
        reviews: 4210,
        sizes: ["15ml", "30ml"],
        features: ["Free shipping $50+", "Cruelty-free", "Clean formula"],
        imageGradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)",
      },
    },
  },
  {
    type: "ingredients",
    label: "Ingredients List",
    section: "browse",
    block: {
      type: "ingredients",
      ingredients: [
        { name: "15% L-Ascorbic Acid", role: "Brightens, fades dark spots, boosts collagen", strength: "Clinical grade" },
        { name: "Ferulic Acid", role: "Stabilizes Vitamin C, doubles antioxidant power", strength: "1%" },
        { name: "Vitamin E", role: "Moisturizes, protects against UV damage", strength: "1%" },
      ],
      certifications: ["Vegan", "No parabens", "No sulfates", "Fragrance-free", "Dermatologist tested"],
    },
  },
  {
    type: "shade_finder",
    label: "Shade Finder",
    section: "browse",
    block: {
      type: "shade_finder",
      shadeOptions: [
        { label: "Cool", gradient: "linear-gradient(135deg, #fce7f3, #fbcfe8)", selected: false },
        { label: "Neutral", gradient: "linear-gradient(135deg, #fef3c7, #fde68a)", selected: true },
        { label: "Warm", gradient: "linear-gradient(135deg, #fed7aa, #fdba74)", selected: false },
      ],
      shadeMatch: { name: "Shade 3N — Sand", description: "Neutral undertone · Light-medium" },
    },
  },
  {
    type: "routine_builder",
    label: "Routine Builder",
    section: "browse",
    block: {
      type: "routine_builder",
      routine: {
        title: "Your Personalized Routine",
        subtitle: "Based on: Acne + Dark spots · Combination skin",
        am: [
          { name: "Gentle Gel Cleanser", price: 28 },
          { name: "Vitamin C Serum", price: 62 },
          { name: "Barrier Cream", price: 48 },
          { name: "SPF 50", price: 34 },
        ],
        pm: [
          { name: "Gentle Gel Cleanser", price: 28 },
          { name: "Retinol Night Serum", price: 56 },
          { name: "Barrier Cream", price: 48 },
        ],
        totalPrice: 228,
        discountPercent: 15,
        currency: "USD",
      },
    },
  },

  // ── Pricing & Promos ──
  {
    type: "bundle",
    label: "Bundle / Set",
    section: "promo",
    block: {
      type: "bundle",
      bundleData: {
        title: "The Complete Glow Kit",
        subtitle: "Holiday Set",
        items: [
          { name: "Vitamin C Serum", originalPrice: 62 },
          { name: "Barrier Cream", originalPrice: 48 },
          { name: "SPF 50", originalPrice: 34 },
          { name: "Gel Cleanser", originalPrice: 28 },
        ],
        originalTotal: 172,
        bundlePrice: 130,
        currency: "USD",
      },
    },
  },
  {
    type: "gift_card",
    label: "Gift Card",
    section: "promo",
    block: {
      type: "gift_card",
      giftCard: {
        amounts: [25, 50, 75, 100],
        selectedAmount: 50,
        currency: "USD",
        deliveryMethod: "email",
      },
    },
  },

  // ── Cart & Checkout ──
  {
    type: "cart",
    label: "Cart",
    section: "cart",
    block: {
      type: "cart",
      cart: {
        items: [
          { name: "Vitamin C Serum", variant: "30ml", price: 62, quantity: 1 },
          { name: "Barrier Repair Cream", variant: "50ml", price: 48, quantity: 1 },
          { name: "Invisible Shield SPF", variant: "40ml", price: 34, quantity: 1 },
        ],
        subtotal: 144,
        discount: 21.6,
        discountCode: "NEWGLOW",
        shipping: 0,
        shippingLabel: "FREE",
        total: 122.4,
        currency: "USD",
      },
    },
  },
  {
    type: "checkout",
    label: "Checkout",
    section: "cart",
    block: {
      type: "checkout",
      checkout: {
        total: 122.4,
        currency: "USD",
        methods: [
          { id: "apple_pay", label: "Apple Pay", subtitle: "Express checkout", selected: true },
          { id: "card", label: "Credit Card", subtitle: "Visa · Mastercard · Amex", selected: false },
          { id: "afterpay", label: "Afterpay", subtitle: "4 × $30.60 · 0% interest", selected: false },
          { id: "paypal", label: "PayPal", subtitle: "Pay with PayPal balance", selected: false },
        ],
      },
    },
  },
  {
    type: "order_confirmed",
    label: "Order Confirmation",
    section: "cart",
    block: {
      type: "order_confirmed",
      confirmation: {
        orderId: "#VL-847291",
        items: [
          { name: "Vitamin C Serum", price: "$62" },
          { name: "Barrier Cream", price: "$48" },
          { name: "SPF 50", price: "$34" },
        ],
        total: 122.4,
        currency: "USD",
        shipping: "USPS Priority · 2–3 days",
        tracking: "Email + SMS",
      },
    },
  },

  // ── Post-Purchase ──
  {
    type: "order_tracker",
    label: "Order Tracker",
    section: "post",
    block: {
      type: "order_tracker",
      tracker: {
        orderId: "#VL-847291",
        orderDate: "Mar 28",
        status: "Shipped",
        steps: ["Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"],
        currentStep: 2,
        carrier: "USPS Priority",
        estimatedDelivery: "Wed, Apr 2",
      },
    },
  },
  {
    type: "return_exchange",
    label: "Return / Exchange",
    section: "post",
    block: {
      type: "return_exchange",
      returnData: {
        product: { name: "Vitamin C Serum", variant: "30ml", orderId: "#VL-847291", deliveredDate: "Apr 2" },
        reasons: ["Irritation / Reaction", "Not effective", "Wrong product", "Damaged"],
        selectedReason: "Irritation / Reaction",
        options: [
          { label: "Refund", subtitle: "Original method", selected: true },
          { label: "Exchange", subtitle: "Different product", selected: false },
          { label: "Credit", subtitle: "$62 + 10% bonus", selected: false },
        ],
        freeReturns: true,
        returnWindow: 30,
      },
    },
  },
  {
    type: "quick_reorder",
    label: "Quick Reorder",
    section: "post",
    block: {
      type: "quick_reorder",
      reorderData: {
        daysSinceOrder: 38,
        items: [
          { name: "Vitamin C Serum", price: 62 },
          { name: "Barrier Cream", price: 48 },
        ],
        total: 110,
        currency: "USD",
      },
    },
  },
  {
    type: "feedback_request",
    label: "Review Request",
    section: "post",
    block: {
      type: "feedback_request",
      feedbackData: {
        productName: "Vitamin C Serum",
        deliveredAgo: "2 weeks ago",
        rewardPoints: 50,
      },
    },
  },

  // ── Engagement & Retention ──
  {
    type: "subscription",
    label: "Subscribe & Save",
    section: "engage",
    block: {
      type: "subscription",
      subscriptionData: {
        product: { name: "Vitamin C Serum", variant: "30ml", oneTimePrice: 62 },
        frequencies: [
          { label: "Every 4 weeks", discount: "20% off", price: 49.6, selected: true },
          { label: "Every 6 weeks", discount: "15% off", price: 52.7, selected: false },
          { label: "Every 8 weeks", discount: "10% off", price: 55.8, selected: false },
        ],
        currency: "USD",
      },
    },
  },
  {
    type: "loyalty",
    label: "Loyalty / Rewards",
    section: "engage",
    block: {
      type: "loyalty",
      loyaltyData: {
        programName: "Glow Rewards",
        tier: "Gold",
        points: 1240,
        nextTier: "Platinum",
        pointsToNextTier: 760,
        progress: 62,
        redeemable: "$12",
        birthdayReward: "$10",
        multiplier: "2x",
      },
    },
  },
  {
    type: "wishlist",
    label: "Saved Items",
    section: "engage",
    block: {
      type: "wishlist",
      wishlistItems: [
        { name: "Retinol Night Serum", price: 56, flag: "Back in stock!", flagColor: "accent" },
        { name: "Peptide Eye Cream", price: 44 },
        { name: "AHA/BHA Exfoliant", price: 32, flag: "Price dropped!", flagColor: "green", originalPrice: 38 },
      ],
    },
  },
  {
    type: "referral",
    label: "Refer a Friend",
    section: "engage",
    block: {
      type: "referral",
      referralData: {
        giveAmount: 15,
        getAmount: 15,
        code: "SARAH-GLOW",
        currency: "USD",
        friendsJoined: 5,
        totalEarned: 75,
      },
    },
  },
  {
    type: "social_proof",
    label: "Social Proof",
    section: "engage",
    block: {
      type: "social_proof",
      socialProofData: {
        stats: [
          { value: "200K+", label: "Customers" },
          { value: "4.8", label: "Avg Rating" },
          { value: "92%", label: "Repurchase" },
        ],
        press: ["Allure Best of Beauty", "Vogue Approved", "Sephora Clean"],
        certifications: ["Cruelty-Free", "Vegan", "Clean at Sephora", "EWG Verified"],
      },
    },
  },

  // ── Support ──
  {
    type: "consultation",
    label: "Book Consultation",
    section: "support",
    block: {
      type: "consultation",
      bookingData: {
        title: "Book a Skin Consult",
        subtitle: "Free 15-min virtual session with a licensed esthetician",
        slots: [
          { time: "10:00 AM", available: true },
          { time: "11:30 AM", available: true },
          { time: "1:00 PM", available: true, selected: true },
          { time: "2:30 PM", available: true },
          { time: "4:00 PM", available: true },
          { time: "5:30 PM", available: true },
        ],
        includes: "Skin analysis · Routine recommendation · Product samples",
      },
    },
  },
];

export default function RelayBlocksPreview({ theme }: Props) {
  const t = theme || DEFAULT_THEME;
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  const noopCallbacks = {
    onSendMessage: () => {},
    onLeadSubmit: () => {},
    onHandoff: () => {},
  };

  const filteredBlocks = activeSection
    ? BLOCK_PREVIEWS.filter((b) => b.section === activeSection)
    : BLOCK_PREVIEWS;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Section filter pills */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveSection(null)}
          style={{
            padding: "6px 14px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: !activeSection ? 600 : 400,
            background: !activeSection ? "#1c1917" : "#fff",
            color: !activeSection ? "#fff" : "#78716c",
            border: !activeSection ? "none" : "1px solid #e7e5e4",
            cursor: "pointer",
          }}
        >
          All ({BLOCK_PREVIEWS.length})
        </button>
        {SECTIONS.map((sec) => {
          const count = BLOCK_PREVIEWS.filter((b) => b.section === sec.id).length;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(activeSection === sec.id ? null : sec.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: activeSection === sec.id ? 600 : 400,
                background: activeSection === sec.id ? "#1c1917" : "#fff",
                color: activeSection === sec.id ? "#fff" : "#78716c",
                border: activeSection === sec.id ? "none" : "1px solid #e7e5e4",
                cursor: "pointer",
              }}
            >
              {sec.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Block grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
        {filteredBlocks.map((preview) => {
          const isExpanded = expandedBlock === preview.type;
          const section = SECTIONS.find((s) => s.id === preview.section);
          return (
            <div
              key={preview.type}
              style={{
                background: "#fff",
                border: isExpanded ? "2px solid #1c1917" : "1px solid #e7e5e4",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                onClick={() => setExpandedBlock(isExpanded ? null : preview.type)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: isExpanded ? "1px solid #e7e5e4" : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1c1917" }}>{preview.label}</div>
                  <div style={{ fontSize: "10px", color: "#a8a29e", fontFamily: "monospace" }}>{preview.type}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#78716c",
                      background: "#faf8f5",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {section?.label}
                  </span>
                  <span style={{ fontSize: "12px", color: "#a8a29e" }}>{isExpanded ? "▾" : "▸"}</span>
                </div>
              </div>

              {/* Block preview (always shown) */}
              <div style={{ padding: "12px", background: "#faf8f5" }}>
                <div style={{ maxWidth: "375px", margin: "0 auto" }}>
                  <BlockRenderer block={preview.block} theme={t} callbacks={noopCallbacks} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
