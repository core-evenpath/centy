'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, CheckCircle } from 'lucide-react';
import { generateRelayBlocksForCategory, createRelayBlockConfig } from '@/actions/relay-admin-actions';
import type { RelayBlockConfig } from '@/lib/types-relay';

const INDUSTRIES = [
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'food_beverage', label: 'Food & Beverage' },
  { id: 'retail', label: 'Retail' },
  { id: 'wellness', label: 'Wellness & Spa' },
  { id: 'travel', label: 'Travel & Tourism' },
  { id: 'real_estate', label: 'Real Estate' },
];

const FUNCTIONS: Record<string, string[]> = {
  hospitality: ['hotel', 'resort', 'boutique_hotel', 'hostel', 'villa'],
  food_beverage: ['restaurant', 'cafe', 'bar', 'bakery', 'food_truck'],
  retail: ['clothing', 'electronics', 'grocery', 'pharmacy', 'specialty'],
  wellness: ['spa', 'gym', 'yoga_studio', 'salon', 'clinic'],
  travel: ['tour_operator', 'travel_agency', 'adventure_sports', 'car_rental'],
  real_estate: ['residential', 'commercial', 'property_management', 'coworking'],
};

export default function RelayGeneratorPage() {
  const [industry, setIndustry] = useState('');
  const [businessFunction, setBusinessFunction] = useState('');
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<Omit<RelayBlockConfig, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!industry || !businessFunction) return;
    setLoading(true);
    setError('');
    setConfigs([]);
    setSaved(false);
    try {
      const result = await generateRelayBlocksForCategory(industry, businessFunction);
      if (result.success && result.configs) {
        setConfigs(result.configs);
      } else {
        setError(result.error || 'Generation failed');
      }
    } catch {
      setError('Unexpected error during generation');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all(configs.map(c => createRelayBlockConfig(c)));
      setSaved(true);
    } catch {
      setError('Failed to save some configs');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Relay Block Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate UI block configurations for a specific business category using AI
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Business Category</CardTitle>
          <CardDescription>Choose the industry and function to generate appropriate blocks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Industry</label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(i => (
                <button
                  key={i.id}
                  onClick={() => { setIndustry(i.id); setBusinessFunction(''); }}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                    industry === i.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          {industry && (
            <div>
              <label className="text-sm font-medium mb-2 block">Business Function</label>
              <div className="flex flex-wrap gap-2">
                {(FUNCTIONS[industry] || []).map(fn => (
                  <button
                    key={fn}
                    onClick={() => setBusinessFunction(fn)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      businessFunction === fn
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    {fn.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!industry || !businessFunction || loading}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" /> Generate Blocks</>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {configs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Generated Blocks ({configs.length})</h2>
            <Button onClick={handleSaveAll} disabled={saving || saved}>
              {saved ? (
                <><CheckCircle className="w-4 h-4 mr-2" /> Saved!</>
              ) : saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                'Save All Blocks'
              )}
            </Button>
          </div>
          <div className="space-y-4">
            {configs.map((config, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{config.label}</CardTitle>
                    <Badge variant="outline">{config.blockType}</Badge>
                  </div>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>AI Fragment:</strong> {config.aiPromptFragment}</p>
                    {config.defaultIntent && (
                      <p><strong>Default Intent:</strong> {config.defaultIntent.icon} {config.defaultIntent.label}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
