import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/partner/', '/admin/', '/employee/', '/early-access/'],
    },
    sitemap: 'https://pingbox.io/sitemap.xml',
  };
}
