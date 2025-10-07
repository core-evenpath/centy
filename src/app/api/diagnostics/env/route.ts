// src/app/api/diagnostics/env/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

async function getProjectNumber(projectId: string): Promise<string | null> {
    try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform.read-only'],
        });
        const authClient = await auth.getClient();
        const resourcemanager = google.cloudresourcemanager('v1');
        
        const response = await resourcemanager.projects.get({
            projectId: projectId,
            auth: authClient,
        });

        return response.data.projectNumber || null;

    } catch (error) {
        console.error("Failed to get project number:", error);
        return null;
    }
}


export async function GET() {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  const presentVars = requiredVars.filter(varName => !!process.env[varName]);
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (missingVars.length === 0 && projectId) {
    const projectNumber = await getProjectNumber(projectId);

    return NextResponse.json({
      success: true,
      message: 'All required environment variables are present.',
      details: `Found: ${presentVars.join(', ')}`,
      projectId: projectId,
      clientEmail: clientEmail,
      projectNumber: projectNumber,
    });
  } else {
    return NextResponse.json({
      success: false,
      message: `Missing ${missingVars.length} required environment variable(s).`,
      details: `The application's backend cannot authenticate with Firebase without these. Missing: ${missingVars.join(', ')}`,
      fix: 'Create a `.env.local` file in the root of your project and add the missing variables. You can get these values from your Firebase project settings.'
    }, { status: 500 });
  }
}
