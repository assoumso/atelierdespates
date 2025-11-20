
import React from 'react';
import { UserRole, DiningMode, AppSettings } from '../types';
import { User, ArrowRight, Utensils } from 'lucide-react';

interface LandingViewProps {
  onSelectRole: (role: UserRole) => void;
  onClientAccess: (mode: DiningMode) => void;
  onRegisterSupplier: () => void;
  appSettings?: AppSettings;
}

export const LandingView: React.FC<LandingViewProps> = ({ onSelectRole, onClientAccess, onRegisterSupplier, appSettings }) => {
  // Valeur par défaut si appSettings n'est pas encore chargé
  const slogan = appSettings?.slogan || "Bienvenue à ATELIER DES PATES ! Ça nous fait plaisir de vous voir, qu’est-ce qui vous tente ?";
  
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-slate-50 px-4 relative overflow-hidden py-12">
      {/* Decorative background elements for futuristic feel */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-100/50 blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-100/50 blur-3xl opacity-60 animate-pulse delay-1000"></div>
      </div>

      <div className="text-center mb-12 max-w-5xl relative z-10">
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 text-transparent bg-clip-text drop-shadow-sm filter">
          {slogan}
        </h1>
      </div>

      <h2 className="text-3xl font-bold text-slate-800 mb-10 relative z-10 tracking-wider uppercase border-b-4 border-yellow-400 pb-2">
        JE VEUX
      </h2>

      {/* Main Actions Grid - 2 Columns now (Emporté & Sur place) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {/* Client Card (Emporté) */}
        <div 
          onClick={() => onClientAccess('EMPORTE')}
          className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-white/50 group flex flex-col items-center text-center transform hover:-translate-y-2 duration-300"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:from-indigo-600 group-hover:to-indigo-500 transition-all shadow-sm group-hover:shadow-indigo-200/50">
            <User className="w-10 h-10 text-indigo-600 group-hover:text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-slate-900 group-hover:text-indigo-600 transition-colors">Emporté</h3>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Commandez vos plats préférés à emporter et récupérez-les en un clin d'œil. Rapide, chaud et gourmand.
          </p>
          <div className="flex items-center text-indigo-600 font-bold mt-auto bg-indigo-50 px-6 py-3 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            Commander <ArrowRight className="w-5 h-5 ml-2" />
          </div>
        </div>

        {/* Sur place Card */}
        <div 
          onClick={() => onClientAccess('SUR_PLACE')}
          className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-white/50 group flex flex-col items-center text-center transform hover:-translate-y-2 duration-300"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:from-amber-600 group-hover:to-amber-500 transition-all shadow-sm group-hover:shadow-amber-200/50">
            <Utensils className="w-10 h-10 text-amber-600 group-hover:text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-slate-900 group-hover:text-amber-600 transition-colors">Sur place</h3>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Installez-vous et savourez votre repas sur place. Profitez d'un cadre agréable pour une pause gourmande et rapide.
          </p>
          <div className="flex items-center text-amber-600 font-bold mt-auto bg-amber-50 px-6 py-3 rounded-full group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
            Commander <ArrowRight className="w-5 h-5 ml-2" />
          </div>
        </div>
      </div>
      
      {/* Bouton Admin discret */}
      <button 
        onClick={() => onSelectRole(UserRole.ADMIN)}
        className="mt-16 p-3 rounded-full text-slate-300 hover:text-slate-600 hover:bg-white transition-all"
        title="Accès Administrateur"
      >
        <div className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center">
           <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
        </div>
      </button>
    </div>
  );
};
