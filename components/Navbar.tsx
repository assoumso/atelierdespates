import React from 'react';
import { UserRole, ViewState } from '../types';
import { ShoppingBag, LogOut, LayoutDashboard, UserCircle, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  userRole: UserRole;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ userRole, currentView, onChangeView, onLogout }) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onChangeView(ViewState.LANDING)}>
            <ShoppingBag className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-slate-900">Atelier des pates</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {userRole !== UserRole.GUEST && (
              <>
                <span className="hidden md:flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {userRole === UserRole.ADMIN && <ShieldCheck className="w-3 h-3 mr-1" />}
                  {userRole === UserRole.SUPPLIER && <LayoutDashboard className="w-3 h-3 mr-1" />}
                  {userRole === UserRole.CLIENT && <UserCircle className="w-3 h-3 mr-1" />}
                  {userRole}
                </span>

                {userRole === UserRole.CLIENT && (
                  <button 
                    onClick={() => onChangeView(ViewState.MARKETPLACE)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === ViewState.MARKETPLACE ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Marché
                  </button>
                )}

                {userRole === UserRole.SUPPLIER && (
                  <button 
                    onClick={() => onChangeView(ViewState.SUPPLIER_DASHBOARD)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === ViewState.SUPPLIER_DASHBOARD ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Mon Catalogue
                  </button>
                )}

                {userRole === UserRole.ADMIN && (
                  <button 
                    onClick={() => onChangeView(ViewState.ADMIN_DASHBOARD)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === ViewState.ADMIN_DASHBOARD ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    Administration
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="flex items-center text-slate-500 hover:text-red-600 transition-colors ml-4"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};