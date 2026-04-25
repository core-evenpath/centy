'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SystemModule } from '@/lib/modules/types';
import SchemaFieldsTable from './SchemaFieldsTable';
import SchemaEditor from './SchemaEditor';

// ── Schema fields panel (PR E10) ────────────────────────────────────
//
// Thin client wrapper that owns the view ↔ edit mode toggle. Read
// mode delegates to the existing SchemaFieldsTable (unchanged).
// Edit mode swaps in SchemaEditor; on save, router.refresh() so the
// server-rendered viewer picks up the new fields.

interface Props {
  slug: string;
  schema: SystemModule;
}

export default function SchemaFieldsPanel({ slug, schema }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  if (isEditing) {
    return (
      <SchemaEditor
        slug={slug}
        schema={schema.schema ?? { fields: [], categories: [] }}
        onCancel={() => setIsEditing(false)}
        onSaved={() => {
          setIsEditing(false);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit fields
        </Button>
      </div>
      <SchemaFieldsTable schema={schema} />
    </div>
  );
}
