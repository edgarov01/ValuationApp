
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Portfolio, Transaction, TransactionType, PortfolioSummary } from '../types';
import { AuthContext } from './AuthContext';
import { calculatePortfolioSummary } from '../services/portfolioService';

interface PortfolioContextType {
  portfolios: Portfolio[];
  addPortfolio: (name: string) => Portfolio | null;
  deletePortfolio: (portfolioId: string) => void;
  getPortfolioById: (portfolioId: string) => Portfolio | undefined;
  addTransaction: (portfolioId: string, transaction: Omit<Transaction, 'id' | 'portfolioId'>) => Transaction | null;
  deleteTransaction: (portfolioId: string, transactionId: string) => void;
  updateHoldingPrice: (portfolioId: string, ticker: string, price: number, date: string) => void;
  getPortfolioSummary: (portfolioId: string) => PortfolioSummary | null;
}

export const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portfolios, setPortfolios] = useLocalStorage<Portfolio[]>('portfolios', []);
  const authContext = useContext(AuthContext);

  const getUserId = (): string | null => {
    if (!authContext || !authContext.user) {
      console.error("User not authenticated to perform portfolio actions.");
      return null;
    }
    return authContext.user.id;
  };

  const addPortfolio = useCallback((name: string): Portfolio | null => {
    const userId = getUserId();
    if (!userId) return null;

    const newPortfolio: Portfolio = {
      id: `port-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      transactions: [],
      manualPrices: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPortfolios(prev => [...prev, newPortfolio]);
    return newPortfolio;
  }, [authContext, setPortfolios]);

  const deletePortfolio = useCallback((portfolioId: string) => {
    const userId = getUserId();
    if (!userId) return;
    setPortfolios(prev => prev.filter(p => p.id !== portfolioId || p.userId !== userId));
  }, [authContext, setPortfolios]);
  
  const getPortfolioById = useCallback((portfolioId: string): Portfolio | undefined => {
    const userId = getUserId();
    if (!userId) return undefined;
    return portfolios.find(p => p.id === portfolioId && p.userId === userId);
  }, [authContext, portfolios]);

  const addTransaction = useCallback((portfolioId: string, transactionData: Omit<Transaction, 'id' | 'portfolioId'>): Transaction | null => {
    const userId = getUserId();
    if (!userId) return null;

    const newTransaction: Transaction = {
      ...transactionData,
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portfolioId,
    };

    setPortfolios(prev =>
      prev.map(p => {
        if (p.id === portfolioId && p.userId === userId) {
          return {
            ...p,
            transactions: [...p.transactions, newTransaction],
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
    return newTransaction;
  }, [authContext, setPortfolios]);
  
  const deleteTransaction = useCallback((portfolioId: string, transactionId: string) => {
    const userId = getUserId();
    if (!userId) return;

    setPortfolios(prev => 
      prev.map(p => {
        if (p.id === portfolioId && p.userId === userId) {
          return {
            ...p,
            transactions: p.transactions.filter(t => t.id !== transactionId),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  }, [authContext, setPortfolios]);

  const updateHoldingPrice = useCallback((portfolioId: string, ticker: string, price: number, date: string) => {
    const userId = getUserId();
    if (!userId) return;

    setPortfolios(prev => 
      prev.map(p => {
        if (p.id === portfolioId && p.userId === userId) {
          return {
            ...p,
            manualPrices: {
              ...p.manualPrices,
              [ticker]: { price, date },
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  }, [authContext, setPortfolios]);

  const getPortfolioSummary = useCallback((portfolioId: string): PortfolioSummary | null => {
    const portfolio = getPortfolioById(portfolioId);
    if (!portfolio) return null;
    return calculatePortfolioSummary(portfolio.transactions, portfolio.manualPrices);
  }, [getPortfolioById]);

  const userPortfolios = portfolios.filter(p => p.userId === authContext?.user?.id);

  return (
    <PortfolioContext.Provider value={{ 
        portfolios: userPortfolios, 
        addPortfolio, 
        deletePortfolio, 
        getPortfolioById, 
        addTransaction,
        deleteTransaction,
        updateHoldingPrice,
        getPortfolioSummary 
      }}>
      {children}
    </PortfolioContext.Provider>
  );
};
    