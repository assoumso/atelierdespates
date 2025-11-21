
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingView } from './views/LandingView';
import { ClientMarketplace } from './views/ClientMarketplace';
import { SupplierDashboard } from './views/SupplierDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { SupplierRegistration } from './views/SupplierRegistration';
import { SupplierLogin } from './views/SupplierLogin'; 
import { AdminLogin } from './views/AdminLogin'; 
import { Product, UserRole, ViewState, Order, OrderStatus, Supplier, DiningMode, AppSettings, InventoryItem } from './types';
import { db, auth } from './services/firebase';
import { signInAnonymously } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  setDoc,
  getDoc
} from 'firebase/firestore';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.GUEST);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LANDING);
  
  // État des données
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  // Paramètres par défaut
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'Atelier des pates',
    slogan: 'Bienvenue à ATELIER DES PATES ! Ça nous fait plaisir de vous voir, qu’est-ce qui vous tente ?',
    contactEmail: 'contact@atelierdespates.ci',
    contactPhone: '+225 07 00 00 00 00',
    contactAddress: 'Abidjan, Côte d\'Ivoire',
    currency: 'FCFA',
    defaultShippingFees: 0,
    serviceFees: 0,
    isMaintenanceMode: false
  });

  // État utilisateur et système
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // État du mode de consommation (Emporté vs Sur Place)
  const [diningMode, setDiningMode] = useState<DiningMode>('EMPORTE');
  
  // --- FIREBASE AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        console.log("Authentification Firebase réussie");
      } catch (error: any) {
        if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
             // Silently ignore
        } else {
             console.warn("Avertissement Auth Firebase:", error.message);
        }
      } finally {
        setIsAuthReady(true);
      }
    };
    initAuth();
  }, []);

  // --- ADMIN PORTAL ACCESS (URL DETECTION) ---
  useEffect(() => {
    const checkAdminAccess = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal') === 'admin') {
        console.log("Portail administrateur demandé : Redirection vers login");
        setCurrentView(ViewState.ADMIN_LOGIN);
      }
    };
    checkAdminAccess();
  }, []);

  // --- DATA LOADING (REAL TIME ONLY) ---
  useEffect(() => {
    if (!isAuthReady) return;

    setIsLoading(true);

    let unsubscribeProducts: () => void;
    let unsubscribeSuppliers: () => void;
    let unsubscribeOrders: () => void;
    let unsubscribeSettings: () => void;
    let unsubscribeInventory: () => void;

    try {
        // 0. Settings (Single Doc)
        unsubscribeSettings = onSnapshot(doc(db, 'Settings', 'general'), (docSnap) => {
          if (docSnap.exists()) {
            setAppSettings(docSnap.data() as AppSettings);
          } else {
            // Create default settings if not exist
            setDoc(doc(db, 'Settings', 'general'), appSettings).catch(err => console.log("Info: Création settings par défaut"));
          }
        });

        // 1. Produits
        const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          setProducts(productsData);
          setIsLoading(false);
        }, (error) => {
          console.error("Erreur lecture Produits (Vérifiez les règles Firestore):", error.code);
          setIsLoading(false);
        });

        // 2. Fournisseurs
        unsubscribeSuppliers = onSnapshot(collection(db, 'Fournisseurs'), (snapshot) => {
          const suppliersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Supplier[];
          setSuppliers(suppliersData);
        }, (error) => {
          console.log("Info lecture Fournisseurs:", error.code);
        });

        // 3. Commandes
        const qOrders = query(collection(db, 'Commandes'), orderBy('date', 'desc'));
        unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Order[];
          setOrders(ordersData);
        }, (error) => {
           console.log("Info lecture Commandes:", error.code);
        });

        // 4. Inventaire (Stocks)
        const qInventory = query(collection(db, 'Inventory'), orderBy('name', 'asc'));
        unsubscribeInventory = onSnapshot(qInventory, (snapshot) => {
          const inventoryData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as InventoryItem[];
          setInventory(inventoryData);
        }, (error) => {
           console.log("Info lecture Inventaire:", error.code);
        });

    } catch (err) {
        console.error("Erreur critique d'initialisation:", err);
        setIsLoading(false);
    }

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeSuppliers) unsubscribeSuppliers();
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeInventory) unsubscribeInventory();
    };
  }, [isAuthReady]);

  // Handlers
  const handleLogin = (role: UserRole) => {
    switch (role) {
      case UserRole.CLIENT:
        setUserRole(UserRole.CLIENT);
        setCurrentView(ViewState.MARKETPLACE);
        break;
      case UserRole.SUPPLIER:
        setCurrentView(ViewState.SUPPLIER_LOGIN);
        break;
      case UserRole.ADMIN:
        setCurrentView(ViewState.ADMIN_LOGIN);
        break;
      default:
        setUserRole(UserRole.GUEST);
        setCurrentView(ViewState.LANDING);
    }
  };

  const handleClientAccess = (mode: DiningMode) => {
    setDiningMode(mode);
    handleLogin(UserRole.CLIENT);
  };

  const handleAdminLogin = (username: string, password: string) => {
     if (username === 'admin' && password === 'admin123') {
        setUserRole(UserRole.ADMIN);
        setCurrentView(ViewState.ADMIN_DASHBOARD);
     } else {
        alert("Identifiants incorrects. (Essayer: admin / admin123)");
     }
  };

  const handleSupplierLogin = (loginInput: string, password: string) => {
    const supplier = suppliers.find(s => (s.email === loginInput || s.name === loginInput) && s.password === password);
    
    if (supplier) {
      setCurrentSupplier(supplier);
      setUserRole(UserRole.SUPPLIER);
      setCurrentView(ViewState.SUPPLIER_DASHBOARD);
    } else {
      alert("Nom d'utilisateur ou mot de passe incorrect.");
    }
  };

  const handleGoToRegistration = () => {
      setCurrentView(ViewState.SUPPLIER_REGISTRATION);
  };

  const handleRegisterSupplier = async (data: Partial<Supplier>) => {
      const newSupplierData = {
          name: data.name || 'Nouvelle Entreprise',
          rating: 5.0, 
          verified: false,
          isAvailable: true,
          category: data.category || 'Ventes',
          description: data.description || '',
          email: data.email,
          phone: data.phone,
          address: data.address,
          password: data.password
      };

      try {
        const docRef = await addDoc(collection(db, 'Fournisseurs'), newSupplierData);
        setCurrentSupplier({ id: docRef.id, ...newSupplierData } as Supplier);
        setUserRole(UserRole.SUPPLIER);
        setCurrentView(ViewState.SUPPLIER_DASHBOARD);
        alert("Compte créé avec succès !");
      } catch (error: any) {
        console.error("Erreur inscription:", error);
        alert("Erreur lors de l'inscription: " + error.message);
      }
  };

  const handleLogout = () => {
    setUserRole(UserRole.GUEST);
    setCurrentView(ViewState.LANDING);
    setCurrentSupplier(null);
    if (window.location.search.includes('portal=admin')) {
        window.history.pushState({}, document.title, window.location.pathname);
    }
  };

  // --- GESTION DES DONNÉES (CRUD RÉEL) ---

  const handleAddProduct = async (newProduct: Product) => {
    try {
      const { id, ...productData } = newProduct;
      await addDoc(collection(db, 'products'), productData);
    } catch (error: any) {
      console.error("Erreur ajout produit:", error);
      alert("Impossible d'ajouter le produit: " + error.message);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
       const { id, ...productData } = updatedProduct;
       await updateDoc(doc(db, 'products', id), productData);
    } catch (error: any) {
      console.error("Erreur MAJ produit:", error);
      alert("Impossible de mettre à jour: " + error.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
         await deleteDoc(doc(db, 'products', id));
      } catch (error: any) {
        console.error("Erreur suppression produit:", error);
        alert("Impossible de supprimer: " + error.message);
      }
    }
  };

  const handleToggleProductPromotion = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      await updateDoc(doc(db, 'products', id), { 
        isPromoted: !product.isPromoted 
      });
    } catch (error: any) {
       console.error("Erreur promotion:", error);
       alert("Erreur mise à jour promotion: " + error.message);
    }
  };

  const handleToggleSupplierVerification = async (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return;

    try {
        await updateDoc(doc(db, 'Fournisseurs', id), { 
          verified: !supplier.verified 
        });
    } catch (error: any) {
       console.error("Erreur vérification:", error);
       alert("Erreur vérification: " + error.message);
    }
  };

  const handleAddUser = async (userData: any) => {
    const newUserData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        phone: userData.phone || '',
        address: userData.address || '',
        rating: 5,
        verified: true,
        isAvailable: true,
        category: 'Personnel'
    };
    
    try {
        await addDoc(collection(db, 'Fournisseurs'), newUserData);
        alert("Utilisateur créé avec succès !");
    } catch (error: any) {
         console.error("Erreur création user:", error);
         alert("Erreur création utilisateur: " + error.message);
    }
  };

  const handleCreateOrder = async (newOrder: Order) => {
    try {
      const { id, ...orderData } = newOrder;
      // On n'ajoute plus de frais par défaut, on prend ce qui est dans l'objet commande (qui sera 0)
      const sanitizedOrder = JSON.parse(JSON.stringify(orderData));
      await addDoc(collection(db, 'Commandes'), sanitizedOrder);
    } catch (error: any) {
      console.error("Erreur création commande:", error);
      alert("Impossible de passer la commande: " + error.message);
      throw error;
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
       await updateDoc(doc(db, 'Commandes', orderId), {
         status: newStatus
       });
    } catch (error: any) {
       console.error("Erreur MAJ statut:", error);
       alert("Impossible de mettre à jour le statut: " + error.message);
    }
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
       await setDoc(doc(db, 'Settings', 'general'), newSettings, { merge: true });
       alert("Paramètres mis à jour avec succès !");
    } catch (error: any) {
       console.error("Erreur MAJ settings:", error);
       alert("Erreur lors de la sauvegarde : " + error.message);
    }
  };

  // --- INVENTORY MANAGEMENT HANDLERS ---
  const handleAddInventoryItem = async (item: InventoryItem) => {
    try {
        const { id, ...itemData } = item;
        await addDoc(collection(db, 'Inventory'), itemData);
    } catch (error: any) {
        console.error("Erreur ajout stock:", error);
        alert("Erreur ajout stock: " + error.message);
    }
  };

  const handleUpdateInventoryItem = async (item: InventoryItem) => {
    try {
        const { id, ...itemData } = item;
        await updateDoc(doc(db, 'Inventory', id), itemData);
    } catch (error: any) {
        console.error("Erreur maj stock:", error);
        alert("Erreur maj stock: " + error.message);
    }
  };

  const handleDeleteInventoryItem = async (id: string) => {
    if (confirm("Supprimer définitivement cet article du stock ?")) {
        try {
            await deleteDoc(doc(db, 'Inventory', id));
        } catch (error: any) {
            console.error("Erreur suppression stock:", error);
            alert("Erreur suppression stock: " + error.message);
        }
    }
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.LANDING:
        return (
            <LandingView 
                onClientAccess={handleClientAccess} 
                onSelectRole={handleLogin} 
                onRegisterSupplier={handleGoToRegistration}
                appSettings={appSettings}
            />
        );
      
      case ViewState.SUPPLIER_LOGIN:
          return (
            <SupplierLogin 
              onLogin={handleSupplierLogin}
              onCancel={() => setCurrentView(ViewState.LANDING)}
              onRegister={handleGoToRegistration}
            />
          );
      
      case ViewState.ADMIN_LOGIN:
          return (
             <AdminLogin 
                onLogin={handleAdminLogin}
                onCancel={() => setCurrentView(ViewState.LANDING)}
             />
          );

      case ViewState.SUPPLIER_REGISTRATION:
          return (
              <SupplierRegistration 
                  onRegister={handleRegisterSupplier}
                  onCancel={() => setCurrentView(ViewState.LANDING)}
              />
          );

      case ViewState.MARKETPLACE:
        return (
          <ClientMarketplace 
            products={products} 
            suppliers={suppliers} 
            onCreateOrder={handleCreateOrder}
            diningMode={diningMode}
          />
        );
      case ViewState.SUPPLIER_DASHBOARD:
        return (
          <SupplierDashboard 
            supplierId={currentSupplier?.id || ''} 
            supplierName={currentSupplier?.name || 'Fournisseur'} 
            products={products} 
            orders={orders}
            onAddProduct={handleAddProduct} 
            onUpdateProduct={handleUpdateProduct} 
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case ViewState.ADMIN_DASHBOARD:
        return (
          <AdminDashboard 
            products={products} 
            suppliers={suppliers} 
            orders={orders}
            inventory={inventory}
            appSettings={appSettings}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onTogglePromotion={handleToggleProductPromotion}
            onToggleVerification={handleToggleSupplierVerification}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAddUser={handleAddUser}
            onUpdateSettings={handleUpdateSettings}
            onAddInventoryItem={handleAddInventoryItem}
            onUpdateInventoryItem={handleUpdateInventoryItem}
            onDeleteInventoryItem={handleDeleteInventoryItem}
          />
        );
      default:
        return <LandingView onClientAccess={handleClientAccess} onSelectRole={handleLogin} onRegisterSupplier={handleGoToRegistration} appSettings={appSettings} />;
    }
  };

  if (isLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500">Connexion au serveur Atelier des pates...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Navbar 
        userRole={userRole} 
        currentView={currentView} 
        onChangeView={setCurrentView}
        onLogout={handleLogout}
      />
      <main className="flex-1">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
