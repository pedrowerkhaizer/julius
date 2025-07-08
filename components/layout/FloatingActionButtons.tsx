import { Plus } from 'lucide-react';

export interface FloatingActionButtonsProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
}

export function FloatingActionButtons({ onAddExpense, onAddIncome }: FloatingActionButtonsProps) {
  return (
    <>
      <div className="fixed left-1/2 bottom-8 z-30 flex gap-3 -translate-x-1/2">
        <button
          onClick={onAddExpense}
          className="flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow px-5 py-3 text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5" /> Nova Saída
        </button>
        <button
          onClick={onAddIncome}
          className="flex items-center gap-2 rounded-lg bg-lime-500 hover:bg-lime-600 text-white shadow px-5 py-3 text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2"
        >
          <Plus className="w-5 h-5" /> Nova Entrada
        </button>
      </div>

      {/* Responsividade para mobile/tablet */}
      <style jsx global>{`
        @media (max-width: 640px) {
          .fixed.left-1\/2.bottom-8 {
            gap: 0.5rem;
            bottom: 1.25rem;
          }
          .fixed.left-1\/2.bottom-8 button {
            font-size: 0.95rem;
            padding: 0.7rem 1.1rem;
          }
        }
      `}</style>
    </>
  );
} 