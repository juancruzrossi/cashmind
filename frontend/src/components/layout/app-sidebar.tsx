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
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
    <>
      <div className="flex items-center h-16 px-4">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 glow-emerald">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold">
              <span className="text-gradient">Cash</span>
              <span className="text-foreground">Mind</span>
            </span>
            <span className="text-[10px] text-muted-foreground -mt-1">Finance Tracker</span>
          </div>
        </Link>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground glow-emerald'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 space-y-1">
        <Separator className="bg-sidebar-border mb-4" />
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200',
            'text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
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
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
