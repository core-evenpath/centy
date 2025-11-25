export interface PlatformMetaConfig {
    appId: string;
    encryptedAppSecret: string;
    verifyToken: string;
    webhookUrl: string;
    updatedAt: string;
    updatedBy: string;
}

export interface PlatformConfig {
    meta: PlatformMetaConfig;
}
