'use server';

import { getPartnerMetaConfig } from '@/lib/meta-whatsapp-service';
import { decrypt } from '@/lib/encryption';

interface PhoneStatusResult {
    success: boolean;
    message: string;
    status?: {
        display_phone_number: string;
        verified_name: string;
        code_verification_status: string;
        quality_rating: string;
        id: string;
    };
}

export async function checkPhoneStatus(
    partnerId: string
): Promise<PhoneStatusResult> {
    try {
        const config = await getPartnerMetaConfig(partnerId);

        if (!config || !config.phoneNumberId || config.phoneNumberId === 'pending') {
            return {
                success: false,
                message: 'Phone number not configured'
            };
        }

        const accessToken = decrypt(config.encryptedAccessToken);

        const response = await fetch(
            `https://graph.facebook.com/v18.0/${config.phoneNumberId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Failed to check phone status:', data);
            return {
                success: false,
                message: data.error?.message || 'Failed to check phone status'
            };
        }

        console.log('✅ Phone status:', data);

        return {
            success: true,
            message: 'Phone status retrieved',
            status: data
        };

    } catch (error: any) {
        console.error('❌ Error checking phone status:', error);
        return {
            success: false,
            message: error.message || 'Failed to check phone status'
        };
    }
}
