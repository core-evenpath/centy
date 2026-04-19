import type { Metadata } from 'next';
import IndustryPage from '../../../components/IndustryPage';

export const metadata: Metadata = {
  title: 'Pingbox for B2B Wholesale — India',
  description: 'Convert IndiaMART and direct WhatsApp RFQs into quoted orders — instantly. Pingbox handles bulk pricing inquiries, quote generation, and PO conversion for Indian distributors and wholesalers.',
};

export default function Page() {
  return (
    <IndustryPage
      eyebrow="For B2B distributors & wholesalers — India"
      headline="Convert every IndiaMART lead into a quoted order — in 10 minutes."
      subheadline="Indian B2B buyers expect quotes within hours. Pingbox handles every WhatsApp RFQ with interactive volume pricing, inventory checks, and quote generation. Your sales team gets pre-qualified leads ready to close — not raw inquiries."
      problemStats="IndiaMART and TradeIndia generate millions of B2B leads daily. Most go unanswered for 24–48 hours. The distributor who quotes fastest wins. B2B buyers in India contact 5–8 suppliers for each RFQ. A Pune electrical wholesaler doing ₹5 crore annually can recover ₹25–50 lakh by improving WhatsApp RFQ response from 4 hours to 10 minutes. The same math applies to FMCG distributors, garment wholesalers, and industrial parts suppliers."
      blocks={[
        'Quote Builder — SKU, quantity, customer-specific pricing tiers in ₹',
        'Volume Pricing Calculator — real-time breaks at 100, 500, 1,000, 5,000 units',
        'Inventory Lookup — check stock levels mid-conversation via ERP sync',
        'Reorder — past orders with one-tap replicate and WhatsApp confirmation',
        'Purchase Order — structured PO creation with Tally/Zoho sync',
        'Freight Quote — shipping estimates by destination + weight (via Delhivery/DTDC)',
      ]}
      integrations={[
        { name: 'IndiaMART', note: 'Direct lead sync via API' },
        { name: 'Zoho CRM / Books', note: 'Quotes, invoices, customer records' },
        { name: 'Tally', note: 'Inventory sync, GST invoicing' },
        { name: 'LeadSquared', note: 'B2B pipeline management' },
        { name: 'Razorpay', note: 'Payment collection, advance deposits' },
        { name: 'WhatsApp Business API', note: 'Meta BSP-verified via Pingbox' },
      ]}
      roi="Avg B2B wholesale order: ₹5,000–₹5,00,000. For distributors doing ₹5 crore annually, recovering even 5% of lost RFQ conversions is ₹25 lakh in annual revenue. Pingbox Scale at ₹16,999/mo is a rounding error. The 10-minute quote that used to take a day is now a competitive advantage against distributors who still use email and manual calls."
    />
  );
}
