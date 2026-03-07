'use client';

import { useState } from 'react';
import { updateRelayConfig, deleteRelayConfig } from '@/actions/relay-partner-actions';
import type { RelayConfig, RelayIntent, RelayTheme } from '@/lib/types-relay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, ChevronDown, ChevronUp, GripVertical, Trash2, Plus, Sparkles } from 'lucide-react';

const ACCENT_COLORS = [
  { label: 'Indigo', value: '#4F46E5', dark: '#3730A3' },
  { label: 'Rose', value: '#E11D48', dark: '#9F1239' },
  { label: 'Emerald', value: '#059669', dark: '#065F46' },
  { label: 'Amber', value: '#D97706', dark: '#92400E' },
  { label: 'Sky', value: '#0284C7', dark: '#075985' },
  { label: 'Violet', value: '#7C3AED', dark: '#4C1D95' },
  { label: 'Pink', value: '#DB2777', dark: '#831843' },
  { label: 'Slate', value: '#334155', dark: '#0F172A' },
];

interface PartnerProfile {
  brandName: string;
  brandTagline: string;
  avatarEmoji: string;
  accentColor: string;
  phone: string;
  email: string;
  website: string;
  whatsappEnabled: boolean;
}

interface Props {
  config: RelayConfig;
  partnerId: string;
  partnerProfile: PartnerProfile | null;
  onSaved: () => void;
}

export function RelaySetupPanel({ config, partnerId, partnerProfile, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [profileApplied, setProfileApplied] = useState(false);

  const [form, setForm] = useState({
    enabled: config.enabled,
    brandName: config.brandName,
    brandTagline: config.brandTagline || '',
    avatarEmoji: config.avatarEmoji || '💬',
    welcomeMessage: config.welcomeMessage,
    systemPrompt: config.systemPrompt || '',
    whatsappEnabled: config.whatsappEnabled,
    callbackEnabled: config.callbackEnabled,
    directBookingEnabled: config.directBookingEnabled,
    externalBookingUrl: config.externalBookingUrl || '',
    responseFormat: config.responseFormat,
    theme: { ...config.theme },
    intents: [...config.intents],
  });

  // Detect if config looks like it still has placeholder defaults
  const hasPlaceholders =
    partnerProfile &&
    !profileApplied &&
    (form.brandName === 'My Business' ||
      form.brandName === partnerProfile.brandName);

  const applyFromProfile = () => {
    if (!partnerProfile) return;
    setForm(prev => ({
      ...prev,
      brandName: partnerProfile.brandName,
      brandTagline: partnerProfile.brandTagline || prev.brandTagline,
      avatarEmoji: partnerProfile.avatarEmoji || prev.avatarEmoji,
      welcomeMessage:
        prev.welcomeMessage === `Hello! Welcome to My Business. How can I help you today?` ||
        prev.welcomeMessage === `Hello! Welcome to ${partnerProfile.brandName}. How can I help you today?`
          ? `Hello! Welcome to ${partnerProfile.brandName}. How can I help you today?`
          : prev.welcomeMessage,
      whatsappEnabled: partnerProfile.whatsappEnabled || prev.whatsappEnabled,
      callbackEnabled: !!partnerProfile.phone || prev.callbackEnabled,
      externalBookingUrl: partnerProfile.website || prev.externalBookingUrl,
      theme: {
        ...prev.theme,
        accentColor: partnerProfile.accentColor !== '#4F46E5'
          ? partnerProfile.accentColor
          : prev.theme.accentColor,
      },
    }));
    setProfileApplied(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateRelayConfig(partnerId, config.id, form);
      onSaved();
    } catch {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setResetting(true);
    setError('');
    try {
      await deleteRelayConfig(partnerId, config.id);
      setConfirmReset(false);
      onSaved();
    } catch {
      setError('Failed to reset configuration');
    } finally {
      setResetting(false);
    }
  };

  const updateTheme = (updates: Partial<RelayTheme>) => {
    setForm(prev => ({ ...prev, theme: { ...prev.theme, ...updates } }));
  };

  const updateIntent = (index: number, updates: Partial<RelayIntent>) => {
    setForm(prev => ({
      ...prev,
      intents: prev.intents.map((intent, i) =>
        i === index ? { ...intent, ...updates } : intent
      ),
    }));
  };

  const removeIntent = (index: number) => {
    setForm(prev => ({
      ...prev,
      intents: prev.intents.filter((_, i) => i !== index),
    }));
  };

  const addIntent = () => {
    const newIntent: RelayIntent = {
      id: `intent-${Date.now()}`,
      icon: '✨',
      label: 'New Intent',
      prompt: 'Tell me about...',
      uiBlock: 'text',
      enabled: true,
      order: form.intents.length,
    };
    setForm(prev => ({ ...prev, intents: [...prev.intents, newIntent] }));
  };

  return (
    <Card className="bg-white border border-[#e5e5e5]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[#111]">Setup & Configuration</CardTitle>
          <div className="flex items-center gap-3">
            <Label htmlFor="relay-enabled" className="text-sm text-gray-600">
              {form.enabled ? 'Widget Active' : 'Widget Disabled'}
            </Label>
            <Switch
              id="relay-enabled"
              checked={form.enabled}
              onCheckedChange={v => setForm(prev => ({ ...prev, enabled: v }))}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Pre-fill from partner profile banner */}
        {partnerProfile && !profileApplied && form.brandName === 'My Business' && (
          <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-indigo-800">Pre-fill from your business profile</p>
                <p className="text-xs text-indigo-600">
                  We found &quot;{partnerProfile.brandName}&quot; — apply it to get started faster
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 flex-shrink-0"
              onClick={applyFromProfile}
            >
              Apply
            </Button>
          </div>
        )}

        {/* Brand */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Brand Name
            </Label>
            <Input
              value={form.brandName}
              onChange={e => setForm(prev => ({ ...prev, brandName: e.target.value }))}
              placeholder={partnerProfile?.brandName || 'Your Business Name'}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Tagline
            </Label>
            <Input
              value={form.brandTagline}
              onChange={e => setForm(prev => ({ ...prev, brandTagline: e.target.value }))}
              placeholder={partnerProfile?.brandTagline || 'Short tagline (optional)'}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Avatar Emoji
            </Label>
            <Input
              value={form.avatarEmoji}
              onChange={e => setForm(prev => ({ ...prev, avatarEmoji: e.target.value }))}
              placeholder={partnerProfile?.avatarEmoji || '💬'}
              className="mt-1 text-2xl"
            />
            <p className="text-[10px] text-gray-400 mt-1">Shows in widget header if no logo is set</p>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Response Format
            </Label>
            <div className="flex gap-2 mt-1">
              {(['generative_ui', 'text_only'] as const).map(format => (
                <button
                  key={format}
                  onClick={() => setForm(prev => ({ ...prev, responseFormat: format }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    form.responseFormat === format
                      ? 'bg-[#111] text-white border-[#111]'
                      : 'bg-white text-gray-600 border-[#e5e5e5] hover:border-gray-400'
                  }`}
                >
                  {format === 'generative_ui' ? 'Generative UI' : 'Text Only'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div>
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Welcome Message
          </Label>
          <Textarea
            value={form.welcomeMessage}
            onChange={e => setForm(prev => ({ ...prev, welcomeMessage: e.target.value }))}
            placeholder={`Hello! Welcome to ${partnerProfile?.brandName || 'us'}. How can I help?`}
            className="mt-1"
            rows={2}
          />
        </div>

        {/* Theme */}
        <div>
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">
            Accent Color
          </Label>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() =>
                  updateTheme({ accentColor: color.value, accentDarkColor: color.dark })
                }
                title={color.label}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  form.theme.accentColor === color.value
                    ? 'border-[#111] scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
              />
            ))}
            {/* Custom color from partner profile */}
            {partnerProfile?.accentColor &&
              !ACCENT_COLORS.find(c => c.value === partnerProfile.accentColor) && (
                <button
                  onClick={() =>
                    updateTheme({
                      accentColor: partnerProfile.accentColor,
                      accentDarkColor: partnerProfile.accentColor,
                    })
                  }
                  title="Your brand color"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.theme.accentColor === partnerProfile.accentColor
                      ? 'border-[#111] scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: partnerProfile.accentColor }}
                />
              )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 block">
              Mode
            </Label>
            <div className="flex gap-1">
              {(['light', 'dark'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => updateTheme({ mode })}
                  className={`flex-1 py-1.5 rounded-md text-xs border transition-all ${
                    form.theme.mode === mode
                      ? 'bg-[#111] text-white border-[#111]'
                      : 'border-[#e5e5e5] hover:border-gray-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 block">
              Corners
            </Label>
            <div className="flex gap-1">
              {(['sharp', 'rounded', 'pill'] as const).map(br => (
                <button
                  key={br}
                  onClick={() => updateTheme({ borderRadius: br })}
                  className={`flex-1 py-1.5 rounded-md text-xs border transition-all ${
                    form.theme.borderRadius === br
                      ? 'bg-[#111] text-white border-[#111]'
                      : 'border-[#e5e5e5] hover:border-gray-400'
                  }`}
                >
                  {br}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 block">
              Font
            </Label>
            <select
              value={form.theme.fontFamily}
              onChange={e => updateTheme({ fontFamily: e.target.value })}
              className="w-full py-1.5 px-2 rounded-md text-xs border border-[#e5e5e5] bg-white"
            >
              {['Inter', 'Outfit', 'DM Sans', 'Nunito', 'Poppins'].map(f => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Intent Strip */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Intent Strip
            </Label>
            <Button variant="outline" size="sm" onClick={addIntent} className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Intent
            </Button>
          </div>
          <div className="space-y-2">
            {form.intents.map((intent, i) => (
              <div
                key={intent.id}
                className="flex items-center gap-2 p-2 bg-[#f5f5f5] rounded-lg"
              >
                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <Input
                  value={intent.icon}
                  onChange={e => updateIntent(i, { icon: e.target.value })}
                  className="w-12 text-center text-lg p-1 h-8"
                />
                <Input
                  value={intent.label}
                  onChange={e => updateIntent(i, { label: e.target.value })}
                  placeholder="Label"
                  className="w-28 h-8 text-xs"
                  maxLength={12}
                />
                <Input
                  value={intent.prompt}
                  onChange={e => updateIntent(i, { prompt: e.target.value })}
                  placeholder="What gets sent to AI when tapped"
                  className="flex-1 h-8 text-xs"
                />
                <Switch
                  checked={intent.enabled}
                  onCheckedChange={v => updateIntent(i, { enabled: v })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-gray-400 hover:text-red-500"
                  onClick={() => removeIntent(i)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            These quick-tap buttons appear at the top of the chat and trigger AI responses
          </p>
        </div>

        {/* Conversion Settings */}
        <div>
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">
            Conversion Options
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded-lg">
              <div>
                <p className="text-sm font-medium text-[#111]">WhatsApp</p>
                <p className="text-xs text-gray-500">
                  {partnerProfile?.whatsappEnabled ? 'Connected ✓' : 'Direct WhatsApp button'}
                </p>
              </div>
              <Switch
                checked={form.whatsappEnabled}
                onCheckedChange={v => setForm(prev => ({ ...prev, whatsappEnabled: v }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded-lg">
              <div>
                <p className="text-sm font-medium text-[#111]">Callback Request</p>
                <p className="text-xs text-gray-500">
                  {partnerProfile?.phone ? `Call ${partnerProfile.phone}` : 'Request a call back'}
                </p>
              </div>
              <Switch
                checked={form.callbackEnabled}
                onCheckedChange={v => setForm(prev => ({ ...prev, callbackEnabled: v }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded-lg">
              <div>
                <p className="text-sm font-medium text-[#111]">Direct Booking</p>
                <p className="text-xs text-gray-500">External booking link</p>
              </div>
              <Switch
                checked={form.directBookingEnabled}
                onCheckedChange={v =>
                  setForm(prev => ({ ...prev, directBookingEnabled: v }))
                }
              />
            </div>
            {form.directBookingEnabled && (
              <div>
                <Label className="text-xs font-medium text-gray-600">Booking URL</Label>
                <Input
                  value={form.externalBookingUrl}
                  onChange={e =>
                    setForm(prev => ({ ...prev, externalBookingUrl: e.target.value }))
                  }
                  placeholder={partnerProfile?.website || 'https://booking.com/your-property'}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Advanced */}
        <div>
          <button
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            Advanced: Custom System Prompt Override
          </button>
          {showAdvanced && (
            <>
              <Textarea
                value={form.systemPrompt}
                onChange={e => setForm(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder={`Optional: override the default assistant personality.\n\nExample: You are a concierge for ${form.brandName}. Be warm and professional. Always recommend specific rooms by name when asked about accommodation.`}
                className="mt-2 font-mono text-xs"
                rows={6}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Leave blank to use the standard business profile + RAG knowledge base.
                When set, this is prepended to the system prompt.
              </p>
            </>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#111] hover:bg-[#000] text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save Configuration
            </>
          )}
        </Button>

        <div className="border-t pt-4">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <p className="text-xs text-red-600 flex-1">
                This will delete your Relay config and start fresh. Are you sure?
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmReset(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReset}
                disabled={resetting}
                className="text-xs"
              >
                {resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Yes, reset'}
              </Button>
            </div>
          ) : (
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Reset Relay configuration
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
