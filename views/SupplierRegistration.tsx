
import React, { useState } from 'react';
import { Building2, User, Phone, MapPin, Lock, ArrowRight, Store } from 'lucide-react';
import { Supplier } from '../types';

interface SupplierRegistrationProps {
  onRegister: (supplierData: Partial<Supplier>) => void;
  onCancel: () => void;
}

export const SupplierRegistration: React.FC<SupplierRegistrationProps> = ({ onRegister, onCancel }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    category: 'Ventes',
    email: '',
    phone: '',
    address: '',
    // description supprimé
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    // Construction de l'objet fournisseur
    const newSupplierData: Partial<Supplier> = {
      name: formData.companyName,
      category: formData.category,
      description: '', // Description vide par défaut
      email: formData.email, // Utilisé comme Nom d'utilisateur
      phone: formData.phone,
      address: formData.address,
      verified: false, // Nécessite validation admin
      rating: 0, // Nouveau compte
      isAvailable: true,
      password: formData.password // Mot de passe inclus
    };

    onRegister(newSupplierData);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Devenir Fournisseur</h2>
          <p className="mt-2 text-sm text-slate-600">
            Créez votre compte professionnel pour accéder à des milliers d'acheteurs potentiels.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identité Entreprise */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'entreprise</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="companyName"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Ex: Global Import Export SA"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Secteur d'activité</label>
              <select
                name="category"
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-slate-300 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Ventes">Ventes</option>
              </select>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone Pro</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="+225 XX XX XX XX"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Nom d'utilisateur (anciennement Email) */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom d'utilisateur</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="email"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Votre nom d'utilisateur"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse du siège</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="address"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Quartier, Ville, Pays"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="group relative flex justify-center py-3 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-lg shadow-emerald-200"
            >
              Créer mon compte
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
