"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, 
  Settings, 
  Wallet, 
  CreditCard, 
  Banknote,
  Menu,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Eventos', href: '/home', icon: Home },
  { name: 'Limites', href: '/settings/limits', icon: Wallet },
  { name: 'Recorrentes', href: '/settings/recurrents', icon: Banknote },
  { name: 'Bancos', href: '/settings/banks', icon: CreditCard },
];

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <nav className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold">Julius</span>
      </div>
      
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
            pathname === item.href 
              ? "bg-accent text-accent-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setOpen(false)}
        >
          <item.icon className="w-4 h-4" />
          {item.name}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden sm:fixed sm:inset-y-0 sm:left-0 sm:z-50 sm:w-64 sm:bg-background sm:border-r sm:flex sm:flex-col">
        <NavContent />
      </div>

      {/* Mobile Header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Julius</span>
          </div>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="flex items-center justify-around p-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors",
                pathname === item.href 
                  ? "text-indigo-600" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40 sm:bottom-4 sm:right-6">
        <Button
          size="icon"
          className="w-12 h-12 rounded-full bg-lime-500 hover:bg-lime-600 text-white shadow-lg"
        >
          <PlusCircle className="w-6 h-6" />
        </Button>
      </div>
    </>
  );
}