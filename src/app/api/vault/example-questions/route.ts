import { NextRequest, NextResponse } from 'next/server';
import { generateExampleQuestions } from '@/actions/vault-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json(
        { success: false, message: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const questions = await generateExampleQuestions(partnerId);
    
    return NextResponse.json({ 
      success: true, 
      questions 
    });
  } catch (error: any) {
    console.error('Error generating example questions:', error);
    return NextResponse.json(
      { success: false, message: error.message, questions: [] },
      { status: 500 }
    );
  }
}