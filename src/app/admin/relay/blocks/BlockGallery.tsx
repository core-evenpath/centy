'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
    DEFAULT_THEME,
} from '@/components/relay/blocks';
import type { CatalogItem, ActivityItem, ContactMethod, RelayBlock } from '@/components/relay/blocks';
import { BlockRenderer } from '@/components/relay/blocks';
import type { RelayBlockConfigDetail } from '@/actions/relay-actions';
import {
    updateRelayBlockConfigAction,
    deleteRelayBlockConfigAction,
    regenerateBlockTemplateAction,
    clearAllRelayBlockConfigsAction,
    generateMissingRelayBlocksAction,
} from '@/actions/relay-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
} from '@/components/ui/collapsible';
import Link from 'next/link';
import {
    ChevronDown,
    ChevronRight,
    Zap,
    Plus,
    Save,
    Trash2,
    RefreshCw,
    Sparkles,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const BLOCK_TYPES = [
    'catalog', 'rooms', 'products', 'services', 'menu', 'listings',
    'compare',
    'activities', 'experiences', 'classes', 'treatments',
    'book', 'reserve', 'appointment', 'inquiry',
    'location', 'directions',
    'contact',
    'gallery', 'photos',
    'info', 'faq', 'details',
    'greeting', 'welcome',
    'text',
] as const;

const BLOCK_TYPE_COLORS: Record<string, string> = {
    catalog: 'bg-blue-100 text-blue-800',
    rooms: 'bg-blue-100 text-blue-800',
    products: 'bg-blue-100 text-blue-800',
    services: 'bg-blue-100 text-blue-800',
    menu: 'bg-blue-100 text-blue-800',
    listings: 'bg-blue-100 text-blue-800',
    compare: 'bg-amber-100 text-amber-800',
    activities: 'bg-purple-100 text-purple-800',
    experiences: 'bg-purple-100 text-purple-800',
    classes: 'bg-purple-100 text-purple-800',
    treatments: 'bg-purple-100 text-purple-800',
    book: 'bg-indigo-100 text-indigo-800',
    reserve: 'bg-indigo-100 text-indigo-800',
    appointment: 'bg-indigo-100 text-indigo-800',
    inquiry: 'bg-indigo-100 text-indigo-800',
    location: 'bg-teal-100 text-teal-800',
    directions: 'bg-teal-100 text-teal-800',
    contact: 'bg-pink-100 text-pink-800',
    gallery: 'bg-orange-100 text-orange-800',
    photos: 'bg-orange-100 text-orange-800',
    info: 'bg-green-100 text-green-800',
    faq: 'bg-green-100 text-green-800',
    details: 'bg-green-100 text-green-800',
    greeting: 'bg-red-100 text-red-800',
    welcome: 'bg-red-100 text-red-800',
    text: 'bg-gray-100 text-gray-800',
};

// ── Industry-specific fallback data per block type ──────────────────
// Each block type gets data that reflects its natural user journey.

const FALLBACK_ROOMS: CatalogItem[] = [
    {
        id: 'deluxe-suite', name: 'Deluxe Ocean Suite', price: 18500, originalPrice: 22000, currency: 'INR', unit: '/night',
        subtitle: 'Ocean-facing luxury with private balcony', tagline: 'Most Popular Choice', emoji: '🌊',
        color: '#2563EB', colorEnd: '#7C3AED', rating: 4.8, reviewCount: 234,
        badges: ['Best Seller', '15% Off'], features: ['King Bed', 'Ocean View', 'Free WiFi', 'Mini Bar'],
        specs: [{ label: 'Size', value: '52 sqm' }, { label: 'Floor', value: '8th-12th' }], maxCapacity: 3,
    },
    {
        id: 'garden-villa', name: 'Garden Villa', price: 32000, currency: 'INR', unit: '/night',
        subtitle: 'Private villa with plunge pool', emoji: '🌺',
        color: '#059669', colorEnd: '#10B981', rating: 4.9, reviewCount: 87,
        badges: ['Premium'], features: ['Private Pool', 'Butler Service', 'Garden Terrace'],
        specs: [{ label: 'Size', value: '120 sqm' }, { label: 'Bedrooms', value: '2' }], maxCapacity: 4,
    },
    {
        id: 'superior-room', name: 'Superior Room', price: 8900, currency: 'INR', unit: '/night',
        subtitle: 'Cozy room with city skyline view', emoji: '🏙️',
        color: '#A2845B', colorEnd: '#BFA07A', rating: 4.5, reviewCount: 412,
        features: ['Queen Bed', 'City View', 'Free WiFi'], specs: [{ label: 'Size', value: '32 sqm' }], maxCapacity: 2,
    },
];

const FALLBACK_MENU: CatalogItem[] = [
    {
        id: 'butter-chicken', name: 'Butter Chicken Thali', price: 450, currency: 'INR',
        subtitle: 'Creamy tomato gravy with naan & rice', emoji: '🍛',
        color: '#DC2626', colorEnd: '#F97316', rating: 4.9, reviewCount: 1203,
        badges: ['Chef\'s Special', 'Bestseller'], features: ['Naan', 'Rice', 'Raita', 'Dessert'],
    },
    {
        id: 'paneer-tikka', name: 'Paneer Tikka Platter', price: 350, originalPrice: 420, currency: 'INR',
        subtitle: 'Charcoal-grilled cottage cheese with mint chutney', emoji: '🧀',
        color: '#EA580C', colorEnd: '#FACC15', rating: 4.7, reviewCount: 567,
        badges: ['Vegetarian', '17% Off'],
    },
    {
        id: 'mango-lassi', name: 'Alphonso Mango Lassi', price: 180, currency: 'INR',
        subtitle: 'Fresh Alphonso mango blended with yogurt', emoji: '🥭',
        color: '#F59E0B', colorEnd: '#FDE68A', rating: 4.8, reviewCount: 890,
        badges: ['Seasonal'],
    },
];

const FALLBACK_PRODUCTS: CatalogItem[] = [
    {
        id: 'wireless-buds', name: 'AuraSound Pro Buds', price: 4999, originalPrice: 7999, currency: 'INR',
        subtitle: 'Active noise cancellation with 36hr battery', emoji: '🎧',
        color: '#1E1B4B', colorEnd: '#4338CA', rating: 4.6, reviewCount: 2341,
        badges: ['38% Off', 'Top Rated'], features: ['ANC', '36hr Battery', 'IPX5'],
        specs: [{ label: 'Driver', value: '12mm' }, { label: 'Bluetooth', value: '5.3' }],
    },
    {
        id: 'smart-watch', name: 'FitPulse Ultra Watch', price: 12999, currency: 'INR',
        subtitle: 'AMOLED display with health monitoring suite', emoji: '⌚',
        color: '#0F766E', colorEnd: '#2DD4BF', rating: 4.4, reviewCount: 876,
        badges: ['New Launch'], features: ['Heart Rate', 'SpO2', 'GPS', '5ATM'],
        specs: [{ label: 'Display', value: '1.43" AMOLED' }, { label: 'Battery', value: '14 days' }],
    },
    {
        id: 'backpack', name: 'UrbanTrail 30L Backpack', price: 2499, currency: 'INR',
        subtitle: 'Water-resistant laptop backpack with USB port', emoji: '🎒',
        color: '#4B5563', colorEnd: '#9CA3AF', rating: 4.7, reviewCount: 3120,
        features: ['Laptop Sleeve', 'USB Port', 'Water Resistant'],
    },
];

const FALLBACK_SERVICES: CatalogItem[] = [
    {
        id: 'full-service', name: 'Complete Home Deep Clean', price: 3500, currency: 'INR', unit: '/visit',
        subtitle: '3-4 hour deep cleaning by trained professionals', emoji: '✨',
        color: '#7C3AED', colorEnd: '#A78BFA', rating: 4.8, reviewCount: 1876,
        badges: ['Most Booked'], features: ['Kitchen', 'Bathrooms', 'Bedrooms', 'Balcony'],
        specs: [{ label: 'Duration', value: '3-4 hrs' }, { label: 'Team', value: '2-3 cleaners' }],
    },
    {
        id: 'ac-service', name: 'AC Service & Gas Refill', price: 1200, originalPrice: 1800, currency: 'INR',
        subtitle: 'Complete cleaning, gas top-up & health check', emoji: '❄️',
        color: '#0284C7', colorEnd: '#38BDF8', rating: 4.6, reviewCount: 4521,
        badges: ['33% Off', 'Season Special'],
        specs: [{ label: 'Duration', value: '60 min' }, { label: 'Warranty', value: '30 days' }],
    },
    {
        id: 'pest-control', name: 'Pest Control Treatment', price: 1999, currency: 'INR',
        subtitle: 'Odourless gel treatment with 90-day guarantee', emoji: '🛡️',
        color: '#15803D', colorEnd: '#4ADE80', rating: 4.5, reviewCount: 987,
        features: ['Cockroaches', 'Ants', 'Bed Bugs'],
    },
];

const FALLBACK_LISTINGS: CatalogItem[] = [
    {
        id: 'sea-view-2bhk', name: '2 BHK Sea-View Apartment', price: 15000000, currency: 'INR',
        subtitle: 'Worli, Mumbai · 1,100 sqft · Ready to Move', emoji: '🏢',
        color: '#1D4ED8', colorEnd: '#60A5FA', rating: 4.3, reviewCount: 12,
        badges: ['Premium', 'RERA Approved'], features: ['Sea View', 'Gym', 'Swimming Pool', 'Parking'],
        specs: [{ label: 'Carpet', value: '1,100 sqft' }, { label: 'Floor', value: '14th of 28' }],
    },
    {
        id: 'villa-lonavala', name: '3 BHK Villa with Garden', price: 8500000, currency: 'INR',
        subtitle: 'Lonavala · 2,400 sqft · Under Construction', emoji: '🏡',
        color: '#166534', colorEnd: '#86EFAC', badges: ['New Project'],
        features: ['Private Garden', 'Club House', 'Mountain View'],
        specs: [{ label: 'Plot', value: '3,200 sqft' }, { label: 'Possession', value: 'Dec 2026' }],
    },
];

const FALLBACK_ACTIVITIES: ActivityItem[] = [
    { id: 'trek-1', name: 'Sunrise Valley Trek', description: 'Guided 8km trail through misty pine forests to a panoramic viewpoint', icon: '🏔️', price: '₹1,200', duration: '4 hrs', category: 'Adventure', bookable: true },
    { id: 'raft-1', name: 'White Water Rafting', description: 'Grade III rapids on the Ganges with certified instructors', icon: '🚣', price: '₹2,500', duration: '2 hrs', category: 'Adventure', bookable: true },
    { id: 'culture-1', name: 'Heritage Walking Tour', description: 'Explore 400-year-old temples, markets & hidden alleyways', icon: '🏛️', price: '₹800', duration: '3 hrs', category: 'Culture', bookable: true },
    { id: 'food-1', name: 'Street Food Crawl', description: 'Taste 12 iconic dishes across the old city with a local foodie', icon: '🍜', price: '₹1,500', duration: '2.5 hrs', category: 'Culture', bookable: true },
    { id: 'camp-1', name: 'Stargazing Campfire Night', description: 'Telescope session, bonfire & stories under clear mountain skies', icon: '🌌', price: 'Free', duration: '3 hrs', category: 'Leisure', bookable: false },
];

const FALLBACK_EXPERIENCES: ActivityItem[] = [
    { id: 'exp-1', name: 'Sunset Sailing Cruise', description: 'Catamaran cruise along the coastline with canapes & champagne', icon: '⛵', price: '₹6,000', duration: '2.5 hrs', category: 'Premium', bookable: true },
    { id: 'exp-2', name: 'Private Wine Tasting', description: 'Curated flight of 8 regional wines with sommelier pairing notes', icon: '🍷', price: '₹3,500', duration: '90 min', category: 'Premium', bookable: true },
    { id: 'exp-3', name: 'Farm-to-Table Brunch', description: 'Harvest ingredients from the organic farm & cook with our chef', icon: '🌾', price: '₹2,800', duration: '3 hrs', category: 'Culinary', bookable: true },
    { id: 'exp-4', name: 'Pottery Workshop', description: 'Hand-throw your own ceramic piece on a traditional wheel', icon: '🏺', price: '₹1,200', duration: '2 hrs', category: 'Creative', bookable: true },
];

const FALLBACK_CLASSES: ActivityItem[] = [
    { id: 'cls-1', name: 'Beginner Yoga Foundation', description: 'Build strength & flexibility with alignment-focused asanas', icon: '🧘', price: '₹500/class', duration: '60 min', category: 'Yoga', bookable: true },
    { id: 'cls-2', name: 'Advanced Vinyasa Flow', description: 'Dynamic sequences linking breath to movement for experienced yogis', icon: '💪', price: '₹700/class', duration: '75 min', category: 'Yoga', bookable: true },
    { id: 'cls-3', name: 'Watercolor Painting', description: 'Learn wet-on-wet techniques painting local landscapes', icon: '🎨', price: '₹1,500', duration: '2 hrs', category: 'Art', bookable: true },
    { id: 'cls-4', name: 'Conversational Spanish', description: 'Interactive group class — no textbooks, just real conversations', icon: '🇪🇸', price: '₹3,000/mo', duration: '45 min', category: 'Language', bookable: true },
    { id: 'cls-5', name: 'Kids Coding Camp', description: 'Scratch & Python basics through fun game-building projects', icon: '💻', price: 'Free Trial', duration: '90 min', category: 'Tech', bookable: true },
];

const FALLBACK_TREATMENTS: ActivityItem[] = [
    { id: 'treat-1', name: 'Balinese Hot Stone Massage', description: 'Volcanic stone therapy for deep muscle tension release', icon: '🪨', price: '₹4,500', duration: '90 min', category: 'Signature Spa', bookable: true },
    { id: 'treat-2', name: 'Ayurvedic Shirodhara', description: 'Warm herbal oil poured over the forehead — profound calm', icon: '🧘', price: '₹3,800', duration: '60 min', category: 'Signature Spa', bookable: true },
    { id: 'treat-3', name: 'HydraGlow Facial', description: 'Deep cleansing, exfoliation & LED light therapy for radiant skin', icon: '✨', price: '₹2,800', duration: '45 min', category: 'Skin Care', bookable: true },
    { id: 'treat-4', name: 'Sports Recovery Session', description: 'Deep tissue massage + cryo + stretch for active bodies', icon: '🏃', price: '₹5,200', duration: '75 min', category: 'Recovery', bookable: true },
    { id: 'treat-5', name: 'Couples Candlelight Ritual', description: 'Side-by-side massage, aromatherapy & champagne', icon: '🕯️', price: '₹9,000', duration: '120 min', category: 'Signature Spa', bookable: true },
];

const FALLBACK_CATALOG: CatalogItem[] = [
    {
        id: 'plan-starter', name: 'Starter Plan', price: 999, currency: 'INR', unit: '/month',
        subtitle: 'Perfect for small teams getting started', emoji: '🚀',
        color: '#6366F1', colorEnd: '#818CF8', rating: 4.6, reviewCount: 312,
        badges: ['Popular'], features: ['5 Users', '10 GB Storage', 'Email Support'],
    },
    {
        id: 'plan-pro', name: 'Professional Plan', price: 2999, originalPrice: 3999, currency: 'INR', unit: '/month',
        subtitle: 'Advanced features for growing businesses', emoji: '💼',
        color: '#7C3AED', colorEnd: '#A78BFA', rating: 4.8, reviewCount: 567,
        badges: ['Best Value', '25% Off'], features: ['25 Users', '100 GB', 'Priority Support', 'API Access'],
        specs: [{ label: 'Uptime SLA', value: '99.9%' }, { label: 'Integrations', value: '50+' }],
    },
    {
        id: 'plan-enterprise', name: 'Enterprise Plan', price: 9999, currency: 'INR', unit: '/month',
        subtitle: 'Custom solutions for large organizations', emoji: '🏢',
        color: '#0F172A', colorEnd: '#334155',
        badges: ['Custom'], features: ['Unlimited Users', '1 TB', 'Dedicated Manager', 'SSO'],
    },
];

function buildPreviewBlock(config: RelayBlockConfigDetail): RelayBlock {
    const sampleData = config.blockTypeTemplate?.sampleData;
    const blockType = config.blockType;

    if (sampleData && Object.keys(sampleData).length > 0) {
        switch (blockType) {
            case 'catalog':
            case 'rooms':
            case 'products':
            case 'services':
            case 'menu':
            case 'listings':
                if (sampleData.items && Array.isArray(sampleData.items) && sampleData.items.length > 0) {
                    return { type: blockType, items: sampleData.items, showBookButton: true, bookButtonLabel: 'View', layout: sampleData.layout };
                }
                break;
            case 'compare':
                if (sampleData.items && Array.isArray(sampleData.items)) {
                    return { type: blockType, items: sampleData.items, compareFields: sampleData.compareFields };
                }
                break;
            case 'activities':
            case 'experiences':
            case 'classes':
            case 'treatments':
                if (sampleData.items && Array.isArray(sampleData.items) && sampleData.items.length > 0) {
                    return { type: blockType, items: sampleData.items };
                }
                break;
            case 'book':
            case 'reserve':
            case 'appointment':
            case 'inquiry':
                if (sampleData.items && Array.isArray(sampleData.items)) {
                    return {
                        type: blockType,
                        items: sampleData.items,
                        conversionPaths: sampleData.conversionPaths,
                        dateMode: sampleData.dateMode || 'single',
                        guestMode: sampleData.guestMode || 'counter',
                        headerLabel: sampleData.headerLabel || 'Book Now',
                        selectLabel: sampleData.selectLabel || 'Select',
                    };
                }
                break;
            case 'location':
            case 'directions':
                if (sampleData.location) {
                    return { type: blockType, location: sampleData.location };
                }
                break;
            case 'contact':
                if (sampleData.methods && Array.isArray(sampleData.methods)) {
                    return { type: blockType, methods: sampleData.methods };
                }
                break;
            case 'gallery':
            case 'photos':
                if (sampleData.items && Array.isArray(sampleData.items)) {
                    return { type: blockType, items: sampleData.items };
                }
                break;
            case 'info':
            case 'faq':
            case 'details':
                if (sampleData.items && Array.isArray(sampleData.items)) {
                    return { type: blockType, items: sampleData.items };
                }
                break;
            case 'greeting':
            case 'welcome':
                if (sampleData.brand) {
                    return { type: blockType, brand: sampleData.brand };
                }
                break;
            case 'text':
                if (sampleData.text) {
                    return { type: blockType, text: sampleData.text, suggestions: sampleData.suggestions };
                }
                break;
        }
    }

    return generateFallbackBlock(blockType);
}

function generateFallbackBlock(blockType: string): RelayBlock {
    switch (blockType) {
        // ── Catalog family: each subtype gets its own industry ──
        case 'rooms':
            return { type: 'rooms', items: FALLBACK_ROOMS, showBookButton: true, bookButtonLabel: 'Book Room' };
        case 'menu':
            return { type: 'menu', items: FALLBACK_MENU, showBookButton: true, bookButtonLabel: 'Order' };
        case 'products':
            return { type: 'products', items: FALLBACK_PRODUCTS, showBookButton: true, bookButtonLabel: 'Add to Cart' };
        case 'services':
            return { type: 'services', items: FALLBACK_SERVICES, showBookButton: true, bookButtonLabel: 'Book Service' };
        case 'listings':
            return { type: 'listings', items: FALLBACK_LISTINGS, showBookButton: true, bookButtonLabel: 'View Details' };
        case 'catalog':
            return { type: 'catalog', items: FALLBACK_CATALOG, showBookButton: true, bookButtonLabel: 'View Plans' };

        // ── Compare: side-by-side product comparison ──
        case 'compare':
            return {
                type: 'compare', items: FALLBACK_PRODUCTS.slice(0, 2), compareFields: [
                    { label: 'Price', key: 'price' },
                    { label: 'Rating', key: 'rating' },
                ],
            };

        // ── Activity family: each subtype reflects its industry ──
        case 'activities':
            return { type: 'activities', items: FALLBACK_ACTIVITIES };
        case 'experiences':
            return { type: 'experiences', items: FALLBACK_EXPERIENCES };
        case 'classes':
            return { type: 'classes', items: FALLBACK_CLASSES };
        case 'treatments':
            return { type: 'treatments', items: FALLBACK_TREATMENTS };

        // ── Booking family: each subtype gets appropriate flow ──
        case 'book':
            return {
                type: 'book', items: FALLBACK_ROOMS.slice(0, 2),
                conversionPaths: [
                    { id: 'direct', label: 'Confirm Reservation', icon: '⚡', type: 'primary' as const, color: '#059669', action: 'direct' as const },
                    { id: 'whatsapp', label: 'Chat on WhatsApp', icon: '💬', type: 'secondary' as const, color: '#25D366', action: 'whatsapp' as const },
                ],
                dateMode: 'range', guestMode: 'counter',
                headerLabel: 'Reserve Your Stay', selectLabel: 'Choose Room',
            };
        case 'reserve':
            return {
                type: 'reserve', items: FALLBACK_MENU.slice(0, 2),
                conversionPaths: [
                    { id: 'direct', label: 'Reserve Table', icon: '🍽️', type: 'primary' as const, color: '#DC2626', action: 'direct' as const },
                    { id: 'callback', label: 'Call Restaurant', icon: '📞', type: 'secondary' as const, action: 'callback' as const },
                ],
                dateMode: 'single', guestMode: 'counter',
                headerLabel: 'Table Reservation', selectLabel: 'Choose Time',
            };
        case 'appointment':
            return {
                type: 'appointment', items: FALLBACK_TREATMENTS.slice(0, 3).map(t => ({
                    id: t.id, name: t.name, price: parseInt(t.price.replace(/[^\d]/g, '')) || 0,
                    currency: 'INR', subtitle: t.description, emoji: t.icon,
                })),
                conversionPaths: [
                    { id: 'direct', label: 'Book Appointment', icon: '📅', type: 'primary' as const, color: '#7C3AED', action: 'direct' as const },
                    { id: 'whatsapp', label: 'Ask on WhatsApp', icon: '💬', type: 'secondary' as const, color: '#25D366', action: 'whatsapp' as const },
                ],
                dateMode: 'single', guestMode: 'none',
                headerLabel: 'Book Treatment', selectLabel: 'Select Treatment',
            };
        case 'inquiry':
            return {
                type: 'inquiry', items: FALLBACK_LISTINGS.slice(0, 2),
                conversionPaths: [
                    { id: 'ask', label: 'Send Inquiry', icon: '📩', type: 'primary' as const, color: '#1D4ED8', action: 'ask' as const },
                    { id: 'callback', label: 'Schedule Visit', icon: '🏠', type: 'secondary' as const, action: 'callback' as const },
                    { id: 'save', label: 'Save for Later', icon: '🔖', type: 'secondary' as const, action: 'save' as const },
                ],
                dateMode: 'single', guestMode: 'none',
                headerLabel: 'Interested in a Property?', selectLabel: 'Select Property',
            };

        // ── Location: generic business ──
        case 'location':
            return {
                type: 'location', location: {
                    name: 'Downtown Flagship Store', address: '12 MG Road, Brigade Gateway',
                    area: 'Bengaluru, Karnataka', emoji: '📍',
                    mapGradient: ['#7C3AED', '#EC4899'] as [string, string],
                    directions: [
                        { icon: '🚇', label: 'Metro', detail: 'MG Road Station — 5 min walk' },
                        { icon: '🚗', label: 'By Car', detail: 'Parking available at Brigade Gateway' },
                        { icon: '🚕', label: 'Auto/Cab', detail: 'Drop at Brigade Gateway main entrance' },
                    ],
                    actions: ['Get Directions', 'Call Store', 'Share'],
                },
            };
        case 'directions':
            return {
                type: 'directions', location: {
                    name: 'Riverside Adventure Camp', address: 'Kolad River Valley, Off NH-17',
                    area: 'Raigad, Maharashtra', emoji: '🏕️',
                    mapGradient: ['#059669', '#84CC16'] as [string, string],
                    directions: [
                        { icon: '🚗', label: 'From Mumbai', detail: '3 hrs via Mumbai-Goa Highway (NH-17)' },
                        { icon: '🚂', label: 'From Pune', detail: '2.5 hrs — take Kolad exit' },
                        { icon: '🚌', label: 'Bus', detail: 'MSRTC bus to Kolad, 10 min auto from stand' },
                    ],
                    actions: ['Get Directions', 'Download Map', 'Share Location'],
                },
            };

        // ── Contact: professional services ──
        case 'contact':
            return {
                type: 'contact', methods: [
                    { type: 'whatsapp' as const, label: 'WhatsApp Support', value: '+91 98765 43210', icon: '💬' },
                    { type: 'phone' as const, label: 'Call Us', value: '+91 98765 43211', icon: '📞' },
                    { type: 'email' as const, label: 'Email', value: 'hello@business.com', icon: '📧' },
                    { type: 'website' as const, label: 'Visit Website', value: 'https://example.com', icon: '🌐' },
                ],
            };

        // ── Gallery: resort / portfolio ──
        case 'gallery':
            return {
                type: 'gallery', items: [
                    { emoji: '🏖️', label: 'Beachfront', span: 2 },
                    { emoji: '🛏️', label: 'Suites' },
                    { emoji: '🍽️', label: 'Dining' },
                    { emoji: '🏊', label: 'Infinity Pool', span: 2 },
                    { emoji: '🧖', label: 'Spa' },
                    { emoji: '🌅', label: 'Sunset View' },
                ],
            };
        case 'photos':
            return {
                type: 'photos', items: [
                    { emoji: '🏠', label: 'Living Room', span: 2 },
                    { emoji: '🛏️', label: 'Master Bedroom' },
                    { emoji: '🍳', label: 'Kitchen' },
                    { emoji: '🛁', label: 'Bathroom' },
                    { emoji: '🌳', label: 'Garden View', span: 2 },
                ],
            };

        // ── Info family: each subtype has its own context ──
        case 'info':
            return {
                type: 'info', items: [
                    { label: 'Working Hours', value: 'Mon–Sat: 9 AM – 7 PM' },
                    { label: 'Delivery', value: 'Free above ₹499 · Same-day available' },
                    { label: 'Returns', value: '7-day easy returns' },
                    { label: 'Payment', value: 'UPI, Cards, COD, EMI' },
                    { label: 'Support', value: 'WhatsApp or call 9876543210' },
                ],
            };
        case 'faq':
            return {
                type: 'faq', items: [
                    { label: 'How do I book an appointment?', value: 'Chat with us or tap "Book Now" on any service' },
                    { label: 'Can I reschedule?', value: 'Yes — free reschedule up to 4 hours before' },
                    { label: 'What\'s the cancellation policy?', value: 'Full refund if cancelled 24 hrs in advance' },
                    { label: 'Do you offer group discounts?', value: 'Yes! 15% off for groups of 4+' },
                    { label: 'Is parking available?', value: 'Free parking for all customers' },
                    { label: 'Are walk-ins accepted?', value: 'Subject to availability — booking recommended' },
                ],
            };
        case 'details':
            return {
                type: 'details', items: [
                    { label: 'Material', value: '100% Organic Cotton, GOTS Certified' },
                    { label: 'Weight', value: '180 GSM' },
                    { label: 'Sizes', value: 'XS · S · M · L · XL · XXL' },
                    { label: 'Care', value: 'Machine wash cold, tumble dry low' },
                    { label: 'Origin', value: 'Handcrafted in Jaipur, India' },
                    { label: 'Warranty', value: '6 months against manufacturing defects' },
                    { label: 'Shipping', value: '2-5 business days pan-India' },
                ],
            };

        // ── Greeting: brand welcome ──
        case 'greeting':
            return {
                type: 'greeting', brand: {
                    name: 'FreshCart', emoji: '🛒',
                    tagline: 'Groceries delivered in 10 minutes',
                    quickActions: [
                        { label: 'Today\'s Deals', prompt: 'Show me today\'s offers', emoji: '🏷️' },
                        { label: 'Reorder Last', prompt: 'Reorder my last purchase', emoji: '🔄' },
                        { label: 'Track Order', prompt: 'Where is my order?', emoji: '📦' },
                        { label: 'Help', prompt: 'I need help with something', emoji: '🤝' },
                    ],
                },
            };
        case 'welcome':
            return {
                type: 'welcome', brand: {
                    name: 'The Shoreline', emoji: '🏖️',
                    tagline: 'Your beachfront escape awaits',
                    quickActions: [
                        { label: 'Browse Rooms', prompt: 'Show me available rooms', emoji: '🛏️' },
                        { label: 'Spa & Wellness', prompt: 'What spa treatments do you offer?', emoji: '🧖' },
                        { label: 'Dining', prompt: 'Tell me about restaurants', emoji: '🍽️' },
                        { label: 'Getting Here', prompt: 'How do I get to the resort?', emoji: '📍' },
                    ],
                },
            };

        // ── Text: engaging conversational ──
        default:
            return {
                type: 'text',
                text: 'Hi there! I\'m here to help you find exactly what you need. What are you looking for today?',
                suggestions: ['Browse popular items', 'Check today\'s offers', 'Track my order', 'Talk to someone'],
            };
    }
}

function getBlockTypeColor(blockType: string): string {
    return BLOCK_TYPE_COLORS[blockType] || 'bg-gray-100 text-gray-800';
}

interface BlockGalleryProps {
    configs: RelayBlockConfigDetail[];
}

export function BlockGallery({ configs: initialConfigs }: BlockGalleryProps) {
    const [configs, setConfigs] = useState(initialConfigs);
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [generatingAll, setGeneratingAll] = useState(false);
    const [clearingAll, setClearingAll] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const uniqueBlockTypes = useMemo(() => {
        const types = new Set(configs.map(c => c.blockType));
        return Array.from(types).sort();
    }, [configs]);

    const filteredConfigs = useMemo(() => {
        if (activeFilter === 'All') return configs;
        return configs.filter(c => c.blockType === activeFilter);
    }, [configs, activeFilter]);

    const handleConfigUpdate = useCallback((id: string, updated: RelayBlockConfigDetail) => {
        setConfigs(prev => prev.map(c => c.id === id ? updated : c));
    }, []);

    const handleConfigDelete = useCallback((id: string) => {
        setConfigs(prev => prev.filter(c => c.id !== id));
    }, []);

    const handleGenerateAll = async () => {
        setGeneratingAll(true);
        try {
            const result = await generateMissingRelayBlocksAction();
            if (result.success) {
                toast.success(`Generated ${result.generated} block config(s)${result.errors.length > 0 ? `, ${result.errors.length} error(s)` : ''}`);
                if (result.generated > 0) {
                    window.location.reload();
                }
            } else {
                toast.error('Failed to generate block configs');
            }
        } catch {
            toast.error('Generation failed');
        } finally {
            setGeneratingAll(false);
        }
    };

    const handleClearAll = async () => {
        setClearingAll(true);
        try {
            const result = await clearAllRelayBlockConfigsAction();
            if (result.success) {
                toast.success(`Cleared ${result.count} block config(s)`);
                setConfigs([]);
            } else {
                toast.error(result.error || 'Failed to clear');
            }
        } catch {
            toast.error('Clear failed');
        } finally {
            setClearingAll(false);
            setShowClearConfirm(false);
        }
    };

    const handleConfigRegenerated = useCallback((id: string, updated: Partial<RelayBlockConfigDetail>) => {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    size="sm"
                    onClick={handleGenerateAll}
                    disabled={generatingAll}
                >
                    {generatingAll ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                    ) : (
                        <><Sparkles className="mr-2 h-4 w-4" />Generate All Missing</>
                    )}
                </Button>

                {!showClearConfirm ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClearConfirm(true)}
                        disabled={configs.length === 0}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Configs
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-1.5">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-700">Delete all {configs.length} configs?</span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleClearAll}
                            disabled={clearingAll}
                            className="h-7"
                        >
                            {clearingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowClearConfirm(false)}
                            className="h-7"
                        >
                            Cancel
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    variant={activeFilter === 'All' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter('All')}
                >
                    All ({configs.length})
                </Button>
                {uniqueBlockTypes.map(type => (
                    <Button
                        key={type}
                        variant={activeFilter === type ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveFilter(type)}
                    >
                        {type} ({configs.filter(c => c.blockType === type).length})
                    </Button>
                ))}
            </div>

            {filteredConfigs.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Block Configs Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            Block configs are auto-generated when modules are created, or use "Generate All Missing" above.
                        </p>
                        <Button asChild>
                            <Link href="/admin/modules/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Modules
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredConfigs.map(config => (
                        <ConfigCard
                            key={config.id}
                            config={config}
                            onUpdate={handleConfigUpdate}
                            onDelete={handleConfigDelete}
                            onRegenerated={handleConfigRegenerated}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface ConfigCardProps {
    config: RelayBlockConfigDetail;
    onUpdate: (id: string, updated: RelayBlockConfigDetail) => void;
    onDelete: (id: string) => void;
    onRegenerated: (id: string, updated: Partial<RelayBlockConfigDetail>) => void;
}

function ConfigCard({ config, onUpdate, onDelete, onRegenerated }: ConfigCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState(config);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [regenerating, setRegenerating] = useState(false);

    const previewBlock = useMemo(() => buildPreviewBlock(draft), [draft.blockType, draft.blockTypeTemplate]);

    const updateDraft = useCallback(<K extends keyof RelayBlockConfigDetail>(
        key: K,
        value: RelayBlockConfigDetail[K]
    ) => {
        setDraft(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateDataSchema = useCallback((
        key: string,
        value: string | number | string[]
    ) => {
        setDraft(prev => ({
            ...prev,
            dataSchema: { ...prev.dataSchema, [key]: value },
        }));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const { id, ...updates } = draft;
        const result = await updateRelayBlockConfigAction(id, updates);
        if (result.success) {
            toast.success('Block config saved');
            onUpdate(config.id, draft);
        } else {
            toast.error(result.error || 'Failed to save');
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete block config "${config.label}"? This cannot be undone.`)) return;
        setDeleting(true);
        const result = await deleteRelayBlockConfigAction(config.id);
        if (result.success) {
            toast.success('Block config deleted');
            onDelete(config.id);
        } else {
            toast.error(result.error || 'Failed to delete');
        }
        setDeleting(false);
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        try {
            const result = await regenerateBlockTemplateAction(config.id);
            if (result.success) {
                toast.success('Template regenerated');
                window.location.reload();
            } else {
                toast.error(result.error || 'Regeneration failed');
            }
        } catch {
            toast.error('Regeneration failed');
        } finally {
            setRegenerating(false);
        }
    };

    const isAiGenerated = config.blockTypeTemplate?.generatedBy === 'gemini';
    const subcategory = config.blockTypeTemplate?.subcategory;

    return (
        <Card className="border border-[#e5e5e5]">
            <button
                type="button"
                className="w-full text-left px-5 py-4 flex items-center gap-3"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen
                    ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                }
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${getBlockTypeColor(config.blockType)}`}>
                    {config.blockType}
                </span>
                <span className="font-medium truncate">{config.label}</span>
                {config.moduleSlug && (
                    <Badge variant="outline" className="text-xs shrink-0 hidden sm:inline-flex">
                        {config.moduleSlug}
                    </Badge>
                )}
                {subcategory && (
                    <Badge variant="outline" className="text-xs shrink-0 hidden md:inline-flex bg-[#f5f5f5]">
                        {subcategory}
                    </Badge>
                )}
                {isAiGenerated && (
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className="ml-auto shrink-0">
                    <Badge
                        variant={config.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                    >
                        {config.status}
                    </Badge>
                </span>
            </button>

            {isOpen && (
                <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-5" />
                    <div className="grid gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3 space-y-4">
                            {config.blockTypeTemplate && (
                                <div className="rounded-lg border border-[#e5e5e5] bg-[#f5f5f5] p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        {isAiGenerated && <Sparkles className="h-4 w-4 text-amber-500" />}
                                        <span>AI-Generated Template</span>
                                        {config.blockTypeTemplate.generatedAt && (
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {new Date(config.blockTypeTemplate.generatedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {config.dataSchema?.displayTemplate && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Display Template</p>
                                            <pre className="text-xs font-mono bg-white rounded p-2 border border-[#e5e5e5] whitespace-pre-wrap">
                                                {config.dataSchema.displayTemplate}
                                            </pre>
                                        </div>
                                    )}

                                    {config.blockTypeTemplate.sampleData && Object.keys(config.blockTypeTemplate.sampleData).length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Sample Data</p>
                                            <div className="bg-white rounded border border-[#e5e5e5] divide-y divide-[#e5e5e5]">
                                                {Object.entries(config.blockTypeTemplate.sampleData).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between px-3 py-1.5 text-xs">
                                                        <span className="font-mono text-muted-foreground">{key}</span>
                                                        <span className="text-right truncate ml-4">{String(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span>Source: {config.blockTypeTemplate.generatedBy}</span>
                                        {config.blockTypeTemplate.subcategory && (
                                            <span>| Subcategory: {config.blockTypeTemplate.subcategory}</span>
                                        )}
                                        {config.blockTypeTemplate.isDefault && (
                                            <Badge variant="outline" className="text-xs py-0">fallback</Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label>Block Type</Label>
                                <Select
                                    value={draft.blockType}
                                    onValueChange={v => updateDraft('blockType', v)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BLOCK_TYPES.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Label</Label>
                                <Input
                                    className="mt-1"
                                    value={draft.label}
                                    onChange={e => updateDraft('label', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    className="mt-1"
                                    rows={2}
                                    value={draft.description || ''}
                                    onChange={e => updateDraft('description', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Display Template</Label>
                                <Textarea
                                    className="mt-1 font-mono text-xs"
                                    rows={2}
                                    placeholder="{{name}} — {{price}} per night"
                                    value={draft.dataSchema?.displayTemplate || ''}
                                    onChange={e => updateDataSchema('displayTemplate', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Max Items</Label>
                                    <Input
                                        className="mt-1"
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={draft.dataSchema?.maxItems ?? ''}
                                        onChange={e => updateDataSchema('maxItems', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={draft.status}
                                        onValueChange={v => updateDraft('status', v)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">active</SelectItem>
                                            <SelectItem value="inactive">inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Source Fields</Label>
                                <Input
                                    className="mt-1"
                                    placeholder="name, price, description"
                                    value={(draft.dataSchema?.sourceFields || []).join(', ')}
                                    onChange={e =>
                                        updateDataSchema(
                                            'sourceFields',
                                            e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                        )
                                    }
                                />
                                <p className="text-xs text-muted-foreground mt-1">Comma-separated field names</p>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button onClick={handleSave} disabled={saving} size="sm">
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRegenerate}
                                    disabled={regenerating || !config.moduleId}
                                >
                                    {regenerating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Regenerating...</>
                                    ) : (
                                        <><RefreshCw className="mr-2 h-4 w-4" />Regenerate Template</>
                                    )}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <Label className="mb-2 block">Live Preview</Label>
                            <div className="max-w-[360px] mx-auto bg-[#FAFAF6] rounded-2xl p-4 shadow-inner border border-gray-100">
                                <BlockRenderer block={previewBlock} theme={DEFAULT_THEME} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
