import { useState } from 'react';
import { CreditCard, CreditCardInvoice, Transaction } from '@/lib/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Pencil, X, ChevronDown, ChevronUp } from 'lucide-react';

interface CreditCardInvoicesProps {
  card: CreditCard;
  invoices: CreditCardInvoice[];
  loading: boolean;
  onSave: (invoice: { month: string; value: number }) => Promise<void>;
  transactions?: Transaction[];
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

function getClosingDate(card: CreditCard, year: number, month: number) {
  // month: 1-based (1=Jan)
  return new Date(year, month - 1, card.closing_day, 23, 59, 59, 999);
}

function getSubscriptionChargeDate(year: number, month: number, billingDay: number) {
  // billingDay: 1-28
  return new Date(year, month - 1, billingDay, 12, 0, 0, 0);
}

export function CreditCardInvoices({ card, invoices, loading, onSave, transactions = [] }: CreditCardInvoicesProps) {
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
          // Parse year and month
          const [year, m] = month.split('-').map(Number);
          const closingDate = getClosingDate(card, year, m);
          // Filtrar assinaturas deste cartão
          const cardSubscriptions = transactions.filter(t =>
            t.type === 'expense' &&
            t.expense_type === 'subscription' &&
            t.subscription_card === card.id &&
            t.subscription_billing_day
          );
          // Para cada assinatura, calcular data de cobrança para o mês
          const subsWithChargeDate = cardSubscriptions.map(sub => {
            const chargeDate = getSubscriptionChargeDate(year, m, sub.subscription_billing_day!);
            return { ...sub, chargeDate };
          });
          // Já caíram: data de cobrança <= fechamento
          const jaCairam = subsWithChargeDate.filter(sub => sub.chargeDate <= closingDate);
          // Ainda vão cair: data de cobrança > fechamento
          const aindaVaoCair = subsWithChargeDate.filter(sub => sub.chargeDate > closingDate);
          return (
            <div key={month} className="flex flex-col gap-2 border rounded p-2">
              <div className="flex items-center gap-3">
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
              {/* Assinaturas */}
              {cardSubscriptions.length > 0 && (
                <div className="text-xs mt-2 ml-2">
                  <div className="font-semibold text-blue-700">Assinaturas deste cartão:</div>
                  {jaCairam.length > 0 && (
                    <div className="mt-1">
                      <span className="font-medium text-green-700">Já caíram nesta fatura:</span>
                      <ul className="list-disc ml-5">
                        {jaCairam.map(sub => (
                          <li key={sub.id + month}>
                            {sub.description} (R$ {sub.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) - Cobrança dia {sub.subscription_billing_day}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aindaVaoCair.length > 0 && (
                    <div className="mt-1">
                      <span className="font-medium text-yellow-700">Ainda vão cair nesta fatura:</span>
                      <ul className="list-disc ml-5">
                        {aindaVaoCair.map(sub => (
                          <li key={sub.id + month}>
                            {sub.description} (R$ {sub.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) - Cobrança dia {sub.subscription_billing_day}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {jaCairam.length === 0 && aindaVaoCair.length === 0 && (
                    <div className="text-muted-foreground">Nenhuma assinatura para este mês.</div>
                  )}
                </div>
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