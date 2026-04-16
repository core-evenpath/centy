'use client';

import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusLabel } from '@/lib/relay/order-helpers';
import type { RelayOrder } from '@/lib/relay/order-types';
import { STATUS_COLORS } from './orders-constants';

interface Props {
  order: RelayOrder;
  selected: boolean;
  onClick: () => void;
}

export default function OrderRow({ order, selected, onClick }: Props) {
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-colors',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-muted/50',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-medium">{order.id}</span>
        <Badge className={STATUS_COLORS[order.status]}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {itemCount} item{itemCount === 1 ? '' : 's'}
        </span>
        <span>
          {order.currency === 'INR' ? '₹' : order.currency + ' '}
          {order.total.toLocaleString()}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
      </div>
    </button>
  );
}
