import { db } from '../src/lib/firebase-admin';

(async () => {
    try {
        const doc = await db.collection('system').doc('platform_config').get();
        if (!doc.exists) {
            console.log('⚠️ No platform_config document found');
            return;
        }
        const data = doc.data();
        console.log('🛠️ Platform Meta Config:');
        console.log(JSON.stringify(data?.meta ?? null, null, 2));
    } catch (err) {
        console.error('❌ Error fetching platform config:', err);
    }
})();
