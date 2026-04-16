'use client';

import { useState } from 'react';
import { Edit2, ExternalLink, RefreshCw, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { addTrackingInfoAction } from '@/actions/relay-orders';
import { getStatusLabel } from '@/lib/relay/order-helpers';
import type { OrderStatus, RelayOrder } from '@/lib/relay/order-types';
import { STATUS_COLORS } from './orders-constants';
import TrackingFormDialog, {
  type TrackingFormValues,
} from './TrackingFormDialog';

interface Props {
  order: RelayOrder;
  partnerId: string;
  nextStatus: OrderStatus | null;
  updating: boolean;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onTrackingUpdated?: () => void;
}

const TRACKING_EDITABLE_STATUSES: OrderStatus[] = [
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
];

function formatMoney(amount: number, currency: string): string {
  if (currency === 'INR') return `₹${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export default function OrderDetailPanel({
  order,
  partnerId,
  nextStatus,
  updating,
  onStatusUpdate,
  onTrackingUpdated,
}: Props) {
  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const canEditTracking = TRACKING_EDITABLE_STATUSES.includes(order.status);

  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);

  const handleSaveTracking = async (values: TrackingFormValues) => {
    setSavingTracking(true);
    const result = await addTrackingInfoAction(partnerId, order.id, values);
    if (result.success) {
      toast.success('Tracking information saved');
      setTrackingDialogOpen(false);
      onTrackingUpdated?.();
    } else {
      toast.error(result.error ?? 'Failed to save tracking');
    }
    setSavingTracking(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-mono">{order.id}</CardTitle>
          <Badge className={STATUS_COLORS[order.status]}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Items</h4>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div
                key={`${item.itemId}_${item.variant ?? ''}_${i}`}
                className="flex justify-between text-sm"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatMoney(item.price * item.quantity, order.currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal, order.currency)}</span>
          </div>
          {order.discountAmount && order.discountAmount > 0 ? (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount{order.discountCode ? ` (${order.discountCode})` : ''}</span>
              <span>-{formatMoney(order.discountAmount, order.currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>
              {order.shippingCost === 0
                ? 'Free'
                : formatMoney(order.shippingCost, order.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (GST)</span>
            <span>{formatMoney(order.tax, order.currency)}</span>
          </div>
          <div className="flex justify-between font-medium pt-2 border-t">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Ship to</h4>
          <div className="text-sm text-muted-foreground">
            <p>{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.phone}</p>
          </div>
        </div>

        <div className="border-t pt-3">
          <h4 className="text-sm font-medium mb-2">Payment</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{order.paymentMethod.toUpperCase()}</Badge>
            <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
              {order.paymentStatus}
            </Badge>
          </div>
        </div>

        {(order.tracking?.trackingNumber || canEditTracking) && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Tracking</h4>
              {canEditTracking && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTrackingDialogOpen(true)}
                >
                  {order.tracking?.trackingNumber ? (
                    <>
                      <Edit2 className="h-3 w-3 mr-1" /> Edit
                    </>
                  ) : (
                    <>
                      <Truck className="h-3 w-3 mr-1" /> Add tracking
                    </>
                  )}
                </Button>
              )}
            </div>
            {order.tracking?.trackingNumber ? (
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Carrier:</span>{' '}
                  {order.tracking.carrier}
                </p>
                <p>
                  <span className="text-muted-foreground">AWB:</span>{' '}
                  <span className="font-mono">
                    {order.tracking.trackingNumber}
                  </span>
                </p>
                {order.tracking.estimatedDelivery && (
                  <p>
                    <span className="text-muted-foreground">ETA:</span>{' '}
                    {new Date(order.tracking.estimatedDelivery).toLocaleDateString()}
                  </p>
                )}
                {order.tracking.trackingUrl && (
                  <a
                    href={order.tracking.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 mt-1"
                  >
                    Track shipment <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tracking info yet.
              </p>
            )}
          </div>
        )}

        {nextStatus && (
          <div className="border-t pt-3">
            <Button
              onClick={() => onStatusUpdate(order.id, nextStatus)}
              disabled={updating}
              className="w-full"
            >
              {updating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Mark as {getStatusLabel(nextStatus)}
            </Button>
          </div>
        )}

        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => onStatusUpdate(order.id, 'cancelled')}
            disabled={updating}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Order
          </Button>
        )}
      </CardContent>

      <TrackingFormDialog
        open={trackingDialogOpen}
        onClose={() => setTrackingDialogOpen(false)}
        onSave={handleSaveTracking}
        saving={savingTracking}
        existingTracking={order.tracking}
      />
    </Card>
  );
}
