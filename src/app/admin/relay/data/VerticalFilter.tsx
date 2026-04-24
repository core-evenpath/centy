'use client';

import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  verticals: string[];
  active: string | null;
  onChange: (vertical: string | null) => void;
}

export default function VerticalFilter({ verticals, active, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Button
        variant={active === null ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onChange(null)}
      >
        All
      </Button>
      {verticals.map((v) => (
        <Button
          key={v}
          variant={active === v ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onChange(v)}
        >
          {v}
        </Button>
      ))}
    </div>
  );
}
