// Partner orders dashboard — server wrapper. The dashboard itself is a
// client component (auth hook + local state); this file stays tiny so
// the route entry is easy to discover.

import OrdersDashboard from './OrdersDashboard';

export const metadata = {
  title: 'Orders · Partner',
  description: 'Manage customer orders placed through Relay checkout.',
};

export default function PartnerOrdersPage() {
  return (
    <div className="container mx-auto py-8 px-6">
      <OrdersDashboard />
    </div>
  );
}
