'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Receipt,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Settings,
  LogOut,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Recibos de Sueldo', href: '/dashboard/payslips', icon: Receipt },
  { name: 'Transacciones', href: '/dashboard/transactions', icon: ArrowLeftRight },
  { name: 'Presupuestos', href: '/dashboard/budgets', icon: PiggyBank },
  { name: 'Metas', href: '/dashboard/goals', icon: Target },
];

const bottomNavigation = [
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out',
          'bg-sidebar border-r border-sidebar-border',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className={cn('flex items-center h-16 px-4', collapsed ? 'justify-center' : 'justify-between')}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 glow-emerald">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold">
                  <span className="text-gradient">Cash</span>
                  <span className="text-foreground">Mind</span>
                </span>
                <span className="text-[10px] text-muted-foreground -mt-1">Finance Tracker</span>
              </div>
            )}
          </Link>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center px-4 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Separator className="bg-sidebar-border" />

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const NavItem = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground glow-emerald'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover border-border">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavItem;
          })}
        </nav>

        <div className="px-3 py-4 space-y-1">
          <Separator className="bg-sidebar-border mb-4" />
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            const NavItem = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover border-border">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavItem;
          })}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200',
                  'text-destructive/80 hover:bg-destructive/10 hover:text-destructive',
                  collapsed && 'justify-center px-2'
                )}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>Cerrar Sesión</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-popover border-border">
                Cerrar Sesión
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
