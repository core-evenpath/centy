// X01 — Service overlay tagging + auto-inclusion verification.

import { describe, expect, it } from 'vitest';
import { getPartnerEngines, FUNCTION_TO_ENGINES } from '../engine-recipes';
import { getAllowedBlocksForFunctionAndEngine } from '../admin-block-registry';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

describe('X01 — Service overlay', () => {
  it('Service blocks tagged: order_confirmation, order_tracker, kitchen_queue, fs_order_tracker', () => {
    const serviceBlocks = ALL_BLOCKS_DATA.filter((b) =>
      (b as unknown as { engines?: string[] }).engines?.includes('service'),
    );
    const ids = serviceBlocks.map((b) => b.id);
    expect(ids).toContain('order_confirmation');
    expect(ids).toContain('order_tracker');
    expect(ids).toContain('kitchen_queue');
    expect(ids).toContain('fs_order_tracker');
  });

  it('Service is auto-included for every booking-primary partner', () => {
    const bookingPrimary = Object.entries(FUNCTION_TO_ENGINES)
      .filter(([, e]) => e[0] === 'booking')
      .map(([fn]) => fn);
    for (const fn of bookingPrimary) {
      const partner = { businessPersona: { identity: { businessCategories: [{ functionId: fn }] } } };
      const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
      expect(engines, `${fn}`).toContain('service');
    }
  });

  it('Service is auto-included for every commerce-primary partner', () => {
    const commercePrimary = Object.entries(FUNCTION_TO_ENGINES)
      .filter(([, e]) => e[0] === 'commerce')
      .map(([fn]) => fn);
    for (const fn of commercePrimary) {
      const partner = { businessPersona: { identity: { businessCategories: [{ functionId: fn }] } } };
      const engines = getPartnerEngines(partner as Parameters<typeof getPartnerEngines>[0]);
      expect(engines, `${fn}`).toContain('service');
    }
  });

  it('Service-scoped catalog includes service-tagged blocks', () => {
    const serviceCatalog = getAllowedBlocksForFunctionAndEngine('ecommerce_d2c', 'service');
    const ids = serviceCatalog.map((b) => b.id);
    expect(ids).toContain('order_confirmation');
    expect(ids).toContain('order_tracker');
  });

  it('Commerce-scoped catalog does NOT include service-only blocks', () => {
    const commerceCatalog = getAllowedBlocksForFunctionAndEngine('ecommerce_d2c', 'commerce');
    const ids = commerceCatalog.map((b) => b.id);
    expect(ids).not.toContain('order_tracker');
    expect(ids).not.toContain('order_confirmation');
  });

  it('Booking-scoped catalog does NOT include Commerce service blocks', () => {
    const bookingCatalog = getAllowedBlocksForFunctionAndEngine('hotels_resorts', 'booking');
    const ids = bookingCatalog.map((b) => b.id);
    expect(ids).not.toContain('order_tracker');
    expect(ids).not.toContain('kitchen_queue');
  });

  it('Shared blocks (greeting, contact) still appear in service catalog', () => {
    const serviceCatalog = getAllowedBlocksForFunctionAndEngine('ecommerce_d2c', 'service');
    const ids = serviceCatalog.map((b) => b.id);
    expect(ids).toContain('greeting');
    expect(ids).toContain('contact');
  });
});
