'use server';

import { getPartnerMetaConfig } from '@/lib/meta-whatsapp-service';
import { decrypt } from '@/lib/encryption';

interface RequestCodeInput {
    partnerId: string;
    codeMethod: 'SMS' | 'VOICE';
    language?: string;
}

interface RequestCodeResult {
    success: boolean;
    message: string;
}

interface VerifyCodeInput {
    partnerId: string;
    code: string;
}

interface VerifyCodeResult {
    success: boolean;
    message: string;
}

export async function requestVerificationCode(
    input: RequestCodeInput
): Promise<RequestCodeResult> {
    try {
        const config = await getPartnerMetaConfig(input.partnerId);

        if (!config) {
            return {
                success: false,
                message: 'WhatsApp configuration not found'
            };
        }

        const accessToken = decrypt(config.encryptedAccessToken);

        const response = await fetch(
            `https://graph.facebook.com/v18.0/${config.phoneNumberId}/request_code`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code_method: input.codeMethod,
                    language: input.language || 'en'
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Request code failed:', data);

            // More detailed error message
            let errorMessage = 'Failed to request verification code';
            if (data.error?.message) {
                errorMessage = data.error.message;
            }
            if (data.error?.error_user_msg) {
                errorMessage = data.error.error_user_msg;
            }

            console.error('Full error details:', {
                message: data.error?.message,
                type: data.error?.type,
                code: data.error?.code,
                error_subcode: data.error?.error_subcode,
                fbtrace_id: data.error?.fbtrace_id
            });

            return {
                success: false,
                message: errorMessage
            };
        }

        console.log('✅ Verification code requested:', data);

        return {
            success: true,
            message: `Verification code sent via ${input.codeMethod}. Please check your phone.`
        };

    } catch (error: any) {
        console.error('❌ Error requesting verification code:', error);
        return {
            success: false,
            message: error.message || 'Failed to request verification code'
        };
    }
}

export async function verifyPhoneCode(
    input: VerifyCodeInput
): Promise<VerifyCodeResult> {
    try {
        const config = await getPartnerMetaConfig(input.partnerId);

        if (!config) {
            return {
                success: false,
                message: 'WhatsApp configuration not found'
            };
        }

        const accessToken = decrypt(config.encryptedAccessToken);

        const response = await fetch(
            `https://graph.facebook.com/v18.0/${config.phoneNumberId}/verify_code`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: input.code
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Verify code failed:', data);
            return {
                success: false,
                message: data.error?.message || 'Invalid verification code'
            };
        }

        console.log('✅ Phone number verified successfully:', data);

        return {
            success: true,
            message: 'Phone number verified successfully!'
        };

    } catch (error: any) {
        console.error('❌ Error verifying code:', error);
        return {
            success: false,
            message: error.message || 'Failed to verify code'
        };
    }
}
