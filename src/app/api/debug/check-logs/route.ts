import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    if (!db) {
        return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    try {
        const logsSnapshot = await db.collection('webhookLogs')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        const logs = logsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const mappingsSnapshot = await db.collection('metaPhoneMappings').get();
        const mappings = mappingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({
            webhookLogs: logs,
            phoneMappings: mappings
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
