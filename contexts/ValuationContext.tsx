
import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ValuationCase, ValuationInputs, ValuationResults } from '../types';
import { AuthContext } from './AuthContext';
import { calculateValuation } from '../services/valuationService';

interface ValuationContextType {
  valuationCases: ValuationCase[];
  addCase: (caseName: string, inputs: ValuationInputs) => Promise<ValuationCase | null>;
  updateCase: (caseId: string, caseName: string, inputs: ValuationInputs) => Promise<ValuationCase | null>;
  deleteCase: (caseId: string) => void;
  getCaseById: (caseId: string) => ValuationCase | undefined;
  isLoading: boolean;
}

export const ValuationContext = createContext<ValuationContextType | undefined>(undefined);

export const ValuationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [valuationCases, setValuationCases] = useLocalStorage<ValuationCase[]>('valuationCases', []);
  const [isLoading, setIsLoading] = useState(false);
  const authContext = useContext(AuthContext);

  const getUserId = (): string | null => {
    if (!authContext || !authContext.user) {
      console.error("User not authenticated to perform valuation actions.");
      return null;
    }
    return authContext.user.id;
  };

  const addCase = useCallback(async (caseName: string, inputs: ValuationInputs): Promise<ValuationCase | null> => {
    const userId = getUserId();
    if (!userId) return null;

    setIsLoading(true);
    try {
      // Simulate async calculation
      await new Promise(resolve => setTimeout(resolve, 500));
      const results: ValuationResults = calculateValuation(inputs);
      
      const newCase: ValuationCase = {
        id: `case-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        caseName,
        inputs,
        results,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setValuationCases(prev => [...prev, newCase]);
      return newCase;
    } catch (error) {
      console.error("Error calculating or adding valuation case:", error);
      return null; // Or throw error to be handled by UI
    } finally {
      setIsLoading(false);
    }
  }, [authContext, setValuationCases]);

  const updateCase = useCallback(async (caseId: string, caseName: string, inputs: ValuationInputs): Promise<ValuationCase | null> => {
    const userId = getUserId();
    if (!userId) return null;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const results: ValuationResults = calculateValuation(inputs);
      
      let updatedCase: ValuationCase | null = null;
      setValuationCases(prev =>
        prev.map(c => {
          if (c.id === caseId && c.userId === userId) {
            updatedCase = {
              ...c,
              caseName,
              inputs,
              results,
              updatedAt: new Date().toISOString(),
            };
            return updatedCase as ValuationCase;
          }
          return c;
        })
      );
      return updatedCase;
    } catch (error) {
      console.error("Error calculating or updating valuation case:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [authContext, setValuationCases]);

  const deleteCase = useCallback((caseId: string) => {
    const userId = getUserId();
    if (!userId) return;
    setValuationCases(prev => prev.filter(c => c.id !== caseId || c.userId !== userId));
  }, [authContext, setValuationCases]);

  const getCaseById = useCallback((caseId: string): ValuationCase | undefined => {
    const userId = getUserId();
    if (!userId) return undefined;
    return valuationCases.find(c => c.id === caseId && c.userId === userId);
  }, [authContext, valuationCases]);

  const userValuationCases = valuationCases.filter(c => c.userId === authContext?.user?.id);

  return (
    <ValuationContext.Provider value={{ valuationCases: userValuationCases, addCase, updateCase, deleteCase, getCaseById, isLoading }}>
      {children}
    </ValuationContext.Provider>
  );
};
    