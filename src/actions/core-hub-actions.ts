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
 * Get formatted context string for AI prompt by reading module items
 * DIRECTLY from businessModules (no sync dependency).
 *
 * This is the main function called by generateInboxSuggestionAction.
 */
export async function getCoreHubContextString(partnerId: string): Promise<string> {
  if (!db) return '';

  try {
    // Read active modules directly
    const modulesSnapshot = await db
      .collection(`partners/${partnerId}/businessModules`)
      .get();

    const activeModules = modulesSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.enabled !== false;
      });

    if (activeModules.length === 0) {
      return '';
    }

    // Read items from each module directly
    const itemsByModule: Record<string, { name: string; items: any[] }> = {};
    let totalItems = 0;

    for (const moduleDc of activeModules) {
      const moduleData = moduleDc.data();
      const moduleId = moduleDc.id;
      const moduleName = moduleData.name || moduleData.moduleSlug || moduleId;

      const itemsSnapshot = await db
        .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
        .where('isActive', '==', true)
        .limit(50)
        .get();

      if (itemsSnapshot.empty) continue;

      const items = itemsSnapshot.docs.map(doc => doc.data());
      itemsByModule[moduleId] = { name: moduleName, items };
      totalItems += items.length;
    }

    if (totalItems === 0) {
      return '';
    }

    // Format items into context string
    let context = '';

    for (const [, { name: moduleName, items }] of Object.entries(itemsByModule)) {
      const displayName = moduleName
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      context += `\n## ${displayName.toUpperCase()}\n`;

      for (const item of items) {
        context += `\n### ${item.name || item.title || 'Untitled'}`;

        // Price
        const price = parsePrice(item.price);
        if (price !== null) {
          const currency = item.currency || 'INR';
          const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
          context += ` — ${symbol}${price.toLocaleString()}`;
          if (item.priceUnit || item.unit || item.billingCycle) {
            context += ` ${item.priceUnit || item.unit || item.billingCycle}`;
          }
        }
        context += '\n';

        // Description
        if (item.description) {
          const desc = item.description.length > 300
            ? item.description.substring(0, 300) + '...'
            : item.description;
          context += `${desc}\n`;
        }

        // Category
        if (item.category && item.category !== 'general') {
          context += `- **Category:** ${item.category}\n`;
        }

        // Custom fields (from module schema)
        if (item.fields && typeof item.fields === 'object') {
          for (const [key, value] of Object.entries(item.fields)) {
            if (value !== null && value !== undefined && value !== '') {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
              const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
              if (Array.isArray(value)) {
                if (value.length > 0) {
                  context += `- **${displayLabel}:** ${value.join(', ')}\n`;
                }
              } else if (typeof value === 'boolean') {
                if (value) context += `- **${displayLabel}:** Yes\n`;
              } else {
                context += `- **${displayLabel}:** ${value}\n`;
              }
            }
          }
        }
      }
    }

    console.log(`[CoreHub] Direct read: ${totalItems} items from ${Object.keys(itemsByModule).length} modules`);
    return context.trim();
  } catch (error: any) {
    console.error('[CoreHub] Direct read failed:', error.message);
    return '';
  }
}

/**
 * Sync all module items and business profile to Core Hub cache.
 * This is an optimization layer - the AI can work without it via direct reads.
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

    const partnerDoc = await db.collection('partners').doc(partnerId).get();

    if (!partnerDoc.exists) {
      return { success: false, message: 'Partner not found' };
    }

    const partnerData = partnerDoc.data() || {};

    const modulesSnapshot = await db
      .collection(`partners/${partnerId}/businessModules`)
      .get();

    const moduleConfigs = modulesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((m: any) => m.enabled !== false);

    console.log(`[CoreHub] Found ${moduleConfigs.length} active modules`);

    // Clear existing Core Hub items
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

    // Process each module and its items
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
            metadata: {},
            searchText: '',
            keywords: [],
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
      }
    }

    // Write items to Core Hub cache
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

    // Build business context from partner data
    const persona = partnerData.businessPersona || {};
    const identity = persona.identity || {};
    const personality = persona.personality || {};

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
    }

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

// ─────────────────────────────────────────────────────────────
// Helper
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
