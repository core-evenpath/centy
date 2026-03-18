'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { RelayConfig, RelayConversation, RelayDiagnostics, RelayDiagnosticCheck } from '@/lib/types-relay';
import { DEFAULT_RELAY_THEME, DEFAULT_RELAY_INTENTS } from '@/lib/types-relay';

// ============================================================================
// WIDGET ID GENERATION
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
}

function randomSuffix(len = 4): string {
  return Math.random().toString(36).substring(2, 2 + len);
}

export async function generateRelayWidgetId(
  partnerId: string,
  brandName: string
): Promise<{ success: boolean; widgetId?: string; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  const base = slugify(brandName || partnerId);
  let attempts = 0;

  while (attempts < 5) {
    const candidate = `${base}-${randomSuffix()}`;

    // Check uniqueness across all relayConfig sub-collections
    const snapshot = await db
      .collectionGroup('relayConfig')
      .where('widgetId', '==', candidate)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: true, widgetId: candidate };
    }
    attempts++;
  }

  // Fallback: use partnerId prefix
  return { success: true, widgetId: `${slugify(partnerId)}-${randomSuffix(6)}` };
}

// ============================================================================
// GET RELAY CONFIG
// ============================================================================

export async function getRelayConfig(
  partnerId: string
): Promise<{ success: boolean; config?: RelayConfig; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    const snapshot = await db
      .collection(`partners/${partnerId}/relayConfig`)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { success: true, config: { id: doc.id, ...doc.data() } as RelayConfig };
    }

    // Create default config
    const widgetResult = await generateRelayWidgetId(partnerId, partnerId);
    const widgetId = widgetResult.widgetId || `relay-${randomSuffix(8)}`;

    const now = new Date().toISOString();
    const defaultConfig: Omit<RelayConfig, 'id'> = {
      partnerId,
      enabled: false,
      widgetId,
      theme: DEFAULT_RELAY_THEME,
      brandName: '',
      welcomeMessage: 'Hi! How can I help you today?',
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

    const docRef = await db.collection(`partners/${partnerId}/relayConfig`).add(defaultConfig);
    return { success: true, config: { id: docRef.id, ...defaultConfig } };
  } catch (error) {
    console.error('getRelayConfig error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
  }
}

// ============================================================================
// UPDATE RELAY CONFIG
// ============================================================================

export async function updateRelayConfig(
  partnerId: string,
  configId: string,
  updates: Partial<Omit<RelayConfig, 'id' | 'createdAt'>>
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    await db.collection(`partners/${partnerId}/relayConfig`).doc(configId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('updateRelayConfig error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
  }
}

// ============================================================================
// RESET RELAY CONFIG
// ============================================================================

export async function resetRelayConfig(
  partnerId: string
): Promise<{ success: boolean; config?: RelayConfig; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    // Delete all existing relay config docs for this partner
    const snapshot = await db
      .collection(`partners/${partnerId}/relayConfig`)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    // Create a fresh default config
    const widgetResult = await generateRelayWidgetId(partnerId, partnerId);
    const widgetId = widgetResult.widgetId || `relay-${randomSuffix(8)}`;

    const now = new Date().toISOString();
    const defaultConfig: Omit<RelayConfig, 'id'> = {
      partnerId,
      enabled: false,
      widgetId,
      theme: DEFAULT_RELAY_THEME,
      brandName: '',
      welcomeMessage: 'Hi! How can I help you today?',
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

    const docRef = await db.collection(`partners/${partnerId}/relayConfig`).add(defaultConfig);
    return { success: true, config: { id: docRef.id, ...defaultConfig } };
  } catch (error) {
    console.error('resetRelayConfig error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Reset failed' };
  }
}

// ============================================================================
// GET RELAY CONVERSATIONS
// ============================================================================

export async function getRelayConversations(
  partnerId: string,
  filter?: { status?: string; leadScore?: string }
): Promise<{ success: boolean; conversations?: RelayConversation[]; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    let query: FirebaseFirestore.Query = db
      .collection(`partners/${partnerId}/relayConversations`)
      .orderBy('lastMessageAt', 'desc')
      .limit(50);

    if (filter?.status) {
      query = db
        .collection(`partners/${partnerId}/relayConversations`)
        .where('status', '==', filter.status)
        .orderBy('lastMessageAt', 'desc')
        .limit(50);
    } else if (filter?.leadScore) {
      query = db
        .collection(`partners/${partnerId}/relayConversations`)
        .where('leadScore', '==', filter.leadScore)
        .orderBy('lastMessageAt', 'desc')
        .limit(50);
    }

    const snapshot = await query.get();
    const conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as RelayConversation));

    return { success: true, conversations };
  } catch (error) {
    console.error('getRelayConversations error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
  }
}

export async function getRelayConversation(
  partnerId: string,
  conversationId: string
): Promise<{ success: boolean; conversation?: RelayConversation; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    const doc = await db
      .collection(`partners/${partnerId}/relayConversations`)
      .doc(conversationId)
      .get();

    if (!doc.exists) return { success: false, error: 'Conversation not found' };
    return { success: true, conversation: { id: doc.id, ...doc.data() } as RelayConversation };
  } catch (error) {
    console.error('getRelayConversation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
  }
}

// ============================================================================
// RUN RELAY DIAGNOSTICS
// ============================================================================

export async function runRelayDiagnostics(
  partnerId: string
): Promise<{ success: boolean; diagnostics?: RelayDiagnostics; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  const checks: RelayDiagnosticCheck[] = [];

  // 1. RAG store status
  try {
    const ragSnapshot = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .where('state', '==', 'ACTIVE')
      .limit(1)
      .get();

    checks.push({
      id: 'rag_store',
      name: 'RAG Store',
      description: 'Active AI knowledge store for answering questions',
      status: ragSnapshot.empty ? 'fail' : 'pass',
      details: ragSnapshot.empty
        ? 'No active RAG store found'
        : `Active store: ${ragSnapshot.docs[0].data().name}`,
      fix: ragSnapshot.empty
        ? 'Upload documents in Core Memory to create a knowledge store'
        : undefined,
    });
  } catch {
    checks.push({
      id: 'rag_store',
      name: 'RAG Store',
      description: 'Active AI knowledge store',
      status: 'fail',
      details: 'Could not check RAG store',
    });
  }

  // 2. Vault document count
  try {
    const vaultSnapshot = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .where('state', '==', 'ACTIVE')
      .get();

    const count = vaultSnapshot.size;
    checks.push({
      id: 'vault_docs',
      name: 'Knowledge Documents',
      description: 'Uploaded documents for AI to answer from',
      status: count === 0 ? 'fail' : count < 3 ? 'warn' : 'pass',
      details: `${count} active document${count !== 1 ? 's' : ''} in vault`,
      fix: count === 0 ? 'Upload at least one document in Core Memory' : undefined,
    });
  } catch {
    checks.push({
      id: 'vault_docs',
      name: 'Knowledge Documents',
      description: 'Uploaded documents',
      status: 'warn',
      details: 'Could not count documents',
    });
  }

  // 3. Module data availability
  try {
    const modulesSnapshot = await db
      .collection(`partners/${partnerId}/modules`)
      .where('enabled', '==', true)
      .get();

    const count = modulesSnapshot.size;
    checks.push({
      id: 'modules',
      name: 'Module Data',
      description: 'Enabled modules with business data',
      status: count === 0 ? 'warn' : 'pass',
      details: `${count} enabled module${count !== 1 ? 's' : ''}`,
      fix: count === 0 ? 'Enable modules with data in the Modules section' : undefined,
    });
  } catch {
    checks.push({
      id: 'modules',
      name: 'Module Data',
      description: 'Enabled modules',
      status: 'warn',
      details: 'Could not check modules',
    });
  }

  // 4. Relay config completeness
  try {
    const configSnapshot = await db
      .collection(`partners/${partnerId}/relayConfig`)
      .limit(1)
      .get();

    if (configSnapshot.empty) {
      checks.push({
        id: 'config',
        name: 'Widget Configuration',
        description: 'Widget brand and settings',
        status: 'warn',
        details: 'No relay config found — will use defaults',
      });
    } else {
      const configData = configSnapshot.docs[0].data();
      const hasBrand = !!(configData.brandName && configData.brandName.trim());
      const hasWelcome = !!(configData.welcomeMessage && configData.welcomeMessage.trim());

      checks.push({
        id: 'config',
        name: 'Widget Configuration',
        description: 'Widget brand and settings',
        status: hasBrand && hasWelcome ? 'pass' : 'warn',
        details: !hasBrand
          ? 'Brand name not set'
          : !hasWelcome
          ? 'Welcome message not set'
          : `Brand: "${configData.brandName}"`,
        fix: !hasBrand ? 'Set your brand name in the Setup section' : undefined,
      });
    }
  } catch {
    checks.push({
      id: 'config',
      name: 'Widget Configuration',
      description: 'Widget settings',
      status: 'warn',
      details: 'Could not check config',
    });
  }

  // 5. Check relay block configs exist for this partner's industry
  try {
    const blockConfigsSnapshot = await db
      .collection('relayBlockConfigs')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    checks.push({
      id: 'block_configs',
      name: 'Relay Block Configs',
      description: 'AI response templates for the widget',
      status: blockConfigsSnapshot.empty ? 'warn' : 'pass',
      details: blockConfigsSnapshot.empty
        ? 'No relay block configs found globally'
        : 'Active block configs available',
      fix: blockConfigsSnapshot.empty
        ? 'Ask admin to generate modules, which auto-creates relay block configs'
        : undefined,
    });
  } catch {
    checks.push({
      id: 'block_configs',
      name: 'Relay Block Configs',
      description: 'AI response templates',
      status: 'warn',
      details: 'Could not check block configs',
    });
  }

  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const overallStatus =
    failCount > 0 ? 'error' : warnCount > 0 ? 'warning' : 'healthy';

  // Get widgetId from config
  let widgetId = '';
  try {
    const configSnapshot = await db
      .collection(`partners/${partnerId}/relayConfig`)
      .limit(1)
      .get();
    if (!configSnapshot.empty) {
      widgetId = configSnapshot.docs[0].data().widgetId || '';
    }
  } catch { /* ignore */ }

  const diagnostics: RelayDiagnostics = {
    widgetId,
    partnerId,
    checks,
    lastCheckedAt: new Date().toISOString(),
    overallStatus,
  };

  return { success: true, diagnostics };
}
