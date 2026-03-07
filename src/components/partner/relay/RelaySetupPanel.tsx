'use client';

import { useState } from 'react';
import { updateRelayConfig } from '@/actions/relay-partner-actions';
import type { RelayConfig, RelayIntent, RelayTheme } from '@/lib/types-relay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, ChevronDown, ChevronUp, GripVertical, Trash2, Plus } from 'lucide-react';

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

interface Props {
  config: RelayConfig;
  partnerId: string;
  onSaved: () => void;
}

export function RelaySetupPanel({ config, partnerId, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const updateTheme = (updates: Partial<RelayTheme>) => {
    setForm(prev => ({ ...prev, theme: { ...prev.theme, ...updates } }));
  };

  const updateIntent = (index: number, updates: Partial<RelayIntent>) => {
    setForm(prev => ({
      ...prev,
      intents: prev.intents.map((intent, i) => i === index ? { ...intent, ...updates } : intent),
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
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{error}</div>
        )}

        {/* Brand */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Brand Name</Label>
            <Input
              value={form.brandName}
              onChange={e => setForm(prev => ({ ...prev, brandName: e.target.value }))}
              placeholder="The Tides Resort"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Tagline</Label>
            <Input
              value={form.brandTagline}
              onChange={e => setForm(prev => ({ ...prev, brandTagline: e.target.value }))}
              placeholder="Where the waves meet serenity"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Avatar Emoji</Label>
            <Input
              value={form.avatarEmoji}
              onChange={e => setForm(prev => ({ ...prev, avatarEmoji: e.target.value }))}
              placeholder="🏨"
              className="mt-1 text-2xl"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Response Format</Label>
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
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Welcome Message</Label>
          <Textarea
            value={form.welcomeMessage}
            onChange={e => setForm(prev => ({ ...prev, welcomeMessage: e.target.value }))}
            placeholder="Hello! How can I help you today?"
            className="mt-1"
            rows={2}
          />
        </div>

        {/* Theme */}
        <div>
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">Accent Color</Label>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => updateTheme({ accentColor: color.value, accentDarkColor: color.dark })}
                title={color.label}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  form.theme.accentColor === color.value ? 'border-[#111] scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 block">Mode</Label>
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
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 block">Border Radius</Label>
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
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1 block">Font</Label>
            <select
              value={form.theme.fontFamily}
              onChange={e => updateTheme({ fontFamily: e.target.value })}
              className="w-full py-1.5 px-2 rounded-md text-xs border border-[#e5e5e5] bg-white"
            >
              {['Inter', 'Outfit', 'DM Sans', 'Nunito', 'Poppins'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Intents */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Intent Strip</Label>
            <Button variant="outline" size="sm" onClick={addIntent} className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Intent
            </Button>
          </div>
          <div className="space-y-2">
            {form.intents.map((intent, i) => (
              <div key={intent.id} className="flex items-center gap-2 p-2 bg-[#f5f5f5] rounded-lg">
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
                  placeholder="AI prompt when tapped"
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
        </div>

        {/* Conversion Settings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#111]">WhatsApp</p>
              <p className="text-xs text-gray-500">Direct WhatsApp button</p>
            </div>
            <Switch
              checked={form.whatsappEnabled}
              onCheckedChange={v => setForm(prev => ({ ...prev, whatsappEnabled: v }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#111]">Callback Request</p>
              <p className="text-xs text-gray-500">Request a call back</p>
            </div>
            <Switch
              checked={form.callbackEnabled}
              onCheckedChange={v => setForm(prev => ({ ...prev, callbackEnabled: v }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded-lg">
            <div>
              <p className="text-sm font-medium text-[#111]">Direct Booking</p>
              <p className="text-xs text-gray-500">In-widget booking flow</p>
            </div>
            <Switch
              checked={form.directBookingEnabled}
              onCheckedChange={v => setForm(prev => ({ ...prev, directBookingEnabled: v }))}
            />
          </div>
          {form.directBookingEnabled && (
            <div>
              <Label className="text-xs font-medium text-gray-600">External Booking URL</Label>
              <Input
                value={form.externalBookingUrl}
                onChange={e => setForm(prev => ({ ...prev, externalBookingUrl: e.target.value }))}
                placeholder="https://booking.com/your-property"
                className="mt-1 h-8 text-xs"
              />
            </div>
          )}
        </div>

        {/* Advanced */}
        <div>
          <button
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Advanced: Custom System Prompt
          </button>
          {showAdvanced && (
            <Textarea
              value={form.systemPrompt}
              onChange={e => setForm(prev => ({ ...prev, systemPrompt: e.target.value }))}
              placeholder="Override the default system prompt..."
              className="mt-2 font-mono text-xs"
              rows={6}
            />
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-[#111] hover:bg-[#000] text-white">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Configuration</>}
        </Button>
      </CardContent>
    </Card>
  );
}
