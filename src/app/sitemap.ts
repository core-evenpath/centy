import { MetadataRoute } from 'next';

const BASE = 'https://pingbox.io';

const now = new Date();

const usPrimary: MetadataRoute.Sitemap[number][] = [
  { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
  { url: `${BASE}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE}/early-access`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE}/contact/sales`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
];

const products: MetadataRoute.Sitemap[number][] = [
  { url: `${BASE}/relay`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/engage`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/intelligence`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
];

const industries: MetadataRoute.Sitemap[number][] = [
  { url: `${BASE}/for/teams`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/for/dental-clinics`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/for/hvac`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/for/fitness`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/for/real-estate`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/for/law-insurance`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/for/b2b-wholesale`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
];

const resources: MetadataRoute.Sitemap[number][] = [
  { url: `${BASE}/customers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE}/docs/api`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
  { url: `${BASE}/case-studies`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE}/help`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${BASE}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${BASE}/tools/leak-calculator`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
];

const company: MetadataRoute.Sitemap[number][] = [
  { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE}/careers`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${BASE}/security`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE}/cookies`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
];

const india: MetadataRoute.Sitemap[number][] = [
  { url: `${BASE}/in`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  { url: `${BASE}/in/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/in/customers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE}/in/contact/sales`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/in/for/dental-clinics`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/in/for/hvac`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/in/for/fitness`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE}/in/for/real-estate`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE}/in/for/b2b-wholesale`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...usPrimary,
    ...products,
    ...industries,
    ...resources,
    ...company,
    ...india,
  ];
}
