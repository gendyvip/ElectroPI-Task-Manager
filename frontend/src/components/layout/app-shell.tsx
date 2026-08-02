'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderKanban, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const links = [{ href: '/projects', label: 'Projects', icon: FolderKanban }];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TM';

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.03_195),_oklch(0.985_0.004_220)_45%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 md:px-6 lg:px-8">
        <aside className="hidden w-60 shrink-0 flex-col rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur md:flex">
          <div className="mb-8">
            <p className="font-heading text-xl font-semibold tracking-tight text-foreground">
              Electro<span className="text-primary">PI</span>
            </p>
            <p className="text-xs text-muted-foreground">Task Manager</p>
          </div>
          <NavLinks />
          <div className="mt-auto space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start" onClick={() => logout()}>
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex items-center justify-between rounded-2xl border border-border/80 bg-card/80 px-4 py-3 shadow-sm backdrop-blur md:hidden">
            <div>
              <p className="font-semibold">ElectroPI</p>
              <p className="text-xs text-muted-foreground">Task Manager</p>
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={<Button variant="outline" size="icon" aria-label="Open menu" />}
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>ElectroPI</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6 px-2">
                  <NavLinks onNavigate={() => setOpen(false)} />
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setOpen(false);
                      void logout();
                    }}
                  >
                    <LogOut className="size-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </header>

          <main className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
