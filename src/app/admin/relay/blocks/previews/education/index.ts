// @ts-nocheck
'use client';

import React from 'react';
import { T, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const E = { pri: '#4338ca', priBg: 'rgba(67,56,202,0.06)', priBg2: 'rgba(67,56,202,0.12)', acc: '#0f766e', accBg: 'rgba(15,118,110,0.06)' };

function LevelBadge({ level, color, bg }: { level: string; color: string; bg: string }) {
  return React.createElement('span', { style: { fontSize: '7px', fontWeight: 600, color, background: bg, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' as const } }, level);
}

function MiniCourseCard() {
  const courses = [
    { name: 'Data Science Fundamentals', inst: 'Dr. Sarah Chen', dur: '12 weeks', level: 'Beginner', students: 2847, rating: 4.8, price: 499, orig: 699, badge: 'Bestseller', grad: 'linear-gradient(135deg, #eef2ff 0%, #c7d2fe 50%, #818cf8 100%)' },
    { name: 'Advanced Machine Learning', inst: 'Prof. James Wu', dur: '16 weeks', level: 'Advanced', students: 1204, rating: 4.7, price: 799, grad: 'linear-gradient(135deg, #fdf4ff 0%, #e9d5ff 50%, #a855f7 100%)' },
  ];
  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column' as const, gap: '4px' } },
    courses.map((c, i) =>
      React.createElement('div', { key: i, style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
        React.createElement('div', { style: { display: 'flex', gap: '8px', padding: '8px 10px' } },
          React.createElement('div', { style: { width: 58, height: 58, borderRadius: 8, background: c.grad, flexShrink: 0, position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
            React.createElement(I, { d: ic.openBook, size: 20, color: 'rgba(255,255,255,0.6)', stroke: 1.5 }),
            c.badge ? React.createElement('div', { style: { position: 'absolute' as const, top: 3, left: 3 } }, React.createElement(Tag, { color: '#fff', bg: E.acc }, c.badge)) : null
          ),
          React.createElement('div', { style: { flex: 1, minWidth: 0 } },
            React.createElement('div', { style: { fontSize: '12px', fontWeight: 600, color: T.t1, lineHeight: 1.2 } }, c.name),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' } },
              React.createElement(I, { d: ic.user, size: 8, color: E.pri }),
              React.createElement('span', { style: { fontSize: '9px', color: T.t3 } }, c.inst)
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' } },
              React.createElement(LevelBadge, { level: c.level, color: c.level === 'Beginner' ? T.green : T.red, bg: c.level === 'Beginner' ? T.greenBg : T.redBg }),
              React.createElement(I, { d: ic.clock, size: 8, color: T.t4 }),
              React.createElement('span', { style: { fontSize: '8px', color: T.t4 } }, c.dur),
              React.createElement(I, { d: ic.users, size: 8, color: T.t4 }),
              React.createElement('span', { style: { fontSize: '8px', color: T.t4 } }, c.students.toLocaleString())
            ),
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' } },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '3px' } },
                React.createElement('span', { style: { fontSize: '14px', fontWeight: 700, color: E.pri } }, fmt(c.price)),
                c.orig ? React.createElement('span', { style: { fontSize: '9px', color: T.t4, textDecoration: 'line-through' } }, fmt(c.orig)) : null,
                React.createElement(Stars, { r: c.rating, size: 7 })
              ),
              React.createElement('button', { style: { fontSize: '8px', fontWeight: 600, color: '#fff', background: E.pri, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' } }, 'Enroll')
            )
          )
        )
      )
    )
  );
}

function MiniCourseDetail() {
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { height: '60px', background: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #818cf8 100%)', display: 'flex', alignItems: 'flex-end', padding: '8px 10px' } },
      React.createElement('div', null,
        React.createElement(Tag, { color: '#fff', bg: 'rgba(255,255,255,0.2)' }, 'Bestseller'),
        React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '3px' } }, 'Data Science Fundamentals')
      )
    ),
    React.createElement('div', { style: { padding: '8px 10px' } },
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '6px' } },
        [{ v: '12 wk', l: 'Duration', icon: ic.clock }, { v: '48', l: 'Lessons', icon: ic.openBook }, { v: '2.8K', l: 'Students', icon: ic.users }, { v: 'Cert', l: 'Included', icon: ic.award }].map(s =>
          React.createElement('div', { key: s.l, style: { padding: '5px', background: T.bg, borderRadius: '5px', textAlign: 'center' as const } },
            React.createElement(I, { d: s.icon, size: 10, color: E.pri, stroke: 1.5 }),
            React.createElement('div', { style: { fontSize: '10px', fontWeight: 700, color: E.pri, marginTop: '1px' } }, s.v),
            React.createElement('div', { style: { fontSize: '6px', color: T.t4 } }, s.l)
          )
        )
      ),
      React.createElement('div', { style: { fontSize: '8px', fontWeight: 700, color: T.t4, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '3px' } }, "What you'll learn"),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column' as const, gap: '2px', marginBottom: '5px' } },
        ['Python programming', 'Statistical analysis', 'ML fundamentals', 'Capstone project'].map(item =>
          React.createElement('div', { key: item, style: { display: 'flex', alignItems: 'center', gap: '4px' } },
            React.createElement(I, { d: ic.check, size: 8, color: T.green, stroke: 2.5 }),
            React.createElement('span', { style: { fontSize: '8px', color: T.t2 } }, item)
          )
        )
      ),
      React.createElement('button', { style: { width: '100%', padding: '7px', borderRadius: '7px', border: 'none', background: E.pri, fontSize: '10px', fontWeight: 600, cursor: 'pointer', color: '#fff', marginTop: '4px' } }, 'Enroll Now -- ' + fmt(499))
    )
  );
}

function MiniSchedule() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const slots = [
    { day: 0, time: '9:00', subj: 'Python', color: E.pri },
    { day: 0, time: '14:00', subj: 'Stats Lab', color: E.acc },
    { day: 1, time: '10:00', subj: 'Data Wrangle', color: T.amber },
    { day: 2, time: '9:00', subj: 'Python', color: E.pri },
    { day: 3, time: '11:00', subj: 'Project', color: T.green },
    { day: 4, time: '9:00', subj: 'Quiz', color: T.red },
  ];
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' } },
      React.createElement(I, { d: ic.cal, size: 11, color: T.t1, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'Weekly Schedule'),
      React.createElement('span', { style: { fontSize: '8px', color: T.t4, marginLeft: 'auto' } }, 'Week 4 of 12')
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', padding: '4px 6px' } },
      days.map((d, di) =>
        React.createElement('div', { key: d, style: { textAlign: 'center' as const } },
          React.createElement('div', { style: { fontSize: '7px', fontWeight: 700, color: T.t4, padding: '2px 0', textTransform: 'uppercase' as const } }, d),
          ...slots.filter(s => s.day === di).map((s, si) =>
            React.createElement('div', { key: si, style: { padding: '3px', borderRadius: '4px', background: `${s.color}10`, borderLeft: `2px solid ${s.color}`, marginBottom: '2px', textAlign: 'left' as const } },
              React.createElement('div', { style: { fontSize: '6px', color: s.color, fontWeight: 700 } }, s.time),
              React.createElement('div', { style: { fontSize: '7px', fontWeight: 600, color: T.t1 } }, s.subj)
            )
          )
        )
      )
    )
  );
}

function MiniInstructor() {
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', padding: '10px' } },
    React.createElement('div', { style: { display: 'flex', gap: '10px' } },
      React.createElement('div', { style: { width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #c7d2fe, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
        React.createElement(I, { d: ic.user, size: 18, color: 'rgba(255,255,255,0.8)', stroke: 1.5 })
      ),
      React.createElement('div', { style: { flex: 1 } },
        React.createElement('div', { style: { fontSize: '12px', fontWeight: 600, color: T.t1 } }, 'Dr. Sarah Chen'),
        React.createElement('div', { style: { fontSize: '9px', color: E.pri, fontWeight: 500 } }, 'Lead Data Science Instructor'),
        React.createElement('div', { style: { fontSize: '8px', color: T.t4, marginTop: '2px' } }, 'Stanford PhD -- 10+ years'),
        React.createElement('div', { style: { display: 'flex', gap: '3px', marginTop: '4px', flexWrap: 'wrap' as const } },
          ['Python', 'ML', 'Statistics', 'Deep Learning'].map(s =>
            React.createElement('span', { key: s, style: { fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: E.priBg, color: E.pri, border: `1px solid ${E.priBg2}` } }, s)
          )
        )
      )
    )
  );
}

function MiniCurriculum() {
  const mods = [
    { num: 1, title: 'Python Foundations', done: true },
    { num: 2, title: 'Data Wrangling', done: true },
    { num: 3, title: 'Statistical Analysis', active: true },
    { num: 4, title: 'ML Basics' },
    { num: 5, title: 'Capstone Project' },
  ];
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' } },
      React.createElement(I, { d: ic.layers, size: 11, color: T.t1, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'Curriculum'),
      React.createElement('span', { style: { fontSize: '8px', color: T.t4, marginLeft: 'auto' } }, '5 modules')
    ),
    ...mods.map((m, i) =>
      React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderBottom: i < mods.length - 1 ? `1px solid ${T.bdr}` : 'none', background: m.active ? E.priBg : 'transparent' } },
        React.createElement('div', { style: { width: 20, height: 20, borderRadius: '50%', background: m.done ? T.green : m.active ? E.pri : T.bg, border: `2px solid ${m.done ? T.green : m.active ? E.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
          m.done ? React.createElement(I, { d: ic.check, size: 10, color: '#fff', stroke: 3 }) : React.createElement('span', { style: { fontSize: '7px', fontWeight: 700, color: m.active ? '#fff' : T.t4 } }, String(m.num))
        ),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('span', { style: { fontSize: '10px', fontWeight: m.active ? 600 : 400, color: T.t1 } }, m.title)
        ),
        m.done ? React.createElement(Tag, { color: T.green, bg: T.greenBg }, 'Done') : null,
        m.active ? React.createElement(Tag, { color: E.pri, bg: E.priBg2 }, 'Current') : null
      )
    )
  );
}

function MiniEnrollment() {
  return React.createElement('div', { style: { background: T.surface, border: `2px solid ${E.pri}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '7px 10px', background: E.priBg, display: 'flex', alignItems: 'center', gap: '5px' } },
      React.createElement(I, { d: ic.clip, size: 12, color: E.pri, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 700, color: E.pri, textTransform: 'uppercase' as const, letterSpacing: '0.5px' } }, 'Enrollment')
    ),
    React.createElement('div', { style: { padding: '8px 10px' } },
      React.createElement('div', { style: { padding: '5px 7px', background: T.bg, borderRadius: '5px', marginBottom: '5px' } },
        React.createElement('div', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'Data Science Fundamentals'),
        React.createElement('div', { style: { fontSize: '8px', color: T.t3 } }, '12 weeks -- Starts May 5, 2026')
      ),
      React.createElement('input', { placeholder: 'Full name', readOnly: true, style: { width: '100%', padding: '5px 8px', borderRadius: '5px', border: `1px solid ${T.bdr}`, fontSize: '9px', marginBottom: '3px', outline: 'none', boxSizing: 'border-box' as const, color: T.t3, background: T.surface } }),
      React.createElement('input', { placeholder: 'Email address', readOnly: true, style: { width: '100%', padding: '5px 8px', borderRadius: '5px', border: `1px solid ${T.bdr}`, fontSize: '9px', marginBottom: '5px', outline: 'none', boxSizing: 'border-box' as const, color: T.t3, background: T.surface } }),
      React.createElement('button', { style: { width: '100%', padding: '7px', borderRadius: '7px', border: 'none', background: E.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' } }, 'Complete Enrollment -- ' + fmt(499))
    )
  );
}

function MiniProgress() {
  const pct = 42;
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' } },
      React.createElement(I, { d: ic.chart, size: 11, color: T.t1, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'My Progress')
    ),
    React.createElement('div', { style: { padding: '8px 10px' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' } },
        React.createElement('div', { style: { width: 44, height: 44, position: 'relative' as const } },
          React.createElement('svg', { width: 44, height: 44, viewBox: '0 0 44 44' },
            React.createElement('circle', { cx: 22, cy: 22, r: 18, fill: 'none', stroke: T.bdr, strokeWidth: 3 }),
            React.createElement('circle', { cx: 22, cy: 22, r: 18, fill: 'none', stroke: E.pri, strokeWidth: 3, strokeDasharray: `${pct * 1.13} 113`, transform: 'rotate(-90 22 22)', strokeLinecap: 'round' })
          ),
          React.createElement('div', { style: { position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '11px', fontWeight: 800, color: E.pri } }, pct + '%')
        ),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', { style: { fontSize: '11px', fontWeight: 600, color: T.t1 } }, 'Data Science Fundamentals'),
          React.createElement('div', { style: { fontSize: '8px', color: T.t3 } }, 'Module 3 of 5 -- Week 6 of 12')
        )
      ),
      ['Python', 'Data Wrangling', 'Statistics', 'ML Basics', 'Capstone'].map((m, i) => {
        const p = i === 0 ? 100 : i === 1 ? 100 : i === 2 ? 60 : 0;
        return React.createElement('div', { key: m, style: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' } },
          React.createElement('span', { style: { fontSize: '7px', color: T.t4, width: '64px' } }, m),
          React.createElement('div', { style: { flex: 1, height: '4px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' } },
            React.createElement('div', { style: { width: `${p}%`, height: '100%', background: p === 100 ? T.green : E.pri, borderRadius: '2px' } })
          ),
          React.createElement('span', { style: { fontSize: '7px', fontWeight: 600, color: p === 100 ? T.green : p > 0 ? E.pri : T.t4, width: '20px', textAlign: 'right' as const } }, p + '%')
        );
      })
    )
  );
}

function MiniAssessment() {
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '10px', background: T.greenBg, textAlign: 'center' as const, borderBottom: `1px solid ${T.greenBdr}` } },
      React.createElement(I, { d: ic.award, size: 18, color: T.green, stroke: 2 }),
      React.createElement('div', { style: { fontSize: '8px', color: T.green, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '1px', marginTop: '2px' } }, 'Assessment Result'),
      React.createElement('div', { style: { fontSize: '22px', fontWeight: 800, color: T.green, lineHeight: 1 } }, '87%'),
      React.createElement('div', { style: { fontSize: '8px', color: T.green, fontWeight: 500 } }, 'Quiz 3 -- Statistical Inference')
    ),
    React.createElement('div', { style: { padding: '8px 10px' } },
      [{ l: 'Probability', s: 92 }, { l: 'Hypothesis Testing', s: 78 }, { l: 'Confidence Intervals', s: 85 }, { l: 'Regression', s: 95 }].map(sec =>
        React.createElement('div', { key: sec.l, style: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' } },
          React.createElement('span', { style: { fontSize: '7px', color: T.t4, width: '80px' } }, sec.l),
          React.createElement('div', { style: { flex: 1, height: '4px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' } },
            React.createElement('div', { style: { width: `${sec.s}%`, height: '100%', background: sec.s >= 90 ? T.green : sec.s >= 80 ? E.pri : T.amber, borderRadius: '2px' } })
          ),
          React.createElement('span', { style: { fontSize: '7px', fontWeight: 700, color: sec.s >= 90 ? T.green : sec.s >= 80 ? E.pri : T.amber, width: '22px', textAlign: 'right' as const } }, sec.s + '%')
        )
      ),
      React.createElement('div', { style: { padding: '4px 7px', background: T.bg, borderRadius: '5px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' } },
        React.createElement('span', { style: { fontSize: '8px', color: T.t3 } }, 'Class average: 79%'),
        React.createElement(Tag, { color: T.green, bg: T.greenBg }, 'Top 15%')
      )
    )
  );
}

function MiniFeeStructure() {
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' } },
      React.createElement(I, { d: ic.dollar, size: 11, color: T.t1, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'Fee Structure')
    ),
    React.createElement('div', { style: { padding: '6px 10px' } },
      [{ l: 'Tuition', v: fmt(499), main: true }, { l: 'Registration', v: fmt(50) }, { l: 'Materials', v: 'Included', color: T.green }, { l: 'Certificate', v: 'Included', color: T.green }].map((r, i) =>
        React.createElement('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' } },
          React.createElement('span', { style: { fontSize: '9px', color: T.t3 } }, r.l),
          React.createElement('span', { style: { fontSize: r.main ? '12px' : '9px', fontWeight: r.main ? 700 : 500, color: r.color || T.t1 } }, r.v)
        )
      ),
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: `2px solid ${T.t1}`, marginTop: '3px' } },
        React.createElement('span', { style: { fontSize: '10px', fontWeight: 700, color: T.t1 } }, 'Total'),
        React.createElement('span', { style: { fontSize: '14px', fontWeight: 700, color: E.pri } }, fmt(549))
      )
    )
  );
}

function MiniStudentReview() {
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '10px' } },
      React.createElement('div', { style: { width: 38, height: 38, borderRadius: '8px', background: E.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement('span', { style: { fontSize: '16px', fontWeight: 800, color: '#fff' } }, '4.8')
      ),
      React.createElement('div', { style: { flex: 1 } },
        React.createElement('div', { style: { fontSize: '9px', fontWeight: 600, color: E.pri } }, 'Excellent'),
        React.createElement('div', { style: { fontSize: '7px', color: T.t4 } }, '2,847 reviews')
      )
    ),
    [{ init: 'MK', name: 'Maria K.', bg: 'Career Switcher', text: 'Went from marketing to data analyst in 3 months.' }, { init: 'RJ', name: 'Rahul J.', bg: 'CS Student', text: 'Solid foundations. Dr. Chen explains complex topics simply.' }].map((rv, i) =>
      React.createElement('div', { key: i, style: { padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' } },
          React.createElement('div', { style: { width: 18, height: 18, borderRadius: '50%', background: E.priBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', fontWeight: 700, color: E.pri, flexShrink: 0 } }, rv.init),
          React.createElement('span', { style: { fontSize: '9px', fontWeight: 600, color: T.t1 } }, rv.name),
          React.createElement(Tag, { color: E.acc, bg: E.accBg }, rv.bg)
        ),
        React.createElement('div', { style: { fontSize: '8px', color: T.t2, lineHeight: 1.4 } }, rv.text)
      )
    )
  );
}

function MiniBatchSelector() {
  const batches = [
    { label: 'May 2026 -- Weekday', time: 'Mon/Wed 7-9 PM', seats: 8, sel: true },
    { label: 'Jun 2026 -- Weekend', time: 'Sat 10 AM-1 PM', seats: 14 },
    { label: 'Jul 2026 -- Intensive', time: 'Mon-Fri 9 AM-12 PM', seats: 20 },
  ];
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' } },
      React.createElement(I, { d: ic.cal, size: 11, color: T.t1, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'Choose Your Batch')
    ),
    ...batches.map((b, i) =>
      React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none', background: b.sel ? E.priBg : 'transparent', cursor: 'pointer' } },
        React.createElement('div', { style: { width: 14, height: 14, borderRadius: '50%', border: b.sel ? `5px solid ${E.pri}` : `2px solid ${T.bdrM}`, background: T.surface, flexShrink: 0, boxSizing: 'border-box' as const } }),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('span', { style: { fontSize: '10px', fontWeight: b.sel ? 600 : 400, color: T.t1 } }, b.label),
          React.createElement('div', { style: { fontSize: '8px', color: T.t4, marginTop: '1px' } }, b.time)
        ),
        React.createElement('span', { style: { fontSize: '9px', fontWeight: 600, color: b.seats <= 10 ? T.red : T.green } }, b.seats + ' seats left')
      )
    )
  );
}

function MiniCertificate() {
  return React.createElement('div', { style: { background: T.surface, border: `2px solid ${E.acc}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '12px', textAlign: 'center' as const, background: 'linear-gradient(135deg, rgba(15,118,110,0.03), rgba(67,56,202,0.05))' } },
      React.createElement(I, { d: ic.award, size: 22, color: E.acc, stroke: 1.5 }),
      React.createElement('div', { style: { fontSize: '6px', fontWeight: 700, color: E.acc, textTransform: 'uppercase' as const, letterSpacing: '2px', marginTop: '3px' } }, 'Certificate of Completion'),
      React.createElement('div', { style: { fontSize: '13px', fontWeight: 600, color: T.t1, marginTop: '3px' } }, 'Data Science Fundamentals'),
      React.createElement('div', { style: { width: '40px', height: '1px', background: E.acc, margin: '5px auto' } }),
      React.createElement('div', { style: { fontSize: '9px', color: T.t2 } }, 'Awarded to'),
      React.createElement('div', { style: { fontSize: '12px', fontWeight: 600, color: E.pri, marginTop: '2px' } }, 'Maria Kowalski'),
      React.createElement('div', { style: { fontSize: '7px', color: T.t4, marginTop: '3px' } }, 'Grade: A- -- ID: CERT-DS-2026-0847')
    ),
    React.createElement('div', { style: { padding: '6px 10px', borderTop: `1px solid ${T.bdr}`, display: 'flex', gap: '4px' } },
      React.createElement('button', { style: { flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 } }, 'Download PDF'),
      React.createElement('button', { style: { flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: E.acc, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' } }, 'Share')
    )
  );
}

function MiniResources() {
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' } },
      React.createElement(I, { d: ic.file, size: 11, color: T.t1, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'Learning Resources')
    ),
    [{ name: 'Statistical Inference', type: 'Video', dur: '42 min', icon: ic.video, color: T.red },
     { name: 'Hypothesis Workbook', type: 'PDF', dur: '18 pages', icon: ic.file, color: E.pri },
     { name: 'Practice Set #3', type: 'Quiz', dur: '15 questions', icon: ic.clip, color: T.amber },
    ].map((r, i) =>
      React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' } },
        React.createElement('div', { style: { width: 24, height: 24, borderRadius: 5, background: `${r.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
          React.createElement(I, { d: r.icon, size: 11, color: r.color, stroke: 1.8 })
        ),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', { style: { fontSize: '9px', fontWeight: 500, color: T.t1 } }, r.name),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' } },
            React.createElement(Tag, { color: r.color, bg: `${r.color}10` }, r.type),
            React.createElement('span', { style: { fontSize: '7px', color: T.t4 } }, r.dur)
          )
        )
      )
    )
  );
}

function MiniFacility() {
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' } },
    React.createElement('div', { style: { padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' } },
      React.createElement(I, { d: ic.building, size: 11, color: T.t1, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'Campus & Facilities')
    ),
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', padding: '3px' } },
      [{ bg: 'linear-gradient(135deg, #eef2ff, #818cf8)', l: 'Main Campus' }, { bg: 'linear-gradient(135deg, #d1fae5, #34d399)', l: 'Computer Lab' }].map((img, i) =>
        React.createElement('div', { key: i, style: { height: 32, borderRadius: 5, background: img.bg, display: 'flex', alignItems: 'flex-end', padding: '2px 4px' } },
          React.createElement('span', { style: { fontSize: '6px', fontWeight: 600, color: 'rgba(0,0,0,0.5)', background: 'rgba(255,255,255,0.6)', padding: '1px 3px', borderRadius: '2px' } }, img.l)
        )
      )
    ),
    React.createElement('div', { style: { padding: '5px 10px' } },
      [ic.wifi, ic.openBook, ic.video, ic.coffee, ic.map].map((icon, j) =>
        React.createElement('div', { key: j, style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '2px 0' } },
          React.createElement(I, { d: icon, size: 9, color: E.pri, stroke: 1.5 }),
          React.createElement('span', { style: { fontSize: '8px', color: T.t2 } }, ['High-speed WiFi', '24/7 Digital Library', 'Recording Studios', 'Student Lounge', 'Downtown Location'][j])
        )
      )
    )
  );
}

const EDU_BLOCKS: VerticalBlockDef[] = [
  { id: 'course_card', family: 'catalog', label: 'Course Card', stage: 'discovery', desc: 'Browsable course with instructor, level badge, duration, student count, rating, price', preview: MiniCourseCard, intents: ['courses', 'browse', 'programs', 'classes'], module: 'education_catalog', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'course_detail', family: 'catalog', label: 'Course Detail', stage: 'showcase', desc: 'Full course view with instructor bio, stats, learning outcomes, pricing', preview: MiniCourseDetail, intents: ['details', 'tell me more', 'syllabus'], module: 'education_catalog', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'schedule', family: 'timetable', label: 'Schedule / Timetable', stage: 'showcase', desc: 'Weekly class grid with day columns, color-coded subject slots', preview: MiniSchedule, intents: ['schedule', 'timetable', 'when', 'class times'], module: 'education_timetable', status: 'active' },
  { id: 'instructor', family: 'people', label: 'Instructor Profile', stage: 'discovery', desc: 'Teacher card with credentials, subject tags, rating, student count', preview: MiniInstructor, intents: ['instructor', 'teacher', 'professor', 'who teaches'], module: 'education_people', status: 'active', reads: ['name', 'description', 'image_url', 'subtitle', 'badges'] },
  { id: 'curriculum', family: 'content', label: 'Curriculum Outline', stage: 'showcase', desc: 'Module breakdown with numbered steps, completion status', preview: MiniCurriculum, intents: ['curriculum', 'modules', 'topics', 'syllabus'], module: 'education_content', status: 'active' },
  { id: 'enrollment', family: 'conversion', label: 'Enrollment Form', stage: 'conversion', desc: 'Registration flow with course summary, payment plan selector', preview: MiniEnrollment, intents: ['enroll', 'register', 'sign up', 'apply'], module: 'education_conversion', status: 'active' },
  { id: 'progress', family: 'tracking', label: 'Progress Dashboard', stage: 'social_proof', desc: 'Circular completion chart, module progress bars, next deadline', preview: MiniProgress, intents: ['progress', 'how am I doing', 'grades'], module: 'education_tracking', status: 'active' },
  { id: 'assessment', family: 'tracking', label: 'Assessment Result', stage: 'social_proof', desc: 'Test score with section breakdown, percentile ranking', preview: MiniAssessment, intents: ['results', 'score', 'quiz', 'test'], module: 'education_tracking', status: 'active' },
  { id: 'fee_structure', family: 'pricing', label: 'Fee Structure', stage: 'showcase', desc: 'Itemized fee table with total, scholarship indicator', preview: MiniFeeStructure, intents: ['fees', 'cost', 'pricing', 'tuition'], module: 'education_pricing', status: 'active' },
  { id: 'student_review', family: 'social_proof', label: 'Student Reviews', stage: 'social_proof', desc: 'Aggregate score with criteria bars, individual reviews', preview: MiniStudentReview, intents: ['reviews', 'ratings', 'testimonials'], module: 'education_social_proof', status: 'active' },
  { id: 'batch_selector', family: 'scheduling', label: 'Batch / Cohort Selector', stage: 'conversion', desc: 'Batch picker with dates, times, mode, seat availability', preview: MiniBatchSelector, intents: ['batch', 'start date', 'cohort', 'next batch'], module: 'education_scheduling', status: 'active' },
  { id: 'certificate', family: 'credentials', label: 'Certificate / Credential', stage: 'social_proof', desc: 'Formal completion certificate with verification ID', preview: MiniCertificate, intents: ['certificate', 'credential', 'diploma'], module: 'education_credentials', status: 'active' },
  { id: 'resources', family: 'content', label: 'Learning Resources', stage: 'discovery', desc: 'Material library with type-coded icons', preview: MiniResources, intents: ['resources', 'materials', 'downloads', 'videos'], module: 'education_content', status: 'active' },
  // engines: ['info'] — campus/facility directory is pure info surface (hours, location, virtual-tour navigation)
  { id: 'facility', family: 'info', label: 'Campus / Facility', stage: 'discovery', desc: 'Campus photo grid, facility list, virtual tour link', preview: MiniFacility, intents: ['campus', 'facility', 'location', 'labs'], module: 'education_info', status: 'active', engines: ['info'] },
];

const EDU_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'early_childhood', name: 'Early Childhood Education', industryId: 'education_learning', blocks: ['course_card', 'schedule', 'enrollment', 'fee_structure', 'facility', 'student_review'] },
  { id: 'k12_education', name: 'K-12 Education', industryId: 'education_learning', blocks: ['course_card', 'schedule', 'curriculum', 'instructor', 'progress', 'assessment', 'fee_structure', 'student_review', 'facility'] },
  { id: 'higher_education', name: 'Higher Education', industryId: 'education_learning', blocks: ['course_card', 'course_detail', 'curriculum', 'instructor', 'enrollment', 'fee_structure', 'batch_selector', 'certificate', 'student_review', 'facility'] },
  { id: 'test_preparation', name: 'Test Preparation', industryId: 'education_learning', blocks: ['course_card', 'schedule', 'instructor', 'progress', 'assessment', 'fee_structure', 'batch_selector', 'student_review'] },
  { id: 'language_learning', name: 'Language Learning', industryId: 'education_learning', blocks: ['course_card', 'schedule', 'instructor', 'progress', 'assessment', 'batch_selector', 'student_review', 'resources'] },
  { id: 'skill_vocational', name: 'Skill Development & Vocational', industryId: 'education_learning', blocks: ['course_card', 'course_detail', 'curriculum', 'instructor', 'enrollment', 'fee_structure', 'certificate', 'student_review', 'batch_selector'] },
  { id: 'corporate_training', name: 'Corporate Training', industryId: 'education_learning', blocks: ['course_card', 'curriculum', 'instructor', 'progress', 'certificate', 'batch_selector', 'student_review'] },
  { id: 'online_learning', name: 'Online Learning Platform', industryId: 'education_learning', blocks: ['course_card', 'course_detail', 'curriculum', 'instructor', 'progress', 'assessment', 'resources', 'certificate', 'student_review'] },
  { id: 'academic_consulting', name: 'Academic Consulting', industryId: 'education_learning', blocks: ['instructor', 'schedule', 'enrollment', 'fee_structure', 'student_review'] },
  { id: 'creative_arts', name: 'Creative Arts Education', industryId: 'education_learning', blocks: ['course_card', 'schedule', 'instructor', 'enrollment', 'fee_structure', 'student_review', 'facility'] },
];

const EDU_FAMILIES: Record<string, VerticalFamilyDef> = {
  catalog: { label: 'Course Catalog', color: '#4338ca' },
  timetable: { label: 'Scheduling', color: '#b45309' },
  people: { label: 'Instructors', color: '#be185d' },
  content: { label: 'Content & Curriculum', color: '#0f766e' },
  conversion: { label: 'Enrollment', color: '#2d6a4f' },
  tracking: { label: 'Progress & Assessment', color: '#1d4ed8' },
  pricing: { label: 'Fees & Pricing', color: '#0f766e' },
  social_proof: { label: 'Reviews & Proof', color: '#be185d' },
  scheduling: { label: 'Batch Management', color: '#b45309' },
  credentials: { label: 'Credentials', color: '#0f766e' },
  info: { label: 'Campus Info', color: '#7a7a70' },
};

export const EDU_CONFIG: VerticalConfig = {
  id: 'education',
  industryId: 'education_learning',
  name: 'Education & Learning',
  iconName: 'GraduationCap',
  accentColor: '#4338ca',
  blocks: EDU_BLOCKS,
  subVerticals: EDU_SUBVERTICALS,
  families: EDU_FAMILIES,
};
