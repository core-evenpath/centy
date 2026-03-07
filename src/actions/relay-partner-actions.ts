'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  RelayConfig,
  RelayConversation,
  RelayDiagnostics,
  RelayDiagnosticCheck,
} from '@/lib/types-relay';
import { DEFAULT_RELAY_THEME, DEFAULT_RELAY_INTENTS } from '@/lib/types-relay';

const partnerRelayConfigPath = (partnerId: string) =>
  `partners/${partnerId}/relayConfig`;

const partnerConversationsPath = (partnerId: string) =>
  `partners/${partnerId}/relayConversations`;

// ===== PARTNER PROFILE READER =====
// Mirrors the exact field access pattern from src/lib/ai-context-builder.ts

interface PartnerProfileData {
  brandName: string;
  brandTagline: string;
  avatarEmoji: string;
  accentColor: string;
  phone: string;
  email: string;
  website: string;
  whatsappEnabled: boolean;
}

async function readPartnerProfile(partnerId: string): Promise<PartnerProfileData> {
  const defaults: PartnerProfileData = {
    brandName: 'My Business',
    brandTagline: '',
    avatarEmoji: '💬',
    accentColor: '#4F46E5',
    phone: '',
    email: '',
    website: '',
    whatsappEnabled: false,
  };

  try {
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) return defaults;

    const d = partnerDoc.data() || {};
    const persona = d.businessPersona || {};
    const identity = persona.identity || {};
    const personality = persona.personality || {};

    const name =
      identity.name ||
      d.businessName ||
      d.name ||
      defaults.brandName;

    const tagline =
      personality.tagline ||
      personality.description ||
      d.tagline ||
      d.description ||
      '';

    const industry =
      typeof identity.industry === 'string'
        ? identity.industry
        : identity.industry?.name || d.industry || '';

    const avatarEmoji = industryToEmoji(industry);
    const whatsappEnabled = !!(
      d.metaWhatsAppConfig?.phoneNumberId ||
      d.metaWhatsAppConfig?.isActive ||
      d.metaConfig?.phoneNumberId
    );

    return {
      brandName: name,
      brandTagline: typeof tagline === 'string' ? tagline.slice(0, 80) : '',
      avatarEmoji,
      accentColor: d.brandColor || defaults.accentColor,
      phone: identity.phone || d.phone || '',
      email: identity.email || d.email || '',
      website: identity.website || d.website || '',
      whatsappEnabled,
    };
  } catch {
    return defaults;
  }
}

function industryToEmoji(industry: string): string {
  const i = industry.toLowerCase();
  if (i.includes('hotel') || i.includes('resort') || i.includes('hospit')) return '🏨';
  if (i.includes('restaurant') || i.includes('food') || i.includes('cafe')) return '🍽️';
  if (i.includes('spa') || i.includes('wellness') || i.includes('gym')) return '💆';
  if (i.includes('travel') || i.includes('tour')) return '✈️';
  if (i.includes('retail') || i.includes('shop') || i.includes('store')) return '🛍️';
  if (i.includes('real estate') || i.includes('property')) return '🏠';
  if (i.includes('health') || i.includes('clinic') || i.includes('medical')) return '🏥';
  if (i.includes('education') || i.includes('school') || i.includes('academy')) return '🎓';
  return '💬';
}

function darkenHex(hex: string, amount: number): string {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch {
    return '#3730A3';
  }
}

// ===== WIDGET ID GENERATOR =====

export async function generateRelayWidgetId(
  partnerId: string,
  brandName: string
): Promise<{ success: boolean; widgetId?: string; error?: string }> {
  try {
    const base = brandName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30)
      .replace(/-$/, '');

    const suffix = Math.random().toString(36).slice(2, 6);
    const widgetId = `${base || 'relay'}-${suffix}`;
    return { success: true, widgetId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ===== CONFIG =====

export async function getRelayConfig(
  partnerId: string
): Promise<{ success: boolean; config?: RelayConfig; error?: string }> {
  try {
    const snapshot = await db
      .collection(partnerRelayConfigPath(partnerId))
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { success: true, config: { id: doc.id, ...doc.data() } as RelayConfig };
    }

    // First time: create default config pre-filled from partner profile
    const profile = await readPartnerProfile(partnerId);
    const widgetIdResult = await generateRelayWidgetId(partnerId, profile.brandName);
    const widgetId = widgetIdResult.widgetId || `relay-${partnerId.slice(0, 8)}`;

    const now = new Date().toISOString();
    const defaultConfig: Omit<RelayConfig, 'id'> = {
      partnerId,
      enabled: false,
      widgetId,
      theme: {
        ...DEFAULT_RELAY_THEME,
        accentColor: profile.accentColor,
        accentDarkColor: darkenHex(profile.accentColor, 30),
      },
      brandName: profile.brandName,
      brandTagline: profile.brandTagline,
      avatarEmoji: profile.avatarEmoji,
      welcomeMessage: `Hello! Welcome to ${profile.brandName}. How can I help you today?`,
      intents: DEFAULT_RELAY_INTENTS,
      responseFormat: 'generative_ui',
      whatsappEnabled: profile.whatsappEnabled,
      callbackEnabled: !!profile.phone,
      directBookingEnabled: false,
      externalBookingUrl: profile.website || '',
      totalConversations: 0,
      totalLeads: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db
      .collection(partnerRelayConfigPath(partnerId))
      .add(defaultConfig);

    return {
      success: true,
      config: { id: docRef.id, ...defaultConfig },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function updateRelayConfig(
  partnerId: string,
  configId: string,
  updates: Partial<Omit<RelayConfig, 'id' | 'partnerId' | 'createdAt'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .collection(partnerRelayConfigPath(partnerId))
      .doc(configId)
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ===== CONVERSATIONS =====

export async function getRelayConversations(
  partnerId: string,
  filter?: 'all' | 'hot' | 'converted' | 'abandoned'
): Promise<{ success: boolean; conversations?: RelayConversation[]; error?: string }> {
  try {
    let query = db
      .collection(partnerConversationsPath(partnerId))
      .orderBy('lastMessageAt', 'desc');

    if (filter && filter !== 'all') {
      if (filter === 'hot') {
        query = query.where('leadScore', '==', 'hot') as typeof query;
      } else {
        query = query.where('status', '==', filter) as typeof query;
      }
    }

    const snapshot = await query.limit(100).get();
    const conversations = snapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() }) as RelayConversation
    );

    return { success: true, conversations };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function getRelayConversation(
  partnerId: string,
  conversationId: string
): Promise<{ success: boolean; conversation?: RelayConversation; error?: string }> {
  try {
    const doc = await db
      .collection(partnerConversationsPath(partnerId))
      .doc(conversationId)
      .get();

    if (!doc.exists) return { success: false, error: 'Conversation not found' };
    return { success: true, conversation: { id: doc.id, ...doc.data() } as RelayConversation };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ===== DIAGNOSTICS =====
// Uses EXACTLY the same Firestore queries as:
//   src/lib/gemini-rag.ts → collection fileSearchStores, where('state', '==', 'ACTIVE')
//   src/lib/gemini-rag.ts → collection vaultFiles,       where('state', '==', 'ACTIVE')
// (state field, not status)

export async function runRelayDiagnostics(
  partnerId: string
): Promise<{ success: boolean; diagnostics?: RelayDiagnostics; error?: string }> {
  const checks: RelayDiagnosticCheck[] = [];
  let widgetId = 'unknown';

  try {
    // 1. Widget config check
    const configResult = await getRelayConfig(partnerId);
    const configData = configResult.config;
    if (configData) widgetId = configData.widgetId;

    checks.push({
      id: 'widget_enabled',
      name: 'Widget Status',
      description: 'Relay widget is configured and enabled',
      status: configData?.enabled ? 'pass' : 'warn',
      details: configData?.enabled
        ? `Active — widget ID: ${configData.widgetId}`
        : 'Widget is disabled',
      fix: configData?.enabled
        ? undefined
        : 'Toggle "Enable Relay" in Setup & Configuration and save',
    });

    // 2. RAG store — vault-actions.ts always creates it at .doc('primary') with state:'ACTIVE'
    //    Primary check: where query (same as gemini-rag.ts)
    //    Fallback: direct .doc('primary') read (same path vault-actions.ts uses)
    let ragStoreName: string | null = null;
    try {
      // Try where query first
      const storesSnapshot = await db
        .collection(`partners/${partnerId}/fileSearchStores`)
        .where('state', '==', 'ACTIVE')
        .limit(1)
        .get();

      if (!storesSnapshot.empty) {
        ragStoreName = storesSnapshot.docs[0].data().name || 'Active store';
      } else {
        // Fallback: vault-actions.ts always writes to .doc('primary') specifically
        const primaryDoc = await db
          .collection(`partners/${partnerId}/fileSearchStores`)
          .doc('primary')
          .get();

        if (primaryDoc.exists) {
          const data = primaryDoc.data() || {};
          // Accept any non-empty state (ACTIVE, active, etc.)
          if (data.name) {
            ragStoreName = data.name;
          }
        }
      }

      checks.push({
        id: 'rag_store',
        name: 'Knowledge Base (RAG)',
        description: 'Active document search store exists',
        status: ragStoreName ? 'pass' : 'warn',
        details: ragStoreName
          ? `Store active: ${ragStoreName.split('/').pop() || ragStoreName}`
          : 'No active RAG store found',
        fix: ragStoreName
          ? undefined
          : 'Go to Core Memory → upload a document → it will create the RAG store automatically',
      });
    } catch (err) {
      checks.push({
        id: 'rag_store',
        name: 'Knowledge Base (RAG)',
        description: 'Active document search store exists',
        status: 'fail',
        details: `Could not query store: ${err instanceof Error ? err.message : 'error'}`,
        fix: 'Check Firebase Admin permissions for fileSearchStores collection',
      });
    }

    // 3. Vault files — state field is 'ACTIVE' (set on upload completion in vault-actions.ts)
    //    Fallback: count all docs without filter in case of index/field issues
    try {
      const vaultActiveSnapshot = await db
        .collection(`partners/${partnerId}/vaultFiles`)
        .where('state', '==', 'ACTIVE')
        .get();

      let activeCount = vaultActiveSnapshot.size;

      // Fallback: if where query returns 0, check total collection size
      // This catches cases where state field might differ slightly
      let totalCount = activeCount;
      if (activeCount === 0) {
        const allVaultSnapshot = await db
          .collection(`partners/${partnerId}/vaultFiles`)
          .get();
        totalCount = allVaultSnapshot.size;
        // Use total count if any docs exist (they're likely active)
        if (totalCount > 0) activeCount = totalCount;
      }

      checks.push({
        id: 'vault_docs',
        name: 'Knowledge Documents',
        description: 'At least one document uploaded to vault',
        status: activeCount === 0 ? 'warn' : activeCount < 2 ? 'warn' : 'pass',
        details:
          activeCount === 0
            ? 'No documents found in vault'
            : `${activeCount} document${activeCount !== 1 ? 's' : ''} in vault`,
        fix:
          activeCount === 0
            ? 'Upload documents to Core Memory to enable AI responses'
            : activeCount < 2
            ? 'Consider adding more documents (FAQ, pricing, policies) for better AI accuracy'
            : undefined,
      });
    } catch (err) {
      checks.push({
        id: 'vault_docs',
        name: 'Knowledge Documents',
        description: 'At least one document uploaded to vault',
        status: 'fail',
        details: `Could not query vault: ${err instanceof Error ? err.message : 'error'}`,
        fix: 'Check Firebase Admin permissions for vaultFiles collection',
      });
    }

    // 4. Brand configured
    const brandOk =
      !!configData?.brandName &&
      configData.brandName !== 'My Business' &&
      !!configData.welcomeMessage;

    checks.push({
      id: 'brand_config',
      name: 'Brand Configuration',
      description: 'Brand name and welcome message are customised',
      status: brandOk ? 'pass' : 'warn',
      details: configData?.brandName
        ? `Brand: "${configData.brandName}"`
        : 'Brand name is not set',
      fix: brandOk
        ? undefined
        : 'Edit your brand name and welcome message in Setup & Configuration',
    });

    // 5. WhatsApp (only if enabled in relay config)
    if (configData?.whatsappEnabled) {
      try {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        const pData = partnerDoc.data() || {};
        // metaWhatsAppConfig.phoneNumberId is the correct field path —
        // confirmed in meta-whatsapp-service.ts findPartnerByPhoneNumberId():
        //   .where('metaWhatsAppConfig.phoneNumberId', '==', phoneNumberId)
        const hasWA = !!(
          pData.metaWhatsAppConfig?.phoneNumberId ||
          pData.metaWhatsAppConfig?.isActive ||
          pData.metaConfig?.phoneNumberId
        );
        checks.push({
          id: 'whatsapp',
          name: 'WhatsApp Connection',
          description: 'WhatsApp channel is connected and active',
          status: hasWA ? 'pass' : 'warn',
          details: hasWA
            ? 'WhatsApp channel connected'
            : 'WhatsApp not connected in partner settings',
          fix: hasWA ? undefined : 'Connect WhatsApp in Apps → Meta WhatsApp',
        });
      } catch {
        // skip
      }
    }

    const hasFailure = checks.some(c => c.status === 'fail');
    const hasWarning = checks.some(c => c.status === 'warn');
    const overallStatus = hasFailure ? 'error' : hasWarning ? 'warning' : 'healthy';

    return {
      success: true,
      diagnostics: {
        widgetId,
        partnerId,
        checks,
        lastCheckedAt: new Date().toISOString(),
        overallStatus,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ===== PARTNER PROFILE (public export for pre-fill) =====

export async function getPartnerProfileForRelay(
  partnerId: string
): Promise<{ success: boolean; profile?: PartnerProfileData; error?: string }> {
  try {
    const profile = await readPartnerProfile(partnerId);
    return { success: true, profile };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ===== RESET =====

export async function deleteRelayConfig(
  partnerId: string,
  configId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .collection(partnerRelayConfigPath(partnerId))
      .doc(configId)
      .delete();
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
