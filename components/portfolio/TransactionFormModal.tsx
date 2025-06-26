
import React, { useState, useEffect, FormEvent } from 'react';
import { Transaction, TransactionType } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, 'id' | 'portfolioId'>) => void;
  initialData?: Omit<Transaction, 'id' | 'portfolioId'>; // For editing
}

const TransactionFormModal: React.FC<TransactionFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.BUY);
  const [ticker, setTicker] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [quantity, setQuantity] = useState<number | string>('');
  const [price, setPrice] = useState<number | string>('');
  const [commissions, setCommissions] = useState<number | string>('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTicker(initialData.ticker);
      setDate(initialData.date);
      setQuantity(initialData.quantity);
      setPrice(initialData.price);
      setCommissions(initialData.commissions || '');
    } else {
      // Reset form for new transaction
      setType(TransactionType.BUY);
      setTicker('');
      setDate(new Date().toISOString().split('T')[0]);
      setQuantity('');
      setPrice('');
      setCommissions('');
    }
  }, [initialData, isOpen]); // Reset form when modal opens or initialData changes

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!ticker.trim()) {
        setFormError('Ticker is required.');
        return;
    }
    const numQuantity = parseFloat(String(quantity));
    const numPrice = parseFloat(String(price));
    
    if (isNaN(numQuantity) || numQuantity <= 0) {
        setFormError('Quantity must be a positive number.');
        return;
    }
    if (isNaN(numPrice) || numPrice < 0) { // Price can be 0 for some specific cases, but generally > 0
        setFormError('Price must be a non-negative number.');
        return;
    }
    const numCommissions = commissions === '' ? undefined : parseFloat(String(commissions));
    if (numCommissions !== undefined && (isNaN(numCommissions) || numCommissions < 0)) {
        setFormError('Commissions must be a non-negative number if provided.');
        return;
    }


    onSubmit({
      type,
      ticker: ticker.toUpperCase(),
      date,
      quantity: numQuantity,
      price: numPrice,
      commissions: numCommissions,
    });
    onClose(); // Close modal on successful submission
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Transaction' : 'Add New Transaction'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value={TransactionType.BUY}>Buy</option>
            <option value={TransactionType.SELL}>Sell</option>
          </select>
        </div>
        <Input id="ticker" label="Ticker" type="text" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} required placeholder="e.g., AAPL"/>
        <Input id="date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input id="quantity" label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0.000001" step="any"/>
        <Input id="price" label="Price per Share" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="any"/>
        <Input id="commissions" label="Commissions/Fees (Optional)" type="number" value={commissions} onChange={(e) => setCommissions(e.target.value)} min="0" step="any"/>
        
        {formError && <p className="text-red-500 text-sm">{formError}</p>}

        <div className="flex justify-end space-x-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{initialData ? 'Update Transaction' : 'Add Transaction'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionFormModal;
    