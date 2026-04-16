'use client';

// ── Single editable prompt row ─────────────────────────────────────────
//
// Used by the AI-flow panel's "not_found" state. The component owns
// only its edit-mode draft; the parent holds the authoritative list.

import { useState } from 'react';
import { Icon } from '../inline-icon';
import { ACCENT, theme } from '../../constants';
import type { GeneratedPrompt } from '../../types';

interface Props {
  prompt: GeneratedPrompt;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (next: string) => void;
  onRemove: () => void;
}

export default function PromptItem({
  prompt,
  isEditing,
  onStartEdit,
  onSave,
  onRemove,
}: Props) {
  const [draft, setDraft] = useState(prompt.question);

  if (isEditing) {
    return (
      <div
        style={{
          display: 'flex',
          gap: 7,
          padding: '7px 9px',
          background: theme.bg,
          borderRadius: 6,
          marginBottom: 5,
          alignItems: 'center',
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => onSave(draft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(draft);
            if (e.key === 'Escape') onSave(prompt.question);
          }}
          autoFocus
          style={{
            flex: 1,
            border: `1px solid ${ACCENT}`,
            borderRadius: 4,
            padding: '3px 6px',
            fontSize: 10.5,
            color: theme.t1,
            background: '#fff',
            outline: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 7,
        padding: '7px 9px',
        background: theme.bg,
        borderRadius: 6,
        marginBottom: 5,
      }}
    >
      <div style={{ fontSize: 10.5, color: theme.t1, lineHeight: 1.4, flex: 1 }}>
        &ldquo;{prompt.question}&rdquo;
      </div>
      <button
        type="button"
        onClick={onStartEdit}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-label="Edit prompt"
      >
        <Icon name="edit" size={13} color={theme.t4} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-label="Remove prompt"
      >
        <Icon name="x" size={13} color={theme.t4} />
      </button>
    </div>
  );
}
