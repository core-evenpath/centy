// ── Address form field definitions ──────────────────────────────────────
//
// Declarative field list used by `CheckoutAddressForm`. Kept separate
// so the markup stays a tight map and individual field tweaks
// (placeholder, required, …) don't pollute the component file.

import type { OrderAddress } from '@/lib/relay/order-types';

export interface AddressField {
  key: keyof OrderAddress;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  grow?: number; // flex-basis hint (1 = full row)
}

export const ADDRESS_FIELDS: AddressField[] = [
  { key: 'name', label: 'Full name', required: true, grow: 1 },
  { key: 'phone', label: 'Phone', required: true, type: 'tel', grow: 1 },
  { key: 'email', label: 'Email (optional)', type: 'email', grow: 1 },
  { key: 'line1', label: 'Address line 1', required: true, grow: 1 },
  { key: 'line2', label: 'Address line 2 (optional)', grow: 1 },
  { key: 'city', label: 'City', required: true },
  { key: 'state', label: 'State', required: true },
  { key: 'postalCode', label: 'Postal code', required: true },
  { key: 'country', label: 'Country', required: true },
];

export const DEFAULT_ADDRESS: OrderAddress = {
  name: '',
  phone: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};
