'use client';

import { useEffect, useState } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';

export default function VaultTestPage() {
  const { user, partnerId, partnerAuth } = useMultiWorkspaceAuth();
  const [testResult, setTestResult] = useState<string>('Starting...');

  useEffect(() => {
    const runTest = async () => {
      console.log('=== VAULT TEST START ===');
      console.log('user:', user?.uid);
      console.log('partnerId:', partnerId);
      console.log('partnerAuth:', partnerAuth);

      if (!partnerId) {
        setTestResult('ERROR: No partnerId');
        return;
      }

      try {
        setTestResult('Testing server action import...');
        
        // Test if the action can be imported
        const { listVaultFiles } = await import('@/actions/vault-actions');
        setTestResult('Server action imported. Calling function...');
        
        console.log('Calling listVaultFiles with partnerId:', partnerId);
        const result = await listVaultFiles(partnerId);
        
        console.log('Result:', result);
        setTestResult(JSON.stringify(result, null, 2));
      } catch (error: any) {
        console.error('Test error:', error);
        setTestResult(`ERROR: ${error.message}\n\nStack: ${error.stack}`);
      }
    };

    if (partnerId && user) {
      runTest();
    }
  }, [partnerId, user]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Vault Test Page</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Auth Info:</h2>
        <pre className="text-xs">
          User: {user?.uid || 'null'}
          {'\n'}
          Partner: {partnerId || 'null'}
          {'\n'}
          Auth: {partnerAuth ? 'true' : 'false'}
        </pre>
      </div>
      <div className="bg-white border mt-4 p-4 rounded">
        <h2 className="font-semibold mb-2">Test Result:</h2>
        <pre className="text-xs whitespace-pre-wrap">{testResult}</pre>
      </div>
    </div>
  );
}