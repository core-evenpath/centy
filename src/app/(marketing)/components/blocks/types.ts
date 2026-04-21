import type { ComponentType } from 'react';

export type LibServiceCardProps = {
  title?: string;
  subtitle?: string;
  price?: string;
};

export type LibPricingTableProps = {
  tiers?: { name: string; price: string; feat: string; pop?: boolean }[];
};

export type LibBookingFlowProps = {
  days?: { d: string; n: string; slots: number; active?: boolean }[];
  times?: string[];
};

export type LibReviewCardProps = {
  quote?: string;
  reviewer?: string;
  initials?: string;
  suffix?: string;
  rating?: string;
};

export type LibQuoteBuilderProps = {
  sku?: string;
  skuSub?: string;
  qty?: number;
  discount?: string;
  total?: string;
};

export type LibLocationMapProps = {
  name?: string;
  address?: string;
  dist?: string;
};

export type FlowDefinition = {
  key: string;
  intent: string;
  outcome: string;
  top: {
    component: ComponentType<any>;
    label: string;
    props?: Record<string, any>;
  };
  bottom: {
    component: ComponentType<any>;
    label: string;
    props?: Record<string, any>;
  };
  verticals: string[];
};
