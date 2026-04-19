// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#0e7490', priLt: '#06b6d4', priBg: 'rgba(14,116,144,0.06)', priBg2: 'rgba(14,116,144,0.12)',
  acc: '#7c3aed', accBg: 'rgba(124,58,237,0.06)', accBg2: 'rgba(124,58,237,0.14)',
  bg: '#f7f8f9',
};

function MiniServiceCard() {
  const svcs = [
    { name: 'General Consultation', dept: 'Primary Care', dur: '30 min', price: 120, insurance: true, avail: 'Same day', icon: ic.activity, rating: 4.8 },
    { name: 'Full Body Checkup', dept: 'Preventive', dur: '90 min', price: 350, insurance: true, avail: 'Next day', icon: ic.activity, badge: 'Popular', rating: 4.9 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {svcs.map((s, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: T.priBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
              <I d={s.icon} size={18} color={T.pri} stroke={1.5} />
              {s.badge && <div style={{ position: 'absolute', top: -2, right: -2 }}><Tag color="#fff" bg={T.acc}>{s.badge}</Tag></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1, lineHeight: 1.2 }}>{s.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Tag color={T.pri} bg={T.priBg}>{s.dept}</Tag>
                <I d={ic.clock} size={8} color={T.t4} /><span style={{ fontSize: '8px', color: T.t4 }}>{s.dur}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(s.price)}</span>
                  {s.insurance && <span style={{ display: 'flex', alignItems: 'center', gap: '1px' }}><I d={ic.shield} size={8} color={T.green} stroke={2} /><span style={{ fontSize: '7px', color: T.green, fontWeight: 500 }}>Covered</span></span>}
                  <Stars r={s.rating} size={7} />
                </div>
                <button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>Book</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniProviderProfile() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #cffafe, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I d={ic.user} size={22} color="rgba(255,255,255,0.8)" stroke={1.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: T.t1 }}>Dr. Emily Rodriguez, MD</div>
          <div style={{ fontSize: '9px', color: T.pri, fontWeight: 500 }}>Internal Medicine</div>
          <div style={{ fontSize: '8px', color: T.t4, marginTop: '2px' }}>Johns Hopkins -- Board Certified -- 15 years</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {[{ v: '4.9', l: 'Rating' }, { v: '3.2K', l: 'Patients' }, { v: '15yr', l: 'Exp.' }].map(s => (
              <span key={s.l} style={{ fontSize: '8px', color: T.t3 }}><span style={{ fontWeight: 700, color: T.t1 }}>{s.v}</span> {s.l}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 10px 4px' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {['Preventive Care', 'Chronic Disease', 'Diabetes', 'Hypertension'].map(s => (
            <span key={s} style={{ fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: T.priBg, color: T.pri, border: `1px solid ${T.priBg2}` }}>{s}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '6px 10px', borderTop: `1px solid ${T.bdr}`, background: T.bg, display: 'flex', gap: '4px', marginTop: '4px' }}>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>View Profile</button>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Book Appt.</button>
      </div>
    </div>
  );
}

function MiniAppointment() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.cal} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Book Appointment</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '5px 7px', background: T.bg, borderRadius: '5px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.priBg2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I d={ic.user} size={10} color={T.pri} stroke={2} /></div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>Dr. Emily Rodriguez</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>General Consultation -- 30 min</div>
          </div>
        </div>
        <div style={{ fontSize: '8px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Select Date</div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ d: 'Mon', n: '14' }, { d: 'Tue', n: '15', sel: true }, { d: 'Wed', n: '16' }, { d: 'Thu', n: '17', off: true }, { d: 'Fri', n: '18' }].map(day => (
            <div key={day.n} style={{ flex: 1, padding: '5px 2px', borderRadius: '6px', textAlign: 'center', border: day.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: day.sel ? T.priBg : day.off ? T.card : T.surface, cursor: day.off ? 'default' : 'pointer', opacity: day.off ? 0.4 : 1 }}>
              <div style={{ fontSize: '7px', color: T.t4 }}>{day.d}</div>
              <div style={{ fontSize: '11px', fontWeight: day.sel ? 700 : 500, color: day.sel ? T.pri : T.t1 }}>{day.n}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '8px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Available Times</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px', marginBottom: '5px' }}>
          {['9:00 AM', '9:30 AM', '10:30 AM', '11:00 AM', '2:00 PM', '3:30 PM'].map((t, i) => (
            <div key={t} style={{ padding: '5px', borderRadius: '5px', textAlign: 'center', fontSize: '8px', border: i === 3 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i === 3 ? T.priBg : T.surface, color: i === 3 ? T.pri : T.t1, fontWeight: i === 3 ? 600 : 400, cursor: 'pointer' }}>{t}</div>
          ))}
        </div>
        <div style={{ padding: '4px 7px', background: T.greenBg, borderRadius: '5px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <I d={ic.shield} size={8} color={T.green} stroke={2} />
          <span style={{ fontSize: '8px', color: T.green }}>Insurance accepted -- Est. copay {fmt(25)}</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Confirm -- Tue Apr 15, 11:00 AM</button>
      </div>
    </div>
  );
}

function MiniSymptomChecker() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.eye} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Symptom Assessment</span>
        <Tag color={T.t4} bg={T.bg}>Step 2 of 4</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: T.t1, marginBottom: '4px' }}>Where is the discomfort?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginBottom: '6px' }}>
          {[{ l: 'Head / Neck', sel: false }, { l: 'Chest / Back', sel: true }, { l: 'Abdomen', sel: false }, { l: 'Limbs / Joints', sel: false }].map(area => (
            <div key={area.l} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 6px', borderRadius: '6px', border: area.sel ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: area.sel ? T.accBg : T.surface, cursor: 'pointer' }}>
              <I d={ic.activity} size={12} color={area.sel ? T.acc : T.t3} stroke={1.5} />
              <span style={{ fontSize: '9px', fontWeight: area.sel ? 600 : 400, color: area.sel ? T.acc : T.t2 }}>{area.l}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '8px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Duration</div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {['Today', '2-3 days', '1+ week', 'Chronic'].map((d, i) => (
            <span key={d} style={{ flex: 1, textAlign: 'center', padding: '4px', borderRadius: '4px', fontSize: '8px', border: i === 1 ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: i === 1 ? T.accBg : T.surface, color: i === 1 ? T.acc : T.t2, fontWeight: i === 1 ? 600 : 400, cursor: 'pointer' }}>{d}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= 2 ? T.acc : T.bdr }} />)}
        </div>
        <button style={{ width: '100%', padding: '7px', borderRadius: '7px', border: 'none', background: T.acc, color: '#fff', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}>Next</button>
        <div style={{ fontSize: '7px', color: T.t4, textAlign: 'center', marginTop: '3px' }}>Not a diagnosis. For guidance only.</div>
      </div>
    </div>
  );
}

function MiniInsurance() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.shield} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Insurance Verification</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '6px 8px', background: T.greenBg, borderRadius: '6px', border: `1px solid ${T.greenBdr}`, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(21,128,61,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I d={ic.check} size={12} color={T.green} stroke={3} />
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: T.green }}>In-Network Provider</div>
            <div style={{ fontSize: '8px', color: T.t3 }}>Blue Cross Blue Shield PPO</div>
          </div>
        </div>
        {[
          { l: 'Plan', v: 'BCBS PPO Gold' },
          { l: 'Member ID', v: 'XWP-8847291' },
          { l: 'Copay', v: fmt(25), color: T.green },
          { l: 'Deductible met', v: '$1,200 / $2,000' },
          { l: 'Auth required', v: 'No', color: T.green },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', borderBottom: i < 4 ? `1px solid ${T.bdr}` : 'none' }}>
            <span style={{ fontSize: '9px', color: T.t3, flex: 1 }}>{r.l}</span>
            <span style={{ fontSize: '9px', fontWeight: 500, color: r.color || T.t1 }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLabResults() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.file} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Lab Results</span>
        <span style={{ fontSize: '8px', color: T.t4, marginLeft: 'auto' }}>Apr 10, 2026</span>
      </div>
      <div style={{ padding: '4px 10px' }}>
        {[
          { test: 'Hemoglobin', val: '14.2', unit: 'g/dL', ref: '12.0-17.5', status: 'normal' },
          { test: 'WBC Count', val: '11.8', unit: 'K/uL', ref: '4.5-11.0', status: 'high' },
          { test: 'Platelets', val: '245', unit: 'K/uL', ref: '150-400', status: 'normal' },
          { test: 'Glucose (fasting)', val: '118', unit: 'mg/dL', ref: '70-100', status: 'high' },
          { test: 'Cholesterol', val: '195', unit: 'mg/dL', ref: '<200', status: 'normal' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', borderBottom: i < 4 ? `1px solid ${T.bdr}` : 'none' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.status === 'normal' ? T.green : T.amber, flexShrink: 0 }} />
            <span style={{ fontSize: '9px', color: T.t1, flex: 1 }}>{r.test}</span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: r.status === 'normal' ? T.t1 : T.amber }}>{r.val}</span>
            <span style={{ fontSize: '7px', color: T.t4 }}>{r.unit}</span>
            <span style={{ fontSize: '7px', color: T.t4, width: '48px', textAlign: 'right' }}>{r.ref}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '5px 10px', borderTop: `1px solid ${T.bdr}`, background: T.amberBg, display: 'flex', alignItems: 'center', gap: '3px' }}>
        <I d={ic.activity} size={9} color={T.amber} stroke={2} />
        <span style={{ fontSize: '8px', color: T.amber, fontWeight: 500 }}>2 values outside normal range. Consult your provider.</span>
      </div>
    </div>
  );
}

function MiniPrescription() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.shield} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Active Prescriptions</span>
      </div>
      {[
        { name: 'Metformin 500mg', dose: '1 tablet twice daily with meals', refills: 3, next: 'Apr 28', status: 'Active', color: T.green },
        { name: 'Lisinopril 10mg', dose: '1 tablet daily in morning', refills: 1, next: 'May 5', status: 'Refill soon', color: T.amber },
        { name: 'Atorvastatin 20mg', dose: '1 tablet at bedtime', refills: 0, next: 'N/A', status: 'Needs renewal', color: T.red },
      ].map((rx, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>{rx.name}</span>
            <Tag color={rx.color} bg={`${rx.color}10`}>{rx.status}</Tag>
          </div>
          <div style={{ fontSize: '8px', color: T.t3, marginTop: '1px' }}>{rx.dose}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
            <span style={{ fontSize: '7px', color: T.t4 }}>Refills: <span style={{ fontWeight: 600, color: rx.refills > 0 ? T.t1 : T.red }}>{rx.refills}</span></span>
            <span style={{ fontSize: '7px', color: T.t4 }}>Next fill: {rx.next}</span>
          </div>
        </div>
      ))}
      <div style={{ padding: '6px 10px', borderTop: `1px solid ${T.bdr}`, display: 'flex', gap: '4px' }}>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Request Refill</button>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Find Pharmacy</button>
      </div>
    </div>
  );
}

function MiniPatientIntake() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.clip} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient Intake</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {['Full name', 'Date of birth'].map((f, i) => (
          <input key={i} placeholder={f} readOnly style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: `1px solid ${T.bdr}`, fontSize: '9px', marginBottom: '3px', outline: 'none', boxSizing: 'border-box', color: T.t3, background: T.surface }} />
        ))}
        <div style={{ fontSize: '8px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px', marginTop: '3px' }}>Medical History</div>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '4px' }}>
          {['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'None'].map((c, i) => (
            <span key={c} style={{ fontSize: '8px', padding: '3px 6px', borderRadius: '4px', border: i < 2 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i < 2 ? T.priBg : T.surface, color: i < 2 ? T.pri : T.t2, fontWeight: i < 2 ? 600 : 400, cursor: 'pointer' }}>{c}</span>
          ))}
        </div>
        <div style={{ fontSize: '8px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Allergies</div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {['Penicillin', 'Sulfa', 'Latex', 'NKDA'].map((a, i) => (
            <span key={a} style={{ fontSize: '8px', padding: '3px 6px', borderRadius: '4px', border: i === 0 ? `2px solid ${T.red}` : `1px solid ${T.bdr}`, background: i === 0 ? T.redBg : T.surface, color: i === 0 ? T.red : T.t2, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer' }}>{a}</span>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Submit Intake Form</button>
      </div>
    </div>
  );
}

function MiniTreatmentPlan() {
  const steps = [
    { label: 'Initial Consultation', date: 'Apr 15', status: 'done', detail: 'Diagnosis confirmed' },
    { label: 'Lab Work', date: 'Apr 17', status: 'done', detail: 'CBC + Metabolic panel' },
    { label: 'Medication Started', date: 'Apr 18', status: 'active', detail: 'Metformin 500mg 2x daily' },
    { label: 'Follow-up Visit', date: 'May 15', status: 'upcoming', detail: 'Review labs + adjust dosage' },
    { label: 'Reassessment', date: 'Jul 15', status: 'upcoming', detail: '3-month checkpoint' },
  ];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.activity} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Treatment Plan</span>
        <Tag color={T.pri} bg={T.priBg}>Type 2 Diabetes</Tag>
      </div>
      <div style={{ padding: '6px 10px' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', position: 'relative', paddingBottom: i < steps.length - 1 ? '8px' : '0' }}>
            {i < steps.length - 1 && <div style={{ position: 'absolute', left: 8, top: 18, width: 1, height: 'calc(100% - 12px)', background: s.status === 'done' ? T.green : T.bdr }} />}
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: s.status === 'done' ? T.green : s.status === 'active' ? T.pri : T.bg, border: `2px solid ${s.status === 'done' ? T.green : s.status === 'active' ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              {s.status === 'done' ? <I d={ic.check} size={9} color="#fff" stroke={3} /> : <span style={{ fontSize: '7px', fontWeight: 700, color: s.status === 'active' ? '#fff' : T.t4 }}>{i + 1}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: s.status === 'active' ? 600 : 400, color: T.t1 }}>{s.label}</span>
                <span style={{ fontSize: '7px', color: T.t4 }}>{s.date}</span>
              </div>
              <div style={{ fontSize: '8px', color: T.t3, marginTop: '1px' }}>{s.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniTelehealth() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.teal}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.tealBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.video} size={12} color={T.teal} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.teal, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Telehealth Visit</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #cffafe, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I d={ic.user} size={14} color="rgba(255,255,255,0.8)" /></div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Dr. Emily Rodriguez</div>
            <div style={{ fontSize: '8px', color: T.t3 }}>Tue Apr 15 -- 11:00 AM -- 30 min</div>
          </div>
        </div>
        <div style={{ fontSize: '8px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Pre-visit checklist</div>
        {[
          { l: 'Camera & microphone tested', done: true },
          { l: 'Quiet, well-lit location', done: true },
          { l: 'Insurance card ready', done: false },
          { l: 'List of current medications', done: false },
        ].map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 0' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: c.done ? T.green : T.bg, border: `1px solid ${c.done ? T.green : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {c.done && <I d={ic.check} size={8} color="#fff" stroke={3} />}
            </div>
            <span style={{ fontSize: '9px', color: c.done ? T.t3 : T.t1, textDecoration: c.done ? 'line-through' : 'none' }}>{c.l}</span>
          </div>
        ))}
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.teal, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Join Video Visit</button>
      </div>
    </div>
  );
}

function MiniWaitTime() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.clock} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Current Wait Times</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, display: 'inline-block' }} /><span style={{ fontSize: '7px', color: T.green, fontWeight: 500 }}>Live</span></span>
      </div>
      {[
        { dept: 'General Practice', wait: '~15 min', q: 3, color: T.green },
        { dept: 'Urgent Care', wait: '~35 min', q: 7, color: T.amber },
        { dept: 'Pediatrics', wait: '~20 min', q: 4, color: T.green },
        { dept: 'Dental', wait: '~10 min', q: 2, color: T.green },
        { dept: 'Lab / Blood Draw', wait: '~5 min', q: 1, color: T.green },
      ].map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 4 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
          <span style={{ fontSize: '9px', color: T.t1, flex: 1 }}>{d.dept}</span>
          <span style={{ fontSize: '9px', fontWeight: 600, color: d.color }}>{d.wait}</span>
          <span style={{ fontSize: '7px', color: T.t4, width: '40px', textAlign: 'right' }}>{d.q} ahead</span>
        </div>
      ))}
      <div style={{ padding: '5px 10px', borderTop: `1px solid ${T.bdr}`, background: T.bg, fontSize: '7px', color: T.t4, textAlign: 'center' }}>Updated 2 min ago</div>
    </div>
  );
}

function MiniFacilityInfo() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.building} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Facility & Departments</span>
      </div>
      {[
        { dept: 'Primary Care', floor: '2nd Floor', hours: '8 AM - 6 PM', status: 'Open', color: T.green },
        { dept: 'Urgent Care', floor: '1st Floor', hours: '24/7', status: 'Open', color: T.green },
        { dept: 'Imaging / Radiology', floor: 'Ground', hours: '7 AM - 8 PM', status: 'Open', color: T.green },
        { dept: 'Laboratory', floor: 'Ground', hours: '6 AM - 5 PM', status: 'Closed', color: T.red },
        { dept: 'Pharmacy', floor: '1st Floor', hours: '9 AM - 7 PM', status: 'Open', color: T.green },
      ].map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 4 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 500, color: T.t1 }}>{d.dept}</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{d.floor} -- {d.hours}</div>
          </div>
          <Tag color={d.color} bg={`${d.color}10`}>{d.status}</Tag>
        </div>
      ))}
      <div style={{ padding: '5px 10px', borderTop: `1px solid ${T.bdr}`, display: 'flex', gap: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', color: T.pri, fontWeight: 500, cursor: 'pointer' }}><I d={ic.phone} size={9} color={T.pri} stroke={2} />Emergency: 911</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', color: T.pri, fontWeight: 500, cursor: 'pointer' }}><I d={ic.map} size={9} color={T.pri} stroke={2} />Get Directions</span>
      </div>
    </div>
  );
}

function MiniPatientReview() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '8px', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>4.8</span>
        </div>
        <div style={{ flex: 1 }}>
          {[{ l: 'Bedside manner', v: 96 }, { l: 'Wait time', v: 84 }, { l: 'Staff friendliness', v: 92 }, { l: 'Explanation clarity', v: 95 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '62px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 90 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'TG', name: 'Thomas G.', text: 'Dr. Rodriguez took the time to explain everything thoroughly.', ago: '5d', visit: 'Annual Physical' },
        { init: 'LP', name: 'Lisa P.', text: 'Efficient and caring staff. Quality of care made up for the wait.', ago: '2w', visit: 'Follow-up' },
      ].map((rv, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.priBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: T.pri, flexShrink: 0 }}>{rv.init}</div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{rv.name}</span>
            <Tag color={T.pri} bg={T.priBg}>{rv.visit}</Tag>
            <span style={{ fontSize: '7px', color: T.t4, marginLeft: 'auto' }}>{rv.ago}</span>
          </div>
          <div style={{ fontSize: '8px', color: T.t2, lineHeight: 1.45 }}>{rv.text}</div>
        </div>
      ))}
    </div>
  );
}

function MiniPetProfile() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', display: 'flex', gap: '8px' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I d={ic.heart} size={18} color="rgba(180,83,9,0.6)" stroke={1.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: T.t1 }}>Max</div>
          <div style={{ fontSize: '9px', color: T.t3 }}>Golden Retriever -- Male -- 4 years</div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
            {['32 kg', 'Neutered', 'Vaccinated'].map((t, i) => (
              <span key={t} style={{ fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: i === 2 ? T.greenBg : T.bg, color: i === 2 ? T.green : T.t2, border: `1px solid ${i === 2 ? T.greenBdr : T.bdr}` }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '4px 10px 6px' }}>
        {[{ l: 'Annual Checkup', d: 'May 2, 2026' }, { l: 'Heartworm Prevention', d: 'Due now', color: T.amber }].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 0', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
            <I d={ic.cal} size={9} color={item.color || T.t4} stroke={1.5} />
            <span style={{ fontSize: '9px', color: T.t1, flex: 1 }}>{item.l}</span>
            <span style={{ fontSize: '8px', fontWeight: 500, color: item.color || T.t3 }}>{item.d}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '5px 10px', borderTop: `1px solid ${T.bdr}`, display: 'flex', gap: '4px' }}>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Health Records</button>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Book Visit</button>
      </div>
    </div>
  );
}

const HC_BLOCKS: VerticalBlockDef[] = [
  { id: 'service_card', family: 'services', label: 'Service / Procedure Card', stage: 'discovery', desc: 'Browsable medical service with specialty tag, duration, pricing, insurance indicator', preview: MiniServiceCard, intents: ['services', 'procedures', 'treatments', 'checkup'], module: 'moduleItems', status: 'active' },
  { id: 'provider_profile', family: 'providers', label: 'Provider Profile', stage: 'discovery', desc: 'Doctor card with credentials, board certifications, specializations, patient stats', preview: MiniProviderProfile, intents: ['doctor', 'physician', 'provider', 'specialist', 'find a doctor'], module: 'moduleItems', status: 'active' },
  { id: 'appointment', family: 'booking', label: 'Appointment Scheduler', stage: 'conversion', desc: 'Date/time slot picker with provider context, insurance copay preview', preview: MiniAppointment, intents: ['book', 'appointment', 'schedule', 'available', 'when can I come'], module: null, status: 'active', engines: ['booking'] },
  { id: 'symptom_checker', family: 'assessment', label: 'Symptom Assessment', stage: 'discovery', desc: 'Multi-step symptom questionnaire with body region, severity, duration', preview: MiniSymptomChecker, intents: ['symptoms', 'not feeling well', 'pain', 'sick', 'check symptoms'], module: null, status: 'active' },
  { id: 'insurance', family: 'billing', label: 'Insurance Verification', stage: 'showcase', desc: 'Plan lookup showing network status, copay estimate, deductible progress', preview: MiniInsurance, intents: ['insurance', 'coverage', 'copay', 'in network', 'deductible'], module: null, status: 'active' },
  { id: 'lab_results', family: 'records', label: 'Lab Results', stage: 'social_proof', desc: 'Test result table with values, reference ranges, normal/abnormal indicators', preview: MiniLabResults, intents: ['results', 'labs', 'blood work', 'test results'], module: null, status: 'active' },
  { id: 'prescription', family: 'pharmacy', label: 'Prescription Manager', stage: 'social_proof', desc: 'Active medication list with dosage, refill count, renewal status', preview: MiniPrescription, intents: ['prescription', 'medication', 'refill', 'medicine', 'pharmacy'], module: null, status: 'active' },
  { id: 'patient_intake', family: 'operations', label: 'Patient Intake Form', stage: 'conversion', desc: 'Pre-visit registration with medical history, allergy picker', preview: MiniPatientIntake, intents: ['forms', 'intake', 'paperwork', 'new patient', 'register'], module: null, status: 'active', engines: ['booking'] },
  { id: 'treatment_plan', family: 'care', label: 'Treatment Plan', stage: 'social_proof', desc: 'Step-by-step care timeline with completed/active/upcoming milestones', preview: MiniTreatmentPlan, intents: ['treatment', 'plan', 'next steps', 'follow up', 'care plan'], module: null, status: 'active' },
  { id: 'telehealth', family: 'virtual', label: 'Telehealth Visit', stage: 'conversion', desc: 'Virtual visit launcher with provider info, pre-visit checklist', preview: MiniTelehealth, intents: ['telehealth', 'video visit', 'virtual', 'online appointment'], module: null, status: 'active', engines: ['booking'] },
  { id: 'wait_time', family: 'operations', label: 'Wait Time Display', stage: 'discovery', desc: 'Live department wait times with queue position, color-coded urgency', preview: MiniWaitTime, intents: ['wait', 'how long', 'queue', 'busy', 'walk in'], module: null, status: 'active', engines: ['booking'] },
  // engines: ['info'] — facility directory (hours / directions / department locations) is pure info surface; used by hospital partners (info-secondary) and standalone info partners
  { id: 'facility', family: 'info', label: 'Facility & Departments', stage: 'discovery', desc: 'Department directory with floor, hours, open/closed status, emergency', preview: MiniFacilityInfo, intents: ['location', 'departments', 'hours', 'directions', 'parking'], module: null, status: 'active', engines: ['info'] },
  { id: 'patient_review', family: 'social_proof', label: 'Patient Reviews', stage: 'social_proof', desc: 'Aggregate score with healthcare-specific criteria, visit-tagged reviews', preview: MiniPatientReview, intents: ['reviews', 'ratings', 'what do patients say', 'testimonials'], module: null, status: 'active' },
  { id: 'pet_profile', family: 'veterinary', label: 'Pet Health Profile', stage: 'showcase', desc: 'Pet card with breed, weight, vaccination timeline -- veterinary only', preview: MiniPetProfile, intents: ['pet', 'dog', 'cat', 'veterinary', 'vet', 'vaccination'], module: 'moduleItems', status: 'active' },
];

const HC_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'general_practice', name: 'Primary Care Clinics', industryId: 'healthcare_medical', blocks: ['service_card', 'provider_profile', 'appointment', 'symptom_checker', 'insurance', 'lab_results', 'prescription', 'patient_intake', 'patient_review', 'wait_time', 'facility'] },
  { id: 'dental_care', name: 'Dental Care', industryId: 'healthcare_medical', blocks: ['service_card', 'provider_profile', 'appointment', 'insurance', 'patient_intake', 'treatment_plan', 'patient_review', 'facility'] },
  { id: 'specialist_clinic', name: 'Specialist Clinics', industryId: 'healthcare_medical', blocks: ['service_card', 'provider_profile', 'appointment', 'symptom_checker', 'insurance', 'lab_results', 'prescription', 'patient_intake', 'treatment_plan', 'patient_review', 'facility', 'telehealth'] },
  { id: 'diagnostic_lab', name: 'Diagnostic & Imaging', industryId: 'healthcare_medical', blocks: ['service_card', 'appointment', 'insurance', 'lab_results', 'patient_intake', 'facility', 'patient_review'] },
  { id: 'pharmacy', name: 'Pharmacy & Medical Retail', industryId: 'healthcare_medical', blocks: ['prescription', 'service_card', 'insurance', 'facility', 'patient_review'] },
  { id: 'physiotherapy', name: 'Physical Therapy & Rehab', industryId: 'healthcare_medical', blocks: ['service_card', 'provider_profile', 'appointment', 'insurance', 'treatment_plan', 'patient_review', 'facility'] },
  { id: 'mental_health', name: 'Mental Health Services', industryId: 'healthcare_medical', blocks: ['service_card', 'provider_profile', 'appointment', 'insurance', 'telehealth', 'treatment_plan', 'patient_review'] },
  { id: 'alternative_medicine', name: 'Alternative & Traditional', industryId: 'healthcare_medical', blocks: ['service_card', 'provider_profile', 'appointment', 'patient_intake', 'patient_review', 'facility'] },
  { id: 'home_healthcare', name: 'Home Healthcare', industryId: 'healthcare_medical', blocks: ['service_card', 'provider_profile', 'appointment', 'prescription', 'treatment_plan', 'telehealth', 'patient_review'] },
  { id: 'veterinary', name: 'Veterinary Services', industryId: 'healthcare_medical', blocks: ['service_card', 'provider_profile', 'appointment', 'pet_profile', 'prescription', 'patient_review', 'facility'] },
];

const HC_FAMILIES: Record<string, VerticalFamilyDef> = {
  services: { label: 'Services & Procedures', color: '#0e7490' },
  providers: { label: 'Providers', color: '#7c3aed' },
  booking: { label: 'Appointment Booking', color: '#15803d' },
  assessment: { label: 'Assessment & Triage', color: '#7c3aed' },
  billing: { label: 'Insurance & Billing', color: '#1d4ed8' },
  records: { label: 'Medical Records', color: '#b45309' },
  pharmacy: { label: 'Pharmacy & Rx', color: '#be185d' },
  operations: { label: 'Patient Operations', color: '#0e7490' },
  care: { label: 'Care Management', color: '#0f766e' },
  virtual: { label: 'Virtual Care', color: '#0f766e' },
  info: { label: 'Facility Info', color: '#7a7a70' },
  social_proof: { label: 'Reviews & Trust', color: '#be185d' },
  veterinary: { label: 'Veterinary', color: '#b45309' },
};

export const HC_CONFIG: VerticalConfig = {
  id: 'healthcare',
  industryId: 'healthcare_medical',
  name: 'Healthcare & Medical',
  iconName: 'Heart',
  accentColor: '#0e7490',
  blocks: HC_BLOCKS,
  subVerticals: HC_SUBVERTICALS,
  families: HC_FAMILIES,
};