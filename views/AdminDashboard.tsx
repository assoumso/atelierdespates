
import React, { useState, useEffect, useRef } from 'react';
import { Product, Supplier, Order, OrderStatus, AppSettings, InventoryItem } from '../types';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, Users, ShoppingBag, FileText, TrendingUp, CheckCircle, 
  AlertTriangle, Trash2, Megaphone, Search, ShieldCheck, Plus, X, Image as ImageIcon, Pencil, Utensils, Truck, Volume2, Bell, UserPlus, Phone, MapPin, Lock, Settings, Save, Package, AlertOctagon, VolumeX, Menu, PlayCircle
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  suppliers: Supplier[];
  orders: Order[];
  inventory?: InventoryItem[];
  appSettings: AppSettings;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onTogglePromotion: (id: string) => void;
  onToggleVerification: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAddUser: (userData: any) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onAddInventoryItem?: (item: InventoryItem) => void;
  onUpdateInventoryItem?: (item: InventoryItem) => void;
  onDeleteInventoryItem?: (id: string) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type AdminTab = 'overview' | 'users' | 'menu' | 'orders' | 'transactions' | 'settings' | 'inventory';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, 
  suppliers, 
  orders, 
  inventory = [],
  appSettings,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onTogglePromotion,
  onToggleVerification,
  onUpdateOrderStatus,
  onAddUser,
  onUpdateSettings,
  onAddInventoryItem,
  onUpdateInventoryItem,
  onDeleteInventoryItem
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Notification State ---
  const prevOrderCountRef = useRef(orders.length);
  const isFirstRender = useRef(true);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [alertLevel, setAlertLevel] = useState<'info' | 'warning' | 'critical'>('info');
  
  // --- AUDIO STATE ---
  // Modification: Activé par défaut sauf si explicitement désactivé ('false')
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('admin_sound_enabled');
    return saved !== 'false'; 
  });
  
  // Référence persistante pour le contexte audio (Mobile Fix)
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- Form States for Menu Management ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('Alimentation');
  const [productDescription, setProductDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- Form State for Inventory Management ---
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [invName, setInvName] = useState('');
  const [invQuantity, setInvQuantity] = useState('');
  const [invUnit, setInvUnit] = useState('');
  const [invThreshold, setInvThreshold] = useState('');

  // --- Form State for User Creation ---
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '', // Utilisé comme login
    password: '',
    role: 'SUPPLIER',
    phone: '',
    address: ''
  });

  // --- State for Settings ---
  const [settingsForm, setSettingsForm] = useState<AppSettings>(appSettings);

  useEffect(() => {
      setSettingsForm(appSettings);
  }, [appSettings]);

  // --- STATISTICS CALCULATION ---
  const totalRevenue = orders
    .filter(o => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.PENDING)
    .reduce((sum, o) => sum + o.totalPrice, 0);
  
  const totalOrders = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === OrderStatus.PENDING).length;
  
  const lowStockItems = inventory.filter(item => item.quantity <= item.threshold);
  
  const avgSatisfaction = (suppliers.length > 0 ? (suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length) : 5).toFixed(1);
  
  // Data for Charts
  const salesData = [
    { name: 'Lun', ventes: 120000 }, { name: 'Mar', ventes: 150000 },
    { name: 'Mer', ventes: 180000 }, { name: 'Jeu', ventes: 140000 },
    { name: 'Ven', ventes: 250000 }, { name: 'Sam', ventes: 300000 },
    { name: 'Dim', ventes: 200000 }
  ];

  const popularProductsData = products
    .map(p => ({
      name: p.name.substring(0, 15) + '...',
      sales: orders.filter(o => o.productId === p.id).reduce((sum, o) => sum + o.quantity, 0)
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.date - a.date);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- AUDIO LOGIC ---
  
  // Fonction pour initialiser/réveiller le contexte audio (Doit être appelé sur un événement utilisateur)
  const unlockAudioContext = () => {
      if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
              audioContextRef.current = new AudioContext();
          }
      }

      // Tenter de reprendre si suspendu (cas fréquent sur mobile)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
              console.log("AudioContext resumed successfully");
          }).catch(e => console.error("Failed to resume AudioContext", e));
      }
  };

  const enableAudio = () => {
    unlockAudioContext(); // Important : Initialise le contexte
    playNotificationSound('order'); // Test immédiat
    setIsAudioEnabled(true);
    localStorage.setItem('admin_sound_enabled', 'true'); 
    setLastNotification("Son activé !");
    setTimeout(() => setLastNotification(null), 2000);
  };

  const disableAudio = () => {
    setIsAudioEnabled(false);
    localStorage.setItem('admin_sound_enabled', 'false');
  };

  const playNotificationSound = (type: 'order' | 'alert' = 'order') => {
    if (!isAudioEnabled) return;

    try {
      // Assurer que le contexte existe
      if (!audioContextRef.current) {
         const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
         if (AudioContext) {
             audioContextRef.current = new AudioContext();
         }
      }

      const ctx = audioContextRef.current;
      if (!ctx) return;

      // Force resume si suspendu (re-tentative auto)
      if (ctx.state === 'suspended') {
          ctx.resume().catch(e => console.error("Auto-resume failed:", e));
      }

      startOscillator(ctx, type);
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  const startOscillator = (ctx: AudioContext, type: 'order' | 'alert') => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'alert') {
         // Alarme stridente pour stock bas
         osc.type = 'sawtooth';
         osc.frequency.setValueAtTime(800, now);
         osc.frequency.linearRampToValueAtTime(600, now + 0.1);
         osc.frequency.linearRampToValueAtTime(800, now + 0.2);
         osc.frequency.linearRampToValueAtTime(600, now + 0.3);
         gain.gain.setValueAtTime(0.2, now);
         gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
         
         osc.start(now);
         osc.stop(now + 0.5);
      } else {
         // Sonnette "Ding Dong" pour commande
         osc.type = 'sine';
         
         // Premier Ton (Ding)
         osc.frequency.setValueAtTime(659.25, now); 
         gain.gain.setValueAtTime(0, now);
         gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
         gain.gain.exponentialRampToValueAtTime(0.1, now + 0.6);

         // Deuxième Ton (Dong)
         setTimeout(() => {
             const osc2 = ctx.createOscillator();
             const gain2 = ctx.createGain();
             osc2.connect(gain2);
             gain2.connect(ctx.destination);
             
             osc2.type = 'sine';
             osc2.frequency.setValueAtTime(523.25, now + 0.8);
             gain2.gain.setValueAtTime(0, now + 0.8);
             gain2.gain.linearRampToValueAtTime(0.5, now + 0.85);
             gain2.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
             
             osc2.start(now + 0.8);
             osc2.stop(now + 3.0);
         }, 600);

         osc.start(now);
         osc.stop(now + 0.8);
      }
  };

  // Order Notification
  useEffect(() => {
    if (isFirstRender.current) {
      prevOrderCountRef.current = orders.length;
      isFirstRender.current = false;
      return;
    }

    // Détecter une NOUVELLE commande
    if (orders.length > prevOrderCountRef.current) {
      const newOrder = orders[0];
      
      console.log("Nouvelle commande détectée !");
      playNotificationSound('order');
      
      setAlertLevel('info');
      setLastNotification(`NOUVELLE COMMANDE : ${newOrder?.totalPrice?.toLocaleString() || '...'} FCFA`);
    }
    prevOrderCountRef.current = orders.length;
  }, [orders.length]); 

  // Stock Alert Notification
  useEffect(() => {
     const criticalItems = inventory.filter(item => item.quantity <= item.threshold);
     if (criticalItems.length > 0) {
         const message = `ALERTE STOCK: ${criticalItems.length} produit(s) en rupture ou seuil critique !`;
         if (lastNotification !== message) {
             playNotificationSound('alert');
             setAlertLevel('critical');
             setLastNotification(message);
             setTimeout(() => setLastNotification(null), 8000);
         }
     }
  }, [inventory]);


  // --- HANDLERS (unchanged) ---

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductCategory(product.category);
    setProductDescription(product.description);
    setSelectedImage(product.imageUrl);
    setIsFormOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setProductName('');
    setProductPrice('');
    setProductCategory('Alimentation');
    setProductDescription('');
    setSelectedImage(null);
    setIsFormOpen(true);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        name: productName,
        price: parseFloat(productPrice),
        category: productCategory,
        description: productDescription,
        imageUrl: selectedImage || editingProduct.imageUrl,
      };
      onUpdateProduct(updatedProduct);
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        name: productName,
        price: parseFloat(productPrice),
        category: productCategory,
        description: productDescription,
        supplierId: 'admin-atelier', 
        supplierName: 'Atelier des pates',
        imageUrl: selectedImage || defaultImage,
        tags: ['menu', 'plat'], 
        createdAt: Date.now(),
        isPromoted: false
      };
      onAddProduct(newProduct);
    }
    setIsFormOpen(false);
  };

  // --- Inventory Handlers ---
  const handleNewInventoryItem = () => {
      setEditingInventoryItem(null);
      setInvName('');
      setInvQuantity('');
      setInvUnit('kg');
      setInvThreshold('5');
      setIsInventoryFormOpen(true);
  };

  const handleEditInventoryItem = (item: InventoryItem) => {
      setEditingInventoryItem(item);
      setInvName(item.name);
      setInvQuantity(item.quantity.toString());
      setInvUnit(item.unit);
      setInvThreshold(item.threshold.toString());
      setIsInventoryFormOpen(true);
  };

  const handleSubmitInventory = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onAddInventoryItem || !onUpdateInventoryItem) return;

      const itemData: InventoryItem = {
          id: editingInventoryItem ? editingInventoryItem.id : `inv-${Date.now()}`,
          name: invName,
          quantity: Number(invQuantity),
          unit: invUnit,
          threshold: Number(invThreshold),
          updatedAt: Date.now()
      };

      if (editingInventoryItem) {
          onUpdateInventoryItem(itemData);
      } else {
          onAddInventoryItem(itemData);
      }
      setIsInventoryFormOpen(false);
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser(newUser);
    setIsUserFormOpen(false);
    setNewUser({ name: '', email: '', password: '', role: 'SUPPLIER', phone: '', address: '' });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateSettings(settingsForm);
  };

  const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
    const styles = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [OrderStatus.SHIPPED]: 'bg-indigo-100 text-indigo-800',
      [OrderStatus.DELIVERED]: 'bg-emerald-100 text-emerald-800',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Notification Banner */}
            {lastNotification && (
              <div className={`text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between animate-bounce sticky top-0 z-50 ${alertLevel === 'critical' ? 'bg-red-600' : 'bg-indigo-600'}`}>
                <div className="flex items-center">
                  {alertLevel === 'critical' ? <AlertTriangle className="w-6 h-6 mr-3 animate-pulse" /> : <Bell className="w-6 h-6 mr-3 animate-pulse" />}
                  <span className="font-bold">{lastNotification}</span>
                </div>
                <button onClick={() => setLastNotification(null)}><X className="w-5 h-5" /></button>
              </div>
            )}

            {/* Stock Alert Card */}
            {lowStockItems.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between animate-pulse">
                 <div className="flex items-center text-red-800">
                    <AlertOctagon className="w-6 h-6 mr-3" />
                    <div>
                       <h4 className="font-bold">Attention : Stocks Critiques</h4>
                       <p className="text-sm">{lowStockItems.length} matières premières sont en rupture ou en quantité faible.</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setActiveTab('inventory')}
                   className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                 >
                   Gérer les stocks
                 </button>
              </div>
            )}

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+12.5%</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{totalRevenue.toLocaleString()} FCFA</h3>
                <p className="text-sm text-slate-500">Chiffre d'Affaires</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+5.2%</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{totalOrders}</h3>
                <p className="text-sm text-slate-500">Commandes Totales</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
                      <Truck className="w-6 h-6" />
                    </div>
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900">{pendingOrdersCount}</h3>
                 <p className="text-sm text-slate-500">Commandes en attente</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{avgSatisfaction}/5.0</h3>
                <p className="text-sm text-slate-500">Note Moyenne</p>
              </div>
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Rapport des Ventes (7 jours)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="ventes" stroke="#6366f1" fillOpacity={1} fill="url(#colorVentes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Plats les plus populaires</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularProductsData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                 <input 
                    type="text" 
                    placeholder="Chercher une commande (ID, client)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                 />
               </div>
               <div className="flex items-center gap-2">
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                    {pendingOrdersCount} En attente
                  </div>
               </div>
             </div>

             <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <p className="text-slate-500">Aucune commande trouvée.</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div key={order.id} className={`bg-white p-6 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${order.status === OrderStatus.PENDING ? 'border-indigo-200 shadow-indigo-50 ring-1 ring-indigo-100' : 'border-slate-200'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs text-slate-400">#{order.id.slice(-6)}</span>
                        <OrderStatusBadge status={order.status} />
                        {order.diningMode === 'SUR_PLACE' ? (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200 font-bold">SUR PLACE</span>
                        ) : (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded border border-purple-200 font-bold">EMPORTÉ</span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg">{order.customerName}</h3>
                      <p className="text-slate-600 text-sm">{order.productName} (x{order.quantity})</p>
                      <div className="mt-2 text-sm text-slate-500 flex gap-4">
                         <span className="flex items-center"><Phone className="w-3 h-3 mr-1"/> {order.customerContact}</span>
                         <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> {order.shippingAddress}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                         <span className="text-xl font-bold text-indigo-600">{order.totalPrice.toLocaleString()} FCFA</span>
                         <p className="text-xs text-slate-400">{new Date(order.date).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        {order.status === OrderStatus.PENDING && (
                          <>
                            <button 
                              onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CANCELLED)}
                              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                            >
                              Annuler
                            </button>
                            <button 
                               onClick={() => onUpdateOrderStatus(order.id, OrderStatus.CONFIRMED)}
                               className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Valider
                            </button>
                          </>
                        )}
                        {order.status === OrderStatus.CONFIRMED && (
                          <button 
                             onClick={() => onUpdateOrderStatus(order.id, OrderStatus.SHIPPED)}
                             className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center"
                          >
                            <Truck className="w-4 h-4 mr-1" />
                            {order.diningMode === 'SUR_PLACE' ? 'Prêt à servir' : 'Expédier'}
                          </button>
                        )}
                         {order.status === OrderStatus.SHIPPED && (
                          <button 
                             onClick={() => onUpdateOrderStatus(order.id, OrderStatus.DELIVERED)}
                             className="px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                          >
                            Terminer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
             </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                 <input 
                    type="text" 
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                 />
               </div>
               <button 
                  onClick={() => setIsUserFormOpen(true)}
                  className="ml-4 flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
               >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Créer un utilisateur
               </button>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                   <tr>
                     <th className="px-6 py-4">Nom</th>
                     <th className="px-6 py-4">Login/Email</th>
                     <th className="px-6 py-4">Rôle</th>
                     <th className="px-6 py-4">Statut</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredSuppliers.map(supplier => (
                     <tr key={supplier.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4 font-medium text-slate-900">{supplier.name}</td>
                       <td className="px-6 py-4">{supplier.email}</td>
                       <td className="px-6 py-4">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                           Fournisseur
                         </span>
                       </td>
                       <td className="px-6 py-4">
                         {supplier.verified ? (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                             <ShieldCheck className="w-3 h-3 mr-1" />
                             Actif
                           </span>
                         ) : (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                             En attente
                           </span>
                         )}
                       </td>
                       <td className="px-6 py-4 text-right space-x-2">
                         <button onClick={() => onToggleVerification(supplier.id)} className="text-indigo-600 hover:underline text-xs font-bold">
                           {supplier.verified ? 'Désactiver' : 'Activer'}
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );

      case 'inventory':
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Rechercher une matière première..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button 
                        onClick={handleNewInventoryItem}
                        className="ml-4 flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Ajouter Matière Première
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Matière Première</th>
                                <th className="px-6 py-4 text-center">Quantité Restante</th>
                                <th className="px-6 py-4 text-center">Seuil d'Alerte</th>
                                <th className="px-6 py-4 text-center">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Aucun stock enregistré. Commencez par ajouter des matières premières.</td>
                                </tr>
                            ) : (
                                filteredInventory.map(item => {
                                    const isLow = item.quantity <= item.threshold;
                                    return (
                                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-red-50/50' : ''}`}>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold">
                                                {item.quantity} <span className="text-slate-500 font-normal text-xs">{item.unit}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-slate-500">
                                                {item.threshold} {item.unit}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isLow ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
                                                        <AlertTriangle className="w-3 h-3 mr-1" /> Rupture / Bas
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> OK
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditInventoryItem(item)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => onDeleteInventoryItem && onDeleteInventoryItem(item.id)}
                                                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );

      case 'menu':
        return (
          <div className="space-y-6">
             <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                 <input 
                    type="text" 
                    placeholder="Rechercher un plat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                 />
               </div>
               <button 
                  onClick={handleNewProduct}
                  className="ml-4 flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
               >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter un plat
               </button>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                   <tr>
                     <th className="px-6 py-4">Plat</th>
                     <th className="px-6 py-4">Catégorie</th>
                     <th className="px-6 py-4">Prix</th>
                     <th className="px-6 py-4 text-center">Mis en Avant</th>
                     <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredProducts.map(product => (
                     <tr key={product.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4">
                         <div className="flex items-center">
                           <img src={product.imageUrl} className="w-10 h-10 rounded object-cover mr-3" alt="" />
                           <div>
                             <span className="font-medium text-slate-900 block">{product.name}</span>
                             <span className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">{product.description}</span>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-slate-500">{product.category}</td>
                       <td className="px-6 py-4 font-medium">{product.price.toLocaleString()} FCFA</td>
                       <td className="px-6 py-4 text-center">
                         <button 
                            onClick={() => onTogglePromotion(product.id)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${product.isPromoted ? 'bg-indigo-600' : 'bg-slate-200'}`}
                         >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${product.isPromoted ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                           <button onClick={() => handleEditProduct(product)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"><Pencil className="w-4 h-4" /></button>
                           <button onClick={() => onDeleteProduct(product.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-6">
             <h3 className="text-lg font-bold text-slate-900">Chronologie des Transactions</h3>
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Montant</th>
                        <th className="px-6 py-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.sort((a,b) => b.date - a.date).map(order => (
                        <tr key={order.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">#{order.id}</td>
                          <td className="px-6 py-4 text-slate-600">{new Date(order.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{order.totalPrice.toLocaleString()} FCFA</td>
                          <td className="px-6 py-4"><OrderStatusBadge status={order.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        );
      
      case 'settings':
        return (
           <div className="space-y-6 max-w-4xl">
              <h3 className="text-lg font-bold text-slate-900">Paramètres Généraux</h3>
              
              {/* SECTION AUDIO / NOTIFICATIONS (AJOUTÉE) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                    <Volume2 className="w-5 h-5 mr-2 text-indigo-600" /> Notifications & Sonore
                 </h4>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                       <p className="font-bold text-slate-900">Alertes Sonores</p>
                       <p className="text-sm text-slate-600">
                         Jouer un son lors d'une nouvelle commande ou d'une rupture de stock.
                       </p>
                       {!isAudioEnabled && (
                         <p className="text-xs text-orange-600 mt-1 font-bold">
                           Le son est actuellement désactivé.
                         </p>
                       )}
                    </div>
                    <div className="flex items-center gap-4">
                       {/* BOUTON TEST / UNLOCK POUR MOBILE */}
                       <button 
                         type="button"
                         onClick={enableAudio}
                         className="flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-200 transition-colors"
                         title="Cliquez ici si vous n'entendez pas de son sur mobile"
                       >
                         <PlayCircle className="w-4 h-4 mr-1" />
                         Tester / Débloquer Audio
                       </button>

                       <button 
                          type="button"
                          onClick={() => isAudioEnabled ? disableAudio() : enableAudio()}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isAudioEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                       >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAudioEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                       </button>
                    </div>
                 </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                 
                 {/* Identité */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                       <LayoutDashboard className="w-5 h-5 mr-2 text-indigo-600" /> Identité de l'application
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'application</label>
                          <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={settingsForm.appName} onChange={(e) => setSettingsForm({...settingsForm, appName: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Devise Principale</label>
                          <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={settingsForm.currency} onChange={(e) => setSettingsForm({...settingsForm, currency: e.target.value})} />
                       </div>
                       <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Slogan / Message d'accueil</label>
                          <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={settingsForm.slogan} onChange={(e) => setSettingsForm({...settingsForm, slogan: e.target.value})} />
                       </div>
                    </div>
                 </div>

                 {/* Contact */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                       <Phone className="w-5 h-5 mr-2 text-indigo-600" /> Informations de Contact
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email Contact</label>
                          <input type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={settingsForm.contactEmail} onChange={(e) => setSettingsForm({...settingsForm, contactEmail: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone Contact</label>
                          <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={settingsForm.contactPhone} onChange={(e) => setSettingsForm({...settingsForm, contactPhone: e.target.value})} />
                       </div>
                       <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Adresse Physique</label>
                          <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={settingsForm.contactAddress} onChange={(e) => setSettingsForm({...settingsForm, contactAddress: e.target.value})} />
                       </div>
                    </div>
                 </div>

                 {/* Finances */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center">
                       <Truck className="w-5 h-5 mr-2 text-indigo-600" /> Frais & Livraisons
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Frais de Livraison (Par défaut)</label>
                          <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={settingsForm.defaultShippingFees} onChange={(e) => setSettingsForm({...settingsForm, defaultShippingFees: Number(e.target.value)})} />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Frais de Service</label>
                          <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2" value={settingsForm.serviceFees} onChange={(e) => setSettingsForm({...settingsForm, serviceFees: Number(e.target.value)})} />
                       </div>
                    </div>
                 </div>

                 {/* Maintenance */}
                 <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200">
                    <h4 className="font-bold text-red-800 mb-4 flex items-center">
                       <AlertTriangle className="w-5 h-5 mr-2" /> Zone de Danger
                    </h4>
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="font-bold text-slate-900">Mode Maintenance</p>
                          <p className="text-sm text-slate-600">Si activé, seuls les administrateurs pourront accéder à l'application.</p>
                       </div>
                       <button 
                          type="button"
                          onClick={() => setSettingsForm({...settingsForm, isMaintenanceMode: !settingsForm.isMaintenanceMode})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settingsForm.isMaintenanceMode ? 'bg-red-600' : 'bg-slate-300'}`}
                       >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settingsForm.isMaintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                       </button>
                    </div>
                 </div>

                 <div className="flex justify-end pt-4">
                    <button type="submit" className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-200 transition-all">
                       <Save className="w-5 h-5 mr-2" />
                       Enregistrer les modifications
                    </button>
                 </div>
              </form>
           </div>
        );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
       {/* Sidebar Desktop */}
       <div className="w-64 bg-slate-900 text-white hidden md:block sticky top-16 h-[calc(100vh-64px)] overflow-y-auto z-20">
         <div className="p-6">
           <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
               <LayoutDashboard className="w-6 h-6 text-white" />
             </div>
             <div>
               <h2 className="font-bold">ADMIN</h2>
               <p className="text-xs text-slate-400">{appSettings.appName}</p>
             </div>
           </div>
           
           <nav className="space-y-2">
             {[
               { id: 'overview', label: 'Rapports & Stats', icon: FileText },
               { id: 'orders', label: 'Commandes', icon: Truck, badge: pendingOrdersCount },
               { id: 'menu', label: 'Gestion du Menu', icon: Utensils },
               { id: 'inventory', label: 'Stocks & Inventaire', icon: Package, badge: lowStockItems.length, alert: lowStockItems.length > 0 },
               { id: 'users', label: 'Utilisateurs', icon: Users },
               { id: 'transactions', label: 'Transactions', icon: LayoutDashboard },
               { id: 'settings', label: 'Paramètres', icon: Settings },
             ].map((item: any) => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id as AdminTab)}
                 className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                   activeTab === item.id 
                     ? 'bg-indigo-600 text-white' 
                     : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                 }`}
               >
                 <item.icon className={`w-5 h-5 mr-3 ${item.alert ? 'text-red-500 animate-pulse' : ''}`} />
                 {item.label}
                 {item.badge > 0 && (
                    <span className={`ml-auto text-white text-xs px-2 py-0.5 rounded-full ${item.alert ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`}>
                      {item.badge}
                    </span>
                 )}
               </button>
             ))}
           </nav>
         </div>
       </div>

       {/* Mobile Sidebar Overlay */}
       {isMobileMenuOpen && (
         <div className="fixed inset-0 z-[100] flex md:hidden">
           {/* Backdrop */}
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
           
           {/* Sidebar Content */}
           <div className="relative bg-slate-900 w-72 h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-left duration-300">
             <div className="p-6">
               <div className="flex items-center justify-between mb-8 text-white">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                     <LayoutDashboard className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <h2 className="font-bold">ADMIN</h2>
                     <p className="text-xs text-slate-400">{appSettings.appName}</p>
                   </div>
                 </div>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                   <X className="w-6 h-6" />
                 </button>
               </div>
               
               <nav className="space-y-2">
                 {[
                   { id: 'overview', label: 'Rapports & Stats', icon: FileText },
                   { id: 'orders', label: 'Commandes', icon: Truck, badge: pendingOrdersCount },
                   { id: 'menu', label: 'Gestion du Menu', icon: Utensils },
                   { id: 'inventory', label: 'Stocks & Inventaire', icon: Package, badge: lowStockItems.length, alert: lowStockItems.length > 0 },
                   { id: 'users', label: 'Utilisateurs', icon: Users },
                   { id: 'transactions', label: 'Transactions', icon: LayoutDashboard },
                   { id: 'settings', label: 'Paramètres', icon: Settings },
                 ].map((item: any) => (
                   <button
                     key={item.id}
                     onClick={() => {
                       setActiveTab(item.id as AdminTab);
                       setIsMobileMenuOpen(false);
                     }}
                     className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                       activeTab === item.id 
                         ? 'bg-indigo-600 text-white' 
                         : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                     }`}
                   >
                     <item.icon className={`w-5 h-5 mr-3 ${item.alert ? 'text-red-500 animate-pulse' : ''}`} />
                     {item.label}
                     {item.badge > 0 && (
                        <span className={`ml-auto text-white text-xs px-2 py-0.5 rounded-full ${item.alert ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`}>
                          {item.badge}
                        </span>
                     )}
                   </button>
                 ))}
               </nav>
             </div>
           </div>
         </div>
       )}

       {/* Main Content */}
       <div className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)]">
         {/* Mobile Header with Toggle */}
         <div className="md:hidden flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 sticky top-0 z-10">
             <div className="flex items-center gap-2">
               <h1 className="font-bold text-lg text-slate-900">
                 {activeTab === 'overview' && 'Rapports'}
                 {activeTab === 'orders' && 'Commandes'}
                 {activeTab === 'users' && 'Utilisateurs'}
                 {activeTab === 'menu' && 'Menu'}
                 {activeTab === 'inventory' && 'Stocks'}
                 {activeTab === 'transactions' && 'Transactions'}
                 {activeTab === 'settings' && 'Paramètres'}
               </h1>
             </div>
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200"
             >
               <Menu className="w-6 h-6" />
             </button>
         </div>

         <div className="hidden md:flex mb-8 justify-between items-center">
           <h1 className="text-2xl font-bold text-slate-900">
             {activeTab === 'overview' && 'Rapports & Statistiques'}
             {activeTab === 'orders' && 'Gestion des Commandes'}
             {activeTab === 'users' && 'Gestion des Utilisateurs'}
             {activeTab === 'menu' && 'Gestion du Menu du Jour'}
             {activeTab === 'inventory' && 'Stocks & Matières Premières'}
             {activeTab === 'transactions' && 'Historique des Transactions'}
             {activeTab === 'settings' && 'Configuration Générale'}
           </h1>
         </div>
         {renderContent()}
       </div>

       {/* ADD/EDIT MENU ITEM MODAL */}
       {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                {editingProduct ? 'Modifier le Plat' : 'Ajouter un Nouveau Plat'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmitProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du plat</label>
                    <input required type="text" value={productName} onChange={e => setProductName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prix (FCFA)</label>
                    <input required type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                    <select 
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Alimentation">Alimentation</option>
                      <option value="Boissons">Boissons</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Pates">Pates</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
                     <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                            {selectedImage ? (
                              <div className="relative w-full h-full overflow-hidden rounded-lg">
                                <img src={selectedImage} alt="Aperçu" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="mb-2 text-sm text-slate-500">Uploader une image</p>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                    </div> 
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea required rows={4} value={productDescription} onChange={e => setProductDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">Annuler</button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all">
                    {editingProduct ? 'Mettre à jour' : 'Ajouter au Menu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT INVENTORY ITEM MODAL */}
      {isInventoryFormOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-900">
                          {editingInventoryItem ? 'Modifier le Stock' : 'Ajouter Matière Première'}
                      </h3>
                      <button onClick={() => setIsInventoryFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  <div className="p-6">
                      <form onSubmit={handleSubmitInventory} className="space-y-6">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la matière</label>
                              <input required type="text" value={invName} onChange={e => setInvName(e.target.value)} placeholder="Ex: Spaguetti, Oeufs..." className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantité Actuelle</label>
                                  <input required type="number" value={invQuantity} onChange={e => setInvQuantity(e.target.value)} placeholder="Ex: 50" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">Unité</label>
                                  <input required type="text" value={invUnit} onChange={e => setInvUnit(e.target.value)} placeholder="Ex: kg, plateaux" className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Seuil d'Alerte Critique</label>
                              <div className="relative">
                                 <AlertOctagon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                 <input required type="number" value={invThreshold} onChange={e => setInvThreshold(e.target.value)} placeholder="Ex: 5" className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 focus:ring-indigo-500" />
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Vous recevrez une alerte quand le stock passera sous ce nombre.</p>
                          </div>

                          <div className="flex gap-3 pt-4">
                              <button type="button" onClick={() => setIsInventoryFormOpen(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors">Annuler</button>
                              <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all">
                                  {editingInventoryItem ? 'Mettre à jour Stock' : 'Ajouter au Stock'}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* ADD USER MODAL */}
      {isUserFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-xl font-bold text-slate-900">Créer un utilisateur</h3>
               <button onClick={() => setIsUserFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
             </div>
             <form onSubmit={handleSubmitUser} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Nom Complet</label>
                 <div className="relative">
                    <UserPlus className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input required type="text" placeholder="Ex: Cuisinier Chef" className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 focus:ring-indigo-500" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Login / Email</label>
                 <div className="relative">
                    <UserPlus className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input required type="text" placeholder="Ex: chef" className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 focus:ring-indigo-500" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input required type="password" placeholder="••••••" className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 focus:ring-indigo-500" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Rôle</label>
                 <select className="w-full border border-slate-300 rounded-lg px-3 py-2" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                   <option value="SUPPLIER">Cuisinier / Fournisseur</option>
                   <option value="ADMIN">Administrateur</option>
                   <option value="CLIENT">Client</option>
                 </select>
               </div>
               <div className="pt-4">
                 <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl">Créer le compte</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
