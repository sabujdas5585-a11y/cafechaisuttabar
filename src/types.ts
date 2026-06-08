export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrls: string[]; // Supports multiple photos
  isAvailable: boolean;
  isPopular?: boolean;
}

export interface Booking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  tableNo?: string;
  notes?: string;
  createdAt: string;
  userId?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'placed' | 'preparing' | 'ready' | 'completed';
  type: 'dine_in' | 'takeaway';
  tableNo?: string;
  createdAt: string;
  updatedAt: string;
  customerEmail?: string;
  userId?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  currentQty: number;
  minQty: number; // For low inventory alerts
  unit: string;
  category: 'dairy' | 'dry' | 'fresh' | 'packaging';
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  isVisible?: boolean;
  userId?: string;
  status?: 'none' | 'working' | 'resolved';
  adminNotes?: string;
}
