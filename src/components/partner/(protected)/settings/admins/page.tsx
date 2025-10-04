// src/app/partner/(protected)/settings/admins/page.tsx
"use client";

import TeamManagement from "../../../../../components/partner/team/TeamManagement";

export default function SettingsAdminsPage() {
  return <TeamManagement roleToShow="partner_admin" />;
}