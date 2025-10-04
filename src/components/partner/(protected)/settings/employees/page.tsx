// src/app/partner/(protected)/settings/employees/page.tsx
"use client";

import TeamManagement from "../../../../../components/partner/team/TeamManagement";

export default function SettingsEmployeesPage() {
  return <TeamManagement roleToShow="employee" />;
}