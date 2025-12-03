'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { MobileSidebar } from './app-sidebar';

export function Header() {
  const { user, logout } = useAuth();
  const username = user?.username || 'Usuario';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-[rgba(255,255,255,0.04)] bg-[#0a0a0c]">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="lg:hidden">
          <MobileSidebar />
        </div>
        <div className="hidden lg:block" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full hover:bg-white/[0.03]"
            >
              <Avatar className="h-9 w-9 border border-[rgba(255,255,255,0.08)]">
                <AvatarFallback className="gradient-gold text-[#0a0a0c] text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{username}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'Sin email'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.06)]" />
            <DropdownMenuItem
              className="cursor-pointer text-muted-foreground focus:text-destructive focus:bg-destructive/10"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
