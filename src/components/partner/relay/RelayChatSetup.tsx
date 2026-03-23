'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { validateRelaySlug, updateRelaySlug } from '@/actions/relay-partner-actions';
import { getRelayUrl } from '@/lib/relay-subdomain';
import type { RelaySlugValidation } from '@/lib/types-relay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, Copy, ExternalLink, Check, X, Loader2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface RelayChatSetupProps {
  partnerId: string;
  currentSlug: string | null;
  onSlugUpdated: (newSlug: string) => void;
}

export default function RelayChatSetup({ partnerId, currentSlug, onSlugUpdated }: RelayChatSetupProps) {
  const [slug, setSlug] = useState(currentSlug || '');
  const [savedSlug, setSavedSlug] = useState(currentSlug || '');
  const [validation, setValidation] = useState<RelaySlugValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const runValidation = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setValidation(value.length > 0 ? { valid: false, error: 'too_short' } : null);
      setValidating(false);
      return;
    }
    setValidating(true);
    try {
      const result = await validateRelaySlug(value, partnerId);
      setValidation(result);
    } catch {
      setValidation({ valid: false, error: 'taken' });
    } finally {
      setValidating(false);
    }
  }, [partnerId]);

  const handleSlugChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(normalized);
    setValidation(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runValidation(normalized), 500);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (!slug || !validation?.valid) return;
    setSaving(true);
    try {
      const result = await updateRelaySlug(partnerId, slug);
      if (result.success) {
        setSavedSlug(slug);
        onSlugUpdated(slug);
        toast.success('Relay link updated');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to save relay link');
    } finally {
      setSaving(false);
    }
  };

  const relayUrl = savedSlug ? getRelayUrl(savedSlug) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(relayUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Chat with us: ${relayUrl}`)}`, '_blank');
  };

  const handleShareEmail = () => {
    window.open(
      `mailto:?subject=${encodeURIComponent('Chat with us')}&body=${encodeURIComponent(`Start a conversation: ${relayUrl}`)}`,
      '_blank'
    );
  };

  const validationMessage = () => {
    if (validating) return null;
    if (!validation) return null;
    if (validation.valid) {
      return (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" /> Available
        </span>
      );
    }
    const messages: Record<string, string> = {
      too_short: 'Must be at least 3 characters',
      too_long: 'Must be 48 characters or fewer',
      invalid_chars: 'Only lowercase letters, numbers, and hyphens',
      reserved: 'This name is reserved',
      taken: 'Already taken',
      hyphen_boundary: 'Cannot start or end with a hyphen',
    };
    return (
      <span className="flex items-center gap-1 text-xs text-red-500">
        <X className="h-3 w-3" /> {messages[validation.error || ''] || 'Invalid'}
      </span>
    );
  };

  const canSave = slug && validation?.valid && !validating && !saving && slug !== savedSlug;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" /> Your Relay Link
        </CardTitle>
        <CardDescription>
          Share this link with your customers. They can chat with your AI assistant directly — no app download needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-0">
            <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 border-input">
              https://
            </span>
            <Input
              value={slug}
              onChange={e => handleSlugChange(e.target.value)}
              placeholder="your-business"
              className="rounded-none border-x-0 font-mono flex-1"
              maxLength={48}
            />
            <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-r-md border border-l-0 border-input">
              .pingbox.io
            </span>
          </div>
          <div className="h-4 flex items-center">
            {validating && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking...
              </span>
            )}
            {validationMessage()}
          </div>
        </div>

        <Button onClick={handleSave} disabled={!canSave} className="w-full">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {saving ? 'Saving...' : 'Save'}
        </Button>

        {savedSlug && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium mb-2">Your live link:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md truncate">
                  {relayUrl}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(relayUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Share2 className="h-3.5 w-3.5" /> Share via:
              </span>
              <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareEmail}>
                Email
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
