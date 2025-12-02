'use client';

import { AppSidebar, MobileSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { AuthGuard } from '@/components/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 lg:ml-64 transition-all duration-300 overflow-x-hidden">
          <Header />
          <main className="p-4 md:p-6 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
