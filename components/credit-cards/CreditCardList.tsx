import { useState } from 'react';
import { CreditCard, BankAccount } from '@/lib/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, Trash2, Pencil, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader as DialogHeaderUI, DialogTitle } from '@/components/ui/dialog';

interface CreditCardListProps {
  bankAccounts: BankAccount[];
  cards: CreditCard[];
  loading: boolean;
  onCreate: (card: Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<CreditCard>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const COLORS = [
  '#6366f1', // indigo
  '#f59e42', // orange
  '#10b981', // green
  '#ef4444', // red
  '#fbbf24', // yellow
  '#3b82f6', // blue
  '#a855f7', // purple
];

interface CreditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  card: Partial<CreditCard>;
  bankAccounts: BankAccount[];
  saving: boolean;
  onChange: (card: Partial<CreditCard>) => void;
  onSave: () => void;
}

function CreditCardDialog({ open, onOpenChange, title, card, bankAccounts, saving, onChange, onSave }: CreditCardDialogProps) {
  const COLORS = [
    '#6366f1', '#f59e42', '#10b981', '#ef4444', '#fbbf24', '#3b82f6', '#a855f7',
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeaderUI>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeaderUI>
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <Label>Banco vinculado</Label>
            <Select value={card.bank_id || ''} onValueChange={v => onChange({ ...card, bank_id: v })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Banco vinculado" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nome do cartão</Label>
            <Input value={card.name || ''} onChange={e => onChange({ ...card, name: e.target.value })} placeholder="Nome do cartão" className="w-40" />
          </div>
          <div>
            <Label>Fechamento</Label>
            <Input type="number" min={1} max={31} value={card.closing_day || 1} onChange={e => onChange({ ...card, closing_day: Number(e.target.value) })} className="w-24" placeholder="Fechamento" />
          </div>
          <div>
            <Label>Vencimento</Label>
            <Input type="number" min={1} max={31} value={card.due_day || 1} onChange={e => onChange({ ...card, due_day: Number(e.target.value) })} className="w-24" placeholder="Vencimento" />
          </div>
          <div>
            <Label>Cor</Label>
            <Select value={card.color || COLORS[0]} onValueChange={v => onChange({ ...card, color: v })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map(c => (
                  <SelectItem key={c} value={c}>
                    <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ background: c }} />
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={onSave} disabled={saving}>Salvar</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreditCardList({ bankAccounts, cards, loading, onCreate, onUpdate, onDelete }: CreditCardListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState<Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>>({
    user_id: '',
    bank_id: '',
    name: '',
    closing_day: 1,
    due_day: 1,
    color: COLORS[0],
  });
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editCard, setEditCard] = useState<Partial<CreditCard>>({});
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newCard.bank_id || !newCard.name) return;
    setSaving(true);
    try {
      await onCreate(newCard);
      setShowAdd(false);
      setNewCard({ user_id: '', bank_id: '', name: '', closing_day: 1, due_day: 1, color: COLORS[0] });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editingCard || !editCard.bank_id || !editCard.name) return;
    setSaving(true);
    try {
      await onUpdate(editingCard.id, editCard);
      setEditingCard(null);
      setEditCard({});
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (card: CreditCard) => {
    setEditingCard(card);
    setEditCard({ ...card });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-lg">Cartões de Crédito</h4>
        <CreditCardDialog
          open={showAdd}
          onOpenChange={setShowAdd}
          title="Novo Cartão"
          card={newCard}
          bankAccounts={bankAccounts}
          saving={saving}
          onChange={c => setNewCard(nc => ({
            ...nc,
            ...c,
            user_id: c.user_id ?? nc.user_id // garantir user_id sempre string
          }))}
          onSave={handleAdd}
        />
        <Button variant="default" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" /> Adicionar Cartão
        </Button>
      </div>
      {/* Lista de cartões */}
      <div className="space-y-4">
        {cards.map(card => (
          <Card key={card.id} className="flex flex-col md:flex-row items-center gap-4 p-4">
            <div className="flex-1 flex items-center gap-4">
              <span className="inline-block w-6 h-6 rounded-full" style={{ background: card.color || COLORS[0] }} />
              <div>
                <div className="font-medium text-lg">{card.name}</div>
                <div className="text-xs text-muted-foreground">
                  Banco: {bankAccounts.find(b => b.id === card.bank_id)?.name || 'N/A'} | Fechamento: {card.closing_day} | Vencimento: {card.due_day}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <CreditCardDialog
                open={editingCard?.id === card.id}
                onOpenChange={open => {
                  if (open) {
                    handleEditOpen(card);
                  } else {
                    setEditingCard(null);
                    setEditCard({});
                  }
                }}
                title="Editar Cartão"
                card={editCard.id === card.id ? editCard : card}
                bankAccounts={bankAccounts}
                saving={saving}
                onChange={c => setEditCard(prev => ({ ...prev, ...c }))}
                onSave={async () => {
                  // Garantir todos os campos obrigatórios
                  if (!editCard.bank_id || !editCard.name || !editCard.closing_day || !editCard.due_day) return;
                  await handleEdit();
                }}
              />
              <Button size="icon" variant="ghost" onClick={() => handleEditOpen(card)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => onDelete(card.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default CreditCardList; 