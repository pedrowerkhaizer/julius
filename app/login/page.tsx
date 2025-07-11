"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    // e.preventDefault();
    console.log('🔐 Tentando fazer login...');
    console.log('Email:', email);
    console.log('Password:', password ? '***' : 'NÃO DEFINIDA');
    
    setLoading(true);
    setError("");
    
    try {
      console.log('📡 Chamando supabase.auth.signInWithPassword...');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('📡 Resposta do Supabase:', error ? 'ERRO' : 'SUCESSO');
      
      setLoading(false);
      if (error) {
        console.error('❌ Erro no login:', error);
        setError(error.message);
      } else {
        console.log('✅ Login realizado com sucesso!');
        router.push("/home");
      }
    } catch (err) {
      console.error('❌ Erro inesperado no login:', err);
      setLoading(false);
      setError('Erro inesperado ao fazer login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Entrar no Julius</CardTitle>
          <p className="text-muted-foreground">
            Acesse sua conta para continuar
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Sua senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Criar conta
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 