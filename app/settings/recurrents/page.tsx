"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Banknote, TrendingUp, TrendingDown, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockRecurrents = [
  {
    id: 1,
    description: 'Salário - Empresa XYZ',
    amount: 5000,
    type: 'income',
    frequency: 'monthly',
    day: 5,
    nextDate: '2025-02-05'
  },
  {
    id: 2,
    description: 'Conta de Luz - Elektro',
    amount: -180,
    type: 'expense',
    frequency: 'monthly',
    day: 15,
    nextDate: '2025-02-15'
  },
  {
    id: 3,
    description: 'Conta de Água - Sabesp',
    amount: -95,
    type: 'expense',
    frequency: 'monthly',
    day: 20,
    nextDate: '2025-02-20'
  },
  {
    id: 4,
    description: 'Internet - Vivo',
    amount: -120,
    type: 'expense',
    frequency: 'monthly',
    day: 10,
    nextDate: '2025-02-10'
  },
];

const frequencyOptions = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
];

export default function RecurrentsPage() {
  const [recurrents, setRecurrents] = useState(mockRecurrents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecurrent, setEditingRecurrent] = useState(null);

  const handleSaveRecurrent = (recurrentData) => {
    if (editingRecurrent) {
      setRecurrents(prev => prev.map(recurrent => 
        recurrent.id === editingRecurrent.id 
          ? { ...recurrent, ...recurrentData }
          : recurrent
      ));
      toast.success('Recorrente atualizado com sucesso!');
    } else {
      const newRecurrent = {
        id: Date.now(),
        ...recurrentData,
        nextDate: calculateNextDate(recurrentData.frequency, recurrentData.day)
      };
      setRecurrents(prev => [...prev, newRecurrent]);
      toast.success('Recorrente criado com sucesso!');
    }
    setIsDialogOpen(false);
    setEditingRecurrent(null);
  };

  const handleDeleteRecurrent = (recurrentId) => {
    setRecurrents(prev => prev.filter(recurrent => recurrent.id !== recurrentId));
    toast.success('Recorrente removido com sucesso!');
  };

  const handleEditRecurrent = (recurrent) => {
    setEditingRecurrent(recurrent);
    setIsDialogOpen(true);
  };

  const calculateNextDate = (frequency, day) => {
    const now = new Date();
    let nextDate = new Date(now.getFullYear(), now.getMonth(), day);
    
    if (nextDate <= now) {
      nextDate = new Date(now.getFullYear(), now.getMonth() + 1, day);
    }
    
    return nextDate.toISOString().split('T')[0];
  };

  const totalIncome = recurrents
    .filter(r => r.type === 'income')
    .reduce((acc, r) => acc + r.amount, 0);

  const totalExpenses = recurrents
    .filter(r => r.type === 'expense')
    .reduce((acc, r) => acc + Math.abs(r.amount), 0);

  const netAmount = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-0">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Transações Recorrentes
            </h1>
            <p className="text-muted-foreground">
              Configure salários e contas fixas que se repetem mensalmente
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-lime-500 hover:bg-lime-600">
                <Plus className="w-4 h-4 mr-2" />
                Nova Recorrente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingRecurrent ? 'Editar Recorrente' : 'Nova Recorrente'}
                </DialogTitle>
              </DialogHeader>
              <RecurrentForm
                recurrent={editingRecurrent}
                onSave={handleSaveRecurrent}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingRecurrent(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-lime-500" />
                <CardTitle className="text-lg">Receitas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-lime-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalIncome)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {recurrents.filter(r => r.type === 'income').length} itens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg">Despesas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalExpenses)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {recurrents.filter(r => r.type === 'expense').length} itens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-indigo-500" />
                <CardTitle className="text-lg">Saldo Líquido</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-lime-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(netAmount)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Mensal estimado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recurrents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            {recurrents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma transação recorrente
                </h3>
                <p className="text-muted-foreground mb-4">
                  Cadastre seu salário e contas fixas para ter uma visão completa
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-lime-500 hover:bg-lime-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Recorrente
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Próxima Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurrents.map((recurrent) => (
                    <TableRow key={recurrent.id}>
                      <TableCell className="font-medium">
                        {recurrent.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={recurrent.type === 'income' ? 'default' : 'secondary'}>
                          {recurrent.type === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          recurrent.type === 'income' ? 'text-lime-600' : 'text-red-600'
                        }`}>
                          {recurrent.type === 'income' ? '+' : ''}
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(recurrent.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {frequencyOptions.find(f => f.value === recurrent.frequency)?.label}
                      </TableCell>
                      <TableCell>
                        {new Date(recurrent.nextDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRecurrent(recurrent)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRecurrent(recurrent.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecurrentForm({ recurrent, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    description: recurrent?.description || '',
    amount: recurrent?.amount ? Math.abs(recurrent.amount).toString() : '',
    type: recurrent?.type || 'expense',
    frequency: recurrent?.frequency || 'monthly',
    day: recurrent?.day?.toString() || '1'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    onSave({
      ...formData,
      amount: formData.type === 'income' ? amount : -amount,
      day: parseInt(formData.day)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          placeholder="Ex: Salário - Empresa XYZ"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Receita</SelectItem>
            <SelectItem value="expense">Despesa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Frequência</Label>
        <Select 
          value={formData.frequency} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a frequência" />
          </SelectTrigger>
          <SelectContent>
            {frequencyOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="day">Dia do Mês</Label>
        <Select 
          value={formData.day} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, day: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o dia" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
              <SelectItem key={day} value={day.toString()}>
                Dia {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-lime-500 hover:bg-lime-600">
          Salvar
        </Button>
      </div>
    </form>
  );
}