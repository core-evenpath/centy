import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { decrypt } from '@/lib/encryption';

const META_API_VERSION = 'v18.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

interface DiagnosticCheck {
    status: 'pass' | 'fail' | 'warn' | 'skip';
    message: string;
    details?: any;
}

interface ComprehensiveDiagnostics {
    timestamp: string;
    partnerId: string | null;
    summary: {
        totalChecks: number;
        passed: number;
        failed: number;
        warnings: number;
    };
    checks: {
        environment: DiagnosticCheck;
        database: DiagnosticCheck;
        partnerConfig: DiagnosticCheck;
        accessToken: DiagnosticCheck;
        phoneNumberStatus: DiagnosticCheck;
        phoneRegistration: DiagnosticCheck;
        webhookConfig: DiagnosticCheck;
        wabaStatus: DiagnosticCheck;
        phoneMappings: DiagnosticCheck;
        recentWebhookLogs: DiagnosticCheck;
    };
    rawData: {
        config?: any;
        metaPhoneResponse?: any;
        metaWabaResponse?: any;
        recentLogs?: any[];
        phoneMappings?: any[];
    };
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');

    const diagnostics: ComprehensiveDiagnostics = {
        timestamp: new Date().toISOString(),
        partnerId,
        summary: { totalChecks: 0, passed: 0, failed: 0, warnings: 0 },
        checks: {
            environment: { status: 'skip', message: 'Not checked' },
            database: { status: 'skip', message: 'Not checked' },
            partnerConfig: { status: 'skip', message: 'Not checked' },
            accessToken: { status: 'skip', message: 'Not checked' },
            phoneNumberStatus: { status: 'skip', message: 'Not checked' },
            phoneRegistration: { status: 'skip', message: 'Not checked' },
            webhookConfig: { status: 'skip', message: 'Not checked' },
            wabaStatus: { status: 'skip', message: 'Not checked' },
            phoneMappings: { status: 'skip', message: 'Not checked' },
            recentWebhookLogs: { status: 'skip', message: 'Not checked' },
        },
        rawData: {},
    };

    // 1. Check Environment Variables
    const envCheck = checkEnvironment();
    diagnostics.checks.environment = envCheck;

    // 2. Check Database Connection
    if (!db) {
        diagnostics.checks.database = {
            status: 'fail',
            message: 'Database not connected - Firebase Admin SDK not initialized',
        };
        return finalizeResponse(diagnostics);
    }
    diagnostics.checks.database = {
        status: 'pass',
        message: 'Firebase Admin SDK connected',
    };

    if (!partnerId) {
        return finalizeResponse(diagnostics);
    }

    try {
        // 3. Check Partner Configuration
        const partnerDoc = await db.collection('partners').doc(partnerId).get();

        if (!partnerDoc.exists) {
            diagnostics.checks.partnerConfig = {
                status: 'fail',
                message: `Partner not found: ${partnerId}`,
            };
            return finalizeResponse(diagnostics);
        }

        const partnerData = partnerDoc.data();
        const config = partnerData?.metaWhatsAppConfig;

        if (!config) {
            diagnostics.checks.partnerConfig = {
                status: 'fail',
                message: 'No WhatsApp configuration found for this partner',
            };
            return finalizeResponse(diagnostics);
        }

        // Store sanitized config (no secrets)
        diagnostics.rawData.config = {
            status: config.status,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId,
            displayPhoneNumber: config.displayPhoneNumber,
            verifiedName: config.verifiedName,
            qualityRating: config.qualityRating,
            integrationType: config.integrationType,
            webhookConfigured: config.webhookConfigured,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
            hasEncryptedToken: !!config.encryptedAccessToken,
            tokenLength: config.encryptedAccessToken?.length || 0,
        };

        diagnostics.checks.partnerConfig = {
            status: config.status === 'active' ? 'pass' : 'warn',
            message: `Configuration found - Status: ${config.status}`,
            details: {
                status: config.status,
                phoneNumberId: config.phoneNumberId,
                wabaId: config.wabaId,
                displayPhoneNumber: config.displayPhoneNumber,
            },
        };

        // 4. Check Access Token
        let decryptedToken: string | null = null;
        try {
            if (!config.encryptedAccessToken) {
                diagnostics.checks.accessToken = {
                    status: 'fail',
                    message: 'No access token stored',
                };
            } else {
                decryptedToken = decrypt(config.encryptedAccessToken);
                if (!decryptedToken || decryptedToken.length < 50) {
                    diagnostics.checks.accessToken = {
                        status: 'fail',
                        message: 'Access token appears invalid (too short or empty)',
                        details: { tokenLength: decryptedToken?.length || 0 },
                    };
                } else {
                    diagnostics.checks.accessToken = {
                        status: 'pass',
                        message: 'Access token decrypted successfully',
                        details: {
                            tokenLength: decryptedToken.length,
                            tokenPreview: `${decryptedToken.substring(0, 10)}...${decryptedToken.substring(decryptedToken.length - 10)}`,
                        },
                    };
                }
            }
        } catch (err: any) {
            diagnostics.checks.accessToken = {
                status: 'fail',
                message: `Failed to decrypt access token: ${err.message}`,
            };
        }

        // 5. Check Phone Number Status at Meta
        if (decryptedToken && config.phoneNumberId) {
            try {
                const phoneResponse = await fetch(
                    `${META_API_BASE}/${config.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,name_status,is_official_business_account`,
                    {
                        headers: { Authorization: `Bearer ${decryptedToken}` },
                    }
                );

                const phoneData = await phoneResponse.json();
                diagnostics.rawData.metaPhoneResponse = phoneData;

                if (!phoneResponse.ok) {
                    const errorCode = phoneData.error?.code;
                    const errorMessage = phoneData.error?.message || 'Unknown error';

                    let statusMessage = `Meta API Error: ${errorMessage}`;
                    let status: 'fail' | 'warn' = 'fail';

                    // Known error codes
                    if (errorCode === 33) {
                        statusMessage = 'Phone number has been DELETED from Meta. You need to reconnect WhatsApp.';
                    } else if (errorCode === 190) {
                        statusMessage = 'Access token is invalid or expired. You need to reconnect WhatsApp.';
                    } else if (errorCode === 100) {
                        statusMessage = 'Phone number ID does not exist or is inaccessible.';
                    } else if (errorCode === 133010) {
                        statusMessage = 'Phone number is not registered. Registration required.';
                        status = 'warn';
                    }

                    diagnostics.checks.phoneNumberStatus = {
                        status,
                        message: statusMessage,
                        details: { errorCode, errorMessage },
                    };
                } else {
                    diagnostics.checks.phoneNumberStatus = {
                        status: 'pass',
                        message: 'Phone number is active at Meta',
                        details: {
                            displayPhoneNumber: phoneData.display_phone_number,
                            verifiedName: phoneData.verified_name,
                            qualityRating: phoneData.quality_rating,
                            codeVerificationStatus: phoneData.code_verification_status,
                            nameStatus: phoneData.name_status,
                        },
                    };
                }
            } catch (err: any) {
                diagnostics.checks.phoneNumberStatus = {
                    status: 'fail',
                    message: `Failed to fetch phone status from Meta: ${err.message}`,
                };
            }
        } else {
            diagnostics.checks.phoneNumberStatus = {
                status: 'skip',
                message: 'Skipped - no valid token or phone number ID',
            };
        }

        // 6. Check Phone Registration (try sending test API call)
        if (decryptedToken && config.phoneNumberId && diagnostics.checks.phoneNumberStatus.status === 'pass') {
            // Instead of actually sending, we check if the phone can call the messages endpoint
            // by making a dry-run request (or checking capabilities)
            try {
                // Try to get message templates as a proxy for registration status
                const templatesResponse = await fetch(
                    `${META_API_BASE}/${config.wabaId}/message_templates?limit=1`,
                    {
                        headers: { Authorization: `Bearer ${decryptedToken}` },
                    }
                );

                if (templatesResponse.ok) {
                    diagnostics.checks.phoneRegistration = {
                        status: 'pass',
                        message: 'Phone number appears to be registered (can access WABA)',
                    };
                } else {
                    const templatesData = await templatesResponse.json();
                    diagnostics.checks.phoneRegistration = {
                        status: 'warn',
                        message: 'Could not verify registration status',
                        details: templatesData.error,
                    };
                }
            } catch (err: any) {
                diagnostics.checks.phoneRegistration = {
                    status: 'warn',
                    message: `Could not verify registration: ${err.message}`,
                };
            }
        } else {
            diagnostics.checks.phoneRegistration = {
                status: 'skip',
                message: 'Skipped - phone number status check failed',
            };
        }

        // 7. Check Webhook Configuration
        diagnostics.checks.webhookConfig = {
            status: config.webhookConfigured ? 'pass' : 'warn',
            message: config.webhookConfigured
                ? 'Webhook is marked as configured'
                : 'Webhook may not be properly configured',
            details: {
                webhookConfigured: config.webhookConfigured,
                expectedCallbackUrl: 'https://www.centy.dev/api/webhooks/meta/whatsapp',
            },
        };

        // 8. Check WABA Status
        if (decryptedToken && config.wabaId) {
            try {
                const wabaResponse = await fetch(
                    `${META_API_BASE}/${config.wabaId}?fields=id,name,currency,timezone_id,message_template_namespace,account_review_status`,
                    {
                        headers: { Authorization: `Bearer ${decryptedToken}` },
                    }
                );

                const wabaData = await wabaResponse.json();
                diagnostics.rawData.metaWabaResponse = wabaData;

                if (!wabaResponse.ok) {
                    diagnostics.checks.wabaStatus = {
                        status: 'fail',
                        message: `WABA Error: ${wabaData.error?.message || 'Unknown error'}`,
                        details: wabaData.error,
                    };
                } else {
                    diagnostics.checks.wabaStatus = {
                        status: 'pass',
                        message: 'WhatsApp Business Account is accessible',
                        details: {
                            id: wabaData.id,
                            name: wabaData.name,
                            accountReviewStatus: wabaData.account_review_status,
                        },
                    };
                }
            } catch (err: any) {
                diagnostics.checks.wabaStatus = {
                    status: 'fail',
                    message: `Failed to fetch WABA status: ${err.message}`,
                };
            }
        } else {
            diagnostics.checks.wabaStatus = {
                status: 'skip',
                message: 'Skipped - no valid token or WABA ID',
            };
        }

        // 9. Check Phone Mappings
        if (config.phoneNumberId) {
            try {
                const mappingDoc = await db.collection('metaPhoneMappings').doc(config.phoneNumberId).get();
                const allMappingsSnapshot = await db
                    .collection('metaPhoneMappings')
                    .where('partnerId', '==', partnerId)
                    .get();

                const mappings = allMappingsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                diagnostics.rawData.phoneMappings = mappings;

                if (!mappingDoc.exists) {
                    diagnostics.checks.phoneMappings = {
                        status: 'warn',
                        message: 'Phone mapping not found - incoming messages may not be routed correctly',
                        details: { phoneNumberId: config.phoneNumberId, mappingsFound: mappings.length },
                    };
                } else {
                    const mappingData = mappingDoc.data();
                    if (mappingData?.partnerId !== partnerId) {
                        diagnostics.checks.phoneMappings = {
                            status: 'fail',
                            message: 'Phone mapping points to different partner!',
                            details: {
                                expected: partnerId,
                                actual: mappingData?.partnerId,
                            },
                        };
                    } else {
                        diagnostics.checks.phoneMappings = {
                            status: 'pass',
                            message: 'Phone mapping exists and is correct',
                            details: {
                                phoneNumberId: config.phoneNumberId,
                                mappedPartnerId: mappingData?.partnerId,
                            },
                        };
                    }
                }
            } catch (err: any) {
                diagnostics.checks.phoneMappings = {
                    status: 'fail',
                    message: `Failed to check phone mappings: ${err.message}`,
                };
            }
        }

        // 10. Check Recent Webhook Logs
        try {
            const logsSnapshot = await db
                .collection('webhookLogs')
                .where('partnerId', '==', partnerId)
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();

            const logs = logsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
                    type: data.type,
                    success: data.success,
                    error: data.error,
                    messageCount: data.messageCount,
                };
            });
            diagnostics.rawData.recentLogs = logs;

            if (logs.length === 0) {
                diagnostics.checks.recentWebhookLogs = {
                    status: 'warn',
                    message: 'No webhook logs found - either no messages received or logging not working',
                };
            } else {
                const successLogs = logs.filter(l => l.success);
                const failedLogs = logs.filter(l => !l.success);
                diagnostics.checks.recentWebhookLogs = {
                    status: failedLogs.length > successLogs.length ? 'warn' : 'pass',
                    message: `Found ${logs.length} recent logs (${successLogs.length} success, ${failedLogs.length} failed)`,
                    details: {
                        total: logs.length,
                        successful: successLogs.length,
                        failed: failedLogs.length,
                        lastLog: logs[0],
                    },
                };
            }
        } catch (err: any) {
            // Index might not exist
            diagnostics.checks.recentWebhookLogs = {
                status: 'warn',
                message: `Could not fetch webhook logs: ${err.message}`,
            };
        }
    } catch (error: any) {
        return NextResponse.json({
            ...diagnostics,
            error: error.message,
        }, { status: 500 });
    }

    return finalizeResponse(diagnostics);
}

function checkEnvironment(): DiagnosticCheck {
    const checks = {
        META_WHATSAPP_VERIFY_TOKEN: !!process.env.META_WHATSAPP_VERIFY_TOKEN,
        ENCRYPTION_SECRET_KEY: !!process.env.ENCRYPTION_SECRET_KEY,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    };

    const missing = Object.entries(checks)
        .filter(([_, present]) => !present)
        .map(([name]) => name);

    if (missing.length === 0) {
        return {
            status: 'pass',
            message: 'All required environment variables are set',
            details: checks,
        };
    }

    const critical = ['ENCRYPTION_SECRET_KEY', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
    const hasCriticalMissing = missing.some(m => critical.includes(m));

    return {
        status: hasCriticalMissing ? 'fail' : 'warn',
        message: `Missing environment variables: ${missing.join(', ')}`,
        details: checks,
    };
}

function finalizeResponse(diagnostics: ComprehensiveDiagnostics): NextResponse {
    // Calculate summary
    const checks = Object.values(diagnostics.checks);
    diagnostics.summary.totalChecks = checks.length;
    diagnostics.summary.passed = checks.filter(c => c.status === 'pass').length;
    diagnostics.summary.failed = checks.filter(c => c.status === 'fail').length;
    diagnostics.summary.warnings = checks.filter(c => c.status === 'warn').length;

    return NextResponse.json(diagnostics);
}
