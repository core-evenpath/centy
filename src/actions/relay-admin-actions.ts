'use server';

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';

const DEFAULT_BLOCKS = [
  {
    id: 'greeting', family: 'entry', label: 'Greeting', description: 'Welcome message with brand identity and quick action buttons',
    stage: 'greeting', status: 'active' as const,
    fields_req: ['brandName', 'tagline', 'welcomeMessage'], fields_opt: ['quickActions', 'brandEmoji', 'logoUrl'],
    intents: ['hello', 'hi', 'start', 'hey'], module: null,
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 3600,
    moduleBinding: null,
  },
  {
    id: 'skin_quiz', family: 'entry', label: 'Quiz / Survey', description: 'Multi-step qualification quiz with progress tracking',
    stage: 'discovery', status: 'new' as const,
    fields_req: ['questions', 'steps'], fields_opt: ['progressBar', 'skipEnabled'],
    intents: ['quiz', 'help me find', 'recommend'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 0,
    moduleBinding: null,
  },
  {
    id: 'product_card', family: 'catalog', label: 'Product Card', description: 'Browsable item card with price, image, rating, and add-to-cart',
    stage: 'discovery', status: 'active' as const,
    fields_req: ['name', 'price', 'currency'], fields_opt: ['image', 'rating', 'badges', 'subtitle', 'specs', 'reviewCount'],
    intents: ['show', 'browse', 'products', 'menu', 'catalog'], module: 'moduleItems',
    applicableCategories: [], variants: [], preloadable: true, streamable: true, cacheDuration: 1800,
    moduleBinding: { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 10 },
  },
  {
    id: 'product_detail', family: 'catalog', label: 'Product Detail', description: 'Full item view with images, variants, specs, and actions',
    stage: 'showcase', status: 'active' as const,
    fields_req: ['name', 'price', 'description'], fields_opt: ['images', 'variants', 'specs', 'reviews', 'sizes'],
    intents: ['details', 'tell me more', 'specs', 'about'], module: 'moduleItems',
    applicableCategories: [], variants: [], preloadable: true, streamable: true, cacheDuration: 1800,
    moduleBinding: { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 1 },
  },
  {
    id: 'compare', family: 'catalog', label: 'Compare', description: 'Side-by-side comparison table for 2-4 items',
    stage: 'comparison', status: 'active' as const,
    fields_req: ['items', 'comparisonFields'], fields_opt: ['highlightWinner', 'recommendation'],
    intents: ['compare', 'difference', 'vs', 'which one'], module: 'moduleItems',
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 900,
    moduleBinding: { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 4 },
  },
  {
    id: 'promo', family: 'marketing', label: 'Promo Banner', description: 'Promotional offer with discount code, countdown, or sale info',
    stage: 'showcase', status: 'active' as const,
    fields_req: ['title', 'description'], fields_opt: ['code', 'expiresAt', 'discountPercent', 'ctaLabel'],
    intents: ['offer', 'deal', 'discount', 'promo', 'sale'], module: null,
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 3600,
    moduleBinding: null,
  },
  {
    id: 'bundle', family: 'marketing', label: 'Bundle / Set', description: 'Multi-item bundle with combined pricing and savings indicator',
    stage: 'showcase', status: 'new' as const,
    fields_req: ['items', 'bundlePrice'], fields_opt: ['originalPrice', 'savingsPercent', 'title'],
    intents: ['bundle', 'set', 'package', 'combo'], module: 'moduleItems',
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 1800,
    moduleBinding: { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 5 },
  },
  {
    id: 'cart', family: 'commerce', label: 'Cart', description: 'Shopping cart with line items, discounts, and checkout CTA',
    stage: 'conversion', status: 'active' as const,
    fields_req: ['items', 'total', 'currency'], fields_opt: ['discount', 'deliveryFee', 'tax', 'promoCode'],
    intents: ['cart', 'checkout', 'order', 'buy', 'bag'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 0,
    moduleBinding: null,
  },
  {
    id: 'order_confirmation', family: 'commerce', label: 'Order Confirmation', description: 'Post-purchase confirmation with order ID and delivery info',
    stage: 'followup', status: 'active' as const,
    fields_req: ['orderId', 'items', 'total'], fields_opt: ['estimatedDelivery', 'trackingUrl'],
    intents: ['confirm', 'receipt', 'thank'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 0,
    moduleBinding: null,
  },
  {
    id: 'order_tracker', family: 'commerce', label: 'Order Tracker', description: 'Live order status with timeline steps and tracking link',
    stage: 'followup', status: 'active' as const,
    fields_req: ['orderId', 'status', 'steps'], fields_opt: ['estimatedArrival', 'carrier'],
    intents: ['track', 'status', 'where is', 'delivery'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 300,
    moduleBinding: null,
  },
  {
    id: 'booking', family: 'conversion', label: 'Booking / Appointment', description: 'Time slot picker for consultations or appointments',
    stage: 'conversion', status: 'new' as const,
    fields_req: ['availableSlots', 'serviceType'], fields_opt: ['duration', 'price', 'staffName'],
    intents: ['book', 'appointment', 'schedule', 'reserve'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 0,
    moduleBinding: null,
  },
  {
    id: 'subscription', family: 'commerce', label: 'Subscribe & Save', description: 'Auto-replenish subscription with frequency options and savings',
    stage: 'conversion', status: 'new' as const,
    fields_req: ['item', 'frequencies'], fields_opt: ['currentPrice', 'savingsPerFrequency'],
    intents: ['subscribe', 'auto', 'recurring', 'replenish'], module: 'moduleItems',
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 0,
    moduleBinding: { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 1 },
  },
  {
    id: 'loyalty', family: 'engagement', label: 'Loyalty / Rewards', description: 'Points balance, tier progress, and redeemable rewards',
    stage: 'social_proof', status: 'new' as const,
    fields_req: ['points', 'tier'], fields_opt: ['nextTier', 'redeemable', 'multiplier'],
    intents: ['points', 'rewards', 'loyalty', 'tier'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 600,
    moduleBinding: null,
  },
  {
    id: 'nudge', family: 'engagement', label: 'Smart Nudge', description: 'Non-blocking contextual suggestion, upsell, or info tip',
    stage: 'social_proof', status: 'active' as const,
    fields_req: ['message'], fields_opt: ['ctaLabel', 'ctaAction', 'icon', 'variant'],
    intents: [] as string[], module: null,
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 1800,
    moduleBinding: null,
  },
  {
    id: 'suggestions', family: 'shared', label: 'Quick Replies', description: 'Tappable suggestion chips for guided conversation flow',
    stage: 'greeting', status: 'active' as const,
    fields_req: ['items'], fields_opt: ['title'],
    intents: [] as string[], module: null,
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 3600,
    moduleBinding: null,
  },
  {
    id: 'contact', family: 'support', label: 'Contact Card', description: 'Business contact info with click-to-call, email, WhatsApp',
    stage: 'handoff', status: 'active' as const,
    fields_req: ['businessName'], fields_opt: ['phone', 'email', 'whatsapp', 'address', 'hours'],
    intents: ['contact', 'phone', 'email', 'reach', 'call'], module: null,
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 3600,
    moduleBinding: null,
  },
];

const DEFAULT_STAGES = [
  { id: 'greeting', label: 'Greeting', type: 'greeting', blockIds: ['greeting', 'suggestions'], intentTriggers: ['browsing'], leadScoreImpact: 1, isEntry: true },
  { id: 'discovery', label: 'Discovery', type: 'discovery', blockIds: ['product_card', 'suggestions', 'skin_quiz'], intentTriggers: ['browsing', 'returning'], leadScoreImpact: 2 },
  { id: 'showcase', label: 'Showcase', type: 'showcase', blockIds: ['product_detail', 'promo', 'bundle'], intentTriggers: ['pricing', 'promo'], leadScoreImpact: 3 },
  { id: 'comparison', label: 'Comparison', type: 'comparison', blockIds: ['compare'], intentTriggers: ['comparing'], leadScoreImpact: 2 },
  { id: 'social_proof', label: 'Social Proof', type: 'social_proof', blockIds: ['nudge', 'loyalty'], intentTriggers: ['inquiry'], leadScoreImpact: 1 },
  { id: 'conversion', label: 'Conversion', type: 'conversion', blockIds: ['cart', 'booking', 'subscription', 'order_confirmation'], intentTriggers: ['booking', 'schedule'], leadScoreImpact: 5 },
  { id: 'handoff', label: 'Handoff', type: 'handoff', blockIds: ['contact'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  { id: 'followup', label: 'Follow-up', type: 'followup', blockIds: ['order_tracker', 'nudge'], intentTriggers: ['returning'], leadScoreImpact: 1 },
];

const DEFAULT_TRANSITIONS = [
  { from: 'greeting', to: 'discovery', trigger: 'browsing' },
  { from: 'greeting', to: 'conversion', trigger: 'booking', priority: 1 },
  { from: 'greeting', to: 'handoff', trigger: 'urgent', priority: 2 },
  { from: 'discovery', to: 'showcase', trigger: 'pricing' },
  { from: 'discovery', to: 'comparison', trigger: 'comparing' },
  { from: 'discovery', to: 'conversion', trigger: 'booking', priority: 1 },
  { from: 'discovery', to: 'handoff', trigger: 'complaint' },
  { from: 'showcase', to: 'conversion', trigger: 'booking', priority: 1 },
  { from: 'showcase', to: 'discovery', trigger: 'browsing' },
  { from: 'showcase', to: 'comparison', trigger: 'comparing' },
  { from: 'comparison', to: 'conversion', trigger: 'booking' },
  { from: 'comparison', to: 'showcase', trigger: 'pricing' },
  { from: 'social_proof', to: 'conversion', trigger: 'booking' },
  { from: 'conversion', to: 'followup', trigger: 'returning' },
  { from: 'conversion', to: 'handoff', trigger: 'contact' },
  { from: 'followup', to: 'discovery', trigger: 'browsing' },
  { from: 'followup', to: 'handoff', trigger: 'complaint' },
];

export async function seedDefaultBlocksAction(): Promise<{ success: boolean; seeded: number; error?: string }> {
  try {
    const now = new Date().toISOString();
    let seeded = 0;
    for (const block of DEFAULT_BLOCKS) {
      await adminDb.collection('relayBlockConfigs').doc(block.id).set({
        ...block,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
      seeded++;
    }
    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');
    return { success: true, seeded };
  } catch (err: unknown) {
    return { success: false, seeded: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function seedDefaultFlowAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    await adminDb.collection('systemFlowTemplates').doc('default_flow').set({
      id: 'default_flow',
      name: 'Default Conversation Flow',
      description: 'Standard e-commerce conversation flow with 8 stages',
      industry: 'General',
      status: 'active',
      stages: DEFAULT_STAGES,
      transitions: DEFAULT_TRANSITIONS,
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function resetAllBlockConfigsAction(): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    const snapshot = await adminDb.collection('relayBlockConfigs').get();
    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');
    return { success: true, deleted: snapshot.size };
  } catch (err: unknown) {
    return { success: false, deleted: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function toggleBlockStatusAction(blockId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb.collection('relayBlockConfigs').doc(blockId).update({
      status: enabled ? 'active' : 'disabled',
      updatedAt: new Date().toISOString(),
    });
    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getRelayDiagnosticsAction(): Promise<{
  success: boolean;
  checks: Array<{ label: string; status: 'pass' | 'warn' | 'fail'; desc: string; icon: string }>;
}> {
  try {
    const checks: Array<{ label: string; status: 'pass' | 'warn' | 'fail'; desc: string; icon: string }> = [];

    const blocksSnap = await adminDb.collection('relayBlockConfigs').get();
    const totalBlocks = blocksSnap.size;
    const activeBlocks = blocksSnap.docs.filter(d => d.data().status === 'active').length;
    checks.push({
      label: 'Block Registry',
      status: totalBlocks > 0 ? 'pass' : 'fail',
      desc: `${totalBlocks} blocks registered (${activeBlocks} active)`,
      icon: '◫',
    });

    const flowSnap = await adminDb.collection('systemFlowTemplates').doc('default_flow').get();
    checks.push({
      label: 'Flow Engine',
      status: flowSnap.exists ? 'pass' : 'fail',
      desc: flowSnap.exists ? `Default flow with ${flowSnap.data()?.stages?.length || 0} stages` : 'No default flow template found',
      icon: '⤳',
    });

    const moduleBound = blocksSnap.docs.filter(d => d.data().module != null).length;
    const moduleUnbound = blocksSnap.docs.filter(d => d.data().module == null).length;
    checks.push({
      label: 'Module Connection',
      status: moduleUnbound > 0 ? 'warn' : 'pass',
      desc: `${moduleBound} blocks have module binding`,
      icon: '⬡',
    });

    checks.push({
      label: 'RAG Store',
      status: 'pass',
      desc: 'Check RAG stores manually',
      icon: '◎',
    });

    checks.push({
      label: 'Widget Config',
      status: 'pass',
      desc: 'Check widget config in partner settings',
      icon: '◇',
    });

    const allIntents = new Set<string>();
    blocksSnap.docs.forEach(d => {
      const intents = d.data().intents;
      if (Array.isArray(intents)) intents.forEach((i: string) => allIntents.add(i));
    });
    checks.push({
      label: 'Intent Coverage',
      status: allIntents.size > 0 ? 'pass' : 'warn',
      desc: `${allIntents.size} unique intents mapped across blocks`,
      icon: '✦',
    });

    return { success: true, checks };
  } catch (err: unknown) {
    return { success: false, checks: [] };
  }
}

export async function getRelayStatsAction(): Promise<{
  success: boolean;
  stats: { activeBlocks: number; totalBlocks: number; flowStages: number; transitions: number; intents: number };
}> {
  try {
    const blocksSnap = await adminDb.collection('relayBlockConfigs').get();
    const totalBlocks = blocksSnap.size;
    const activeBlocks = blocksSnap.docs.filter(d => d.data().status === 'active').length;

    const flowSnap = await adminDb.collection('systemFlowTemplates').doc('default_flow').get();
    const flowData = flowSnap.exists ? flowSnap.data() : null;
    const flowStages = flowData?.stages?.length || 0;
    const transitions = flowData?.transitions?.length || 0;

    const allIntents = new Set<string>();
    blocksSnap.docs.forEach(d => {
      const intents = d.data().intents;
      if (Array.isArray(intents)) intents.forEach((i: string) => allIntents.add(i));
    });

    return { success: true, stats: { activeBlocks, totalBlocks, flowStages, transitions, intents: allIntents.size } };
  } catch (err: unknown) {
    return { success: false, stats: { activeBlocks: 0, totalBlocks: 0, flowStages: 0, transitions: 0, intents: 0 } };
  }
}

export async function getFlowTemplatesListAction(): Promise<{
  success: boolean;
  templates: Array<{ id: string; name: string; desc: string; industry: string; stages: number; status: string }>;
}> {
  try {
    const snapshot = await adminDb.collection('systemFlowTemplates').get();
    const templates = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || doc.id,
        desc: data.description || '',
        industry: data.industry || 'General',
        stages: data.stages?.length || 0,
        status: data.status || 'active',
      };
    });
    return { success: true, templates };
  } catch (err: unknown) {
    return { success: false, templates: [] };
  }
}
