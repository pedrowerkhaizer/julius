"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User2, MessageCircle, Calendar, BarChart2, Bell, ArrowLeft, Upload, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const notificationTypes = [
  {
    key: "weekly_summary",
    label: "Resumo da Semana",
    icon: <BarChart2 className="w-4 h-4 mr-2 text-lime-600" />,
    example: (
      <div className="bg-muted rounded-lg p-4 text-sm mt-2">
        <div className="font-semibold mb-1">Semana finalizada! 🎉</div>
        <div>💰 <b>Economia:</b> R$ 340,00</div>
        <div>📊 <b>Gastos:</b> R$ 1.260,00</div>
        <div>🎯 <b>Para metas:</b> R$ 204,00</div>
        <div className="mt-2">Destaque: Você economizou 15% em transporte! Continue assim! 🚀</div>
      </div>
    ),
    defaultDay: "domingo",
    defaultHour: "18:00"
  },
  {
    key: "monthly_projection",
    label: "Projeção Mensal",
    icon: <Calendar className="w-4 h-4 mr-2 text-blue-600" />,
    example: (
      <div className="bg-muted rounded-lg p-4 text-sm mt-2">
        <div className="font-semibold mb-1">Projeção Mensal 📊</div>
        <div>Com base no seu padrão atual, você vai fechar julho com <b>R$ 1.890,50</b>.</div>
        <div className="mt-2">Para melhorar:</div>
        <ul className="list-disc ml-5">
          <li>Reduza 20% nos gastos com alimentação</li>
          <li>Mantenha o controle no transporte</li>
        </ul>
        <div className="mt-2">Potencial: <b>R$ 2.340,00</b> 💪</div>
      </div>
    ),
    defaultDay: "primeiro dia do mês",
    defaultHour: "09:00"
  },
  {
    key: "alerts",
    label: "Alertas de Gastos",
    icon: <Bell className="w-4 h-4 mr-2 text-red-500" />,
    example: (
      <div className="bg-muted rounded-lg p-4 text-sm mt-2">
        <div className="font-semibold mb-1">Atenção! 🚨</div>
        <div>Você ultrapassou o limite de gastos em <b>Alimentação</b> nesta semana.</div>
        <div className="mt-2">Dica: Reveja seus gastos e ajuste seu planejamento.</div>
      </div>
    ),
    defaultDay: "quando acontecer",
    defaultHour: "imediato"
  }
];

const diasSemana = [
  "domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"
];
const horarios = [
  "08:00", "09:00", "12:00", "18:00", "20:00", "21:00"
];

// Defina o tipo para notificacoes
interface NotificacaoConfig {
  enabled: boolean;
  day: string;
  hour: string;
}

const notificationKeys = ["weekly_summary", "monthly_projection", "alerts"] as const;
type NotificationKey = typeof notificationKeys[number];

export default function AjustesPage() {
  // Perfil
  const [nome, setNome] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [whatsapp, setWhatsapp] = useState("");
  // Notificações
  const [notificacoes, setNotificacoes] = useState<Record<NotificationKey, NotificacaoConfig>>({
    weekly_summary: { enabled: true, day: "domingo", hour: "18:00" },
    monthly_projection: { enabled: true, day: "primeiro dia do mês", hour: "09:00" },
    alerts: { enabled: true, day: "quando acontecer", hour: "imediato" }
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Ajustes salvos com sucesso!");
    }, 1200);
  }

  function handleNotificationChange(key: NotificationKey, field: keyof NotificacaoConfig, value: any) {
    setNotificacoes(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  }

  function handleWhatsappChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 11) raw = raw.slice(0, 11);
    let formatted = raw;
    if (raw.length > 2) formatted = `(${raw.slice(0,2)}) ${raw.slice(2)}`;
    if (raw.length > 7) formatted = `(${raw.slice(0,2)}) ${raw.slice(2,7)}-${raw.slice(7)}`;
    setWhatsapp(formatted);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = ev => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setAvatarPreview("");
    setAvatarUrl("");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/home')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="flex items-center gap-2">
              <User2 className="w-6 h-6 text-primary" /> Ajustes do Usuário
            </CardTitle>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Edite seu perfil e preferências de notificações do Julius.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-8" onSubmit={handleSave}>
            {/* Perfil */}
            <div>
              <h3 className="font-semibold mb-3 text-lg">Perfil</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative group">
                  <Avatar>
                    <AvatarImage src={avatarPreview || avatarUrl || undefined} alt={nome || "avatar"} />
                    <AvatarFallback>{nome ? nome[0].toUpperCase() : <User2 className="w-5 h-5" />}</AvatarFallback>
                  </Avatar>
                  {avatarPreview && (
                    <button type="button" onClick={handleRemoveAvatar} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow hover:bg-red-700 transition-opacity opacity-80 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="avatarUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Button asChild variant="outline" size="sm">
                      <label htmlFor="avatarUpload" className="flex items-center cursor-pointer">
                        <Upload className="w-4 h-4 mr-1" />
                        {avatarPreview ? "Trocar foto" : "Carregar foto"}
                      </label>
                    </Button>
                    {avatarPreview && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar}>
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" value={whatsapp} onChange={handleWhatsappChange} placeholder="(99) 99999-9999" maxLength={15} />
                </div>
              </div>
            </div>
            {/* Notificações */}
            <div>
              <h3 className="font-semibold mb-3 text-lg">Notificações WhatsApp</h3>
              <div className="space-y-6">
                {notificationTypes.map(nt => {
                  const key = nt.key as NotificationKey;
                  return (
                    <div key={nt.key} className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        {nt.icon}
                        <span className="font-medium">{nt.label}</span>
                        <Switch
                          checked={notificacoes[key].enabled}
                          onCheckedChange={v => handleNotificationChange(key, "enabled", v)}
                          className="ml-auto"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Label>Dia:</Label>
                          <Select
                            value={notificacoes[key].day}
                            onValueChange={v => handleNotificationChange(key, "day", v)}
                            disabled={!notificacoes[key].enabled}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Dia" />
                            </SelectTrigger>
                            <SelectContent>
                              {nt.key === "weekly_summary" && diasSemana.map(dia => (
                                <SelectItem key={dia} value={dia}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</SelectItem>
                              ))}
                              {nt.key === "monthly_projection" && (
                                <SelectItem value="primeiro dia do mês">Primeiro dia do mês</SelectItem>
                              )}
                              {nt.key === "alerts" && (
                                <SelectItem value="quando acontecer">Quando acontecer</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label>Horário:</Label>
                          <Select
                            value={notificacoes[key].hour}
                            onValueChange={v => handleNotificationChange(key, "hour", v)}
                            disabled={!notificacoes[key].enabled}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Horário" />
                            </SelectTrigger>
                            <SelectContent>
                              {nt.key === "weekly_summary" && horarios.map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                              {nt.key === "monthly_projection" && horarios.map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                              {nt.key === "alerts" && (
                                <SelectItem value="imediato">Imediato</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Exemplo:</Label>
                        {nt.example}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="mt-2" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Ajustes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 