'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { PawPrint, Syringe } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_pet_profile',
  family: 'veterinary',
  label: 'Pet Health Profile',
  description: 'Pet card with breed, weight, vaccination timeline',
  applicableCategories: ['healthcare', 'veterinary', 'animal_clinic', 'pet_care'],
  intentTriggers: {
    keywords: ['pet', 'dog', 'cat', 'veterinary', 'vet', 'vaccination', 'animal'],
    queryPatterns: ['my pet profile', 'pet vaccinations *', 'pet health *'],
    dataConditions: ['has_pet'],
  },
  dataContract: {
    required: [
      { field: 'petName', type: 'text', label: 'Pet Name' },
    ],
    optional: [
      { field: 'species', type: 'text', label: 'Species' },
      { field: 'breed', type: 'text', label: 'Breed' },
      { field: 'weight', type: 'text', label: 'Weight' },
      { field: 'age', type: 'text', label: 'Age' },
      { field: 'vaccinations', type: 'tags', label: 'Vaccinations' },
      { field: 'imageUrl', type: 'image', label: 'Photo' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    petName: 'Max', species: 'Dog', breed: 'Golden Retriever', weight: '32 kg', age: '4 years',
    vaccinations: [
      { name: 'Rabies', date: '2026-01-15', status: 'current' },
      { name: 'DHPP', date: '2025-11-20', status: 'current' },
      { name: 'Bordetella', date: '2025-06-10', status: 'due' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function PetProfileBlock({ data, theme }: BlockComponentProps) {
  const vaccinations: Array<Record<string, any>> = data.vaccinations || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: 12, display: 'flex', gap: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <PawPrint size={22} color={theme.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{data.petName}</div>
          <div style={{ fontSize: 10, color: theme.t3, marginTop: 1 }}>
            {[data.species, data.breed].filter(Boolean).join(' · ')}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {data.weight && <div style={{ padding: '2px 6px', borderRadius: 4, background: theme.bg, fontSize: 8, color: theme.t2 }}>{data.weight}</div>}
            {data.age && <div style={{ padding: '2px 6px', borderRadius: 4, background: theme.bg, fontSize: 8, color: theme.t2 }}>{data.age}</div>}
          </div>
        </div>
      </div>
      {vaccinations.length > 0 && (
        <div style={{ borderTop: `1px solid ${theme.bdr}` }}>
          <div style={{ padding: '6px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vaccinations</span>
          </div>
          {vaccinations.map((v, i) => (
            <div key={i} style={{ padding: '6px 12px', borderBottom: i < vaccinations.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Syringe size={10} color={v.status === 'current' ? theme.green : theme.amber} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 500, color: theme.t1 }}>{v.name}</div>
                <div style={{ fontSize: 7, color: theme.t4 }}>{v.date}</div>
              </div>
              <span style={{ fontSize: 7, fontWeight: 600, padding: '2px 5px', borderRadius: 3, background: v.status === 'current' ? theme.greenBg : theme.amberBg, color: v.status === 'current' ? theme.green : theme.amber, textTransform: 'capitalize' }}>
                {v.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
