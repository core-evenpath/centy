
// src/components/admin/MigrationTools.tsx
"use client";

import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "../../hooks/use-toast";
import { Database, CheckCircle2, AlertTriangle, RefreshCw, MessageSquare } from "lucide-react";
import { migrateUserMappings, validateUserMappings } from '../../scripts/migrate-user-mappings';
import {
    previewWhatsAppContentBackfill,
    executeWhatsAppContentBackfill,
    type BackfillPreview,
    type BackfillResult,
} from '../../actions/admin-whatsapp-migration';

export default function MigrationTools() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string>('');
  const [validationResult, setValidationResult] = useState<string>('');
  const [isPreviewingBackfill, setIsPreviewingBackfill] = useState(false);
  const [isExecutingBackfill, setIsExecutingBackfill] = useState(false);
  const [backfillPreview, setBackfillPreview] = useState<BackfillPreview | null>(null);
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null);
  const [backfillError, setBackfillError] = useState<string>('');
  const { toast } = useToast();

  const handleBackfillPreview = async () => {
    setIsPreviewingBackfill(true);
    setBackfillError('');
    setBackfillResult(null);
    try {
      const result = await previewWhatsAppContentBackfill();
      if (result.ok) {
        setBackfillPreview(result);
        toast({
          title: "Preview ready",
          description: `${result.staleMessageCount} message${result.staleMessageCount === 1 ? '' : 's'} across ${result.affectedConversationCount} conversation${result.affectedConversationCount === 1 ? '' : 's'} would be rewritten.`,
        });
      } else {
        setBackfillPreview(null);
        setBackfillError(result.error);
        toast({ variant: "destructive", title: "Preview failed", description: result.error });
      }
    } catch (error: any) {
      setBackfillError(error.message);
      toast({ variant: "destructive", title: "Preview error", description: error.message });
    } finally {
      setIsPreviewingBackfill(false);
    }
  };

  const handleBackfillExecute = async () => {
    if (!backfillPreview) return;
    if (!window.confirm(`Rewrite ${backfillPreview.staleMessageCount} WhatsApp message${backfillPreview.staleMessageCount === 1 ? '' : 's'}? This cannot be undone.`)) {
      return;
    }
    setIsExecutingBackfill(true);
    setBackfillError('');
    try {
      const result = await executeWhatsAppContentBackfill();
      if (result.ok) {
        setBackfillResult(result);
        setBackfillPreview(null);
        toast({
          title: "Backfill complete",
          description: `Updated ${result.updatedMessages} message${result.updatedMessages === 1 ? '' : 's'} and ${result.updatedConversations} conversation preview${result.updatedConversations === 1 ? '' : 's'}.`,
        });
      } else {
        setBackfillError(result.error);
        toast({ variant: "destructive", title: "Backfill failed", description: result.error });
      }
    } catch (error: any) {
      setBackfillError(error.message);
      toast({ variant: "destructive", title: "Backfill error", description: error.message });
    } finally {
      setIsExecutingBackfill(false);
    }
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationResult('');
    
    try {
      const result = await migrateUserMappings();
      setMigrationResult(result.message);
      
      if (result.success) {
        toast({
          title: "Migration Complete",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Migration Failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      const errorMessage = `Migration error: ${error.message}`;
      setMigrationResult(errorMessage);
      toast({
        variant: "destructive",
        title: "Migration Error",
        description: errorMessage,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleValidation = async () => {
    setIsValidating(true);
    setValidationResult('');
    
    try {
      const result = await validateUserMappings();
      setValidationResult(result.message);
      
      if (result.success) {
        toast({
          title: "Validation Complete",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Validation Failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      const errorMessage = `Validation error: ${error.message}`;
      setValidationResult(errorMessage);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorMessage,
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Multi-Tenant Migration Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">User Mapping Migration</h4>
              <p className="text-sm text-muted-foreground">
                Create user mappings for existing partners to enable proper tenant lookup during login.
              </p>
              <Button 
                onClick={handleMigration}
                disabled={isMigrating}
                className="w-full"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Run Migration
                  </>
                )}
              </Button>
              {migrationResult && (
                <div className={`p-3 rounded-md text-sm ${
                  migrationResult.includes('failed') || migrationResult.includes('error')
                    ? 'bg-destructive/10 text-destructive border border-destructive/20'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {migrationResult.includes('failed') || migrationResult.includes('error') ? (
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  )}
                  {migrationResult}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Validate User Mappings</h4>
              <p className="text-sm text-muted-foreground">
                Check the current state of user mappings in the database.
              </p>
              <Button 
                onClick={handleValidation}
                disabled={isValidating}
                variant="outline"
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Validate Mappings
                  </>
                )}
              </Button>
              {validationResult && (
                <div className={`p-3 rounded-md text-sm ${
                  validationResult.includes('failed') || validationResult.includes('error')
                    ? 'bg-destructive/10 text-destructive border border-destructive/20'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {validationResult.includes('failed') || validationResult.includes('error') ? (
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  )}
                  {validationResult}
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Migration Steps</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Run the migration to create user mappings for existing partners</li>
              <li>Validate that mappings were created successfully</li>
              <li>Test partner login functionality</li>
              <li>Monitor for any remaining authentication issues</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            WhatsApp Message Content Backfill
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Rewrites legacy Meta WhatsApp messages whose content was saved as a bare
            placeholder (e.g. <code className="text-xs px-1 py-0.5 bg-muted rounded">[UNSUPPORTED]</code>,
            <code className="text-xs px-1 py-0.5 bg-muted rounded">[INTERACTIVE]</code>,
            <code className="text-xs px-1 py-0.5 bg-muted rounded">[REACTION]</code>) before the webhook fix shipped.
            Original webhook payloads from <code className="text-xs px-1 py-0.5 bg-muted rounded">webhookLogs</code> are
            used to reconstruct accurate content; anything the log doesn't cover falls back to a readable generic string.
            Conversation previews in the inbox sidebar are refreshed from each conversation's latest message.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleBackfillPreview}
              disabled={isPreviewingBackfill || isExecutingBackfill}
              variant="outline"
            >
              {isPreviewingBackfill ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Scanning…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" />Preview</>
              )}
            </Button>

            <Button
              onClick={handleBackfillExecute}
              disabled={!backfillPreview || backfillPreview.staleMessageCount === 0 || isExecutingBackfill}
            >
              {isExecutingBackfill ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Backfilling…</>
              ) : (
                <><Database className="w-4 h-4 mr-2" />Run Backfill</>
              )}
            </Button>
          </div>

          {backfillError && (
            <div className="p-3 rounded-md text-sm bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {backfillError}
            </div>
          )}

          {backfillPreview && (
            <div className="p-3 rounded-md text-sm bg-muted border space-y-2">
              <div className="font-medium">Preview</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div><span className="text-muted-foreground">Stale messages:</span> <span className="font-medium">{backfillPreview.staleMessageCount}</span></div>
                <div><span className="text-muted-foreground">Conversations:</span> <span className="font-medium">{backfillPreview.affectedConversationCount}</span></div>
                <div><span className="text-muted-foreground">Reconstructable:</span> <span className="font-medium">{backfillPreview.reconstructableCount}</span></div>
                <div><span className="text-muted-foreground">Fallback:</span> <span className="font-medium">{backfillPreview.fallbackCount}</span></div>
              </div>
              {Object.keys(backfillPreview.byType).length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">By type:</span>{' '}
                  {Object.entries(backfillPreview.byType)
                    .map(([t, n]) => `${t}=${n}`)
                    .join(', ')}
                </div>
              )}
            </div>
          )}

          {backfillResult && (
            <div className="p-3 rounded-md text-sm bg-green-50 text-green-700 border border-green-200 space-y-1">
              <div className="font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Backfill complete
              </div>
              <div className="text-xs">
                Updated {backfillResult.updatedMessages} message{backfillResult.updatedMessages === 1 ? '' : 's'}
                ({backfillResult.reconstructedFromPayload} reconstructed, {backfillResult.fallbackUsed} fallback)
                across {backfillResult.updatedConversations} conversation{backfillResult.updatedConversations === 1 ? '' : 's'}.
              </div>
              {backfillResult.errors.length > 0 && (
                <div className="text-xs text-amber-700">
                  {backfillResult.errors.length} non-fatal error{backfillResult.errors.length === 1 ? '' : 's'}:{' '}
                  {backfillResult.errors.slice(0, 3).join('; ')}
                </div>
              )}
              <div className="text-[11px] text-muted-foreground">Audit: {backfillResult.auditId}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
