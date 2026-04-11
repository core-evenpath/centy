'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { BookOpen, Star } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_course_detail',
  family: 'catalog',
  label: 'Course Detail',
  description: 'Full course view with instructor bio, stats, learning outcomes, pricing',
  applicableCategories: ['education', 'elearning', 'coaching', 'training', 'academy'],
  intentTriggers: {
    keywords: ['details', 'about', 'course info', 'syllabus', 'overview', 'more'],
    queryPatterns: ['tell me about *', 'more about *', 'what will I learn *'],
    dataConditions: ['has_course_detail'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Course Title' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'instructor', type: 'text', label: 'Instructor' },
      { field: 'instructorBio', type: 'text', label: 'Instructor Bio' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'students', type: 'number', label: 'Students Enrolled' },
      { field: 'duration', type: 'text', label: 'Duration' },
      { field: 'outcomes', type: 'tags', label: 'Learning Outcomes' },
      { field: 'level', type: 'select', label: 'Level', options: ['Beginner', 'Intermediate', 'Advanced'] },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Full-Stack Web Development', price: 4999, instructor: 'Priya Sharma',
    instructorBio: '10+ years in software engineering at top startups',
    rating: 4.7, students: 1240, duration: '12 weeks', level: 'Intermediate',
    outcomes: ['Build production React apps', 'Design REST APIs with Node.js', 'Deploy to cloud platforms'],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function CourseDetailBlock({ data, theme }: BlockComponentProps) {
  const outcomes: string[] = data.outcomes || [];
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ height: 72, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.accent}40)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <BookOpen size={28} color={theme.accent} />
        {data.level && <div style={{ position: 'absolute', top: 6, left: 8, fontSize: 7, fontWeight: 700, color: '#fff', background: theme.accent, padding: '2px 6px', borderRadius: 4 }}>{data.level}</div>}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{data.title || 'Course'}</div>
        <div style={{ fontSize: 10, color: theme.t3, marginTop: 2 }}>{data.duration}{data.students ? ` · ${data.students.toLocaleString()} students` : ''}</div>
        {data.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} fill={s <= Math.round(data.rating) ? theme.amber : 'none'} color={s <= Math.round(data.rating) ? theme.amber : theme.t4} />)}
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.t2, marginLeft: 2 }}>{data.rating}</span>
          </div>
        )}
        {data.instructor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 8px', background: theme.bg, borderRadius: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: theme.accent }}>{data.instructor[0]}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.instructor}</div>
              {data.instructorBio && <div style={{ fontSize: 8, color: theme.t3 }}>{data.instructorBio}</div>}
            </div>
          </div>
        )}
        {outcomes.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: theme.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>What you'll learn</div>
            {outcomes.map((o, i) => <div key={i} style={{ fontSize: 10, color: theme.t2, padding: '2px 0', display: 'flex', gap: 4 }}><span style={{ color: theme.green }}>✓</span>{o}</div>)}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: `1px solid ${theme.bdr}` }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: theme.accent }}>{fmt(data.price || 0)}</span>
          <button style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Enroll Now</button>
        </div>
      </div>
    </div>
  );
}
