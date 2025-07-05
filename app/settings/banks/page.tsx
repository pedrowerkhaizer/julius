"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Plus, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import PluggyConnectButton from "@/components/pluggy/PluggyConnectButton";

export default function BanksPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Recupera o itemId do localStorage (ajuste conforme seu fluxo)
  const itemId = typeof window !== "undefined" ? localStorage.getItem("pluggy_itemId") : null;

  useEffect(() => {
    if (!itemId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`http://localhost:3001/pluggy/${itemId}/accounts`)
      .then(res => res.json())
      .then(data => {
        setAccounts(data.accounts || data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao buscar contas Pluggy");
        setLoading(false);
      });
  }, [itemId]);

  // Funções de atualizar/desconectar podem ser implementadas conforme endpoints do backend

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-lime-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-lime-500/10 text-lime-700 border-lime-500/20">Conectado</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Sincronizando</Badge>;
    }
  };  

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-0">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Conexões Bancárias
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas conexões com bancos através do Open Finance
          </p>
        </div>

        {/* Connected Banks */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Bancos Conectados</h2>
          {loading ? (
            <div>Carregando...</div>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum banco conectado
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Conecte seus bancos para sincronizar transações automaticamente
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{account.type}</p>
                        </div>
                      </div>
                      {getStatusIcon("connected")}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Saldo:</span>
                        <span className={`font-bold ${account.balance >= 0 ? "text-lime-600" : "text-red-600"}`}>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL"
                          }).format(account.balance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        {getStatusBadge("connected")}
                      </div>
                      {/* Adicione mais informações conforme necessário */}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Botão para conectar novo banco */}
        <PluggyConnectButton
          onSuccess={item => {
            localStorage.setItem("pluggy_itemId", item.id);
            // Redirecione ou atualize a página para buscar os dados reais
          }}
        />
      </div>
    </div>
  );
}