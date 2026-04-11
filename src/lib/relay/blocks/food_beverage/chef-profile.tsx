'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Award, ChefHat } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_chef_profile',
  family: 'people',
  label: 'Chef / Team Profile',
  description: 'Executive chef card with credentials, cuisine specialties',
  applicableCategories: ['food_beverage', 'restaurant', 'fine_dining', 'catering'],
  intentTriggers: {
    keywords: ['chef', 'team', 'head chef', 'executive chef', 'culinary'],
    queryPatterns: ['who is the chef', 'meet the team', 'about the chef', 'chef profile'],
    dataConditions: ['has_chef_info'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Chef Name' },
      { field: 'title', type: 'text', label: 'Title' },
    ],
    optional: [
      { field: 'bio', type: 'textarea', label: 'Bio' },
      { field: 'specialties', type: 'tags', label: 'Cuisine Specialties' },
      { field: 'credentials', type: 'tags', label: 'Credentials' },
      { field: 'yearsExperience', type: 'number', label: 'Years of Experience' },
      { field: 'imageUrl', type: 'image', label: 'Photo' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    name: 'Marco Bellini', title: 'Executive Chef',
    bio: 'Trained at Le Cordon Bleu Paris, with 15 years across Michelin-starred kitchens in Rome, Tokyo, and New York.',
    specialties: ['Italian', 'French', 'Asian Fusion'],
    credentials: ['Le Cordon Bleu', 'Michelin Star 2019', 'James Beard Nominee'],
    yearsExperience: 15,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function ChefProfileBlock({ data, theme }: BlockComponentProps) {
  const specialties: string[] = data.specialties || [];
  const credentials: string[] = data.credentials || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px', display: 'flex', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ChefHat size={22} color={theme.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{data.name}</div>
          <div style={{ fontSize: 10, color: theme.accent, fontWeight: 600, marginTop: 1 }}>{data.title}</div>
          {data.yearsExperience && <div style={{ fontSize: 9, color: theme.t4, marginTop: 2 }}>{data.yearsExperience} years experience</div>}
        </div>
      </div>
      {data.bio && (
        <div style={{ padding: '0 14px 12px', fontSize: 10, color: theme.t2, lineHeight: 1.5 }}>{data.bio}</div>
      )}
      {specialties.length > 0 && (
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Specialties</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {specialties.map(s => <span key={s} style={{ fontSize: 9, color: theme.accent, background: theme.accentBg, padding: '3px 7px', borderRadius: 4, fontWeight: 600 }}>{s}</span>)}
          </div>
        </div>
      )}
      {credentials.length > 0 && (
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Credentials</div>
          {credentials.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 0' }}>
              <Award size={10} color={theme.amber} />
              <span style={{ fontSize: 10, color: theme.t2 }}>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
