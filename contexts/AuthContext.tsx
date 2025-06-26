
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>; // Simple mock
  register: (email: string, pass: string) => Promise<boolean>; // Simple mock
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>('authUser', null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock users stored in localStorage for simplicity
  const [registeredUsers, setRegisteredUsers] = useLocalStorage<Record<string, string>>('registeredUsers', {});

  useEffect(() => {
    setIsLoading(false); // In a real app, you might verify token here
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Mock login: check if user exists and password matches (in real app, this is API call)
    // For this mock, we're not actually storing/checking passwords securely.
    // This is purely for frontend demo purposes.
    return new Promise(resolve => {
        setTimeout(() => { // Simulate API delay
            if (registeredUsers[email]) { // Check if email is registered
                setUser({ id: email, email }); // Simplified user object
                setIsLoading(false);
                resolve(true);
            } else {
                setIsLoading(false);
                resolve(false);
            }
        }, 500);
    });
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Mock register: add user to localStorage (in real app, this is API call)
    return new Promise(resolve => {
        setTimeout(() => {
            if (registeredUsers[email]) {
                setIsLoading(false);
                resolve(false); // User already exists
            } else {
                setRegisteredUsers(prev => ({ ...prev, [email]: password })); // DO NOT store plain passwords in real apps
                setUser({ id: email, email }); // Auto-login after register
                setIsLoading(false);
                resolve(true);
            }
        }, 500);
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
    