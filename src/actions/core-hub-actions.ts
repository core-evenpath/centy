'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  CoreHubConfig,
  CoreHubItem,
  CoreHubContext,
  CoreHubSyncResult,
} from '@/lib/types-core-hub';

/**
 * Sync all module items and business profile to Core Hub
 *
 * Call this when:
 * 1. Partner saves/updates/deletes module items
 * 2. Partner updates business profile
 * 3. Manual sync from admin
 */
export async function syncModulesToCoreHub(partnerId: string): Promise<CoreHubSyncResult> {
  const startTime = Date.now();

  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  const errors: string[] = [];
  let totalItemsSynced = 0;
  let modulesProcessed = 0;

  try {
    console.log('[CoreHub] Sync starting for partner:', partnerId);

    // Step 1: Get Business Profile
    const partnerDoc = await db.collection('partners').doc(partnerId).get();

    if (!partnerDoc.exists) {
      return { success: false, message: 'Partner not found' };
    }

    const partnerData = partnerDoc.data() || {};

    // Step 2: Get All Active Modules
    const modulesSnapshot = await db
      .collection(`partners/${partnerId}/businessModules`)
      .get();

    const moduleConfigs = modulesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((m: any) => m.enabled !== false);

    console.log(`[CoreHub] Found ${moduleConfigs.length} active modules`);

    // Step 3: Clear Existing Core Hub Items
    const existingItemsSnapshot = await db
      .collection(`partners/${partnerId}/coreHub/data/items`)
      .get();

    const deletePromises: Promise<any>[] = [];
    let deleteBatch = db.batch();
    let deleteCount = 0;

    for (const doc of existingItemsSnapshot.docs) {
      deleteBatch.delete(doc.ref);
      deleteCount++;

      if (deleteCount >= 500) {
        deletePromises.push(deleteBatch.commit());
        deleteBatch = db.batch();
        deleteCount = 0;
      }
    }

    if (deleteCount > 0) {
      deletePromises.push(deleteBatch.commit());
    }

    await Promise.all(deletePromises);
    console.log(`[CoreHub] Cleared ${existingItemsSnapshot.docs.length} existing items`);

    // Step 4: Process Each Module and Its Items
    const moduleSyncStatus: CoreHubConfig['moduleSyncStatus'] = {};
    const allItems: CoreHubItem[] = [];

    for (const moduleConfig of moduleConfigs) {
      const moduleId = moduleConfig.id;

      try {
        const itemsSnapshot = await db
          .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
          .get();

        const activeItems = itemsSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.isActive !== false;
        });

        console.log(`[CoreHub]   ${moduleId}: ${activeItems.length} items`);

        for (const itemDoc of activeItems) {
          const itemData = itemDoc.data();

          const coreHubItem: CoreHubItem = {
            id: `${moduleId}_${itemDoc.id}`,
            partnerId,
            sourceModule: (moduleConfig as any).moduleSlug || moduleId,
            sourceItemId: itemDoc.id,
            name: itemData.name || itemData.title || '',
            description: itemData.description || itemData.details || itemData.content || '',
            category: itemData.category || itemData.type || (moduleConfig as any).moduleSlug || moduleId,
            price: parsePrice(itemData.price || itemData.cost || itemData.amount),
            priceUnit: itemData.priceUnit || itemData.unit || itemData.billingCycle || null,
            currency: itemData.currency || partnerData.currency || 'INR',
            metadata: sanitizeMetadata(itemData),
            searchText: buildSearchText(itemData),
            keywords: extractKeywords(itemData, (moduleConfig as any).moduleSlug || moduleId),
            isActive: true,
            syncedAt: FieldValue.serverTimestamp() as any,
          };

          allItems.push(coreHubItem);
        }

        moduleSyncStatus[moduleId] = {
          lastSyncedAt: FieldValue.serverTimestamp() as any,
          itemCount: activeItems.length,
          enabled: true,
        };

        modulesProcessed++;
        totalItemsSynced += activeItems.length;
      } catch (moduleError: any) {
        console.error(`[CoreHub] Error processing ${moduleId}:`, moduleError.message);
        errors.push(`${moduleId}: ${moduleError.message}`);

        moduleSyncStatus[moduleId] = {
          lastSyncedAt: FieldValue.serverTimestamp() as any,
          itemCount: 0,
          enabled: false,
        };
      }
    }

    // Step 5: Write Items to Core Hub (Batched)
    const writePromises: Promise<any>[] = [];
    let writeBatch = db.batch();
    let writeCount = 0;

    for (const item of allItems) {
      const itemRef = db.doc(`partners/${partnerId}/coreHub/data/items/${item.id}`);
      writeBatch.set(itemRef, item);
      writeCount++;

      if (writeCount >= 500) {
        writePromises.push(writeBatch.commit());
        writeBatch = db.batch();
        writeCount = 0;
      }
    }

    if (writeCount > 0) {
      writePromises.push(writeBatch.commit());
    }

    await Promise.all(writePromises);
    console.log(`[CoreHub] Wrote ${allItems.length} items`);

    // Step 6: Build business context from partner data and business persona
    const persona = partnerData.businessPersona || {};
    const identity = persona.identity || {};
    const personality = persona.personality || {};

    // Build hours string from operatingHours
    let hoursStr = '';
    if (identity.operatingHours) {
      const oh = identity.operatingHours;
      if (oh.isOpen24x7) {
        hoursStr = 'Open 24/7';
      } else if (oh.appointmentOnly) {
        hoursStr = 'By Appointment Only';
      } else if (oh.schedule) {
        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const parts: string[] = [];
        for (const day of dayOrder) {
          const sched = oh.schedule[day];
          if (sched) {
            const dayName = day.charAt(0).toUpperCase() + day.slice(1);
            const openTime = sched.openTime || sched.open;
            const closeTime = sched.closeTime || sched.close;
            if ((sched.isOpen || (openTime && closeTime)) && openTime && closeTime) {
              parts.push(`${dayName}: ${openTime}-${closeTime}`);
            } else {
              parts.push(`${dayName}: Closed`);
            }
          }
        }
        hoursStr = parts.join(', ');
      }
      if (oh.specialNote) {
        hoursStr += hoursStr ? ` (${oh.specialNote})` : oh.specialNote;
      }
    }

    // Build address string
    let addressStr = '';
    if (identity.address) {
      const addr = identity.address;
      const parts = [addr.street, addr.area, addr.city, addr.state, addr.postalCode || addr.pincode, addr.country].filter(Boolean);
      addressStr = parts.join(', ');
    }

    const configData: CoreHubConfig = {
      partnerId,
      lastSyncedAt: FieldValue.serverTimestamp() as any,
      businessContext: {
        name: identity.name || partnerData.businessName || partnerData.name || '',
        industry: typeof identity.industry === 'string'
          ? identity.industry
          : identity.industry?.name || identity.industry?.category || partnerData.industry || '',
        subcategory: identity.industry?.subcategory || partnerData.subcategory || partnerData.functionId || '',
        country: identity.address?.country || partnerData.country || '',
        description: personality.description || partnerData.description || partnerData.about || '',
        hours: hoursStr || partnerData.businessHours || partnerData.hours || '',
        contactEmail: identity.email || partnerData.email || partnerData.contactEmail || '',
        contactPhone: identity.phone || partnerData.phone || partnerData.contactPhone || partnerData.whatsappNumber || '',
        address: addressStr || partnerData.address || partnerData.location || '',
        website: identity.website || partnerData.website || partnerData.url || '',
      },
      moduleSyncStatus,
      totalItemCount: totalItemsSynced,
      syncVersion: Date.now(),
    };

    await db.doc(`partners/${partnerId}/coreHub/config`).set(configData, { merge: true });

    const duration = Date.now() - startTime;
    console.log(`[CoreHub] Sync complete: ${totalItemsSynced} items from ${modulesProcessed} modules in ${duration}ms`);

    return {
      success: true,
      message: `Synced ${totalItemsSynced} items from ${modulesProcessed} modules`,
      itemsSynced: totalItemsSynced,
      modulesProcessed,
      errors: errors.length > 0 ? errors : undefined,
      duration,
    };
  } catch (error: any) {
    console.error('[CoreHub] Sync failed:', error);
    return {
      success: false,
      message: `Sync failed: ${error.message}`,
      errors: [error.message],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Get Core Hub context for AI suggestions
 * Automatically re-syncs if data is stale or item count has changed
 */
export async function getCoreHubContext(partnerId: string): Promise<CoreHubContext> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const configDoc = await db.doc(`partners/${partnerId}/coreHub/config`).get();

    if (!configDoc.exists) {
      console.log('[CoreHub] Not initialized, triggering sync...');
      const syncResult = await syncModulesToCoreHub(partnerId);

      if (!syncResult.success) {
        return { success: false, message: syncResult.message };
      }

      // Re-fetch after sync
      const retryConfig = await db.doc(`partners/${partnerId}/coreHub/config`).get();
      if (!retryConfig.exists) {
        return { success: false, message: 'Core Hub config not found after sync' };
      }

      const config = retryConfig.data() as CoreHubConfig;
      const itemsSnapshot = await db
        .collection(`partners/${partnerId}/coreHub/data/items`)
        .where('isActive', '==', true)
        .get();

      return {
        success: true,
        businessContext: config.businessContext,
        moduleItems: itemsSnapshot.docs.map(doc => doc.data() as CoreHubItem),
        itemCount: itemsSnapshot.docs.length,
        lastSyncedAt: config.lastSyncedAt?.toDate?.() || undefined,
      };
    }

    const config = configDoc.data() as CoreHubConfig;

    // Check if Core Hub is stale (older than 5 minutes) or if module item count has changed
    let needsSync = false;
    const lastSync = config.lastSyncedAt?.toDate?.() || new Date(0);
    const ageMs = Date.now() - lastSync.getTime();
    const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    if (ageMs > STALE_THRESHOLD_MS) {
      console.log(`[CoreHub] Data is stale (${Math.round(ageMs / 1000)}s old), re-syncing...`);
      needsSync = true;
    } else {
      // Quick count check: compare actual module items vs Core Hub count
      const modulesSnapshot = await db
        .collection(`partners/${partnerId}/businessModules`)
        .get();

      const activeModules = modulesSnapshot.docs.filter(doc => doc.data().enabled !== false);
      let totalModuleItems = 0;
      for (const moduleDoc of activeModules) {
        const itemsCount = await db
          .collection(`partners/${partnerId}/businessModules/${moduleDoc.id}/items`)
          .where('isActive', '!=', false)
          .count()
          .get();
        totalModuleItems += itemsCount.data().count;
      }

      if (totalModuleItems !== config.totalItemCount) {
        console.log(`[CoreHub] Item count mismatch (modules: ${totalModuleItems}, hub: ${config.totalItemCount}), re-syncing...`);
        needsSync = true;
      }
    }

    if (needsSync) {
      const syncResult = await syncModulesToCoreHub(partnerId);
      if (!syncResult.success) {
        console.warn('[CoreHub] Re-sync failed, using existing data:', syncResult.message);
      }
    }

    const itemsSnapshot = await db
      .collection(`partners/${partnerId}/coreHub/data/items`)
      .where('isActive', '==', true)
      .get();

    const moduleItems = itemsSnapshot.docs.map(doc => doc.data() as CoreHubItem);

    // Re-read config if we synced (to get updated businessContext)
    const finalConfig = needsSync
      ? (await db.doc(`partners/${partnerId}/coreHub/config`).get()).data() as CoreHubConfig
      : config;

    return {
      success: true,
      businessContext: finalConfig.businessContext,
      moduleItems,
      itemCount: moduleItems.length,
      lastSyncedAt: finalConfig.lastSyncedAt?.toDate?.() || undefined,
    };
  } catch (error: any) {
    console.error('[CoreHub] Failed to get context:', error);
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Get formatted context string for AI prompt.
 * This is the main function called by generateInboxSuggestionAction.
 */
export async function getCoreHubContextString(partnerId: string): Promise<string> {
  const result = await getCoreHubContext(partnerId);

  if (!result.success || !result.businessContext) {
    console.warn('[CoreHub] Context not available');
    return '';
  }

  const { businessContext, moduleItems = [] } = result;

  let context = `## BUSINESS INFORMATION\n`;

  if (businessContext.name) {
    context += `- **Business Name:** ${businessContext.name}\n`;
  }

  if (businessContext.industry) {
    context += `- **Industry:** ${businessContext.industry}`;
    if (businessContext.subcategory) {
      context += ` > ${businessContext.subcategory}`;
    }
    context += '\n';
  }

  if (businessContext.hours) {
    context += `- **Business Hours:** ${businessContext.hours}\n`;
  }

  if (businessContext.contactPhone) {
    context += `- **Phone:** ${businessContext.contactPhone}\n`;
  }

  if (businessContext.contactEmail) {
    context += `- **Email:** ${businessContext.contactEmail}\n`;
  }

  if (businessContext.address) {
    context += `- **Address:** ${businessContext.address}\n`;
  } else if (businessContext.country) {
    context += `- **Location:** ${businessContext.country}\n`;
  }

  if (businessContext.website) {
    context += `- **Website:** ${businessContext.website}\n`;
  }

  if (businessContext.description) {
    context += `- **About:** ${businessContext.description}\n`;
  }

  // Build Module Items Sections
  if (moduleItems.length === 0) {
    context += `\n_No products or services configured yet._\n`;
    return context.trim();
  }

  // Group items by source module
  const itemsByModule: Record<string, CoreHubItem[]> = {};

  for (const item of moduleItems) {
    const module = item.sourceModule || 'other';
    if (!itemsByModule[module]) {
      itemsByModule[module] = [];
    }
    itemsByModule[module].push(item);
  }

  for (const [moduleSlug, items] of Object.entries(itemsByModule)) {
    const moduleName = moduleSlug
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    context += `\n## ${moduleName.toUpperCase()}\n`;

    for (const item of items) {
      context += `\n### ${item.name}`;

      if (item.price !== null && item.price !== undefined) {
        const currency = item.currency || 'INR';
        const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
        context += ` — ${currencySymbol}${item.price.toLocaleString()}`;

        if (item.priceUnit) {
          context += ` ${item.priceUnit}`;
        }
      }

      context += '\n';

      if (item.description) {
        const desc = item.description.length > 300
          ? item.description.substring(0, 300) + '...'
          : item.description;
        context += `${desc}\n`;
      }

      if (item.metadata) {
        const relevantFields = ['features', 'includes', 'duration', 'availability', 'tags'];

        for (const field of relevantFields) {
          if (item.metadata[field]) {
            const value = Array.isArray(item.metadata[field])
              ? item.metadata[field].join(', ')
              : item.metadata[field];

            if (value) {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
              context += `- **${fieldName}:** ${value}\n`;
            }
          }
        }
      }
    }
  }

  return context.trim();
}

/**
 * Check if Core Hub needs sync (stale data)
 */
export async function isCoreHubStale(partnerId: string, maxAgeMs: number = 3600000): Promise<boolean> {
  if (!db) return true;

  try {
    const configDoc = await db.doc(`partners/${partnerId}/coreHub/config`).get();

    if (!configDoc.exists) return true;

    const config = configDoc.data() as CoreHubConfig;

    if (!config.lastSyncedAt) return true;

    const lastSync = config.lastSyncedAt.toDate?.() || new Date(0);
    const age = Date.now() - lastSync.getTime();

    return age > maxAgeMs;
  } catch {
    return true;
  }
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function parsePrice(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function sanitizeMetadata(data: any): Record<string, any> {
  const exclude = [
    'name', 'title', 'description', 'details', 'content',
    'price', 'cost', 'amount', 'id', 'partnerId', 'moduleId',
    'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
    '_schemaVersion', 'ragText', 'ragUpdatedAt', 'sortOrder',
  ];
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!exclude.includes(key) && value !== undefined && value !== null) {
      result[key] = value;
    }
  }

  return result;
}

function buildSearchText(item: any): string {
  const parts = [
    item.name,
    item.title,
    item.description,
    item.details,
    item.content,
    item.category,
    item.type,
  ];

  if (Array.isArray(item.tags)) {
    parts.push(...item.tags);
  }

  if (Array.isArray(item.features)) {
    parts.push(...item.features);
  }

  if (Array.isArray(item.keywords)) {
    parts.push(...item.keywords);
  }

  return parts.filter(Boolean).join(' ').toLowerCase();
}

function extractKeywords(item: any, moduleSlug: string): string[] {
  const keywords: string[] = [moduleSlug];

  if (item.name) {
    keywords.push(...item.name.toLowerCase().split(/\s+/));
  }

  if (item.category) {
    keywords.push(item.category.toLowerCase());
  }

  if (item.type) {
    keywords.push(item.type.toLowerCase());
  }

  if (Array.isArray(item.tags)) {
    keywords.push(...item.tags.map((t: string) => t.toLowerCase()));
  }

  return [...new Set(keywords)].filter(k => k.length > 2);
}
