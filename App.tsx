
import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import DashboardPage from './components/dashboard/DashboardPage';
import ValuationPage from './components/valuation/ValuationPage';
import ValuationCaseForm from './components/valuation/ValuationCaseForm';
import PortfolioPage from './components/portfolio/PortfolioPage';
import PortfolioDetail from './components/portfolio/PortfolioDetail';
import Navbar from './components/navigation/Navbar';

const App: React.FC = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return <div>Loading authentication...</div>;
  }
  const { isAuthenticated, isLoading } = authContext;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading App...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {isAuthenticated && <Navbar />}
      <main className="flex-grow p-4 md:p-8">
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/valuation" element={<ValuationPage />} />
              <Route path="/valuation/new" element={<ValuationCaseForm />} />
              <Route path="/valuation/edit/:caseId" element={<ValuationCaseForm />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/portfolio/:portfolioId" element={<PortfolioDetail />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}
        </Routes>
      </main>
      {isAuthenticated && (
         <footer className="bg-slate-800 text-white p-4 text-center text-sm">
           Valuation Sandbox & Portfolio Ledger &copy; {new Date().getFullYear()}
         </footer>
      )}
    </div>
  );
};

export default App;
    