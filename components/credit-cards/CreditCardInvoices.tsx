import { useState } from 'react';
import { CreditCard, CreditCardInvoice } from '@/lib/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Pencil, X, ChevronDown, ChevronUp } from 'lucide-react';

interface CreditCardInvoicesProps {
  card: CreditCard;
  invoices: CreditCardInvoice[];
  loading: boolean;
  onSave: (invoice: { month: string; value: number }) => Promise<void>;
}

function getNextMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export function CreditCardInvoices({ card, invoices, loading, onSave }: CreditCardInvoicesProps) {
  const [showAll, setShowAll] = useState(false);
  const months = getNextMonths(showAll ? 6 : 3);
  const [editMonth, setEditMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const handleEdit = (month: string, value: number) => {
    setEditMonth(month);
    setEditValue(value);
  };

  const handleSave = async () => {
    if (!editMonth) return;
    setSaving(true);
    await onSave({ month: editMonth, value: editValue });
    setEditMonth(null);
    setSaving(false);
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h5 className="font-semibold mb-2">Faturas de {card.name}</h5>
      <div className="space-y-2">
        {months.map(month => {
          const invoice = invoices.find(inv => inv.month === month);
          return (
            <div key={month} className="flex items-center gap-3 border rounded p-2">
              <div className="w-24 font-mono">{month}</div>
              {editMonth === month ? (
                <>
                  <Input type="number" value={editValue} onChange={e => setEditValue(Number(e.target.value))} className="w-32" />
                  <Button size="icon" onClick={handleSave} disabled={saving}><Save className="w-4 h-4" /></Button>
                  <Button size="icon" variant="outline" onClick={() => setEditMonth(null)}><X className="w-4 h-4" /></Button>
                </>
              ) : (
                <>
                  <div className="w-32">
                    {invoice ? invoice.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(month, invoice?.value || 0)} disabled={loading}><Pencil className="w-4 h-4" /></Button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowAll(v => !v)}>
          {showAll ? <><ChevronUp className="w-4 h-4 mr-1" /> Ver menos</> : <><ChevronDown className="w-4 h-4 mr-1" /> Ver mais</>}
        </Button>
      </div>
    </div>
  );
}

export default CreditCardInvoices; 