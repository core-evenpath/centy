export interface EmbeddedSignupResponse {
    authResponse: {
        code: string;
        userID?: string;
        expiresIn?: number;
        accessToken?: string;
    } | null;
    status: 'connected' | 'not_authorized' | 'unknown';
}

export interface EmbeddedSignupSessionInfo {
    type: 'WA_EMBEDDED_SIGNUP';
    data: {
        phone_number_id: string;
        waba_id: string;
    };
    event: 'FINISH' | 'CANCEL' | 'ERROR';
    version: number;
}

export interface TokenExchangeResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
}

export interface TokenExchangeError {
    error: {
        message: string;
        type: string;
        code: number;
        fbtrace_id: string;
    };
}

export interface WABASubscribeResponse {
    success: boolean;
}

export interface PhoneNumberDetails {
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
    code_verification_status?: 'VERIFIED' | 'NOT_VERIFIED';
    platform_type?: string;
    name_status?: string;
}

export interface WABADetails {
    id: string;
    name: string;
    timezone_id: string;
    message_template_namespace: string;
    account_review_status?: string;
    business_verification_status?: string;
    phone_numbers?: {
        data: PhoneNumberDetails[];
    };
}

export interface EmbeddedSignupCompleteInput {
    partnerId: string;
    code: string;
    wabaId: string;
    phoneNumberId: string;
}

export interface EmbeddedSignupCompleteResult {
    success: boolean;
    message: string;
    verifyToken?: string;
}

export interface MetaEmbeddedConfig {
    phoneNumberId: string;
    wabaId: string;
    encryptedAccessToken: string;
    verifyToken: string;
    displayPhoneNumber: string;
    verifiedName?: string;
    qualityRating?: string;
    webhookConfigured: boolean;
    status: 'pending' | 'active' | 'disconnected' | 'error';
    integrationType: 'embedded_signup';
    lastVerifiedAt?: string;
    tokenExpiresAt?: string;
    createdAt: string;
    updatedAt: string;
}

declare global {
    interface Window {
        fbAsyncInit: () => void;
        FB: {
            init: (params: {
                appId: string;
                autoLogAppEvents: boolean;
                xfbml: boolean;
                version: string;
            }) => void;
            login: (
                callback: (response: EmbeddedSignupResponse) => void,
                options: {
                    config_id: string;
                    response_type: string;
                    override_default_response_type: boolean;
                    extras: {
                        version: string;
                    };
                }
            ) => void;
            getLoginStatus: (callback: (response: EmbeddedSignupResponse) => void) => void;
            logout: (callback: () => void) => void;
        };
    }
}

export { };
