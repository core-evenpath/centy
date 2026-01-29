// src/app/api/admin/seed-taxonomy/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { seedSystemTaxonomy, verifyTaxonomySeeding } from '@/actions/seed-taxonomy-actions';

/**
 * POST /api/admin/seed-taxonomy
 * Seeds all systemTaxonomy collections
 * Requires Admin or Super Admin authentication
 */
export async function POST(request: Request) {
    try {
        // Get and verify authorization
        const headersList = await headers();
        const authHeader = headersList.get('authorization');

        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized', details: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;

        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (error: any) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Unauthorized', details: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Check authorization - Admin, Super Admin, or core@suupe.com
        const userRole = decodedToken.role;
        const userEmail = decodedToken.email;
        const isAuthorized =
            userRole === 'Admin' ||
            userRole === 'Super Admin' ||
            userEmail === 'core@suupe.com';

        if (!isAuthorized) {
            console.error(
                `Forbidden: User ${userEmail} with role "${userRole}" attempted to seed taxonomy`
            );
            return NextResponse.json(
                {
                    error: 'Forbidden',
                    details: `Your role (${userRole}) does not have permission to seed taxonomy`,
                },
                { status: 403 }
            );
        }

        console.log(`Seeding taxonomy initiated by ${userEmail} (${userRole})`);

        // Execute seeding
        const result = await seedSystemTaxonomy();

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    summary: result.summary,
                    errors: result.errors,
                    message: 'Seeding completed with errors',
                },
                { status: 207 } // Multi-Status
            );
        }

        return NextResponse.json({
            success: true,
            summary: result.summary,
            message: 'Taxonomy seeded successfully',
        });
    } catch (error: any) {
        console.error('Error in seed-taxonomy POST:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                details: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/seed-taxonomy
 * Verifies taxonomy seeding by counting documents
 * Requires Admin or Super Admin authentication
 */
export async function GET(request: Request) {
    try {
        // Get and verify authorization
        const headersList = await headers();
        const authHeader = headersList.get('authorization');

        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized', details: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;

        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (error: any) {
            console.error('Token verification failed:', error);
            return NextResponse.json(
                { error: 'Unauthorized', details: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Check authorization - Admin, Super Admin, or core@suupe.com
        const userRole = decodedToken.role;
        const userEmail = decodedToken.email;
        const isAuthorized =
            userRole === 'Admin' ||
            userRole === 'Super Admin' ||
            userEmail === 'core@suupe.com';

        if (!isAuthorized) {
            console.error(
                `Forbidden: User ${userEmail} with role "${userRole}" attempted to verify taxonomy`
            );
            return NextResponse.json(
                {
                    error: 'Forbidden',
                    details: `Your role (${userRole}) does not have permission to verify taxonomy`,
                },
                { status: 403 }
            );
        }

        console.log(`Verifying taxonomy by ${userEmail} (${userRole})`);

        // Execute verification
        const result = await verifyTaxonomySeeding();

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            counts: result.counts,
            message: 'Taxonomy verified successfully',
        });
    } catch (error: any) {
        console.error('Error in seed-taxonomy GET:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                details: error.message,
            },
            { status: 500 }
        );
    }
}
