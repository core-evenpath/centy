
// src/components/admin/PartnerBusinessProfile.tsx
import React from 'react';
import type { Partner } from '../../lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Building, Users, MapPin, DollarSign, Mail, Phone, Calendar } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../lib/business-persona-types';

interface PartnerBusinessProfileProps {
  partner: Partner;
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: React.ReactNode }) => (
    <div>
        <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4" />
            {label}
        </dt>
        <dd className="text-md font-semibold text-foreground">{value || 'N/A'}</dd>
    </div>
);

export default function PartnerBusinessProfile({ partner }: PartnerBusinessProfileProps) {
  const persona = (partner as any).businessPersona;
  const currencyCode = persona?.identity?.currency;
  const currency = currencyCode ? SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) : null;
  const currencySymbol = currency?.symbol || '₹';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Context & Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            <InfoItem icon={Building} label="Business Name" value={partner.businessName} />
            <InfoItem icon={Users} label="Employees" value={`${partner.employeeCount} (${partner.businessSize})`} />
            <InfoItem icon={MapPin} label="Location" value={`${partner.location.city}, ${partner.location.state}`} />
            <InfoItem icon={DollarSign} label="Monthly Revenue" value={`${currencySymbol}${partner.monthlyRevenue}`} />
            <InfoItem icon={Users} label="Contact Person" value={partner.contactPerson} />
            <InfoItem icon={Mail} label="Contact Email" value={partner.email} />
            <InfoItem icon={Phone} label="Phone Number" value={partner.phone} />
            <InfoItem icon={Calendar} label="Joined Date" value={new Date(partner.joinedDate).toLocaleDateString()} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
