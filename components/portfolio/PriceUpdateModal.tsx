
import React, { useState, FormEvent, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticker: string, price: number, date: string) => void;
  ticker: string; // The ticker for which price is being updated
  currentPrice?: number;
  currentDate?: string;
}

const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({ isOpen, onClose, onSubmit, ticker, currentPrice, currentDate }) => {
  const [price, setPrice] = useState<number | string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
        setPrice(currentPrice !== undefined ? currentPrice : '');
        setDate(currentDate || new Date().toISOString().split('T')[0]);
        setFormError('');
    }
  }, [isOpen, currentPrice, currentDate]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const numPrice = parseFloat(String(price));

    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Price must be a non-negative number.');
      return;
    }
    if (!date) {
        setFormError('Date is required.');
        return;
    }

    onSubmit(ticker, numPrice, date);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Market Price for ${ticker}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="marketPrice"
          label={`Current Market Price for ${ticker}`}
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          min="0"
          step="any"
        />
        <Input
            id="priceAsOfDate"
            label="Price as of Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
        />
        {formError && <p className="text-red-500 text-sm">{formError}</p>}
        <div className="flex justify-end space-x-3 pt-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Update Price</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PriceUpdateModal;
    