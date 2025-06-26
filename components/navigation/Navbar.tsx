
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (authContext) {
      authContext.logout();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-slate-800 text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold hover:text-indigo-300 transition-colors">
              Valuation Sandbox
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/valuation">Valuation Sandbox</NavLink>
              <NavLink to="/portfolio">Portfolio Ledger</NavLink>
            </div>
          </div>
          <div className="hidden md:block">
            <Button onClick={handleLogout} variant="secondary" size="sm">
              Logout
            </Button>
          </div>
          <div className="md:hidden flex items-center">
            {/* Mobile menu button can be added here */}
            <Button onClick={handleLogout} variant="secondary" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile menu, show/hide based on menu state - can be added later */}
       <div className="md:hidden bg-slate-700">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <MobileNavLink to="/dashboard">Dashboard</MobileNavLink>
          <MobileNavLink to="/valuation">Valuation</MobileNavLink>
          <MobileNavLink to="/portfolio">Portfolio</MobileNavLink>
        </div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children }) => (
  <Link
    to={to}
    className="text-gray-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
    // activeClassName="bg-slate-900 text-white" // This doesn't work directly with react-router-dom v6 Link
    // You'd use NavLink from react-router-dom and style based on its `isActive` prop if needed
  >
    {children}
  </Link>
);

const MobileNavLink: React.FC<NavLinkProps> = ({ to, children }) => (
   <Link
    to={to}
    className="text-gray-300 hover:bg-slate-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
  >
    {children}
  </Link>
);


export default Navbar;
    