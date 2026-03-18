'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Save, GripVertical, Trash2, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RelayConfig, RelayIntent, RelayTheme } from '@/lib/types-relay';
import { DEFAULT_RELAY_THEME, DEFAULT_RELAY_INTENTS } from '@/lib/types-relay';
import { updateRelayConfig, resetRelayConfig } from '@/actions/relay-partner-actions';

const ACCENT_PRESETS = [
  { label: 'Indigo', value: '#4F46E5', dark: '#3730A3' },
  { label: 'Blue', value: '#2563EB', dark: '#1D4ED8' },
  { label: 'Violet', value: '#7C3AED', dark: '#6D28D9' },
  { label: 'Rose', value: '#E11D48', dark: '#BE123C' },
  { label: 'Orange', value: '#EA580C', dark: '#C2410C' },
  { label: 'Green', value: '#16A34A', dark: '#15803D' },
  { label: 'Teal', value: '#0D9488', dark: '#0F766E' },
  { label: 'Slate', value: '#475569', dark: '#334155' },
  { label: 'Black', value: '#111111', dark: '#000000' },
];

interface RelaySetupPanelProps {
  config: RelayConfig;
  onSaved: (updated: RelayConfig) => void;
  onReset: (freshConfig: RelayConfig) => void;
}

export function RelaySetupPanel({ config, onSaved, onReset }: RelaySetupPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [enabled, setEnabled] = useState(config.enabled);
  const [brandName, setBrandName] = useState(config.brandName);
  const [brandTagline, setBrandTagline] = useState(config.brandTagline || '');
  const [avatarEmoji, setAvatarEmoji] = useState(config.avatarEmoji || '');
  const [welcomeMessage, setWelcomeMessage] = useState(config.welcomeMessage);
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt || '');
  const [accentColor, setAccentColor] = useState(config.theme.accentColor);
  const [accentDarkColor, setAccentDarkColor] = useState(config.theme.accentDarkColor);
  const [mode, setMode] = useState<'light' | 'dark'>(config.theme.mode);
  const [borderRadius, setBorderRadius] = useState<RelayTheme['borderRadius']>(config.theme.borderRadius);
  const [intents, setIntents] = useState<RelayIntent[]>([...config.intents].sort((a, b) => a.order - b.order));
  const [whatsappEnabled, setWhatsappEnabled] = useState(config.whatsappEnabled);
  const [callbackEnabled, setCallbackEnabled] = useState(config.callbackEnabled);
  const [directBookingEnabled, setDirectBookingEnabled] = useState(config.directBookingEnabled);
  const [externalBookingUrl, setExternalBookingUrl] = useState(config.externalBookingUrl || '');

  const updateIntent = (id: string, field: keyof RelayIntent, value: RelayIntent[keyof RelayIntent]) => {
    setIntents((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const removeIntent = (id: string) => {
    setIntents((prev) => prev.filter((i) => i.id !== id));
  };

  const addIntent = () => {
    const newIntent: RelayIntent = {
      id: `intent_${Date.now()}`,
      icon: '✨',
      label: 'New',
      prompt: 'Tell me more',
      uiBlock: 'info',
      enabled: true,
      order: intents.length,
    };
    setIntents((prev) => [...prev, newIntent]);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const selectedPreset = ACCENT_PRESETS.find((p) => p.value === accentColor);
    const updates: Partial<RelayConfig> = {
      enabled,
      brandName,
      brandTagline: brandTagline || undefined,
      avatarEmoji: avatarEmoji || undefined,
      welcomeMessage,
      systemPrompt: systemPrompt || undefined,
      intents: intents.map((intent, index) => ({ ...intent, order: index })),
      theme: {
        ...config.theme,
        accentColor,
        accentDarkColor: selectedPreset?.dark || accentDarkColor,
        mode,
        borderRadius,
      },
      whatsappEnabled,
      callbackEnabled,
      directBookingEnabled,
      externalBookingUrl: externalBookingUrl || undefined,
    };

    const result = await updateRelayConfig(config.partnerId, config.id, updates);

    if (result.success) {
      toast.success('Relay settings saved');
      onSaved({ ...config, ...updates } as RelayConfig);
    } else {
      toast.error(result.error || 'Save failed');
    }
    setIsSaving(false);
  };

  const handleReset = async () => {
    if (!confirm('Reset all Relay settings to defaults? This will clear your brand, theme, intents, and generate a new widget ID. This cannot be undone.')) return;

    setIsResetting(true);
    const result = await resetRelayConfig(config.partnerId);

    if (result.success && result.config) {
      toast.success('Relay settings reset to defaults');
      // Update local state from fresh config
      setEnabled(result.config.enabled);
      setBrandName(result.config.brandName);
      setBrandTagline('');
      setAvatarEmoji('');
      setWelcomeMessage(result.config.welcomeMessage);
      setSystemPrompt('');
      setAccentColor(DEFAULT_RELAY_THEME.accentColor);
      setAccentDarkColor(DEFAULT_RELAY_THEME.accentDarkColor);
      setMode(DEFAULT_RELAY_THEME.mode);
      setBorderRadius(DEFAULT_RELAY_THEME.borderRadius);
      setIntents([...DEFAULT_RELAY_INTENTS]);
      setWhatsappEnabled(false);
      setCallbackEnabled(false);
      setDirectBookingEnabled(false);
      setExternalBookingUrl('');
      onReset(result.config);
    } else {
      toast.error(result.error || 'Reset failed');
    }
    setIsResetting(false);
  };

  return (
    <div className="space-y-6">
      {/* Enable toggle header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Relay Widget</h3>
              <p className="text-sm text-muted-foreground">
                Enable to activate your AI chat widget for embedding
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Brand settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your Business Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandTagline">Tagline (optional)</Label>
            <Input
              id="brandTagline"
              value={brandTagline}
              onChange={(e) => setBrandTagline(e.target.value)}
              placeholder="We're here to help"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarEmoji">Avatar Emoji</Label>
            <Input
              id="avatarEmoji"
              value={avatarEmoji}
              onChange={(e) => setAvatarEmoji(e.target.value)}
              placeholder="🤖"
              maxLength={2}
              className="text-2xl"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="welcomeMessage">Welcome Message</Label>
            <Textarea
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={2}
              placeholder="Hi! How can I help you today?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Theme picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Widget Theme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Accent Color</Label>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setAccentColor(preset.value);
                    setAccentDarkColor(preset.dark);
                  }}
                  title={preset.label}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    accentColor === preset.value
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:border-gray-300'
                  )}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={mode === 'dark'}
                onCheckedChange={(v) => setMode(v ? 'dark' : 'light')}
                id="darkMode"
              />
              <Label htmlFor="darkMode">Dark mode</Label>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Border Radius</Label>
              <div className="flex gap-2">
                {(['sharp', 'rounded', 'pill'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setBorderRadius(r)}
                    className={cn(
                      'px-3 py-1 border text-sm transition-colors',
                      r === 'sharp' && 'rounded-none',
                      r === 'rounded' && 'rounded-md',
                      r === 'pill' && 'rounded-full',
                      borderRadius === r
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intent strip editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intent Chips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {intents.map((intent, index) => (
            <div key={intent.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <Switch
                checked={intent.enabled}
                onCheckedChange={(v) => updateIntent(intent.id, 'enabled', v)}
                className="flex-shrink-0"
              />
              <Input
                value={intent.icon}
                onChange={(e) => updateIntent(intent.id, 'icon', e.target.value)}
                maxLength={2}
                className="w-14 text-center text-lg p-1"
              />
              <Input
                value={intent.label}
                onChange={(e) => updateIntent(intent.id, 'label', e.target.value)}
                maxLength={12}
                placeholder="Label"
                className="w-28"
              />
              <Input
                value={intent.prompt}
                onChange={(e) => updateIntent(intent.id, 'prompt', e.target.value)}
                placeholder="Prompt sent to AI"
                className="flex-1"
              />
              <button
                onClick={() => removeIntent(intent.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addIntent} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Intent
          </Button>
        </CardContent>
      </Card>

      {/* Conversion settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} id="wa" />
            <Label htmlFor="wa">Enable WhatsApp lead capture</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={callbackEnabled} onCheckedChange={setCallbackEnabled} id="cb" />
            <Label htmlFor="cb">Enable callback request</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={directBookingEnabled}
              onCheckedChange={setDirectBookingEnabled}
              id="book"
            />
            <Label htmlFor="book">Enable direct booking</Label>
          </div>
          {directBookingEnabled && (
            <div className="space-y-2">
              <Label htmlFor="bookingUrl">External Booking URL</Label>
              <Input
                id="bookingUrl"
                value={externalBookingUrl}
                onChange={(e) => setExternalBookingUrl(e.target.value)}
                placeholder="https://book.example.com"
                type="url"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced system prompt */}
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced">
          <AccordionTrigger className="text-sm">Advanced — Custom System Prompt</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              <Label htmlFor="systemPrompt">System Prompt Override</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                placeholder="Override the default AI instructions for this widget..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the default prompt based on your brand and relay blocks.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset} disabled={isResetting || isSaving} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
          {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isSaving || isResetting}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
