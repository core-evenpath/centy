// src/app/api/admin/early-access/route.ts
import { NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    // Check for authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json({ 
        error: 'Unauthorized: Missing token',
        details: 'Authorization header is required'
      }, { status: 401 });
    }

    // Extract and verify token
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (tokenError: any) {
      console.error('Token verification failed:', tokenError);
      return NextResponse.json({ 
        error: 'Unauthorized: Invalid token',
        details: tokenError.message
      }, { status: 401 });
    }

    // Check user role
    const userRole = decodedToken.role;
    const allowedRoles = ['Admin', 'Super Admin'];
    
    if (!allowedRoles.includes(userRole)) {
      console.error(`Forbidden: User role "${userRole}" does not have permission`);
      return NextResponse.json({ 
        error: 'Forbidden: Insufficient permissions',
        details: `Your role (${userRole}) does not have access to this resource`
      }, { status: 403 });
    }

    // Check database configuration
    if (!db) {
      console.error('Database not configured - Firebase Admin SDK not initialized');
      return NextResponse.json({ 
        error: 'Database not configured',
        details: 'Firebase Admin SDK is not properly initialized'
      }, { status: 500 });
    }

    // Fetch early access signups
    console.log('Fetching early access signups...');
    
    const signupsSnapshot = await db.collection('earlyAccessSignups')
      .orderBy('createdAt', 'desc')
      .limit(50) // Increased from 5 to get more results
      .get();

    console.log(`Found ${signupsSnapshot.size} signups`);
      
    const signups = signupsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        createdAt: data.createdAt ? {
          seconds: data.createdAt._seconds || data.createdAt.seconds,
          nanoseconds: data.createdAt._nanoseconds || data.createdAt.nanoseconds
        } : null
      };
    });

    return NextResponse.json({ 
      success: true,
      signups,
      count: signups.length 
    });

  } catch (error: any) {
    console.error('Error fetching early access signups:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ 
        error: 'Unauthorized: Invalid token',
        details: 'Your session has expired. Please log in again.'
      }, { status: 401 });
    }

    // Handle Firestore index error
    if (error.code === 9 || error.message?.includes('index')) {
      return NextResponse.json({ 
        error: 'Database index required',
        details: 'A Firestore index is required for this query. Check the Firebase Console for an index creation link.',
        indexInfo: {
          collection: 'earlyAccessSignups',
          field: 'createdAt',
          order: 'DESCENDING'
        }
      }, { status: 500 });
    }

    // Handle permission errors
    if (error.code === 7 || error.message?.includes('permission')) {
      return NextResponse.json({ 
        error: 'Permission denied',
        details: 'Firebase Admin SDK does not have permission to access this collection.'
      }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}

// Optional: Add a POST endpoint to manually trigger index creation check
export async function POST(request: Request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (decodedToken.role !== 'Admin' && decodedToken.role !== 'Super Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all signups without ordering to check if data exists
    const allSignupsSnapshot = await db.collection('earlyAccessSignups')
      .limit(5)
      .get();

    const signupsWithoutOrder = allSignupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      message: 'Signups fetched without ordering',
      signups: signupsWithoutOrder,
      note: 'If this works but GET fails, you need to create a Firestore index'
    });

  } catch (error: any) {
    console.error('Error in POST test:', error);
    return NextResponse.json({ 
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}