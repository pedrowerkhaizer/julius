import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimelineEvent } from '@/hooks/useTimeline';
import { UpdateTransactionData } from '@/lib/types/finance';

export interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: TimelineEvent | null;
  onSave: (data: UpdateTransactionData, mode: 'single' | 'all') => Promise<void>;
  loading?: boolean;
}

export function EditTransactionDialog({ 
  open, 
  onOpenChange, 
  event, 
  onSave, 
  loading = false 
}: EditTransactionDialogProps) {
  const [editMode, setEditMode] = useState<'single' | 'all'>('single');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (event) {
      setDescription(event.description);
      setAmount(event.amount);
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;

    const updateData: UpdateTransactionData = {
      description,
      amount,
    };

    await onSave(updateData, editMode);
    onOpenChange(false);
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        
        {event.isRecurring && (
          <div className="mb-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Esta é uma transação recorrente. Escolha como deseja editar:
            </p>
            <div className="flex gap-2">
              <Button 
                type="button"
                variant={editMode === "single" ? "default" : "outline"} 
                onClick={() => setEditMode("single")}
                size="sm"
              >
                Só esta ocorrência
              </Button>
              <Button 
                type="button"
                variant={editMode === "all" ? "default" : "outline"} 
                onClick={() => setEditMode("all")}
                size="sm"
              >
                Toda a recorrência
              </Button>
            </div>
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 font-medium">Descrição</label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Valor (R$)</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !editMode}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 