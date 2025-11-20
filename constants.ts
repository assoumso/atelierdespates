
import { Product, Supplier, Order, OrderStatus } from './types';

export const MOCK_SUPPLIERS: Supplier[] = [
  { 
    id: 's1', 
    name: 'Global Tech Imports', 
    rating: 4.8, 
    verified: true, 
    isAvailable: true,
    category: 'Électronique',
    description: 'Spécialiste des équipements informatiques haute performance.',
    phone: '22507070707', // Numéro fictif pour test WhatsApp
    email: 'contact@globaltech.com',
    address: 'Abidjan, Plateau',
    password: '123456' // Mot de passe par défaut
  },
  { 
    id: 's2', 
    name: 'BioFerme Direct', 
    rating: 4.5, 
    verified: true, 
    isAvailable: true,
    category: 'Alimentation',
    description: 'Producteur local de fruits et légumes de saison.',
    phone: '22505050505',
    email: 'bio@ferme.ci',
    address: 'Bingerville',
    password: '123456'
  },
  { 
    id: 's3', 
    name: 'Textile & Mode Pro', 
    rating: 4.2, 
    verified: false, 
    isAvailable: false, // Indisponible pour la démo
    category: 'Vêtements',
    description: 'Grossiste en textile et accessoires de mode.',
    phone: '22501010101',
    password: '123456'
  },
  { 
    id: 's4', 
    name: 'IndusEquip Solutions', 
    rating: 4.9, 
    verified: true, 
    isAvailable: true,
    category: 'Industrie',
    description: 'Machines et outillages pour le secteur industriel.',
    phone: '22507080910',
    password: '123456'
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Ordinateur Portable UltraBook',
    description: 'Un ordinateur performant pour les professionnels, doté d\'un processeur dernière génération et d\'un écran 4K.',
    price: 850000,
    category: 'Électronique',
    supplierId: 's1',
    supplierName: 'Global Tech Imports',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    tags: ['ordinateur', 'tech', 'travail'],
    createdAt: Date.now(),
    isPromoted: true
  },
  {
    id: 'p2',
    name: 'Panier de Légumes Bio',
    description: 'Sélection de légumes de saison cultivés sans pesticides. Idéal pour une alimentation saine.',
    price: 25000,
    category: 'Alimentation',
    supplierId: 's2',
    supplierName: 'BioFerme Direct',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    tags: ['bio', 'légumes', 'frais'],
    createdAt: Date.now() - 100000,
    isPromoted: false
  },
  {
    id: 'p3',
    name: 'Lot de T-shirts Coton',
    description: 'Lot de 50 t-shirts en coton premium, parfaits pour la personnalisation ou la revente.',
    price: 165000,
    category: 'Vêtements',
    supplierId: 's3',
    supplierName: 'Textile & Mode Pro',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    tags: ['coton', 'gros', 'mode'],
    createdAt: Date.now() - 200000,
    isPromoted: false
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    productId: 'p1',
    productName: 'Ordinateur Portable UltraBook',
    quantity: 2,
    totalPrice: 1700000,
    supplierId: 's1',
    customerName: 'Alice Martin',
    customerContact: '01 23 45 67 89',
    status: OrderStatus.PENDING,
    date: Date.now() - 3600000, // 1 hour ago
    shippingAddress: '12 Rue de la Paix, 75001 Paris'
  },
  {
    id: 'ord-002',
    productId: 'p1',
    productName: 'Ordinateur Portable UltraBook',
    quantity: 1,
    totalPrice: 850000,
    supplierId: 's1',
    customerName: 'Entreprise StartUp Tech',
    customerContact: '04 56 78 90 12',
    status: OrderStatus.CONFIRMED,
    date: Date.now() - 86400000, // 1 day ago
    shippingAddress: '45 Avenue du Code, 69000 Lyon'
  },
  {
    id: 'ord-003',
    productId: 'p1',
    productName: 'Ordinateur Portable UltraBook',
    quantity: 5,
    totalPrice: 4250000,
    supplierId: 's1',
    customerName: 'Université des Sciences',
    customerContact: '05 67 89 01 23',
    status: OrderStatus.SHIPPED,
    date: Date.now() - 172800000, // 2 days ago
    shippingAddress: 'Campus Universitaire, 33000 Bordeaux'
  }
];

export const CATEGORIES = ['Électronique', 'Alimentation', 'Vêtements', 'Maison', 'Industrie', 'Service'];
