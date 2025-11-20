
import React, { useState } from 'react';
import { Lock, User, ArrowRight, Store, LogIn } from 'lucide-react';

interface SupplierLoginProps {
  onLogin: (email: string, password: string) => void;
  onRegister: () => void;
  onCancel: () => void;
}

export const SupplierLogin: React.FC<SupplierLoginProps> = ({ onLogin, onRegister, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Petit délai artificiel pour l'effet UX
    setTimeout(() => {
      onLogin(email, password);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Connexion Fournisseur</h2>
          <p className="mt-2 text-sm text-slate-600">
            Accédez à votre tableau de bord pour gérer vos produits et commandes.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom d'utilisateur</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Votre nom d'utilisateur"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
             <div className="text-sm">
               <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">Mot de passe oublié ?</a>
             </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg shadow-indigo-200"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-slate-600">
            Pas encore de compte ?{' '}
            <button onClick={onRegister} className="font-bold text-emerald-600 hover:text-emerald-500">
              Créer un compte fournisseur
            </button>
          </p>
          <div className="mt-6 pt-6 border-t border-slate-100">
             <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-600">
               Retour à l'accueil
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
