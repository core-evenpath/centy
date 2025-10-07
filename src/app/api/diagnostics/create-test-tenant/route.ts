// src/app/api/diagnostics/create-test-tenant/route.ts
import { NextResponse } from 'next/server';
import { adminAuth } from '../../../../lib/firebase-admin';

export async function POST() {
  try {
    if (!adminAuth) {
      return NextResponse.json({
        success: false,
        message: 'Firebase Admin SDK not initialized',
        details: 'Cannot create tenant without Admin SDK.',
        fix: "This is a downstream effect of the Admin SDK failing to initialize. Check your environment variables."
      }, { status: 500 });
    }

    // Create a test tenant with a unique display name for this test run.
    // The name must be between 4-20 characters.
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const testTenantName = `diag-test-${randomSuffix}`;
    
    const tenant = await adminAuth.tenantManager().createTenant({
      displayName: testTenantName,
    });

    // Immediately delete the test tenant to clean up.
    await adminAuth.tenantManager().deleteTenant(tenant.tenantId);

    return NextResponse.json({
      success: true,
      message: 'Successfully created and deleted a test tenant.',
      details: `Test Tenant ID: ${tenant.tenantId}`
    });

  } catch (error: any) {
    let message = "Tenant creation test failed with an unexpected error.";
    let fix = "Review the error details and check your Google Cloud project's Identity Platform configuration.";

    if (error.code === 'auth/insufficient-permission' || (error.message && (error.message.includes('permission') || error.message.includes('PermissionDenied')))) {
      message = "The service account lacks permission to create tenants.";
      fix = "Add the 'Identity Platform Admin' role to your service account in the Google Cloud IAM console.";
    } else if (error.message && error.message.includes('serviceusage.services.use')) {
      message = "The service account cannot check if the Identity Platform API is enabled.";
      fix = "Add the 'Service Usage Consumer' role to your service account in the Google Cloud IAM console.";
    } else if (error.message && error.message.includes('multi-tenancy must be enabled')) {
      message = "Identity Platform (Multi-Tenancy) is not enabled for this project.";
      fix = "Go to the Google Cloud Console, navigate to Identity Platform -> Settings, and enable Multi-tenancy.";
    }

    return NextResponse.json({
      success: false,
      message: message,
      details: error.message,
      fix: fix
    }, { status: 500 });
  }
}
