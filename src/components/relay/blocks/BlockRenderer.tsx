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
