import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ success: false, message: 'Database not configured' }, { status: 500 });
    }

    const logsSnapshot = await db
      .collection('webhookLogs')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null
    }));

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Error fetching webhook logs:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (!db) {
      return NextResponse.json({ success: false, message: 'Database not configured' }, { status: 500 });
    }

    const logsSnapshot = await db.collection('webhookLogs').get();
    const batch = db.batch();
    
    logsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({ success: true, message: 'Logs cleared', deletedCount: logsSnapshot.size });
  } catch (error: any) {
    console.error('Error clearing logs:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}