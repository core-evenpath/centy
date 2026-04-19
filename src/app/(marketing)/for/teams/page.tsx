import type { Metadata } from 'next';
import ForTeamsClient from '../../components/ForTeamsClient';

export const metadata: Metadata = {
  title: 'Pingbox for Multi-Location Teams',
  description: 'Deploy Pingbox across every location from one admin. Built for franchise groups and multi-location service brands.',
  alternates: {
    canonical: 'https://pingbox.io/for/teams',
  },
};

export default function Page() {
  return <ForTeamsClient />;
}
