
import { NextRequest, NextResponse } from 'next/server';
import { seedAllModuleData } from '@/lib/modules/seed-modules';
import { bulkGenerateModulesAction } from '@/actions/module-ai-actions';
import { DEFAULT_BULK_CONFIG } from '@/lib/modules/constants';

export async function POST(request: NextRequest) {
    try {
        // Auth check would go here in real app
        // const authHeader = request.headers.get('Authorization');
        // if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) { ... }

        const body = await request.json().catch(() => ({}));
        const useAI = body.useAI ?? false;
        const countryCode = body.countryCode ?? 'IN';

        if (useAI) {
            // Use AI to generate modules
            const result = await bulkGenerateModulesAction(
                { ...DEFAULT_BULK_CONFIG, countryCode },
                'system'
            );

            return NextResponse.json({
                success: result.success,
                method: 'ai',
                data: {
                    generated: result.generated.length,
                    failed: result.failed.length,
                    details: result,
                }
            });
        } else {
            // Use seed data (static)
            const result = await seedAllModuleData();

            return NextResponse.json({
                success: result.success,
                method: 'seed',
                data: {
                    modules: result.modules,
                    assignments: result.assignments,
                }
            });
        }
    } catch (error) {
        console.error('Seed modules error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
