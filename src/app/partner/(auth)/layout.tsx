// src/app/partner/(auth)/layout.tsx
// Layout for public-facing partner pages like login and signup.

export default function PartnerAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
