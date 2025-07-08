"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WhatsAppInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export default function WhatsAppInput({
  value,
  onChange,
  label = "WhatsApp",
  placeholder = "+55 24 98124-0000",
  required = false,
  disabled = false,
  id
}: WhatsAppInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const formatWhatsAppNumber = (input: string): string => {
    // Remove tudo exceto números e +
    let cleaned = input.replace(/[^\d+]/g, '');
    
    // Garante que começa com +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    // Remove + duplicados
    cleaned = cleaned.replace(/\++/g, '+');
    
    // Se só tem o +, retorna
    if (cleaned === '+') {
      return '+';
    }
    
    // Remove o + para formatar
    let numbers = cleaned.slice(1);
    
    // Aplica formatação flexível baseada no comprimento
    let formatted = '+';
    
    if (numbers.length > 0) {
      formatted += numbers.slice(0, 2); // Código do país
    }
    
    if (numbers.length > 2) {
      formatted += ' ' + numbers.slice(2, 4); // DDD
    }
    
    if (numbers.length > 4) {
      formatted += ' ' + numbers.slice(4, 9); // Primeira parte do número
    }
    
    if (numbers.length > 9) {
      formatted += '-' + numbers.slice(9, 13); // Segunda parte do número
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatWhatsAppNumber(inputValue);
    
    setDisplayValue(formatted);
    
    // Para o onChange, envia apenas os números com +
    const cleaned = formatted.replace(/[^\d+]/g, '');
    onChange(cleaned);
  };

  return (
    <div>
      {label && (
        <Label htmlFor={id}>
          {label}
        </Label>
      )}
      <Input
        id={id}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="font-mono"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Com o WhatsApp configurado, você poderá interagir com seus saldos, despesas e receitas diretamente pelo WhatsApp.
      </p>
    </div>
  );
} 