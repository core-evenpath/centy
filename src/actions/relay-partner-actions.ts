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
      .slice(0, 30);

    const suffix = Math.random().toString(36).slice(2, 6);
    const widgetId = `${base}-${suffix}`;

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

    // Create default config
    const widgetIdResult = await generateRelayWidgetId(partnerId, partnerId);
    const widgetId = widgetIdResult.widgetId || `relay-${partnerId.slice(0, 8)}`;

    const now = new Date().toISOString();
    const defaultConfig: Omit<RelayConfig, 'id'> = {
      partnerId,
      enabled: false,
      widgetId,
      theme: DEFAULT_RELAY_THEME,
      brandName: 'My Business',
      welcomeMessage: 'Hello! How can I help you today?',
      intents: DEFAULT_RELAY_INTENTS,
      responseFormat: 'generative_ui',
      whatsappEnabled: false,
      callbackEnabled: false,
      directBookingEnabled: false,
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
    let query = db.collection(partnerConversationsPath(partnerId)).orderBy('lastMessageAt', 'desc');

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

export async function runRelayDiagnostics(
  partnerId: string
): Promise<{ success: boolean; diagnostics?: RelayDiagnostics; error?: string }> {
  const checks: RelayDiagnosticCheck[] = [];
  let widgetId = 'unknown';

  try {
    // Check 1: Config exists
    const configResult = await getRelayConfig(partnerId);
    const configCheck: RelayDiagnosticCheck = {
      id: 'config',
      name: 'Widget Configuration',
      description: 'Relay config document exists in Firestore',
      status: configResult.success && configResult.config ? 'pass' : 'fail',
      details: configResult.success && configResult.config
        ? `Widget ID: ${configResult.config.widgetId}`
        : 'No config found',
      fix: 'Enable Relay and save your configuration',
    };
    checks.push(configCheck);

    if (configResult.config) {
      widgetId = configResult.config.widgetId;
    }

    // Check 2: RAG store
    let ragCheck: RelayDiagnosticCheck;
    try {
      const storesSnapshot = await db
        .collection(`partners/${partnerId}/fileSearchStores`)
        .where('state', '==', 'ACTIVE')
        .limit(1)
        .get();

      ragCheck = {
        id: 'rag_store',
        name: 'Knowledge Base (RAG)',
        description: 'Active document search store exists',
        status: storesSnapshot.empty ? 'warn' : 'pass',
        details: storesSnapshot.empty
          ? 'No active RAG store found'
          : `Store: ${storesSnapshot.docs[0].data().name || 'Active'}`,
        fix: 'Upload documents to Core Memory to enable AI responses',
      };
    } catch {
      ragCheck = {
        id: 'rag_store',
        name: 'Knowledge Base (RAG)',
        description: 'Active document search store exists',
        status: 'fail',
        details: 'Could not check RAG store',
      };
    }
    checks.push(ragCheck);

    // Check 3: Vault document count
    let vaultCheck: RelayDiagnosticCheck;
    try {
      const vaultSnapshot = await db
        .collection(`partners/${partnerId}/vaultFiles`)
        .where('state', '==', 'ACTIVE')
        .limit(10)
        .get();

      const count = vaultSnapshot.size;
      vaultCheck = {
        id: 'vault_docs',
        name: 'Knowledge Documents',
        description: 'At least one document uploaded to vault',
        status: count === 0 ? 'warn' : count < 3 ? 'warn' : 'pass',
        details: `${count} active document${count !== 1 ? 's' : ''} found`,
        fix: count === 0
          ? 'Upload documents to Core Memory for AI-powered responses'
          : 'Consider uploading more documents for better AI coverage',
      };
    } catch {
      vaultCheck = {
        id: 'vault_docs',
        name: 'Knowledge Documents',
        description: 'At least one document uploaded to vault',
        status: 'warn',
        details: 'Could not check vault documents',
      };
    }
    checks.push(vaultCheck);

    // Check 4: Widget enabled
    const enabledCheck: RelayDiagnosticCheck = {
      id: 'widget_enabled',
      name: 'Widget Status',
      description: 'Relay widget is enabled',
      status: configResult.config?.enabled ? 'pass' : 'warn',
      details: configResult.config?.enabled ? 'Widget is active' : 'Widget is disabled',
      fix: 'Toggle the "Enable Relay" switch in Setup',
    };
    checks.push(enabledCheck);

    // Check 5: Brand configured
    const brandCheck: RelayDiagnosticCheck = {
      id: 'brand_config',
      name: 'Brand Configuration',
      description: 'Brand name and welcome message are set',
      status:
        configResult.config?.brandName &&
        configResult.config?.brandName !== 'My Business' &&
        configResult.config?.welcomeMessage
          ? 'pass'
          : 'warn',
      details: configResult.config?.brandName || 'Not configured',
      fix: 'Set your brand name and welcome message in Setup',
    };
    checks.push(brandCheck);

    // Overall status
    const hasFailure = checks.some(c => c.status === 'fail');
    const hasWarning = checks.some(c => c.status === 'warn');
    const overallStatus = hasFailure ? 'error' : hasWarning ? 'warning' : 'healthy';

    const diagnostics: RelayDiagnostics = {
      widgetId,
      partnerId,
      checks,
      lastCheckedAt: new Date().toISOString(),
      overallStatus,
    };

    return { success: true, diagnostics };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
