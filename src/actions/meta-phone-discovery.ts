'use server';

import { decrypt } from '@/lib/encryption';
import { getPartnerMetaConfig } from '@/lib/meta-whatsapp-service';

interface PhoneNumberInfo {
    id: string; // Phone Number ID
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
    code_verification_status?: string;
}

interface FetchPhoneNumbersResult {
    success: boolean;
    message: string;
    phoneNumbers?: PhoneNumberInfo[];
}

export async function fetchWABAPhoneNumbers(
    partnerId: string,
    wabaId: string,
    accessToken?: string
): Promise<FetchPhoneNumbersResult> {
    try {
        // If no access token provided, fetch from saved config
        let token = accessToken;
        if (!token) {
            const config = await getPartnerMetaConfig(partnerId);
            if (!config) {
                return {
                    success: false,
                    message: 'WhatsApp configuration not found'
                };
            }
            token = decrypt(config.encryptedAccessToken);
        }

        const response = await fetch(
            `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Failed to fetch phone numbers:', data);
            return {
                success: false,
                message: data.error?.message || 'Failed to fetch phone numbers'
            };
        }

        console.log('✅ Phone numbers fetched:', data.data);

        return {
            success: true,
            message: 'Phone numbers retrieved successfully',
            phoneNumbers: data.data || []
        };

    } catch (error: any) {
        console.error('❌ Error fetching phone numbers:', error);
        return {
            success: false,
            message: error.message || 'Failed to fetch phone numbers'
        };
    }
}

export async function selectPhoneNumber(
    partnerId: string,
    phoneNumberId: string,
    displayPhoneNumber: string
): Promise<{ success: boolean; message: string }> {
    try {
        const config = await getPartnerMetaConfig(partnerId);

        if (!config) {
            return {
                success: false,
                message: 'WhatsApp configuration not found'
            };
        }

        // Update the configuration with the selected phone number
        const { connectMetaWhatsApp } = await import('./meta-whatsapp-actions');

        const result = await connectMetaWhatsApp(partnerId, {
            phoneNumberId,
            wabaId: config.wabaId,
            accessToken: decrypt(config.encryptedAccessToken),
            displayPhoneNumber,
            businessName: config.businessName
        });

        return result;

    } catch (error: any) {
        console.error('❌ Error selecting phone number:', error);
        return {
            success: false,
            message: error.message || 'Failed to select phone number'
        };
    }
}
