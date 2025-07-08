import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TimelineEvent } from '@/hooks/useTimeline';

export interface DeleteTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: TimelineEvent | null;
  onConfirm: (mode: 'single' | 'all') => Promise<void>;
  loading?: boolean;
}

export function DeleteTransactionDialog({ 
  open, 
  onOpenChange, 
  event, 
  onConfirm, 
  loading = false 
}: DeleteTransactionDialogProps) {
  const [deleteMode, setDeleteMode] = useState<'single' | 'all'>('single');

  const handleConfirm = async () => {
    if (!event) return;
    await onConfirm(deleteMode);
    onOpenChange(false);
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover Transação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Tem certeza que deseja remover a transação &quot;{event.description}&quot;?
          </p>
          
          {event.isRecurring && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Esta é uma transação recorrente. Escolha como deseja remover:
              </p>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant={deleteMode === "single" ? "default" : "outline"} 
                  onClick={() => setDeleteMode("single")}
                  size="sm"
                >
                  Só esta ocorrência
                </Button>
                <Button 
                  type="button"
                  variant={deleteMode === "all" ? "default" : "outline"} 
                  onClick={() => setDeleteMode("all")}
                  size="sm"
                >
                  Toda a recorrência
                </Button>
              </div>
            </div>
          )}
          
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
              type="button" 
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Removendo...' : 'Confirmar Remoção'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 