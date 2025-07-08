import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, User2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { formatDateFriendly } from '@/lib/utils/dateUtils';

interface UserMenuProps {
  user: any;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout");
    } else {
      toast.success("Logout realizado com sucesso");
      router.push("/login");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="ml-2 cursor-pointer">
          <Avatar>
            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} alt={user?.email || "avatar"} />
            <AvatarFallback>
              {user?.email ? user.email[0].toUpperCase() : <User2 className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          {user?.user_metadata?.full_name || user?.email || "Usuário"}
        </DropdownMenuLabel>
        <div className="px-3 pb-1 text-xs text-muted-foreground">
          {user?.created_at && (
            <>Membro desde {formatDateFriendly(user.created_at || '')}</>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/ajustes')}>
          <Settings className="w-4 h-4 mr-2" /> Ajustes do Usuário
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 