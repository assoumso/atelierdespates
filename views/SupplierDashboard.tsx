
import React, { useState, useEffect, useRef } from 'react';
import { Product, Order, OrderStatus, Message } from '../types';
import { 
  Plus, Sparkles, X, Package, ShoppingCart, DollarSign, 
  MessageSquare, Settings, CheckCircle, AlertCircle, 
  Truck, Clock, Trash2, UploadCloud, Smartphone, Rocket, Banknote, Image as ImageIcon, Phone, MapPin, Bell, Volume2, Pencil, Play, Utensils, ShoppingBag, Power, PlayCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SupplierDashboardProps {
  supplierId: string;
  supplierName: string;
  products: Product[];
  orders: Order[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onDeleteProduct: (id: string) => void;
}

type DashboardTab = 'overview' | 'products' | 'orders' | 'messages' | 'finance' | 'settings';

export const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ 
  supplierId, 
  supplierName, 
  products, 
  orders,
  onAddProduct,
  onUpdateProduct,
  onUpdateOrderStatus,
  onDeleteProduct
}) => {
  // Filter products for this supplier
  const myProducts = products.filter(p => p.supplierId === supplierId);
  
  // Initialize activeTab
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    return myProducts.length === 0 ? 'products' : 'overview';
  });

  // --- Interaction State (Splash Screen) ---
  const [hasInteracted, setHasInteracted] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // --- Product Form State ---
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Service');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // --- KYC State ---
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'unverified'>('unverified');

  // --- Filtered Data & Notification Logic ---
  const myOrders = orders.filter(o => o.supplierId === supplierId); 
  
  // Référence pour stocker le nombre de commandes précédent
  const prevOrderCountRef = useRef(myOrders.length);
  const isFirstRender = useRef(true);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  // Référence Audio Context
  const audioContextRef = useRef<AudioContext | null>(null);

  // Vérification permission notification au montage
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Fonction pour initialiser la session (Son + Vibration + Notification)
  const initializeSession = () => {
      unlockAudioContext();
      playNotificationSound(); // Test sonore immédiat
      
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200]);
      }

      requestNotificationPermission();
      setHasInteracted(true);
  };

  const unlockAudioContext = () => {
      if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
              audioContextRef.current = new AudioContext();
          }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
             console.log("Audio Context Resumed");
          }).catch(e => console.error(e));
      }
  };

  // Fonction pour demander la permission
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          new Notification("Atelier des pates", {
            body: "Tableau de bord fournisseur actif.",
            icon: '/icon.png'
          });
        }
      });
    }
  };

  // Fonction améliorée pour jouer un son de notification (Double Bip)
  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
         const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
         if (AudioContext) audioContextRef.current = new AudioContext();
      }

      const ctx = audioContextRef.current;
      if (!ctx) return;
      
      // Tentative de reprise si le contexte est suspendu
      if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Impossible de démarrer l'audio:", e));
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      
      // Séquence plus "Alarme"
      // Note 1
      osc.frequency.setValueAtTime(880, now); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      // Note 2
      osc.frequency.setValueAtTime(1174.66, now + 0.3); // D6
      gain.gain.setValueAtTime(0.2, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      
      // Note 3 (Répétition Note 1)
      osc.frequency.setValueAtTime(880, now + 0.6); // A5
      gain.gain.setValueAtTime(0.2, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

      osc.start(now);
      osc.stop(now + 1.0);
    } catch (e) {
      console.error("Erreur lecture son:", e);
    }
  };

  // Fonction pour déclencher l'alerte mobile (Vibration + Notification Système)
  const triggerMobileAlert = (message: string) => {
    // 1. Vibration (si supporté par le mobile)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        // Vibration longue et distincte
        navigator.vibrate([500, 200, 500]); 
      } catch (e) {
        console.warn("Vibration non supportée ou bloquée");
      }
    }

    // 2. Notification Système Native
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification("Atelier des pates - Nouvelle Commande !", {
          body: message,
          icon: '/icon.png',
          vibrate: [500, 200, 500],
          tag: 'new-order',
          requireInteraction: true // La notif reste jusqu'à ce qu'on clique
        } as any);
        notif.onclick = () => {
          window.focus();
          setActiveTab('orders');
          notif.close();
        };
      } catch (e) {
        console.error("Erreur notification native:", e);
      }
    }
  };

  // Effet pour détecter les nouvelles commandes
  useEffect(() => {
    if (isFirstRender.current) {
      prevOrderCountRef.current = myOrders.length;
      isFirstRender.current = false;
      return;
    }

    if (myOrders.length > prevOrderCountRef.current) {
      const notifMsg = `Vous avez reçu une nouvelle commande de ${myOrders[0].totalPrice.toLocaleString()} FCFA !`;
      console.log("Nouvelle commande détectée ! Alerte...");
      
      if (hasInteracted) {
          playNotificationSound();
          triggerMobileAlert(notifMsg);
      }
      
      setLastNotification(notifMsg);
      setTimeout(() => setLastNotification(null), 10000); 
    }

    prevOrderCountRef.current = myOrders.length;
  }, [myOrders.length, hasInteracted]); 

  
  // --- Stats ---
  const totalRevenue = myOrders.reduce((sum, order) => order.status !== OrderStatus.CANCELLED ? sum + order.totalPrice : sum, 0);
  const pendingOrdersCount = myOrders.filter(o => o.status === OrderStatus.PENDING).length;
  const activeProductsCount = myProducts.length;

  // --- Handlers ---

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Redimensionnement via Canvas pour réduire la taille (Max 800px)
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            setSelectedImage(dataUrl);
          }
          setIsProcessingImage(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setDescription(product.description);
    setSelectedImage(product.imageUrl);
    setIsFormOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    resetForm();
    setIsFormOpen(true);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const defaultImage = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80";

    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        name,
        price: parseFloat(price),
        category,
        description,
        imageUrl: selectedImage || editingProduct.imageUrl,
      };
      onUpdateProduct(updatedProduct);
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        name,
        price: parseFloat(price),
        category,
        description,
        supplierId,
        supplierName,
        imageUrl: selectedImage || defaultImage,
        tags: [], 
        createdAt: Date.now()
      };
      onAddProduct(newProduct);
    }
    
    setIsFormOpen(false);
    resetForm();
    setEditingProduct(null);
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('Service');
    setDescription('');
    setSelectedImage(null);
  };

  // --- Sub-components ---

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center">
      <div className={`p-4 rounded-full mr-4 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  );

  const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
    const styles = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [OrderStatus.SHIPPED]: 'bg-indigo-100 text-indigo-800',
      [OrderStatus.DELIVERED]: 'bg-emerald-100 text-emerald-800',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
    };
    
    const labels = {
      [OrderStatus.PENDING]: 'En attente',
      [OrderStatus.CONFIRMED]: 'Confirmée',
      [OrderStatus.SHIPPED]: 'En route',
      [OrderStatus.DELIVERED]: 'Livrée',
      [OrderStatus.CANCELLED]: 'Annulée',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // --- SPLASH SCREEN GUARD ---
  if (!hasInteracted) {
      return (
          <div className="fixed inset-0 bg-slate-900 z-[999] flex flex-col items-center justify-center p-4 text-center">
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Power className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Démarrer le Service</h2>
                  <p className="text-slate-500 mb-8">
                      Activez le tableau de bord pour autoriser les sons et vibrations.
                  </p>
                  <button 
                      onClick={initializeSession}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-indigo-200 transition-transform transform hover:scale-105 flex items-center justify-center"
                  >
                      <PlayCircle className="w-6 h-6 mr-2" />
                      Ouvrir mon Espace
                  </button>
              </div>
          </div>
      );
  }

  // --- Render Content ---
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Banner Permission Notification */}
            {notificationPermission !== 'granted' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center text-blue-700">
                  <Bell className="w-5 h-5 mr-3" />
                  <div>
                    <p className="font-bold text-sm">Activez les notifications !</p>
                    <p className="text-xs">Pour être alerté en temps réel des nouvelles commandes, autorisez les notifications.</p>
                  </div>
                </div>
                <button 
                  onClick={requestNotificationPermission}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  Autoriser
                </button>
              </div>
            )}

            {/* Notification Toast */}
            {lastNotification && (
              <div className="bg-indigo-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center justify-between animate-bounce fixed top-24 right-4 z-50 w-[90%] md:w-auto border-2 border-white/20">
                <div className="flex items-center cursor-pointer" onClick={() => setActiveTab('orders')}>
                  <Volume2 className="w-6 h-6 mr-3 animate-pulse" />
                  <div>
                     <span className="font-bold text-sm md:text-base block">{lastNotification}</span>
                     <span className="text-xs opacity-90">Cliquez pour voir</span>
                  </div>
                </div>
                <button onClick={() => setLastNotification(null)} className="text-white/80 hover:text-white ml-4">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {myProducts.length === 0 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-start shadow-sm">
                 <div className="bg-indigo-100 p-3 rounded-lg mr-4 hidden sm:block">
                   <Rocket className="w-6 h-6 text-indigo-600" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-indigo-900 mb-1">Bienvenue dans votre Espace Fournisseur !</h3>
                   <p className="text-indigo-700 mb-4 text-sm">
                     Votre compte est actif. Pour commencer à vendre, la première étape est de constituer votre catalogue produits.
                   </p>
                   <button 
                     onClick={() => setActiveTab('products')}
                     className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
                   >
                     Aller à mes produits
                   </button>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Chiffre d'Affaires" value={`${totalRevenue.toLocaleString()} FCFA`} icon={DollarSign} color="bg-emerald-500" />
              <StatCard title="Commandes en attente" value={pendingOrdersCount} icon={Clock} color="bg-yellow-500" />
              <StatCard title="Produits Actifs" value={activeProductsCount} icon={Package} color="bg-indigo-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Aperçu des Ventes (7 jours)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Lun', ventes: 450000 }, { name: 'Mar', ventes: 320000 }, { name: 'Mer', ventes: 550000 },
                        { name: 'Jeu', ventes: 280000 }, { name: 'Ven', ventes: 700000 }, { name: 'Sam', ventes: 850000 },
                        { name: 'Dim', ventes: 400000 }
                      ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="ventes" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Dernières Commandes</h3>
                <div className="space-y-4">
                  {myOrders.length > 0 ? myOrders.slice(0, 3).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                       <div>
                         <p className="font-medium text-slate-900">{order.customerName}</p>
                         <p className="text-xs text-slate-500">{order.productName}</p>
                       </div>
                       <div className="text-right">
                         <p className="font-bold text-slate-900">{order.totalPrice.toLocaleString()} FCFA</p>
                         <OrderStatusBadge status={order.status} />
                       </div>
                    </div>
                  )) : (
                    <p className="text-slate-400 text-sm text-center py-4">Aucune commande pour le moment.</p>
                  )}
                </div>
                <button onClick={() => setActiveTab('orders')} className="w-full mt-4 text-sm text-indigo-600 font-medium hover:underline">
                  Voir toutes les commandes
                </button>
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-bold text-slate-900">Mon Catalogue</h2>
               <button 
                  onClick={handleNewProduct}
                  className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter un produit
                </button>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               {myProducts.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
                      <Plus className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Votre catalogue est vide</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                      C'est le moment de lancer votre activité ! Ajoutez vos produits pour qu'ils soient visibles instantanément par les acheteurs sur la plateforme.
                    </p>
                    <button 
                      onClick={handleNewProduct}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center mx-auto"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Créer mon premier produit
                    </button>
                  </div>
               ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Produit</th>
                      <th className="px-6 py-4">Prix</th>
                      <th className="px-6 py-4">Date Ajout</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 flex items-center">
                          <img src={product.imageUrl} className="w-10 h-10 rounded object-cover mr-3" alt="" />
                          <div>
                            <div className="font-medium text-slate-900">{product.name}</div>
                            <div className="text-xs text-slate-500">{product.category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">{product.price.toLocaleString()} FCFA</td>
                        <td className="px-6 py-4 text-slate-500">{new Date(product.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => onDeleteProduct(product.id)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               )}
             </div>
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Gestion des Commandes</h2>
            {myOrders.length === 0 ? (
               <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                   <Truck className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-medium text-slate-900">Aucune commande</h3>
                 <p className="text-slate-500">Vos commandes apparaîtront ici une fois que les clients achèteront vos produits.</p>
               </div>
            ) : (
            <div className="grid gap-4">
              {myOrders.map(order => (
                <div key={order.id} className={`bg-white p-6 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${order.status === OrderStatus.PENDING ? 'border-indigo-200 shadow-indigo-50 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs text-slate-400">#{order.id.slice(-6)}</span>
                      <OrderStatusBadge status={order.status} />
                      
                      {/* Badge Emporté/Sur place */}
                      {order.diningMode === 'SUR_PLACE' ? (
                         <span className="flex items-center text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200 font-bold">
                           <Utensils className="w-3 h-3 mr-1" />
                           SUR PLACE
                         </span>
                      ) : (
                         <span className="flex items-center text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded border border-purple-200 font-bold">
                           <ShoppingBag className="w-3 h-3 mr-1" />
                           À EMPORTER
                         </span>
                      )}

                      {order.paymentDetails?.method === 'MOBILE_MONEY' ? (
                         <span className="flex items-center text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                           <Smartphone className="w-3 h-3 mr-1" />
                           Payé via {order.paymentDetails.provider}
                         </span>
                      ) : (
                         <span className="flex items-center text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">
                           <Banknote className="w-3 h-3 mr-1" />
                           Paiement à la livraison
                         </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{order.customerName}</h3>
                    <p className="text-slate-600 text-sm">{order.productName} (x{order.quantity})</p>
                    <div className="mt-2 text-sm text-slate-500 space-y-1">
                      <p className="flex items-center font-medium text-slate-700">
                        <Phone className="w-3 h-3 mr-1" /> {order.customerContact || 'Non spécifié'}
                      </p>
                      <p className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> {order.shippingAddress}
                      </p>
                      <div className="flex gap-4 text-xs pt-1 border-t border-slate-100 mt-2">
                        <span>Produits: {(order.quantity * (order.totalPrice - (order.shippingFees || 0) - (order.serviceFees || 0)) / order.quantity).toLocaleString()} FCFA</span>
                        {order.serviceFees && <span>+ Service: {order.serviceFees} FCFA</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                       <p className="text-xs text-slate-500">Total à encaisser</p>
                       <span className="text-xl font-bold text-indigo-600">{order.totalPrice.toLocaleString()} FCFA</span>
                    </div>
                    
                    {/* Action Buttons based on status */}
                    <div className="flex gap-2">
                      {order.status === OrderStatus.PENDING && (
                        <>
                          <button 
                            onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CANCELLED)}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                          >
                            Refuser
                          </button>
                          <button 
                             onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CONFIRMED)}
                             className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-sm hover:shadow-emerald-200"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Valider Commande
                          </button>
                        </>
                      )}
                      {order.status === OrderStatus.CONFIRMED && (
                        <button 
                           onClick={() => onUpdateOrderStatus(order.id, OrderStatus.SHIPPED)}
                           className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center"
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          Marquer {order.diningMode === 'SUR_PLACE' ? 'Prêt' : 'Expédié'}
                        </button>
                      )}
                       {order.status === OrderStatus.SHIPPED && (
                        <button 
                           onClick={() => onUpdateOrderStatus(order.id, OrderStatus.DELIVERED)}
                           className="px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                        >
                          Confirmer {order.diningMode === 'SUR_PLACE' ? 'Service' : 'Livraison'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        );

      case 'finance':
         return (
           <div className="space-y-8">
             <h2 className="text-2xl font-bold text-slate-900">Finances & Paiements</h2>
             
             <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-lg">
               <p className="text-slate-400 mb-2">Solde Disponible</p>
               <div className="flex items-baseline gap-4">
                 <h3 className="text-4xl font-bold">{totalRevenue.toLocaleString()} FCFA</h3>
                 <span className="text-emerald-400 text-sm font-medium">+12% ce mois</span>
               </div>
               <div className="mt-8 flex gap-4">
                 <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                   Demander un virement
                 </button>
                 <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                   Télécharger factures
                 </button>
               </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="font-bold text-slate-900 mb-4">Historique des transactions</h3>
               <div className="space-y-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                     <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mr-3">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Paiement Commande #ORD-{100+i}</p>
                          <p className="text-xs text-slate-500">Il y a {i} jours</p>
                        </div>
                     </div>
                     <span className="font-bold text-emerald-600">+ {(150000 * i).toLocaleString()} FCFA</span>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         );

      case 'messages':
        return (
          <div className="h-[600px] bg-white rounded-xl shadow-sm border border-slate-200 flex overflow-hidden">
            <div className="w-1/3 border-r border-slate-200 bg-slate-50">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-700">Discussions</h3>
              </div>
              <div className="overflow-y-auto h-full">
                {['Alice Martin', 'Tech Solutions', 'Université Lyon'].map((name, i) => (
                  <div key={i} className={`p-4 cursor-pointer hover:bg-white transition-colors border-b border-slate-100 ${i === 0 ? 'bg-white border-l-4 border-l-indigo-500' : ''}`}>
                    <h4 className="font-medium text-slate-900">{name}</h4>
                    <p className="text-xs text-slate-500 mt-1 truncate">Bonjour, est-ce que le produit est disponible en...</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Alice Martin</h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">En ligne</span>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50">
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-lg rounded-tl-none max-w-[80%] text-sm shadow-sm">
                    Bonjour, je voudrais savoir si vous livrez en Belgique ?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white p-3 rounded-lg rounded-tr-none max-w-[80%] text-sm shadow-sm">
                    Bonjour Alice ! Oui, nous livrons partout en Europe sous 3 à 5 jours ouvrés.
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                  <input type="text" placeholder="Écrivez votre message..." className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm">Envoyer</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Paramètres & Vérification</h2>
            
            {/* Sound Test Button */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-lg font-bold text-slate-900">Test des Notifications</h3>
                   <p className="text-sm text-slate-500">Vérifiez que vous entendez bien l'alerte de commande.</p>
                 </div>
                 <button 
                   onClick={() => {
                     playNotificationSound();
                     triggerMobileAlert("Test de notification réussi !");
                   }}
                   className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                 >
                   <Play className="w-4 h-4 mr-2" />
                   Tester l'alerte
                 </button>
              </div>
            </div>

            {/* KYC Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Vérification d'identité (KYC)</h3>
                {kycStatus === 'verified' && <span className="flex items-center text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full"><CheckCircle className="w-4 h-4 mr-1" /> Vérifié</span>}
                {kycStatus === 'pending' && <span className="flex items-center text-yellow-600 font-bold text-sm bg-yellow-50 px-3 py-1 rounded-full"><Clock className="w-4 h-4 mr-1" /> En cours</span>}
                {kycStatus === 'unverified' && <span className="flex items-center text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded-full"><AlertCircle className="w-4 h-4 mr-1" /> Non vérifié</span>}
              </div>

              <p className="text-slate-600 mb-6 text-sm">
                Pour activer les retraits et augmenter votre visibilité, vous devez fournir les documents suivants : K-BIS de moins de 3 mois et une pièce d'identité du gérant.
              </p>

              {kycStatus === 'unverified' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                    <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">Glissez votre K-BIS ici ou cliquez pour parcourir</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG jusqu'à 5MB</p>
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                    <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">Pièce d'identité (Recto/Verso)</p>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => setKycStatus('pending')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      Soumettre pour validation
                    </button>
                  </div>
                </div>
              )}

              {kycStatus === 'pending' && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100">
                  Vos documents ont bien été reçus. Nos équipes les traitent généralement sous 24h.
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="text-lg font-bold text-slate-900 mb-4">Informations Entreprise</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'entreprise</label>
                   <input type="text" value={supplierName} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Email de contact</label>
                   <input type="text" value="contact@globaltech.com" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Description publique</label>
                   <textarea rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea>
                 </div>
               </div>
               <div className="mt-4 flex justify-end">
                 <button className="text-indigo-600 font-medium text-sm hover:underline">Sauvegarder les modifications</button>
               </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-slate-200 hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {supplierName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{supplierName}</p>
              <p className="text-xs text-emerald-600 flex items-center"><span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span> En ligne</p>
            </div>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'overview', icon: Package, label: 'Vue d\'ensemble' },
              { id: 'products', icon: ShoppingCart, label: 'Mes Produits' },
              { id: 'orders', icon: Truck, label: 'Commandes' },
              { id: 'messages', icon: MessageSquare, label: 'Messagerie' },
              { id: 'finance', icon: DollarSign, label: 'Finances' },
              { id: 'settings', icon: Settings, label: 'Paramètres & KYC' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as DashboardTab)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
                {item.id === 'orders' && pendingOrdersCount > 0 && (
                  <span className="ml-auto bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center justify-center min-w-[20px]">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {renderContent()}
      </div>

      {/* Add Product Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit (Service)'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmitProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du produit</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Service de livraison" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prix (FCFA)</label>
                    <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: 5000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                    <select 
                      value={category}
                      disabled
                      className="w-full border border-slate-300 bg-slate-50 text-slate-500 rounded-lg px-4 py-2 outline-none cursor-not-allowed"
                    >
                      <option value="Service">Service</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Seule la catégorie Service est disponible.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image du produit</label>
                     <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                            {isProcessingImage ? (
                               <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                                  <p className="text-sm text-slate-500">Traitement de l'image...</p>
                               </div>
                            ) : selectedImage ? (
                              <div className="relative w-full h-full overflow-hidden rounded-lg">
                                <img src={selectedImage} alt="Aperçu" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <p className="text-white font-bold text-sm">Changer l'image</p>
                                </div>
                              </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Cliquez pour uploader</span></p>
                                    <p className="text-xs text-slate-500">PNG, JPG (Max. 800x800px)</p>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                    </div> 
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Décrivez votre service en détail..." />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">
                    Annuler
                  </button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center">
                    {editingProduct ? (
                       <>
                         <Pencil className="w-5 h-5 mr-2" />
                         Mettre à jour
                       </>
                    ) : (
                       <>
                         <Plus className="w-5 h-5 mr-2" />
                         Publier le Produit
                       </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
