export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  restaurants: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  settings: Record<string, any>;
}

export interface Invoice {
  id: string;
  restaurantId: string;
  invoiceNumber: string;
  vendor: string;
  date: string;
  items: InvoiceItem[];
  total: number;
  status: 'pending' | 'processed' | 'error';
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
} 