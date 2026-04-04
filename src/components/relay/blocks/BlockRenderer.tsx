"use client";
import React from "react";
import type { RelayTheme, BlockCallbacks } from "./types";
import { DEFAULT_THEME } from "./types";
import CatalogCards from "./CatalogCards";
import CompareTable from "./CompareTable";
import ServiceList from "./ServiceList";
import BookingFlow from "./BookingFlow";
import LocationCard from "./LocationCard";
import ContactCard from "./ContactCard";
import GalleryGrid from "./GalleryGrid";
import InfoTable from "./InfoTable";
import TextWithSuggestions from "./TextWithSuggestions";
import GreetingCard from "./GreetingCard";
import PricingTable from "./PricingTable";
import TestimonialCards from "./TestimonialCards";
import QuickActions from "./QuickActions";
import ScheduleView from "./ScheduleView";
import PromoCard from "./PromoCard";
import LeadCapture from "./LeadCapture";
import HandoffCard from "./HandoffCard";
import SkinQuiz from "./SkinQuiz";
import ConcernPicker from "./ConcernPicker";
import ProductDetailCard from "./ProductDetailCard";
import IngredientsList from "./IngredientsList";
import ShadeFinderCard from "./ShadeFinderCard";
import RoutineBuilderCard from "./RoutineBuilderCard";
import BundleCard from "./BundleCard";
import GiftCardBlock from "./GiftCardBlock";
import CartSummary from "./CartSummary";
import CheckoutCard from "./CheckoutCard";
import OrderConfirmation from "./OrderConfirmation";
import OrderTrackerCard from "./OrderTrackerCard";
import ReturnExchange from "./ReturnExchange";
import QuickReorder from "./QuickReorder";
import SubscriptionCard from "./SubscriptionCard";
import LoyaltyCard from "./LoyaltyCard";
import WishlistCard from "./WishlistCard";
import ReferralCard from "./ReferralCard";
import SocialProofCard from "./SocialProofCard";
import FeedbackRequest from "./FeedbackRequest";
import ConsultationBooking from "./ConsultationBooking";

export interface RelayBlock {
  type: string;
  text?: string;
  items?: any[];
  suggestions?: string[];
  location?: any;
  methods?: any[];
  brand?: any;
  compareFields?: any[];
  conversionPaths?: any[];
  dateMode?: "range" | "single" | "none";
  guestMode?: "counter" | "none";
  headerLabel?: string;
  selectLabel?: string;
  bookButtonLabel?: string;
  bookLabel?: string;
  showBookButton?: boolean;
  layout?: "stack" | "carousel";
  pricingTiers?: any[];
  testimonials?: any[];
  quickActions?: any[];
  schedule?: any[];
  promos?: any[];
  fields?: any[];
  handoffOptions?: any[];
  title?: string;
  subtitle?: string;
  quizStep?: any;
  concerns?: any[];
  productDetail?: any;
  ingredients?: any[];
  certifications?: string[];
  shadeOptions?: any[];
  shadeMatch?: any;
  routine?: any;
  bundleData?: any;
  giftCard?: any;
  cart?: any;
  checkout?: any;
  confirmation?: any;
  tracker?: any;
  returnData?: any;
  reorderData?: any;
  subscriptionData?: any;
  loyaltyData?: any;
  wishlistItems?: any[];
  referralData?: any;
  socialProofData?: any;
  feedbackData?: any;
  bookingData?: any;
  color?: string;
}

interface BlockRendererProps {
  block: RelayBlock;
  theme?: RelayTheme;
  callbacks?: BlockCallbacks;
}

export default function BlockRenderer({
  block,
  theme = DEFAULT_THEME,
  callbacks,
}: BlockRendererProps) {
  const t = block.type;

  switch (t) {
    case "catalog":
    case "rooms":
    case "products":
    case "services":
    case "menu":
    case "listings":
      return (
        <CatalogCards
          items={block.items || []}
          theme={theme}
          onBook={(id) => callbacks?.onSendMessage?.(`I'd like to book ${id}`)}
          layout={block.layout}
          showBookButton={block.showBookButton}
          bookButtonLabel={block.bookButtonLabel}
        />
      );

    case "compare":
      return (
        <CompareTable
          items={block.items || []}
          theme={theme}
          compareFields={block.compareFields}
        />
      );

    case "activities":
    case "experiences":
    case "classes":
    case "treatments":
      return (
        <ServiceList
          items={block.items || []}
          theme={theme}
          onBook={(id) => callbacks?.onSendMessage?.(`I'd like to book ${id}`)}
          bookLabel={block.bookLabel}
        />
      );

    case "book":
    case "reserve":
    case "appointment":
    case "inquiry":
      return (
        <BookingFlow
          items={block.items || []}
          theme={theme}
          callbacks={callbacks}
          conversionPaths={block.conversionPaths}
          dateMode={block.dateMode}
          guestMode={block.guestMode}
          headerLabel={block.headerLabel}
          selectLabel={block.selectLabel}
        />
      );

    case "location":
    case "directions":
      return (
        <LocationCard
          location={block.location || { name: "", address: "", area: "" }}
          theme={theme}
        />
      );

    case "contact":
      return (
        <ContactCard
          methods={block.methods || []}
          theme={theme}
          onContact={(method) => callbacks?.onSendMessage?.(`Contact via ${method.type}`)}
        />
      );

    case "gallery":
    case "photos":
      return (
        <GalleryGrid
          items={block.items || []}
          theme={theme}
        />
      );

    case "info":
    case "faq":
    case "details":
      return (
        <InfoTable
          items={block.items || []}
          theme={theme}
        />
      );

    case "greeting":
    case "welcome":
      return (
        <GreetingCard
          brandName={block.brand?.name || ""}
          brandEmoji={block.brand?.emoji}
          tagline={block.brand?.tagline}
          quickActions={block.brand?.quickActions}
          theme={theme}
          onAction={(prompt) => callbacks?.onSendMessage?.(prompt)}
        />
      );

    case "pricing":
    case "packages":
    case "plans":
      return (
        <PricingTable
          items={block.pricingTiers || block.items || []}
          theme={theme}
          onSelect={(id) => callbacks?.onSendMessage?.(`I'm interested in the ${id} plan`)}
          headerLabel={block.title}
        />
      );

    case "testimonials":
    case "reviews":
      return (
        <TestimonialCards
          items={block.testimonials || block.items || []}
          theme={theme}
        />
      );

    case "quick_actions":
    case "menu_actions":
      return (
        <QuickActions
          items={block.quickActions || block.items || []}
          theme={theme}
          onAction={(prompt) => callbacks?.onSendMessage?.(prompt)}
        />
      );

    case "schedule":
    case "timetable":
    case "slots":
      return (
        <ScheduleView
          items={block.schedule || block.items || []}
          theme={theme}
          onBook={(id) => callbacks?.onSendMessage?.(`I'd like to book the ${id} slot`)}
        />
      );

    case "promo":
    case "offer":
    case "deal":
      return (
        <PromoCard
          items={block.promos || block.items || []}
          theme={theme}
          onClaim={(id) => callbacks?.onSendMessage?.(`I want to claim the ${id} offer`)}
        />
      );

    case "lead_capture":
    case "form":
    case "inquiry_form":
      return (
        <LeadCapture
          fields={block.fields || []}
          theme={theme}
          title={block.title}
          subtitle={block.subtitle}
          onSubmit={(data) => callbacks?.onLeadSubmit?.(data)}
        />
      );

    case "handoff":
    case "connect":
    case "human":
      return (
        <HandoffCard
          options={block.handoffOptions || block.items || []}
          theme={theme}
          title={block.title}
          subtitle={block.subtitle}
          onSelect={(opt) => callbacks?.onHandoff?.(opt)}
        />
      );

    case "skin_quiz":
      return (
        <SkinQuiz
          step={block.quizStep}
          theme={theme}
          onSelect={(label) => callbacks?.onSendMessage?.(`Selected: ${label}`)}
          onNext={() => callbacks?.onSendMessage?.("Next step")}
        />
      );

    case "concern_picker":
    case "concerns":
      return (
        <ConcernPicker
          items={block.concerns || block.items || []}
          theme={theme}
          onSelect={(id) => callbacks?.onSendMessage?.(`I'm concerned about ${id}`)}
        />
      );

    case "product_detail":
    case "product_page":
      return (
        <ProductDetailCard
          product={block.productDetail || block.items?.[0]}
          theme={theme}
          onAddToBag={(id) => callbacks?.onSendMessage?.(`Add ${id} to bag`)}
        />
      );

    case "ingredients":
    case "ingredient_list":
      return (
        <IngredientsList
          items={block.ingredients || block.items || []}
          theme={theme}
          certifications={block.certifications}
        />
      );

    case "shade_finder":
    case "shade_match":
      return (
        <ShadeFinderCard
          options={block.shadeOptions || []}
          match={block.shadeMatch}
          theme={theme}
          color={block.color}
          onAdd={() => callbacks?.onSendMessage?.("Add matched shade to bag")}
        />
      );

    case "routine_builder":
    case "routine":
      return (
        <RoutineBuilderCard
          routine={block.routine}
          theme={theme}
          onAddRoutine={() => callbacks?.onSendMessage?.("Add full routine to bag")}
        />
      );

    case "bundle":
    case "bundle_set":
    case "gift_set":
      return (
        <BundleCard
          bundle={block.bundleData || block.items?.[0]}
          theme={theme}
          onAdd={() => callbacks?.onSendMessage?.("Add bundle to bag")}
        />
      );

    case "gift_card":
      return (
        <GiftCardBlock
          data={block.giftCard}
          theme={theme}
          onSend={(amt) => callbacks?.onSendMessage?.(`Send $${amt} gift card`)}
        />
      );

    case "cart":
    case "bag":
    case "shopping_bag":
      return (
        <CartSummary
          cart={block.cart}
          theme={theme}
          onCheckout={() => callbacks?.onSendMessage?.("Proceed to checkout")}
        />
      );

    case "checkout":
    case "payment":
      return (
        <CheckoutCard
          data={block.checkout}
          theme={theme}
          onPay={(method) => callbacks?.onSendMessage?.(`Pay with ${method}`)}
        />
      );

    case "order_confirmed":
    case "confirmation":
      return (
        <OrderConfirmation
          data={block.confirmation}
          theme={theme}
        />
      );

    case "order_tracker":
    case "track_order":
    case "shipment":
      return (
        <OrderTrackerCard
          tracker={block.tracker}
          theme={theme}
          onTrack={() => callbacks?.onSendMessage?.("Track my order")}
        />
      );

    case "return_exchange":
    case "return":
    case "exchange":
      return (
        <ReturnExchange
          data={block.returnData}
          theme={theme}
          onSubmit={(opt) => callbacks?.onSendMessage?.(`I want a ${opt}`)}
        />
      );

    case "quick_reorder":
    case "reorder":
      return (
        <QuickReorder
          data={block.reorderData}
          theme={theme}
          onReorder={() => callbacks?.onSendMessage?.("Reorder all items")}
        />
      );

    case "subscription":
    case "subscribe_save":
      return (
        <SubscriptionCard
          data={block.subscriptionData}
          theme={theme}
          onSubscribe={(freq) => callbacks?.onSendMessage?.(`Subscribe ${freq}`)}
        />
      );

    case "loyalty":
    case "rewards":
    case "points":
      return (
        <LoyaltyCard
          data={block.loyaltyData}
          theme={theme}
          onRedeem={() => callbacks?.onSendMessage?.("Redeem my points")}
        />
      );

    case "wishlist":
    case "saved_items":
    case "favorites":
      return (
        <WishlistCard
          items={block.wishlistItems || block.items || []}
          theme={theme}
          onAdd={(i) => callbacks?.onSendMessage?.(`Add wishlist item ${i + 1} to bag`)}
        />
      );

    case "referral":
    case "refer_friend":
      return (
        <ReferralCard
          data={block.referralData}
          theme={theme}
          onCopy={() => callbacks?.onSendMessage?.("Copy referral code")}
          onShare={() => callbacks?.onSendMessage?.("Share referral link")}
        />
      );

    case "social_proof":
    case "trust_badges":
      return (
        <SocialProofCard
          data={block.socialProofData}
          theme={theme}
        />
      );

    case "feedback_request":
    case "review_request":
      return (
        <FeedbackRequest
          data={block.feedbackData}
          theme={theme}
          onRate={(stars) => callbacks?.onSendMessage?.(`Rated ${stars} stars`)}
        />
      );

    case "consultation":
    case "book_consultation":
      return (
        <ConsultationBooking
          data={block.bookingData}
          theme={theme}
          onBook={(slot) => callbacks?.onSendMessage?.(`Book consultation at ${slot}`)}
        />
      );

    default:
      return (
        <TextWithSuggestions
          text={block.text || ""}
          suggestions={block.suggestions}
          theme={theme}
          onSuggestionClick={(s) => callbacks?.onSendMessage?.(s)}
        />
      );
  }
}
