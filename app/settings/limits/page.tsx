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
import { Wallet, CreditCard, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { id: 1, name: 'Alimentação' },
  { id: 2, name: 'Transporte' },
  { id: 3, name: 'Farmácia' },
  { id: 4, name: 'Lazer' },
];

const paymentMethods = [
  { code: 'debito_pix', name: 'Débito/PIX/Dinheiro' },
  { code: 'cartao', name: 'Cartão de Crédito' },
];

// Mock data
const mockLimits = [
  {
    id: 1,
    category: 'Alimentação',
    payMethod: 'debito_pix',
    monthlyLimit: 800,
    cardDueDay: null
  },
  {
    id: 2,
    category: 'Alimentação',
    payMethod: 'cartao',
    monthlyLimit: 400,
    cardDueDay: 10
  },
  {
    id: 3,
    category: 'Transporte',
    payMethod: 'debito_pix',
    monthlyLimit: 300,
    cardDueDay: null
  },
  {
    id: 4,
    category: 'Lazer',
    payMethod: 'cartao',
    monthlyLimit: 500,
    cardDueDay: 10
  },
];

export default function LimitsPage() {
  const [limits, setLimits] = useState(mockLimits);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState(null);

  const handleSaveLimit = (limitData) => {
    if (editingLimit) {
      setLimits(prev => prev.map(limit => 
        limit.id === editingLimit.id 
          ? { ...limit, ...limitData }
          : limit
      ));
      toast.success('Limite atualizado com sucesso!');
    } else {
      const newLimit = {
        id: Date.now(),
        ...limitData
      };
      setLimits(prev => [...prev, newLimit]);
      toast.success('Limite criado com sucesso!');
    }
    setIsDialogOpen(false);
    setEditingLimit(null);
  };

  const handleDeleteLimit = (limitId) => {
    setLimits(prev => prev.filter(limit => limit.id !== limitId));
    toast.success('Limite removido com sucesso!');
  };

  const handleEditLimit = (limit) => {
    setEditingLimit(limit);
    setIsDialogOpen(true);
  };

  const totalMonthlyLimits = limits.reduce((acc, limit) => acc + limit.monthlyLimit, 0);

  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-0">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Limites por Categoria
            </h1>
            <p className="text-muted-foreground">
              Configure seus limites mensais por categoria e método de pagamento
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-lime-500 hover:bg-lime-600">
                <Plus className="w-4 h-4 mr-2" />
                Novo Limite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLimit ? 'Editar Limite' : 'Novo Limite'}
                </DialogTitle>
              </DialogHeader>
              <LimitForm
                limit={editingLimit}
                onSave={handleSaveLimit}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingLimit(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-500" />
                <CardTitle className="text-lg">Total Mensal</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalMonthlyLimits)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Soma de todos os limites
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <CardTitle className="text-lg">Categorias</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {new Set(limits.map(l => l.category)).size}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Com limites definidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-lime-500" />
                <CardTitle className="text-lg">Métodos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {limits.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Configurações ativas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Limits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Limites Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            {limits.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum limite configurado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro limite para começar a controlar seus gastos
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-lime-500 hover:bg-lime-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Limite
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Limite Mensal</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {limits.map((limit) => (
                    <TableRow key={limit.id}>
                      <TableCell className="font-medium">
                        {limit.category}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {paymentMethods.find(m => m.code === limit.payMethod)?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(limit.monthlyLimit)}
                      </TableCell>
                      <TableCell>
                        {limit.cardDueDay ? `Dia ${limit.cardDueDay}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLimit(limit)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLimit(limit.id)}
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

function LimitForm({ limit, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    category: limit?.category || '',
    payMethod: limit?.payMethod || '',
    monthlyLimit: limit?.monthlyLimit || '',
    cardDueDay: limit?.cardDueDay || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category || !formData.payMethod || !formData.monthlyLimit) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    onSave({
      ...formData,
      monthlyLimit: parseFloat(formData.monthlyLimit),
      cardDueDay: formData.payMethod === 'cartao' && formData.cardDueDay 
        ? parseInt(formData.cardDueDay) 
        : null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payMethod">Método de Pagamento</Label>
        <Select 
          value={formData.payMethod} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, payMethod: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um método" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map(method => (
              <SelectItem key={method.code} value={method.code}>
                {method.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthlyLimit">Limite Mensal (R$)</Label>
        <Input
          id="monthlyLimit"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.monthlyLimit}
          onChange={(e) => setFormData(prev => ({ ...prev, monthlyLimit: e.target.value }))}
        />
      </div>

      {formData.payMethod === 'cartao' && (
        <div className="space-y-2">
          <Label htmlFor="cardDueDay">Dia de Vencimento do Cartão</Label>
          <Select 
            value={formData.cardDueDay.toString()} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, cardDueDay: value }))}
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
      )}

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