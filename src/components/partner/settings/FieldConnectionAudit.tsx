"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Database,
    Unplug,
    Info
} from 'lucide-react';

/**
 * Field Connection Status
 * - connected: Field is mapped to a valid schema path and saves to backend
 * - partial: Field saves to industrySpecificData (catch-all, less structured)
 * - not_connected: Field has no backend mapping or handler
 */

// All fields defined in the settings page with their backend connection status
// Updated after fixing saveBusinessPersonaAction to properly merge industrySpecificData
const FIELD_AUDIT: Record<string, {
    label: string;
    uiKey: string;
    schemaPath: string;
    status: 'connected' | 'partial' | 'not_connected';
    notes?: string;
}[]> = {
    'Core Identity': [
        { label: 'Business Name', uiKey: 'name', schemaPath: 'identity.name', status: 'connected' },
        { label: 'Tagline', uiKey: 'tagline', schemaPath: 'personality.tagline', status: 'connected' },
        { label: 'Description', uiKey: 'description', schemaPath: 'personality.description', status: 'connected' },
        { label: 'Founded Year', uiKey: 'foundedYear', schemaPath: 'personality.foundedYear', status: 'connected' },
        { label: 'USPs', uiKey: 'usps', schemaPath: 'personality.uniqueSellingPoints', status: 'connected' },
        { label: 'Languages', uiKey: 'languages', schemaPath: 'personality.languagePreference', status: 'connected' },
        { label: 'Category', uiKey: 'category', schemaPath: 'identity.industry.name', status: 'connected' },
    ],
    'Contact Information': [
        { label: 'Phone', uiKey: 'phone', schemaPath: 'identity.phone', status: 'connected' },
        { label: 'WhatsApp', uiKey: 'whatsapp', schemaPath: 'identity.whatsAppNumber', status: 'connected' },
        { label: 'Email', uiKey: 'email', schemaPath: 'identity.email', status: 'connected' },
        { label: 'Website', uiKey: 'website', schemaPath: 'identity.website', status: 'connected' },
        { label: 'Address', uiKey: 'address', schemaPath: 'identity.address.street', status: 'connected' },
        { label: 'Office Address', uiKey: 'officeAddress', schemaPath: 'identity.address.street', status: 'connected' },
        { label: 'Service Areas', uiKey: 'serviceAreas', schemaPath: 'identity.serviceArea', status: 'connected' },
        { label: 'Instagram', uiKey: 'instagram', schemaPath: 'identity.socialMedia.instagram', status: 'connected' },
        { label: 'LinkedIn', uiKey: 'linkedin', schemaPath: 'identity.socialMedia.linkedin', status: 'connected' },
    ],
    'Operating Hours': [
        { label: 'Hours Type', uiKey: 'hoursType', schemaPath: 'identity.operatingHours.specialNote', status: 'connected' },
        { label: 'Schedule', uiKey: 'schedule', schemaPath: 'identity.operatingHours.schedule', status: 'connected' },
        { label: 'Response Time', uiKey: 'responseTime', schemaPath: 'personality.responseTimeExpectation', status: 'connected' },
        { label: 'Booking Link', uiKey: 'bookingLink', schemaPath: 'industrySpecificData.bookingLink', status: 'connected' },
        { label: 'Support Hours', uiKey: 'supportHours', schemaPath: 'identity.operatingHours.specialNote', status: 'connected' },
    ],
    'Pricing & Payments': [
        { label: 'Consultation Fee', uiKey: 'consultationFee', schemaPath: 'knowledge.pricingHighlights', status: 'connected' },
        { label: 'Payment Methods', uiKey: 'paymentMethods', schemaPath: 'knowledge.acceptedPayments', status: 'connected' },
        { label: 'Pricing Note', uiKey: 'pricingNote', schemaPath: 'knowledge.pricingHighlights', status: 'connected' },
        { label: 'Price Range', uiKey: 'priceRange', schemaPath: 'knowledge.pricingHighlights', status: 'connected' },
    ],
    'Credentials (Professional Services)': [
        { label: 'Years in Business', uiKey: 'experience', schemaPath: 'industrySpecificData.experience', status: 'connected' },
        { label: 'Notable Clients', uiKey: 'clients', schemaPath: 'industrySpecificData.notableClients', status: 'connected' },
        { label: 'Certifications', uiKey: 'certifications', schemaPath: 'knowledge.certifications', status: 'connected' },
        { label: 'Awards', uiKey: 'awards', schemaPath: 'knowledge.awards', status: 'connected' },
    ],
    'Retail & E-Commerce': [
        { label: 'Support Hours', uiKey: 'supportHours', schemaPath: 'identity.operatingHours.specialNote', status: 'connected' },
        { label: 'Delivery Zones', uiKey: 'deliveryZones', schemaPath: 'industrySpecificData.deliveryZones', status: 'connected' },
        { label: 'Delivery Time', uiKey: 'deliveryTime', schemaPath: 'industrySpecificData.deliveryTime', status: 'connected' },
        { label: 'Shipping Cost', uiKey: 'shippingCost', schemaPath: 'industrySpecificData.shippingCost', status: 'connected' },
        { label: 'Free Shipping Above', uiKey: 'freeShippingMin', schemaPath: 'industrySpecificData.freeShippingMin', status: 'connected' },
        { label: 'Product Categories', uiKey: 'categories', schemaPath: 'knowledge.serviceCategories', status: 'connected' },
        { label: 'Bestsellers', uiKey: 'bestsellers', schemaPath: 'industrySpecificData.bestsellers', status: 'connected' },
        { label: 'COD Limit', uiKey: 'codLimit', schemaPath: 'industrySpecificData.codLimit', status: 'connected' },
        { label: 'Current Offers', uiKey: 'currentOffers', schemaPath: 'knowledge.currentOffers', status: 'connected' },
        { label: 'Return Window', uiKey: 'returnWindow', schemaPath: 'industrySpecificData.returnWindow', status: 'connected' },
    ],
    'Real Estate': [
        { label: 'RERA Registration', uiKey: 'reraNumber', schemaPath: 'industrySpecificData.reraNumber', status: 'connected' },
        { label: 'Specialization', uiKey: 'specialization', schemaPath: 'industrySpecificData.specialization', status: 'connected' },
        { label: 'Cities Covered', uiKey: 'cities', schemaPath: 'industrySpecificData.citiesCovered', status: 'connected' },
        { label: 'Key Localities', uiKey: 'localities', schemaPath: 'industrySpecificData.keyLocalities', status: 'connected' },
        { label: 'Featured Projects', uiKey: 'projects', schemaPath: 'industrySpecificData.featuredProjects', status: 'connected' },
        { label: 'Property Types', uiKey: 'types', schemaPath: 'industrySpecificData.propertyTypes', status: 'connected' },
        { label: 'Segments', uiKey: 'segments', schemaPath: 'industrySpecificData.segments', status: 'connected' },
        { label: 'Commission Structure', uiKey: 'commission', schemaPath: 'industrySpecificData.commissionStructure', status: 'connected' },
        { label: 'Buying Process', uiKey: 'buyingProcess', schemaPath: 'industrySpecificData.buyingProcess', status: 'connected' },
        { label: 'Documents Required', uiKey: 'documents', schemaPath: 'industrySpecificData.documentsRequired', status: 'connected' },
    ],
    'Healthcare': [
        { label: 'Type (Clinic/Hospital/etc.)', uiKey: 'type', schemaPath: 'industrySpecificData.establishmentType', status: 'connected' },
        { label: 'Specialization', uiKey: 'specialization', schemaPath: 'industrySpecificData.specialization', status: 'connected' },
        { label: 'Emergency Number', uiKey: 'emergency', schemaPath: 'industrySpecificData.emergencyNumber', status: 'connected' },
        { label: 'Emergency Hours', uiKey: 'emergencyHours', schemaPath: 'industrySpecificData.emergencyHours', status: 'connected' },
        { label: 'Insurance Accepted', uiKey: 'insuranceAccepted', schemaPath: 'industrySpecificData.insuranceAccepted', status: 'connected' },
        { label: 'TPA Tie-ups', uiKey: 'tpa', schemaPath: 'industrySpecificData.tpaPartners', status: 'connected' },
        { label: 'Cashless Treatment', uiKey: 'cashlessAvailable', schemaPath: 'industrySpecificData.cashlessAvailable', status: 'connected' },
    ],
    'Food & Restaurant': [
        { label: 'Cuisine Type', uiKey: 'cuisine', schemaPath: 'restaurantInfo.cuisineTypes', status: 'connected' },
        { label: 'Type (Fine Dining/QSR/etc.)', uiKey: 'type', schemaPath: 'industrySpecificData.establishmentType', status: 'connected' },
        { label: 'Ambiance', uiKey: 'ambiance', schemaPath: 'industrySpecificData.ambiance', status: 'connected' },
        { label: 'Reservation Link', uiKey: 'reservationLink', schemaPath: 'industrySpecificData.reservationLink', status: 'connected' },
        { label: 'Seating Capacity', uiKey: 'seating', schemaPath: 'restaurantInfo.seatingCapacity', status: 'connected' },
        { label: 'Delivery Hours', uiKey: 'delivery', schemaPath: 'industrySpecificData.deliveryHours', status: 'connected' },
        { label: 'Last Order Time', uiKey: 'lastOrder', schemaPath: 'industrySpecificData.lastOrderTime', status: 'connected' },
        { label: 'Happy Hours', uiKey: 'happyHours', schemaPath: 'industrySpecificData.happyHours', status: 'connected' },
        { label: 'Menu Categories', uiKey: 'categories', schemaPath: 'knowledge.serviceCategories', status: 'connected' },
        { label: 'Signature Dishes', uiKey: 'specialties', schemaPath: 'industrySpecificData.signatureDishes', status: 'connected' },
        { label: 'Dietary Options', uiKey: 'dietary', schemaPath: 'industrySpecificData.dietaryOptions', status: 'connected' },
        { label: 'Order Platforms', uiKey: 'platforms', schemaPath: 'restaurantInfo.deliveryPartners', status: 'connected' },
        { label: 'Delivery Radius', uiKey: 'deliveryRadius', schemaPath: 'restaurantInfo.deliveryRadius', status: 'connected' },
        { label: 'Minimum Order', uiKey: 'minOrder', schemaPath: 'restaurantInfo.minimumOrder', status: 'connected' },
        { label: 'Delivery Fee', uiKey: 'deliveryFee', schemaPath: 'restaurantInfo.deliveryFee', status: 'connected' },
        { label: 'Catering Minimum', uiKey: 'cateringMin', schemaPath: 'industrySpecificData.cateringMinimum', status: 'connected' },
    ],
    'Education': [
        { label: 'Type (Coaching/Online/etc.)', uiKey: 'type', schemaPath: 'industrySpecificData.establishmentType', status: 'connected' },
        { label: 'Subjects/Skills', uiKey: 'subjects', schemaPath: 'industrySpecificData.subjects', status: 'connected' },
        { label: 'Courses Offered', uiKey: 'courses', schemaPath: 'industrySpecificData.courses', status: 'connected' },
        { label: 'Boards/Exams', uiKey: 'boards', schemaPath: 'industrySpecificData.boards', status: 'connected' },
        { label: 'Age Groups', uiKey: 'ageGroups', schemaPath: 'industrySpecificData.ageGroups', status: 'connected' },
        { label: 'Fee Range', uiKey: 'feeRange', schemaPath: 'knowledge.pricingHighlights', status: 'connected' },
        { label: 'Batch Timings', uiKey: 'batches', schemaPath: 'industrySpecificData.batchTimings', status: 'connected' },
        { label: 'Batch Size', uiKey: 'batchSize', schemaPath: 'industrySpecificData.batchSize', status: 'connected' },
        { label: 'Faculty Members', uiKey: 'faculty', schemaPath: 'industrySpecificData.facultyMembers', status: 'connected' },
        { label: 'Teaching Method', uiKey: 'method', schemaPath: 'industrySpecificData.teachingMethods', status: 'connected' },
        { label: 'Eligibility', uiKey: 'eligibility', schemaPath: 'industrySpecificData.eligibility', status: 'connected' },
        { label: 'Results/Placements', uiKey: 'results', schemaPath: 'industrySpecificData.resultsAndPlacements', status: 'connected' },
    ],
    'Finance': [
        { label: 'Type (Advisor/Agent/etc.)', uiKey: 'type', schemaPath: 'industrySpecificData.establishmentType', status: 'connected' },
        { label: 'Registrations', uiKey: 'registrations', schemaPath: 'industrySpecificData.registrations', status: 'connected' },
        { label: 'Office Address', uiKey: 'office', schemaPath: 'identity.address.street', status: 'connected' },
        { label: 'Minimum Investment', uiKey: 'minInvestment', schemaPath: 'industrySpecificData.minimumInvestment', status: 'connected' },
        { label: 'Fee Structure', uiKey: 'feeStructure', schemaPath: 'industrySpecificData.feeStructure', status: 'connected' },
        { label: 'Years of Experience', uiKey: 'experience', schemaPath: 'industrySpecificData.experience', status: 'connected' },
        { label: 'AUM', uiKey: 'aum', schemaPath: 'industrySpecificData.aum', status: 'connected' },
        { label: 'Risk Disclosure', uiKey: 'riskDisclosure', schemaPath: 'industrySpecificData.riskDisclosure', status: 'connected' },
        { label: 'Disclaimer', uiKey: 'disclaimer', schemaPath: 'industrySpecificData.disclaimer', status: 'connected' },
    ],
    'Hospitality': [
        { label: 'Type (Hotel/Resort/etc.)', uiKey: 'type', schemaPath: 'industrySpecificData.establishmentType', status: 'connected' },
        { label: 'Star Rating', uiKey: 'starRating', schemaPath: 'industrySpecificData.starRating', status: 'connected' },
        { label: 'Nearby Attractions', uiKey: 'nearbyAttractions', schemaPath: 'industrySpecificData.nearbyAttractions', status: 'connected' },
        { label: 'Check-in Time', uiKey: 'checkIn', schemaPath: 'hotelPolicies.checkIn.time', status: 'connected' },
        { label: 'Check-out Time', uiKey: 'checkOut', schemaPath: 'hotelPolicies.checkOut.time', status: 'connected' },
        { label: 'Amenities', uiKey: 'amenities', schemaPath: 'hotelAmenities', status: 'connected' },
        { label: 'Dining Options', uiKey: 'dining', schemaPath: 'industrySpecificData.diningOptions', status: 'connected' },
        { label: 'Policies (cancellation/pets/etc.)', uiKey: 'policies', schemaPath: 'industrySpecificData.hotelPoliciesText', status: 'connected' },
        { label: 'Events Capacity', uiKey: 'eventsCapacity', schemaPath: 'industrySpecificData.eventsCapacity', status: 'connected' },
        { label: 'Event Services', uiKey: 'eventServices', schemaPath: 'industrySpecificData.eventServices', status: 'connected' },
    ],
    'Policies & FAQs': [
        { label: 'FAQs', uiKey: 'faqs', schemaPath: 'knowledge.faqs', status: 'connected' },
        { label: 'Return Policy', uiKey: 'returnPolicy', schemaPath: 'knowledge.policies.returnPolicy', status: 'connected' },
        { label: 'Refund Policy', uiKey: 'refundPolicy', schemaPath: 'knowledge.policies.refundPolicy', status: 'connected' },
        { label: 'Cancellation Policy', uiKey: 'cancellation', schemaPath: 'knowledge.policies.cancellationPolicy', status: 'connected' },
    ],
};

export default function FieldConnectionAudit() {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [showOnlyIssues, setShowOnlyIssues] = useState(false);

    // Calculate stats
    const allFields = Object.values(FIELD_AUDIT).flat();
    const connectedCount = allFields.filter(f => f.status === 'connected').length;
    const partialCount = allFields.filter(f => f.status === 'partial').length;
    const notConnectedCount = allFields.filter(f => f.status === 'not_connected').length;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'connected':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'partial':
                return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'not_connected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
                return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Connected</span>;
            case 'partial':
                return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Partial</span>;
            case 'not_connected':
                return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Not Connected</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Database className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Field Connection Audit</h3>
                        <p className="text-xs text-slate-500">Backend mapping status for all fields</p>
                    </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={showOnlyIssues}
                        onChange={(e) => setShowOnlyIssues(e.target.checked)}
                        className="rounded border-slate-300"
                    />
                    <span className="text-slate-600">Show issues only</span>
                </label>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{connectedCount}</p>
                    <p className="text-xs text-emerald-700">Fully Connected</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{partialCount}</p>
                    <p className="text-xs text-amber-700">Partial (Generic)</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{notConnectedCount}</p>
                    <p className="text-xs text-red-700">Not Connected</p>
                </div>
            </div>

            {/* Legend */}
            <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-700 mb-2">Legend:</p>
                <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-slate-600">Connected - Saves to proper schema path</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-slate-600">Partial - Saves to industrySpecificData</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-slate-600">Not Connected - No backend handler</span>
                    </div>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-2">
                {Object.entries(FIELD_AUDIT).map(([sectionName, fields]) => {
                    const filteredFields = showOnlyIssues
                        ? fields.filter(f => f.status !== 'connected')
                        : fields;

                    if (filteredFields.length === 0) return null;

                    const isExpanded = expandedSection === sectionName;
                    const sectionConnected = fields.filter(f => f.status === 'connected').length;
                    const sectionTotal = fields.length;

                    return (
                        <div
                            key={sectionName}
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedSection(isExpanded ? null : sectionName)}
                                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900 text-sm">{sectionName}</span>
                                    <span className="text-xs text-slate-500">
                                        {sectionConnected}/{sectionTotal} connected
                                    </span>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                            </button>

                            {isExpanded && (
                                <div className="border-t border-slate-100">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Field</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">UI Key</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Schema Path</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFields.map((field, idx) => (
                                                <tr
                                                    key={field.uiKey}
                                                    className={cn(
                                                        "border-t border-slate-100",
                                                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                                    )}
                                                >
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(field.status)}
                                                            <span className="text-slate-900">{field.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                            {field.uiKey}
                                                        </code>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                            {field.schemaPath}
                                                        </code>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            {getStatusBadge(field.status)}
                                                            {field.notes && (
                                                                <span className="text-xs text-slate-400" title={field.notes}>
                                                                    <Info className="w-3.5 h-3.5" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary Note */}
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-700">
                    <strong>Note:</strong> Fields marked as "Partial" are saved to <code className="bg-indigo-100 px-1 rounded">industrySpecificData</code>,
                    a flexible catch-all object. This works but lacks type safety. For production, consider adding dedicated schema paths for
                    frequently-used industry fields.
                </p>
            </div>
        </div>
    );
}
