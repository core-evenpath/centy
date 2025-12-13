// src/app/partner/(protected)/settings/dashboard/page.tsx
// Redirect to main settings page - all business data is now managed there
import { redirect } from 'next/navigation';

export default function SettingsDashboardPage() {
  redirect('/partner/settings');
}
