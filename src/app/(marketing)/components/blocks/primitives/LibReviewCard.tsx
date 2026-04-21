'use client';
import { C, F, FS } from '../../theme';
import type { LibReviewCardProps } from '../types';

export function LibReviewCard({
  quote = 'Booked whitening, in and out in an hour. Results were exactly as shown.',
  reviewer = 'Maya Rodriguez',
  initials = 'MR',
  suffix = 'verified patient',
  rating = '847 reviews',
}: LibReviewCardProps) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={C.amber} stroke="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        <span style={{ fontSize: 11, color: C.t3, fontFamily: F, fontWeight: 600, marginLeft: 6 }}>5.0 &middot; {rating}</span>
      </div>
      <div style={{ fontSize: 13, color: C.ink, fontFamily: FS, fontStyle: 'italic', lineHeight: 1.45, marginBottom: 9, letterSpacing: '-0.01em' }}>&ldquo;{quote}&rdquo;</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, #8A7DFF, ${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', fontFamily: F, flexShrink: 0 }}>{initials}</div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: C.t2, fontFamily: F }}>{reviewer} <span style={{ color: C.t4, fontWeight: 500 }}>&middot; {suffix}</span></span>
      </div>
    </div>
  );
}
