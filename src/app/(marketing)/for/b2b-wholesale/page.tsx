import type { Metadata } from 'next';
import IndustryPage from '../../components/IndustryPage';
import { B2B_FLOWS } from '../../components/blocks';

export const metadata: Metadata = {
  title: 'Pingbox for B2B Wholesale',
  description: 'Every RFQ becomes a quote. Every quote becomes an order. Pingbox handles bulk pricing inquiries, quote generation, and PO conversion for distributors and wholesalers.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For B2B distributors & wholesalers"
      headline="Every RFQ becomes a quote. Every quote becomes an order."
      subheadline="Pingbox handles bulk pricing inquiries, quote generation, and PO conversion for distributors and wholesalers. Buyers get instant pricing on volume breaks. Your sales team gets qualified leads ready to close."
      problemStats="B2B buyers expect B2C-grade response times with B2B-grade detail. Your buyer fills out a form, gets an email 4 hours later, goes back and forth 5 times to clarify quantities and specs, and finally gets a quote the next day. Competitors who can quote in 10 minutes win. For distributors doing $5M annually, recovering even 5% of lost RFQ conversions is $250K in annual revenue."
      blockFlows={B2B_FLOWS}
      blockHeadword="wholesale"
      blockLabel="LIVE FLOWS FOR B2B"
      blockNarrative="RFQs get a real-time Quote Builder with volume pricing, a Location Map showing the nearest distribution center, and a Purchase Order block ready to fill. Your buyer gets a quote in 10 minutes. Your competitor is still drafting the email."
      blocks={[
        'Quote Builder — quantity, SKU, customer-specific pricing tiers',
        'Volume Pricing Calculator — real-time breaks at 100, 500, 1,000, 5,000 units',
        'Inventory Lookup — check stock levels mid-conversation',
        'Reorder — past orders with one-tap replicate',
        'Purchase Order — structured PO creation',
        'Freight Quote — shipping estimates by destination and weight',
      ]}
      integrations={[
        { name: 'NetSuite', note: 'ERP, inventory, pricing' },
        { name: 'SAP Business One', note: 'Enterprise ERP' },
        { name: 'Oracle', note: 'Financial systems' },
        { name: 'Shopify Plus B2B', note: 'Wholesale storefront' },
        { name: 'Custom ERP', note: 'Via REST API + webhooks' },
      ]}
      roi="Avg B2B order: $500–$50,000. For distributors doing $5M annually, recovering even 5% of lost RFQ conversions is $250K in annual revenue. Pingbox Scale becomes a rounding error. The 10-minute quote that used to take a day is now a competitive advantage."
    />
  );
}
