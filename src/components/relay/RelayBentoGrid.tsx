'use client';

import React, { useState } from 'react';
import {
  Layers, ShoppingBag, Package, Wrench, UtensilsCrossed, BedDouble, List,
  Activity, Compass, GraduationCap, Heart, CalendarCheck, CalendarClock,
  MessageSquarePlus, MapPin, Phone, Image, Info, HelpCircle, DollarSign,
  Star, Clock, Tag, UserPlus, Users, Hand, Zap, Radio, Sparkles,
  MessageSquare, ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RelayTheme } from '@/components/relay/blocks/types';
import { IconBox } from '@/components/relay/primitives';

const ICON_MAP: Record<string, LucideIcon> = {
  Layers, ShoppingBag, Package, Wrench, UtensilsCrossed, BedDouble, List,
  Activity, Compass, GraduationCap, Heart, CalendarCheck, CalendarClock,
  MessageSquarePlus, MapPin, Phone, Image, Info, HelpCircle, DollarSign,
  Star, Clock, Tag, UserPlus, Users, Hand, Zap, Radio, Sparkles, MessageSquare,
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Layers;
}

interface BentoItem {
  key: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  size: 'large' | 'medium' | 'small';
  onClick: () => void;
}

interface RelayBentoGridProps {
  brand: {
    name: string;
    tagline: string;
  };
  modules: Array<{
    id: string;
    slug: string;
    name: string;
    description?: string;
    iconName: string;
    blockType: string;
    itemCount: number;
    category: string;
  }>;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    whatsapp?: string;
  };
  usp?: string[];
  hasRag?: boolean;
  theme: RelayTheme;
  onModuleClick: (moduleSlug: string) => void;
  onAsk: () => void;
}

function buildBentoItems(props: RelayBentoGridProps): BentoItem[] {
  const { brand, modules, contact, hasRag, onModuleClick, onAsk } = props;
  const items: BentoItem[] = [];

  if (modules.length < 2) {
    items.push({
      key: 'welcome',
      label: brand.name,
      sub: brand.tagline || 'Welcome',
      icon: Radio,
      size: 'large',
      onClick: onAsk,
    });
    items.push({
      key: 'ask',
      label: 'Ask anything',
      sub: 'Get instant answers',
      icon: MessageSquare,
      size: 'medium',
      onClick: onAsk,
    });
    if (contact && (contact.phone || contact.email || contact.whatsapp)) {
      items.push({
        key: 'contact',
        label: 'Contact us',
        sub: 'Get in touch',
        icon: Phone,
        size: 'medium',
        onClick: onAsk,
      });
    }
    if (modules.length === 1) {
      const m = modules[0];
      items.push({
        key: m.id,
        label: m.name,
        sub: m.description || `${m.itemCount} items`,
        icon: resolveIcon(m.iconName),
        size: 'medium',
        onClick: () => onModuleClick(m.slug),
      });
    }
    return items;
  }

  items.push({
    key: 'overview',
    label: 'What we offer',
    sub: `${modules.length} services`,
    icon: Layers,
    size: 'large',
    onClick: onAsk,
  });

  const productModule = modules.find((m) => m.category === 'Products');
  const serviceModule = modules.find((m) => m.category === 'Services');
  const used = new Set<string>();

  if (productModule) {
    used.add(productModule.id);
    items.push({
      key: productModule.id,
      label: productModule.name,
      sub: productModule.description || `${productModule.itemCount} items`,
      icon: resolveIcon(productModule.iconName),
      size: 'medium',
      onClick: () => onModuleClick(productModule.slug),
    });
  }

  if (serviceModule) {
    used.add(serviceModule.id);
    items.push({
      key: serviceModule.id,
      label: serviceModule.name,
      sub: serviceModule.description || `${serviceModule.itemCount} items`,
      icon: resolveIcon(serviceModule.iconName),
      size: 'medium',
      onClick: () => onModuleClick(serviceModule.slug),
    });
  }

  if (contact && (contact.phone || contact.email || contact.whatsapp)) {
    items.push({
      key: 'contact',
      label: 'Contact',
      sub: 'Hours \u00B7 Location \u00B7 Reach us',
      icon: Phone,
      size: 'small',
      onClick: onAsk,
    });
  }

  if (hasRag) {
    items.push({
      key: 'quick-answers',
      label: 'Quick answers',
      sub: 'Ask anything',
      icon: HelpCircle,
      size: 'small',
      onClick: onAsk,
    });
  }

  const remaining = modules.filter((m) => !used.has(m.id));
  for (let i = 0; i < Math.min(3, remaining.length); i++) {
    const m = remaining[i];
    items.push({
      key: m.id,
      label: m.name,
      sub: m.description || `${m.itemCount} items`,
      icon: resolveIcon(m.iconName),
      size: 'small',
      onClick: () => onModuleClick(m.slug),
    });
  }

  return items;
}

function BentoCard({
  item,
  span,
  theme,
}: {
  item: BentoItem;
  span: boolean;
  theme: RelayTheme;
}) {
  const [hovered, setHovered] = useState(false);
  const isLarge = item.size === 'large';
  const iconSize = isLarge ? 36 : 28;

  return (
    <div
      onClick={item.onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        gridColumn: span ? '1 / -1' : undefined,
        background: theme.bg,
        border: `1px solid ${hovered ? theme.accent + '40' : theme.bdrL}`,
        borderRadius: 12,
        cursor: 'pointer',
        padding: isLarge ? 16 : 14,
        display: 'flex',
        flexDirection: isLarge ? 'row' : 'column',
        alignItems: isLarge ? 'center' : 'flex-start',
        gap: isLarge ? 14 : 8,
        transition: 'border-color 0.15s',
      }}
    >
      <IconBox
        icon={item.icon}
        size={iconSize}
        theme={theme}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: theme.text,
            fontFamily: theme.fontFamily,
            lineHeight: 1.3,
          }}
        >
          {item.label}
        </div>
        <div
          style={{
            fontSize: 11,
            color: theme.t4,
            fontFamily: theme.fontFamily,
            marginTop: 2,
            lineHeight: 1.3,
          }}
        >
          {item.sub}
        </div>
      </div>
      <ChevronRight
        size={14}
        strokeWidth={2}
        style={{ color: theme.t4, flexShrink: 0 }}
      />
    </div>
  );
}

export default function RelayBentoGrid(props: RelayBentoGridProps) {
  const { brand, theme, onAsk } = props;
  const items = buildBentoItems(props);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: theme.fontFamily,
      }}
    >
      <div
        style={{
          padding: '20px 16px 14px',
          borderBottom: `1px solid ${theme.bdrL}`,
          display: 'flex',
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <IconBox
          icon={Radio}
          size={36}
          bg={theme.accent}
          color="#fff"
          theme={theme}
        />
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: theme.text,
              lineHeight: 1.3,
            }}
          >
            {brand.name}
          </div>
          {brand.tagline && (
            <div
              style={{
                fontSize: 12,
                color: theme.t3,
                marginTop: 1,
                lineHeight: 1.3,
              }}
            >
              {brand.tagline}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            alignContent: 'start',
          }}
        >
          {items.map((item, i) => (
            <BentoCard
              key={item.key}
              item={item}
              span={i === 0 && item.size === 'large'}
              theme={theme}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          padding: '10px 12px 16px',
          borderTop: `1px solid ${theme.bdrL}`,
        }}
      >
        <div
          onClick={onAsk}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: theme.bg,
            borderRadius: 10,
            border: `1px solid ${theme.bdrL}`,
            cursor: 'pointer',
          }}
        >
          <Sparkles size={14} strokeWidth={2} style={{ color: theme.t4 }} />
          <span
            style={{
              fontSize: 13,
              color: theme.t4,
              fontFamily: theme.fontFamily,
            }}
          >
            Ask about {brand.name}...
          </span>
        </div>
      </div>
    </div>
  );
}
