'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, User } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_instructor',
  family: 'people',
  label: 'Instructor Profile',
  description: 'Teacher card with credentials, subject tags, rating, student count',
  applicableCategories: ['education', 'elearning', 'coaching', 'training', 'academy'],
  intentTriggers: {
    keywords: ['instructor', 'teacher', 'faculty', 'professor', 'trainer', 'tutor'],
    queryPatterns: ['who teaches *', 'about the instructor', 'teacher profile', 'faculty for *'],
    dataConditions: ['has_instructor'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Instructor Name' },
    ],
    optional: [
      { field: 'title', type: 'text', label: 'Title / Designation' },
      { field: 'bio', type: 'textarea', label: 'Bio' },
      { field: 'subjects', type: 'tags', label: 'Subjects' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'students', type: 'number', label: 'Students Taught' },
      { field: 'courses', type: 'number', label: 'Courses' },
      { field: 'imageUrl', type: 'image', label: 'Photo' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    name: 'Priya Sharma', title: 'Senior Instructor · M.Tech IIT Delhi',
    bio: '10+ years in software engineering, ex-Google, passionate about mentoring.',
    subjects: ['React', 'Node.js', 'System Design'], rating: 4.8, students: 3200, courses: 5,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function InstructorBlock({ data, theme }: BlockComponentProps) {
  const subjects: string[] = data.subjects || [];
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={20} color={theme.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.name}</div>
          {data.title && <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>{data.title}</div>}
          {data.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
              {[1, 2, 3, 4, 5].map(s => <Star key={s} size={9} fill={s <= Math.round(data.rating) ? theme.amber : 'none'} color={s <= Math.round(data.rating) ? theme.amber : theme.t4} />)}
              <span style={{ fontSize: 9, fontWeight: 600, color: theme.t2, marginLeft: 2 }}>{data.rating}</span>
            </div>
          )}
        </div>
      </div>
      {data.bio && <div style={{ fontSize: 10, color: theme.t2, lineHeight: 1.4, marginTop: 8 }}>{data.bio}</div>}
      <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.bdr}` }}>
        {data.students && <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>{data.students.toLocaleString()}</div><div style={{ fontSize: 8, color: theme.t4 }}>Students</div></div>}
        {data.courses && <div style={{ textAlign: 'center', flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>{data.courses}</div><div style={{ fontSize: 8, color: theme.t4 }}>Courses</div></div>}
      </div>
      {subjects.length > 0 && (
        <div style={{ display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
          {subjects.map(s => <span key={s} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{s}</span>)}
        </div>
      )}
    </div>
  );
}
