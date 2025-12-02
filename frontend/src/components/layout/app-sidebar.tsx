'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Receipt,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Settings,
  LogOut,
  Wallet,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Recibos de Sueldo', href: '/payslips', icon: Receipt },
  { name: 'Transacciones', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Presupuestos', href: '/budgets', icon: PiggyBank },
  { name: 'Metas', href: '/goals', icon: Target },
];

const bottomNavigation = [
  { name: 'Configuración', href: '/settings', icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = () => {
    onNavigate?.();
    logout();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-16 px-5">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-gold">
            <Wallet className="w-[18px] h-[18px] text-[#0a0a0c]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight">
              <span className="text-gradient-gold">Cash</span>
              <span className="text-foreground">Mind</span>
            </span>
            <span className="text-[10px] text-muted-foreground -mt-0.5 tracking-wide">
              Finance Tracker
            </span>
          </div>
        </Link>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-4" />

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 space-y-1">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-1 mb-3" />
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground'
              )}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0 text-muted-foreground" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200',
            'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
          )}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-60 flex-col bg-[#08080a] border-r border-[rgba(255,255,255,0.04)]">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 hover:bg-white/[0.03]"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-60 p-0 bg-[#08080a] border-[rgba(255,255,255,0.04)]"
      >
        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
