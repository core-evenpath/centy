import type { Metadata } from 'next';
import CustomersClient from '../components/CustomersClient';

export const metadata: Metadata = {
  title: 'Customers — Pingbox',
  description: 'See how service brands across dental, HVAC, fitness, and real estate converted more with Pingbox.',
  alternates: {
    canonical: 'https://pingbox.io/customers',
    languages: {
      'en-us': 'https://pingbox.io/customers',
      'en-in': 'https://pingbox.io/in/customers',
      'x-default': 'https://pingbox.io/customers',
    },
  },
};

export default function Page() {
  return <CustomersClient />;
}
