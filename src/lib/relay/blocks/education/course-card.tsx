'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, BookOpen } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_course_card',
  family: 'catalog',
  label: 'Course Card',
  description: 'Browsable course with instructor, level badge, duration, student count, rating, price',
  applicableCategories: ['education', 'elearning', 'coaching', 'training', 'academy'],
  intentTriggers: {
    keywords: ['courses', 'browse', 'programs', 'classes', 'learn', 'enroll', 'catalog'],
    queryPatterns: ['show me courses', 'what courses *', 'available programs', '* classes'],
    dataConditions: ['has_courses'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Course Title' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'instructor', type: 'text', label: 'Instructor' },
      { field: 'level', type: 'select', label: 'Level', options: ['Beginner', 'Intermediate', 'Advanced'] },
      { field: 'duration', type: 'text', label: 'Duration' },
      { field: 'students', type: 'number', label: 'Student Count' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'reviews', type: 'number', label: 'Review Count' },
      { field: 'imageUrl', type: 'image', label: 'Thumbnail' },
      { field: 'tags', type: 'tags', label: 'Tags' },
    ],
  },
  variants: ['default', 'compact', 'featured'],
  sampleData: {
    items: [
      { title: 'Full-Stack Web Development', price: 4999, instructor: 'Priya Sharma', level: 'Intermediate', duration: '12 weeks', students: 1240, rating: 4.7, reviews: 312, tags: ['React', 'Node.js'] },
      { title: 'Data Science Fundamentals', price: 3499, instructor: 'Arjun Mehta', level: 'Beginner', duration: '8 weeks', students: 890, rating: 4.5, reviews: 198 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

const levelColor = (l: string, t: BlockComponentProps['theme']) =>
  l === 'Advanced' ? { color: t.red, bg: t.redBg } : l === 'Intermediate' ? { color: t.amber, bg: t.amberBg } : { color: t.green, bg: t.greenBg };

export default function CourseCardBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <BookOpen size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No courses available</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((c, i) => {
        const lc = levelColor(c.level || 'Beginner', theme);
        return (
          <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, display: 'flex', gap: 10, padding: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 8, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={20} color={theme.t4} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{c.title}</div>
              <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>{c.instructor}{c.duration ? ` · ${c.duration}` : ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                {c.level && <span style={{ fontSize: 8, fontWeight: 600, color: lc.color, background: lc.bg, padding: '1px 5px', borderRadius: 4 }}>{c.level}</span>}
                {c.rating && <><Star size={9} fill={theme.amber} color={theme.amber} /><span style={{ fontSize: 9, color: theme.t2 }}>{c.rating}</span></>}
                {c.students && <span style={{ fontSize: 8, color: theme.t4 }}>· {c.students.toLocaleString()} students</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(c.price)}</span>
                <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>Enroll</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
