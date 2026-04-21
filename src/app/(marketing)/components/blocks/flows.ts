import { LibServiceCard } from './primitives/LibServiceCard';
import { LibPricingTable } from './primitives/LibPricingTable';
import { LibBookingFlow } from './primitives/LibBookingFlow';
import { LibReviewCard } from './primitives/LibReviewCard';
import { LibQuoteBuilder } from './primitives/LibQuoteBuilder';
import { LibLocationMap } from './primitives/LibLocationMap';
import type { FlowDefinition } from './types';

// ── Homepage (all verticals) ──────────────────────────────────────────────────

export const HOMEPAGE_FLOWS: FlowDefinition[] = [
  {
    key: 'browse-book',
    intent: '\u201CHow much for teeth whitening?\u201D',
    outcome: 'Booked',
    top: { component: LibServiceCard, label: 'Service Card' },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['dental', 'fitness', 'real-estate'],
  },
  {
    key: 'compare-book',
    intent: '\u201CWhat are my options?\u201D',
    outcome: 'Booked',
    top: { component: LibPricingTable, label: 'Pricing Table' },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['dental', 'hvac', 'fitness'],
  },
  {
    key: 'proof-act',
    intent: '\u201CAre you guys any good?\u201D',
    outcome: 'Booked',
    top: { component: LibReviewCard, label: 'Review Card' },
    bottom: { component: LibServiceCard, label: 'Service Card' },
    verticals: ['dental', 'fitness', 'real-estate', 'law'],
  },
  {
    key: 'quote-fulfill',
    intent: '\u201C500 units of SKU BBV-075?\u201D',
    outcome: 'Quote sent',
    top: { component: LibQuoteBuilder, label: 'Quote Builder' },
    bottom: { component: LibLocationMap, label: 'Location Map' },
    verticals: ['b2b'],
  },
  {
    key: 'service-proof',
    intent: '\u201CHow do I know it works?\u201D',
    outcome: 'Converted',
    top: { component: LibServiceCard, label: 'Service Card' },
    bottom: { component: LibReviewCard, label: 'Review Card' },
    verticals: ['dental', 'fitness', 'hvac'],
  },
];

// ── Dental — US ───────────────────────────────────────────────────────────────

export const DENTAL_FLOWS: FlowDefinition[] = [
  {
    key: 'dental-browse-book',
    intent: '\u201CHow much for teeth whitening?\u201D',
    outcome: 'Booked',
    top: { component: LibServiceCard, label: 'Service Card', props: { title: 'Teeth Whitening \u2014 Pro', subtitle: '60 min \u00B7 in-office \u00B7 1 visit', price: '$389' } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['dental'],
  },
  {
    key: 'dental-compare',
    intent: '\u201CWhat are my options?\u201D',
    outcome: 'Booked',
    top: { component: LibPricingTable, label: 'Pricing Table', props: { tiers: [{ name: 'Whitening Plus', price: '$389', feat: 'Clean + pro whitening', pop: true }, { name: 'Full Restoration', price: '$1,200+', feat: 'Full smile consult' }] } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['dental'],
  },
  {
    key: 'dental-proof',
    intent: '\u201CAre you guys any good?\u201D',
    outcome: 'Booked',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: 'Booked whitening, in and out in an hour. Results were exactly as shown.', reviewer: 'Maya Rodriguez', initials: 'MR', suffix: 'verified patient' } },
    bottom: { component: LibServiceCard, label: 'Service Card', props: { title: 'Teeth Whitening \u2014 Pro', subtitle: '60 min \u00B7 in-office', price: '$389' } },
    verticals: ['dental'],
  },
];

// ── Dental — India ────────────────────────────────────────────────────────────

export const DENTAL_FLOWS_IN: FlowDefinition[] = [
  {
    key: 'dental-in-browse-book',
    intent: '\u201CWhitening ki cost kitni hai?\u201D',
    outcome: 'Booked',
    top: { component: LibServiceCard, label: 'Service Card', props: { title: 'Teeth Whitening \u2014 Pro', subtitle: '60 min \u00B7 clinic visit \u00B7 1 session', price: '\u20B98,999' } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['dental'],
  },
  {
    key: 'dental-in-compare',
    intent: '\u201CKaun sa treatment better hai?\u201D',
    outcome: 'Booked',
    top: { component: LibPricingTable, label: 'Pricing Table', props: { tiers: [{ name: 'Whitening Plus', price: '\u20B98,999', feat: 'Clean + pro whitening', pop: true }, { name: 'Smile Design', price: '\u20B924,999+', feat: 'Full consultation' }] } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['dental'],
  },
  {
    key: 'dental-in-proof',
    intent: '\u201CKya aap trustworthy hain?\u201D',
    outcome: 'Booked',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: 'WhatsApp pe booking ki, usi din appointment mili. Results bahut acche the.', reviewer: 'Priya Sharma', initials: 'PS', suffix: 'verified patient' } },
    bottom: { component: LibLocationMap, label: 'Location Map', props: { name: 'Smile Studio \u2014 Koramangala', address: 'HSR Layout, Bengaluru', dist: '1.2 km' } },
    verticals: ['dental'],
  },
];

// ── HVAC — US ─────────────────────────────────────────────────────────────────

export const HVAC_FLOWS: FlowDefinition[] = [
  {
    key: 'hvac-emergency',
    intent: '\u201CAC stopped working. Can someone come today?\u201D',
    outcome: 'Scheduled',
    top: { component: LibServiceCard, label: 'Service Card', props: { title: 'Emergency AC Diagnostic', subtitle: '30 min \u00B7 same-day dispatch', price: '$89' } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['hvac'],
  },
  {
    key: 'hvac-quote',
    intent: '\u201CHow much for a new furnace?\u201D',
    outcome: 'Quote sent',
    top: { component: LibPricingTable, label: 'Pricing Table', props: { tiers: [{ name: 'Standard Install', price: '$2,800', feat: 'Gas furnace, 80% efficiency', pop: false }, { name: 'Premium Install', price: '$4,200', feat: '96% efficiency + smart thermostat', pop: true }] } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['hvac'],
  },
  {
    key: 'hvac-proof',
    intent: '\u201CAre you guys reliable?\u201D',
    outcome: 'Booked',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: 'Emergency call at 2pm, tech arrived by 4. Fixed same day. Highly recommend.', reviewer: 'James Wilson', initials: 'JW', suffix: 'verified customer' } },
    bottom: { component: LibServiceCard, label: 'Service Card', props: { title: 'Emergency AC Diagnostic', subtitle: '30 min \u00B7 same-day', price: '$89' } },
    verticals: ['hvac'],
  },
];

// ── HVAC — India ──────────────────────────────────────────────────────────────

export const HVAC_FLOWS_IN: FlowDefinition[] = [
  {
    key: 'hvac-in-emergency',
    intent: '\u201CAC not cooling, emergency visit possible?\u201D',
    outcome: 'Scheduled',
    top: { component: LibServiceCard, label: 'Service Card', props: { title: 'AC Emergency Service', subtitle: '30 min \u00B7 same-day visit', price: '\u20B9799' } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['hvac'],
  },
  {
    key: 'hvac-in-quote',
    intent: '\u201CNew AC install ka cost?\u201D',
    outcome: 'Quote sent',
    top: { component: LibPricingTable, label: 'Pricing Table', props: { tiers: [{ name: '1.5 Ton Split AC', price: '\u20B932,999', feat: '3-star, 5yr warranty', pop: true }, { name: '2 Ton Inverter AC', price: '\u20B944,999', feat: '5-star, 10yr compressor', pop: false }] } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['hvac'],
  },
  {
    key: 'hvac-in-proof',
    intent: '\u201CKya service acha hai?\u201D',
    outcome: 'Booked',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: 'WhatsApp pe message kiya, 2 ghante mein technician aa gaya. Problem fix ho gayi.', reviewer: 'Rahul Mehta', initials: 'RM', suffix: 'verified customer' } },
    bottom: { component: LibLocationMap, label: 'Location Map', props: { name: 'AirCool \u2014 Indiranagar', address: 'HAL 2nd Stage, Bengaluru', dist: '2.1 km' } },
    verticals: ['hvac'],
  },
];

// ── Fitness — US ──────────────────────────────────────────────────────────────

export const FITNESS_FLOWS: FlowDefinition[] = [
  {
    key: 'fitness-browse',
    intent: '\u201CDo you have morning classes?\u201D',
    outcome: 'Booked',
    top: { component: LibServiceCard, label: 'Service Card', props: { title: 'Morning HIIT \u2014 6:00 AM', subtitle: '45 min \u00B7 all levels \u00B7 daily', price: '$18/class' } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['fitness'],
  },
  {
    key: 'fitness-trial',
    intent: '\u201CCan I try one class free?\u201D',
    outcome: 'Booked',
    top: { component: LibPricingTable, label: 'Pricing Table', props: { tiers: [{ name: 'Free Trial Class', price: '$0', feat: 'One class, no commitment', pop: true }, { name: 'Monthly Unlimited', price: '$89/mo', feat: 'All classes, all times', pop: false }] } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['fitness'],
  },
  {
    key: 'fitness-proof',
    intent: '\u201CIs it worth it?\u201D',
    outcome: 'Converted',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: 'I\'ve tried 6 studios. This is the first one where I stayed past a month. Classes are that good.', reviewer: 'Sarah Kim', initials: 'SK', suffix: 'member since 2023' } },
    bottom: { component: LibServiceCard, label: 'Service Card', props: { title: 'Monthly Unlimited', subtitle: 'All classes \u00B7 no contract', price: '$89/mo' } },
    verticals: ['fitness'],
  },
];

// ── Fitness — India ───────────────────────────────────────────────────────────

export const FITNESS_FLOWS_IN: FlowDefinition[] = [
  {
    key: 'fitness-in-browse',
    intent: '\u201CMorning batch available hai?\u201D',
    outcome: 'Booked',
    top: { component: LibServiceCard, label: 'Service Card', props: { title: 'Morning Zumba \u2014 6:30 AM', subtitle: '45 min \u00B7 beginners welcome', price: '\u20B9499/class' } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['fitness'],
  },
  {
    key: 'fitness-in-trial',
    intent: '\u201CEk free class try kar sakta hoon?\u201D',
    outcome: 'Booked',
    top: { component: LibPricingTable, label: 'Pricing Table', props: { tiers: [{ name: 'Free Trial', price: '\u20B90', feat: 'One class, no commitment', pop: true }, { name: 'Monthly Pass', price: '\u20B92,499/mo', feat: 'Unlimited classes', pop: false }] } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['fitness'],
  },
  {
    key: 'fitness-in-proof',
    intent: '\u201CResults milenge kya?\u201D',
    outcome: 'Converted',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: '3 mahine mein 8kg weight loss. Trainers bahut supportive hain. Highly recommend!', reviewer: 'Ananya Patel', initials: 'AP', suffix: 'member since 2024' } },
    bottom: { component: LibServiceCard, label: 'Service Card', props: { title: 'Monthly Unlimited Pass', subtitle: 'All classes \u00B7 no lock-in', price: '\u20B92,499/mo' } },
    verticals: ['fitness'],
  },
];

// ── Real Estate — US ──────────────────────────────────────────────────────────

export const REAL_ESTATE_FLOWS: FlowDefinition[] = [
  {
    key: 're-availability',
    intent: '\u201CIs the 2BR on Oak Street still available?\u201D',
    outcome: 'Viewing booked',
    top: { component: LibServiceCard, label: 'Service Card', props: { title: 'Oak St 2BR \u2014 $3,200/mo', subtitle: '2 bed \u00B7 1 bath \u00B7 1,200 sqft', price: '$3,200/mo' } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['real-estate'],
  },
  {
    key: 're-viewing',
    intent: '\u201CCan I see it this weekend?\u201D',
    outcome: 'Booked',
    top: { component: LibBookingFlow, label: 'Booking Flow' },
    bottom: { component: LibLocationMap, label: 'Location Map', props: { name: 'Oak Street \u2014 Unit 4B', address: '142 Oak St, Brooklyn', dist: '0.4 mi' } },
    verticals: ['real-estate'],
  },
  {
    key: 're-proof',
    intent: '\u201CCan I trust your listings?\u201D',
    outcome: 'Viewing booked',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: 'Found our apartment in 3 days. The booking flow made viewing scheduling incredibly easy.', reviewer: 'Alex Chen', initials: 'AC', suffix: 'verified renter' } },
    bottom: { component: LibServiceCard, label: 'Service Card', props: { title: 'Oak St 2BR', subtitle: '2 bed \u00B7 1,200 sqft', price: '$3,200/mo' } },
    verticals: ['real-estate'],
  },
];

// ── Real Estate — India ───────────────────────────────────────────────────────

export const REAL_ESTATE_FLOWS_IN: FlowDefinition[] = [
  {
    key: 're-in-availability',
    intent: '\u201C2BHK Koramangala mein available hai?\u201D',
    outcome: 'Viewing booked',
    top: { component: LibServiceCard, label: 'Service Card', props: { title: '2BHK \u2014 Koramangala 5th Block', subtitle: '2 BHK \u00B7 1,100 sqft \u00B7 semi-furnished', price: '\u20B928,000/mo' } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['real-estate'],
  },
  {
    key: 're-in-viewing',
    intent: '\u201CWeekend visit possible hai?\u201D',
    outcome: 'Booked',
    top: { component: LibBookingFlow, label: 'Booking Flow' },
    bottom: { component: LibLocationMap, label: 'Location Map', props: { name: 'Koramangala 5th Block', address: '12th Cross, Bengaluru', dist: '1.8 km' } },
    verticals: ['real-estate'],
  },
  {
    key: 're-in-proof',
    intent: '\u201CKya listings genuine hain?\u201D',
    outcome: 'Viewing booked',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: '3 din mein flat mila. WhatsApp pe hi saari details aur visit booking ho gayi. Superb!', reviewer: 'Vikram Nair', initials: 'VN', suffix: 'verified tenant' } },
    bottom: { component: LibServiceCard, label: 'Service Card', props: { title: '2BHK \u2014 Koramangala', subtitle: '2 BHK \u00B7 1,100 sqft', price: '\u20B928,000/mo' } },
    verticals: ['real-estate'],
  },
];

// ── Law & Insurance — US ──────────────────────────────────────────────────────

export const LAW_FLOWS: FlowDefinition[] = [
  {
    key: 'law-intake',
    intent: '\u201CDo you handle personal injury cases?\u201D',
    outcome: 'Consultation booked',
    top: { component: LibServiceCard, label: 'Service Card', props: { title: 'Personal Injury Consult', subtitle: 'Free \u00B7 30 min \u00B7 no obligation', price: 'Free' } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['law'],
  },
  {
    key: 'law-proof',
    intent: '\u201CDo you win cases?\u201D',
    outcome: 'Consultation booked',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: 'They settled my case in 4 months. The intake process was fast and the team kept me updated throughout.', reviewer: 'Marcus T.', initials: 'MT', suffix: 'personal injury client' } },
    bottom: { component: LibServiceCard, label: 'Service Card', props: { title: 'Free Consultation', subtitle: '30 min \u00B7 no commitment', price: 'Free' } },
    verticals: ['law'],
  },
  {
    key: 'law-compare',
    intent: '\u201CWhat does the process look like?\u201D',
    outcome: 'Consultation booked',
    top: { component: LibPricingTable, label: 'Pricing Table', props: { tiers: [{ name: 'Free Consult', price: '$0', feat: 'Evaluate your case', pop: true }, { name: 'Contingency Fee', price: '33%', feat: 'Only pay if we win', pop: false }] } },
    bottom: { component: LibBookingFlow, label: 'Booking Flow' },
    verticals: ['law'],
  },
];

// ── B2B Wholesale — US ────────────────────────────────────────────────────────

export const B2B_FLOWS: FlowDefinition[] = [
  {
    key: 'b2b-quote',
    intent: '\u201CBulk price for 500 units of SKU BBV-075?\u201D',
    outcome: 'Quote sent',
    top: { component: LibQuoteBuilder, label: 'Quote Builder', props: { sku: 'SKU BBV-075', skuSub: 'Brass valve, 3/4\u2033', qty: 500, discount: '\u2212$280', total: '$1,320' } },
    bottom: { component: LibLocationMap, label: 'Location Map', props: { name: 'Northstar \u2014 Distribution Center', address: '412 W 34th St, NYC', dist: '0.8 mi' } },
    verticals: ['b2b'],
  },
  {
    key: 'b2b-catalog',
    intent: '\u201CWhat do you carry in the 3/4\u2033 range?\u201D',
    outcome: 'Quote sent',
    top: { component: LibPricingTable, label: 'Pricing Table', props: { tiers: [{ name: 'BBV-075 Brass Valve', price: '$2.64/unit', feat: '500+ qty · 8-week lead', pop: true }, { name: 'BSV-082 Steel Valve', price: '$1.89/unit', feat: '250+ qty · 4-week lead', pop: false }] } },
    bottom: { component: LibQuoteBuilder, label: 'Quote Builder' },
    verticals: ['b2b'],
  },
  {
    key: 'b2b-proof',
    intent: '\u201CCan we trust your supply chain?\u201D',
    outcome: 'RFQ submitted',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: 'Placed a $40K order via chat. Quote came back in 10 minutes. Shipped on time, every time.', reviewer: 'David Park', initials: 'DP', suffix: 'procurement manager' } },
    bottom: { component: LibLocationMap, label: 'Location Map', props: { name: 'Northstar \u2014 Distribution', address: '412 W 34th St, NYC', dist: '0.8 mi' } },
    verticals: ['b2b'],
  },
];

// ── B2B Wholesale — India ─────────────────────────────────────────────────────

export const B2B_FLOWS_IN: FlowDefinition[] = [
  {
    key: 'b2b-in-quote',
    intent: '\u201C500 units ka bulk rate kya hoga?\u201D',
    outcome: 'Quote sent',
    top: { component: LibQuoteBuilder, label: 'Quote Builder', props: { sku: 'SKU VLV-3B', skuSub: 'Brass ball valve, 20mm', qty: 500, discount: '\u2212\u20B91,800', total: '\u20B98,700' } },
    bottom: { component: LibLocationMap, label: 'Location Map', props: { name: 'Bharat Supply \u2014 Warehouse', address: 'MIDC Phase II, Pune', dist: '3.2 km' } },
    verticals: ['b2b'],
  },
  {
    key: 'b2b-in-catalog',
    intent: '\u201CBrass fittings mein kya available hai?\u201D',
    outcome: 'Quote sent',
    top: { component: LibPricingTable, label: 'Pricing Table', props: { tiers: [{ name: 'Brass Ball Valve 20mm', price: '\u20B919.40/piece', feat: '500+ qty \u00B7 in-stock', pop: true }, { name: 'GI Pipe Fitting 15mm', price: '\u20B912.80/piece', feat: '1000+ qty \u00B7 2-wk lead', pop: false }] } },
    bottom: { component: LibQuoteBuilder, label: 'Quote Builder', props: { sku: 'VLV-3B', skuSub: 'Brass ball valve', qty: 500, discount: '\u2212\u20B91,800', total: '\u20B98,700' } },
    verticals: ['b2b'],
  },
  {
    key: 'b2b-in-proof',
    intent: '\u201CKya delivery reliable hai?\u201D',
    outcome: 'RFQ submitted',
    top: { component: LibReviewCard, label: 'Review Card', props: { quote: 'WhatsApp pe order diya, 15 min mein quote aaya. Delivery date pe same-day delivery. Best supplier!', reviewer: 'Suresh Gupta', initials: 'SG', suffix: 'procurement manager' } },
    bottom: { component: LibLocationMap, label: 'Location Map', props: { name: 'Bharat Supply \u2014 MIDC Pune', address: 'MIDC Phase II, Pune', dist: '3.2 km' } },
    verticals: ['b2b'],
  },
];
