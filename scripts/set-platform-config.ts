import { savePlatformMetaConfig } from '../src/actions/admin-platform-actions';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

(async () => {
    try {
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN;
        const webhookUrl = process.env.META_WHATSAPP_WEBHOOK_URL;
        const userId = process.env.NEXT_PUBLIC_FIREBASE_AUTH_UID || 'admin-setup';

        if (!appId || !appSecret || !verifyToken || !webhookUrl) {
            console.error('❌ Missing required env vars. Please set META_APP_ID, META_APP_SECRET, META_WHATSAPP_VERIFY_TOKEN, META_WHATSAPP_WEBHOOK_URL');
            process.exit(1);
        }

        const result = await savePlatformMetaConfig({
            appId,
            appSecret,
            verifyToken,
            webhookUrl,
            userId,
        });
        console.log('✅ Platform config save result:', result);
    } catch (err) {
        console.error('❌ Error saving platform config:', err);
    }
})();
