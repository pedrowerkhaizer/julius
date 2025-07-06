"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Erro na autenticação:", error);
        router.push("/login");
        return;
      }

      if (data.session) {
        // Usuário autenticado com sucesso
        router.push("/home");
      } else {
        // Sem sessão, redireciona para login
        router.push("/login");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Verificando autenticação...</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">
            Aguarde enquanto verificamos sua conta...
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 