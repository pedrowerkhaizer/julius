"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar, TrendingUp, TrendingDown, Clock, Filter } from "lucide-react";
import { toast } from "sonner";

const periodOptions = [
  { value: "default", label: "Últimos 7 dias + Próximos 21 dias" },
  { value: "last30", label: "Últimos 30 dias" },
  { value: "next30", label: "Próximos 30 dias" },
  { value: "current_month", label: "Mês atual" },
  { value: "next_month", label: "Próximo mês" },
  { value: "custom", label: "Período personalizado" },
];

export default function EventsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("default");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [limits, setLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const itemId = typeof window !== "undefined" ? localStorage.getItem("pluggy_itemId") : null;

  useEffect(() => {
    if (!itemId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`http://localhost:3001/pluggy/${itemId}/transactions`).then(res => res.json()),
      fetch(`http://localhost:3001/pluggy/${itemId}/accounts`).then(res => res.json()),
      // Se tiver endpoint de limites, adicione aqui
      // fetch(`http://localhost:3001/pluggy/${itemId}/limits`).then(res => res.json()),
    ])
      .then(([transactionsData, accountsData]) => {
        setTransactions(transactionsData.transactions || transactionsData || []);
        setAccounts(accountsData.accounts || accountsData || []);
        // setLimits(limitsData.limits || limitsData || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao buscar dados Pluggy");
        setLoading(false);
      });
  }, [itemId]);

  // Se não houver itemId ou contas, mostrar mensagem amigável
  if (!itemId || (!loading && accounts.length === 0)) {
    return (
      <div className="min-h-screen bg-background pt-16 sm:pt-0 flex flex-col items-center justify-center">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum banco conectado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Conecte um banco para ver sua timeline financeira.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Agrupamento, projeções e cálculos ---

  // 1. Agrupar transações por data
  const groupedByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    transactions.forEach(tx => {
      const date = tx.date?.split("T")[0] || "Sem data";
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(tx);
    });
    return grouped;
  }, [transactions]);

  // 2. Saldo atual (primeira conta, ou some todos)
  const currentBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

  // 3. Gastos do dia
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTxs = transactions.filter(tx => tx.date?.startsWith(todayStr));
  const todaySpent = todayTxs.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // 4. Limite diário (exemplo: pegue do backend ou defina um valor)
  const dailyLimit = 170; // TODO: buscar do backend se disponível
  const remainingLimit = dailyLimit - todaySpent;

  // 5. Filtros de período
  const filteredDates = useMemo(() => {
    let startDate, endDate;
    const today = new Date();
    switch (selectedPeriod) {
      case "default":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 21);
        break;
      case "last30":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        endDate = new Date(today);
        break;
      case "next30":
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        break;
      case "current_month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "next_month":
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          return Object.keys(groupedByDate);
        }
        break;
      default:
        return Object.keys(groupedByDate);
    }
    return Object.keys(groupedByDate).filter(date => {
      const d = new Date(date);
      return d >= startDate && d <= endDate;
    });
  }, [selectedPeriod, customStartDate, customEndDate, groupedByDate]);

  // 6. Projeções futuras (opcional, pode misturar com dados reais)
  // Exemplo: adicionar eventos futuros baseados em limites/recorrentes

  // 7. Funções auxiliares
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    if (dateString === todayStr) return "Hoje";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateString === yesterday.toISOString().split("T")[0]) return "Ontem";
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateString === tomorrow.toISOString().split("T")[0]) return "Amanhã";
    return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  };

  const getEventIcon = (tx: any) => {
    if (tx.amount > 0) return <TrendingUp className="w-4 h-4 text-lime-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  // --- Renderização ---

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-0">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Timeline de Eventos
          </h1>
          <p className="text-muted-foreground">
            Acompanhe suas transações passadas e projeções futuras
          </p>
        </div>

        {/* Period Filter */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <CardTitle className="text-lg">Filtrar Período</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPeriod === "custom" && (
                <>
                  <div className="flex-1">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm"
                      placeholder="Data inicial"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm"
                      placeholder="Data final"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-lime-500" />
                <CardTitle className="text-lg">Saldo Atual</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(currentBalance)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {accounts[0]?.name}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                <CardTitle className="text-lg">Hoje</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(todaySpent)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Gastos até agora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-lg">Restante Hoje</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${remainingLimit >= 0 ? "text-lime-600" : "text-red-600"}`}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(remainingLimit)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Limite diário
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Events Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Eventos ({transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : filteredDates.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum evento no período
                </h3>
                <p className="text-muted-foreground mb-4">
                  Ajuste o filtro para ver mais eventos
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredDates.map(date => (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="px-4 py-3 bg-muted/30 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">
                          {formatDateHeader(date)}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {new Date(date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    {/* Events for this date */}
                    {groupedByDate[date].map((tx, idx) => (
                      <div
                        key={tx.id || idx}
                        className={`p-4 hover:bg-muted/50 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              {getEventIcon(tx)}
                              {/* Adapte badges conforme sua lógica */}
                            </div>
                            <div className="text-base font-medium text-foreground mb-1">
                              {tx.description || tx.category || "Transação"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tx.accountName || tx.accountId}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-lg font-bold ${
                                tx.amount > 0
                                  ? "text-lime-600"
                                  : "text-red-600"
                              }`}
                            >
                              {tx.amount > 0 ? "+" : ""}
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(tx.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}