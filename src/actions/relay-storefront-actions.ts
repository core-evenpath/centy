'use server';

import { db as adminDb } from '@/lib/firebase-admin';

export interface RelayModuleEntry {
  id: string;
  slug: string;
  name: string;
  description?: string;
  iconName: string;
  blockType: string;
  itemCount: number;
  category: string;
}

export interface RelayStorefrontData {
  brand: {
    name: string;
    tagline: string;
    accentColor: string;
    welcomeMessage: string;
    slug?: string;
  };
  modules: RelayModuleEntry[];
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    whatsapp?: string;
  };
  operatingHours?: {
    isOpen24x7?: boolean;
    appointmentOnly?: boolean;
    specialNote?: string;
  };
  usp: string[];
  flowDefinition?: {
    name: string;
    stages: Array<{ id: string; label: string; type: string }>;
  };
  hasRag: boolean;
  industryId?: string;
  functionId?: string;
}

export const MODULE_ICON_MAP: Record<string, string> = {
  catalog: 'ShoppingBag',
  products: 'Package',
  services: 'Wrench',
  menu: 'UtensilsCrossed',
  rooms: 'BedDouble',
  listings: 'List',
  activities: 'Activity',
  experiences: 'Compass',
  classes: 'GraduationCap',
  treatments: 'Heart',
  book: 'CalendarCheck',
  reserve: 'CalendarCheck',
  appointment: 'CalendarClock',
  inquiry: 'MessageSquarePlus',
  location: 'MapPin',
  contact: 'Phone',
  gallery: 'Image',
  info: 'Info',
  faq: 'HelpCircle',
  pricing: 'DollarSign',
  testimonials: 'Star',
  schedule: 'Clock',
  promo: 'Tag',
  lead_capture: 'UserPlus',
  handoff: 'Users',
  greeting: 'Hand',
  quick_actions: 'Zap',
};

export const CATEGORY_MAP: Record<string, string> = {
  catalog: 'Products',
  products: 'Products',
  menu: 'Products',
  rooms: 'Products',
  listings: 'Products',
  services: 'Services',
  activities: 'Services',
  experiences: 'Services',
  classes: 'Services',
  treatments: 'Services',
  info: 'Information',
  faq: 'Information',
  gallery: 'Information',
  testimonials: 'Information',
  location: 'Information',
  contact: 'Information',
  book: 'Actions',
  reserve: 'Actions',
  appointment: 'Actions',
  inquiry: 'Actions',
  pricing: 'Actions',
  schedule: 'Actions',
  promo: 'Actions',
  lead_capture: 'Actions',
  handoff: 'Actions',
  quick_actions: 'Actions',
};

export async function getRelayStorefrontDataAction(partnerId: string): Promise<{
  success: boolean;
  data?: RelayStorefrontData;
  error?: string;
}> {
  try {
    const [partnerDoc, modulesSnap, partnerBlocksSnap, relayConfigSnap, flowSnap, ragSnap] =
      await Promise.all([
        adminDb.collection('partners').doc(partnerId).get(),
        adminDb
          .collection(`partners/${partnerId}/businessModules`)
          .where('enabled', '==', true)
          .get(),
        adminDb
          .collection(`partners/${partnerId}/relayConfig/blocks`)
          .where('isVisible', '==', true)
          .orderBy('sortOrder', 'asc')
          .get(),
        adminDb.collection(`partners/${partnerId}/relayConfig`).doc('config').get(),
        adminDb.collection(`partners/${partnerId}/relayConfig`).doc('flowDefinition').get(),
        adminDb
          .collection(`partners/${partnerId}/vaultFiles`)
          .where('state', '==', 'ACTIVE')
          .limit(1)
          .get(),
      ]);

    const partnerData = partnerDoc.data();
    const persona = partnerData?.businessPersona;
    const identity = persona?.identity;
    const personality = persona?.personality;
    const relayConfig = relayConfigSnap.exists ? relayConfigSnap.data() : null;

    let modules: RelayModuleEntry[];

    if (!partnerBlocksSnap.empty) {
      modules = partnerBlocksSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          slug: data.moduleSlug || '',
          name: data.customLabel || data.label || '',
          description: data.customDescription || data.description,
          iconName: data.iconName || MODULE_ICON_MAP[data.blockType] || 'Layers',
          blockType: data.blockType || 'catalog',
          itemCount: 0,
          category: data.category || CATEGORY_MAP[data.blockType] || 'Information',
        };
      });
    } else {
      const blockConfigsSnap = await adminDb.collection('relayBlockConfigs').get();

      const blockConfigsBySlug = new Map<string, { blockType: string }>();
      const blockConfigsById = new Map<string, { blockType: string }>();
      blockConfigsSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.moduleSlug) {
          blockConfigsBySlug.set(data.moduleSlug, { blockType: data.blockType || 'catalog' });
        }
        blockConfigsById.set(doc.id, { blockType: data.blockType || 'catalog' });
      });

      modules = modulesSnap.docs.map((doc) => {
        const data = doc.data();
        const slug = data.moduleSlug || '';
        const blockConfig =
          blockConfigsBySlug.get(slug) || blockConfigsById.get(`module_${slug}`) || null;
        const blockType = blockConfig?.blockType || 'catalog';

        return {
          id: doc.id,
          slug,
          name: data.name || slug,
          description: data.description,
          iconName: MODULE_ICON_MAP[blockType] || 'Layers',
          blockType,
          itemCount: data.itemCount ?? 0,
          category: CATEGORY_MAP[blockType] || 'Information',
        };
      });
    }

    const address = identity?.address;
    const formattedAddress =
      address?.city && address?.state ? `${address.city}, ${address.state}` : undefined;

    const categories = identity?.businessCategories || [];
    const firstCategory = categories[0];

    const brand = {
      name: identity?.name || relayConfig?.brandName || '',
      tagline: personality?.tagline || relayConfig?.tagline || '',
      accentColor: relayConfig?.accentColor || '#6366f1',
      welcomeMessage: relayConfig?.welcomeMessage || '',
      slug: relayConfig?.relaySlug,
    };

    const contactInfo = {
      phone: identity?.phone || undefined,
      email: identity?.email || undefined,
      website: identity?.website || undefined,
      address: formattedAddress,
      whatsapp: partnerData?.metaWhatsAppConfig?.displayPhoneNumber || undefined,
    };

    const hours = identity?.operatingHours;
    const operatingHours = hours
      ? {
          isOpen24x7: hours.isOpen24x7 || undefined,
          appointmentOnly: hours.appointmentOnly || undefined,
          specialNote: hours.specialNote || undefined,
        }
      : undefined;

    const usp: string[] = personality?.uniqueSellingPoints || [];

    let flowDefinition: RelayStorefrontData['flowDefinition'] = undefined;
    if (flowSnap.exists) {
      const flowData = flowSnap.data();
      if (flowData?.name && Array.isArray(flowData?.stages)) {
        flowDefinition = {
          name: flowData.name,
          stages: flowData.stages.map((s: { id: string; label: string; type: string }) => ({
            id: s.id,
            label: s.label,
            type: s.type,
          })),
        };
      }
    }

    return {
      success: true,
      data: {
        brand,
        modules,
        contact: contactInfo,
        operatingHours,
        usp,
        flowDefinition,
        hasRag: !ragSnap.empty,
        industryId: firstCategory?.industryId,
        functionId: firstCategory?.functionId,
      },
    };
  } catch (error) {
    console.error('Failed to fetch relay storefront data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch relay storefront data',
    };
  }
}
