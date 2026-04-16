'use client';

// ── Tracking form dialog ────────────────────────────────────────────────
//
// Pure UI around the carrier/tracking-number/ETA fields. Parent owns
// the submit handler (which calls `addTrackingInfoAction`); this
// component only validates shape and auto-fills the tracking URL
// for known carriers.

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrderTracking } from '@/lib/relay/order-types';
import {
  CARRIERS,
  carrierLabel,
  carrierValueFromLabel,
  getTrackingUrl,
} from './tracking-carriers';

export interface TrackingFormValues {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (tracking: TrackingFormValues) => Promise<void>;
  saving: boolean;
  existingTracking?: OrderTracking;
}

export default function TrackingFormDialog({
  open,
  onClose,
  onSave,
  saving,
  existingTracking,
}: Props) {
  const [carrierValue, setCarrierValue] = useState<string>(() =>
    carrierValueFromLabel(existingTracking?.carrier),
  );
  const [customCarrier, setCustomCarrier] = useState<string>(() =>
    carrierValueFromLabel(existingTracking?.carrier) === 'other'
      ? existingTracking?.carrier ?? ''
      : '',
  );
  const [trackingNumber, setTrackingNumber] = useState(
    existingTracking?.trackingNumber ?? '',
  );
  const [trackingUrl, setTrackingUrl] = useState(
    existingTracking?.trackingUrl ?? '',
  );
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    existingTracking?.estimatedDelivery?.split('T')[0] ?? '',
  );

  const handleCarrierChange = (value: string) => {
    setCarrierValue(value);
    if (trackingNumber && value !== 'other') {
      const url = getTrackingUrl(value, trackingNumber);
      if (url) setTrackingUrl(url);
    }
  };

  const handleTrackingNumberChange = (value: string) => {
    setTrackingNumber(value);
    if (carrierValue && carrierValue !== 'other') {
      const url = getTrackingUrl(carrierValue, value);
      if (url) setTrackingUrl(url);
    }
  };

  const resolvedCarrier =
    carrierValue === 'other' ? customCarrier.trim() : carrierLabel(carrierValue);

  const isValid = Boolean(resolvedCarrier) && trackingNumber.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;
    await onSave({
      carrier: resolvedCarrier,
      trackingNumber: trackingNumber.trim(),
      trackingUrl: trackingUrl.trim() || undefined,
      estimatedDelivery: estimatedDelivery
        ? new Date(estimatedDelivery).toISOString()
        : undefined,
    });
  };

  const isUpdate = !!existingTracking?.trackingNumber;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? 'Update Tracking' : 'Add Tracking'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier / Courier</Label>
            <Select value={carrierValue} onValueChange={handleCarrierChange}>
              <SelectTrigger id="carrier">
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {carrierValue === 'other' && (
              <Input
                placeholder="Enter carrier name"
                value={customCarrier}
                onChange={(e) => setCustomCarrier(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Tracking number / AWB</Label>
            <Input
              id="trackingNumber"
              placeholder="e.g. DL123456789IN"
              value={trackingNumber}
              onChange={(e) => handleTrackingNumberChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackingUrl">Tracking URL (optional)</Label>
            <Input
              id="trackingUrl"
              placeholder="https://…"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Auto-filled for common carriers. Customers will see this link on
              the order tracker.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedDelivery">
              Estimated delivery (optional)
            </Label>
            <Input
              id="estimatedDelivery"
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isUpdate ? 'Update tracking' : 'Add tracking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
