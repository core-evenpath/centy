/**
 * SettingsBackendService
 *
 * A flexible backend service for managing partner settings with:
 * - Field-level updates with validation
 * - Document import capabilities
 * - Inbox context synchronization
 * - Event-driven architecture for real-time updates
 */

import type { BusinessPersona, SetupProgress } from '@/lib/business-persona-types';

// ============================================
// Types & Interfaces
// ============================================

export interface FieldUpdate {
    path: string;
    value: any;
    timestamp: Date;
    source: 'manual' | 'ai' | 'import';
}

export interface UpdateResult {
    success: boolean;
    message: string;
    setupProgress?: SetupProgress;
    updatedFields?: string[];
}

export interface ImportResult {
    success: boolean;
    message: string;
    importedFields: string[];
    extractedData?: Record<string, any>;
}

export interface SyncStatus {
    lastSync: Date | null;
    pendingChanges: number;
    inboxContextUpdated: boolean;
}

export type FieldChangeListener = (field: string, value: any, source: string) => void;

// ============================================
// Field Validation Rules
// ============================================

const FIELD_VALIDATORS: Record<string, (value: any) => { valid: boolean; message?: string }> = {
    'identity.name': (value) => ({
        valid: typeof value === 'string' && value.trim().length >= 2,
        message: 'Business name must be at least 2 characters',
    }),
    'identity.email': (value) => ({
        valid: !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Invalid email format',
    }),
    'identity.phone': (value) => ({
        valid: !value || /^[+\d\s()-]{7,20}$/.test(value),
        message: 'Invalid phone number format',
    }),
    'identity.website': (value) => ({
        valid: !value || /^https?:\/\/.+/.test(value),
        message: 'Website must start with http:// or https://',
    }),
    'personality.description': (value) => ({
        valid: !value || (typeof value === 'string' && value.length <= 2000),
        message: 'Description must be under 2000 characters',
    }),
};

// ============================================
// Field Path Mappings (UI Key -> Schema Path)
// ============================================

export const FIELD_PATH_MAPPINGS: Record<string, string> = {
    // Identity
    'name': 'identity.name',
    'businessName': 'identity.name',
    'tagline': 'personality.tagline',
    'description': 'personality.description',
    'founded': 'industrySpecificData.founded',
    'teamSize': 'industrySpecificData.teamSize',
    'usps': 'personality.uniqueSellingPoints',

    // Contact
    'phone': 'identity.phone',
    'whatsapp': 'identity.whatsAppNumber',
    'email': 'identity.email',
    'website': 'identity.website',
    'address': 'identity.address.street',
    'city': 'identity.address.city',
    'state': 'identity.address.state',
    'serviceAreas': 'identity.serviceArea',

    // Operating Hours
    'hoursType': 'identity.operatingHours.specialNote',
    'schedule': 'identity.operatingHours.schedule',
    'responseTime': 'personality.responseTimeExpectation',
    'bookingLink': 'industrySpecificData.bookingLink',

    // Services/Products
    'services': 'knowledge.productsOrServices',
    'products': 'knowledge.productsOrServices',
    'pricing': 'knowledge.pricingHighlights',
    'paymentMethods': 'knowledge.acceptedPayments',

    // Credentials
    'certifications': 'knowledge.certifications',
    'awards': 'knowledge.awards',
    'faqs': 'knowledge.faqs',

    // Policies
    'returnPolicy': 'knowledge.policies.returnPolicy',
    'refundPolicy': 'knowledge.policies.refundPolicy',
    'cancellation': 'knowledge.policies.cancellationPolicy',
};

// ============================================
// Service Class
// ============================================

class SettingsBackendService {
    private listeners: Map<string, Set<FieldChangeListener>> = new Map();
    private updateQueue: FieldUpdate[] = [];
    private isProcessing = false;

    /**
     * Resolve a simplified field key to its full schema path
     */
    resolveFieldPath(fieldKey: string): string {
        return FIELD_PATH_MAPPINGS[fieldKey] || fieldKey;
    }

    /**
     * Validate a field value before saving
     */
    validateField(path: string, value: any): { valid: boolean; message?: string } {
        const validator = FIELD_VALIDATORS[path];
        if (!validator) {
            return { valid: true }; // No validator = always valid
        }
        return validator(value);
    }

    /**
     * Register a listener for field changes
     */
    onFieldChange(field: string | '*', listener: FieldChangeListener): () => void {
        if (!this.listeners.has(field)) {
            this.listeners.set(field, new Set());
        }
        this.listeners.get(field)!.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.get(field)?.delete(listener);
        };
    }

    /**
     * Notify listeners of a field change
     */
    notifyListeners(field: string, value: any, source: string) {
        // Notify specific field listeners
        this.listeners.get(field)?.forEach(listener => {
            listener(field, value, source);
        });

        // Notify wildcard listeners
        this.listeners.get('*')?.forEach(listener => {
            listener(field, value, source);
        });
    }

    /**
     * Queue an update for processing
     */
    queueUpdate(update: FieldUpdate) {
        this.updateQueue.push(update);
        this.notifyListeners(update.path, update.value, update.source);
    }

    /**
     * Get all pending updates
     */
    getPendingUpdates(): FieldUpdate[] {
        return [...this.updateQueue];
    }

    /**
     * Clear the update queue
     */
    clearQueue() {
        this.updateQueue = [];
    }

    /**
     * Build a nested update object from a flat path
     */
    buildUpdateObject(path: string, value: any): Record<string, any> {
        const keys = path.split('.');
        const result: any = {};

        if (keys.length === 1) {
            result[keys[0]] = value;
        } else {
            let current = result;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        }

        return result;
    }

    /**
     * Extract a value from a nested object using a path
     */
    getValueFromPath(obj: any, path: string): any {
        const keys = path.split('.');
        let current = obj;

        for (const key of keys) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }

        return current;
    }

    /**
     * Set a value in a nested object using a path (mutates the object)
     */
    setValueAtPath(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
    }

    /**
     * Deep merge two objects
     */
    deepMerge(target: any, source: any): any {
        const result = { ...target };

        for (const key of Object.keys(source)) {
            if (
                source[key] !== null &&
                typeof source[key] === 'object' &&
                !Array.isArray(source[key]) &&
                target[key] !== null &&
                typeof target[key] === 'object' &&
                !Array.isArray(target[key])
            ) {
                result[key] = this.deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Calculate field completion for a section
     */
    calculateSectionCompletion(
        persona: Partial<BusinessPersona>,
        fields: Array<{ key: string; required?: boolean }>
    ): { filled: number; total: number; percentage: number } {
        let filled = 0;
        let total = 0;

        fields.forEach(field => {
            total++;
            const path = this.resolveFieldPath(field.key);
            const value = this.getValueFromPath(persona, path);

            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value) && value.length > 0) filled++;
                else if (typeof value === 'string' && value.trim().length > 0) filled++;
                else if (typeof value === 'object' && Object.keys(value).length > 0) filled++;
                else if (typeof value === 'boolean' || typeof value === 'number') filled++;
            }
        });

        return {
            filled,
            total,
            percentage: total > 0 ? Math.round((filled / total) * 100) : 100,
        };
    }

    /**
     * Generate a summary of the business persona for AI context
     */
    generatePersonaSummary(persona: Partial<BusinessPersona>): string {
        const parts: string[] = [];
        const identity = persona.identity;
        const personality = persona.personality;
        const knowledge = persona.knowledge;

        // Business Identity
        if (identity?.name) parts.push(`Business: ${identity.name}`);
        if (personality?.tagline) parts.push(`Tagline: ${personality.tagline}`);
        if (identity?.industry?.name) parts.push(`Industry: ${identity.industry.name}`);

        // Contact Info
        if (identity?.phone) parts.push(`Phone: ${identity.phone}`);
        if (identity?.email) parts.push(`Email: ${identity.email}`);
        if (identity?.website) parts.push(`Website: ${identity.website}`);
        if (identity?.address?.city && identity?.address?.state) {
            parts.push(`Location: ${identity.address.city}, ${identity.address.state}`);
        }

        // Description
        if (personality?.description) {
            parts.push(`About: ${personality.description.substring(0, 200)}...`);
        }

        // USPs
        if (personality?.uniqueSellingPoints?.length) {
            parts.push(`Specialties: ${personality.uniqueSellingPoints.slice(0, 5).join(', ')}`);
        }

        // Products/Services
        if (knowledge?.productsOrServices?.length) {
            const productNames = knowledge.productsOrServices
                .slice(0, 5)
                .map(p => p.name)
                .filter(Boolean);
            if (productNames.length > 0) {
                parts.push(`Offerings: ${productNames.join(', ')}`);
            }
        }

        // Operating Hours
        if (identity?.operatingHours?.isOpen24x7) {
            parts.push('Hours: Open 24/7');
        } else if (identity?.operatingHours?.appointmentOnly) {
            parts.push('Hours: By appointment only');
        }

        return parts.join('\n');
    }

    /**
     * Check if inbox context needs to be refreshed based on changed fields
     */
    shouldRefreshInboxContext(changedFields: string[]): boolean {
        const inboxRelevantFields = [
            'identity.name',
            'identity.phone',
            'identity.email',
            'identity.website',
            'identity.address',
            'identity.operatingHours',
            'personality.description',
            'personality.tagline',
            'personality.voiceTone',
            'personality.uniqueSellingPoints',
            'knowledge.productsOrServices',
            'knowledge.faqs',
            'knowledge.policies',
        ];

        return changedFields.some(field =>
            inboxRelevantFields.some(relevant =>
                field.startsWith(relevant) || relevant.startsWith(field)
            )
        );
    }

    /**
     * Get fields that map to specific inbox AI behaviors
     */
    getInboxContextFields(): Record<string, string> {
        return {
            'identity.name': 'Business name used in greetings',
            'identity.phone': 'Contact number provided to customers',
            'identity.email': 'Support email for escalations',
            'identity.operatingHours': 'Availability responses',
            'personality.voiceTone': 'AI response tone and style',
            'knowledge.faqs': 'Quick answers to common questions',
            'knowledge.productsOrServices': 'Product/service information',
            'knowledge.policies': 'Policy-related responses',
        };
    }
}

// Export singleton instance
export const settingsBackendService = new SettingsBackendService();

// Export class for testing
export { SettingsBackendService };
