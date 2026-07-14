export type Store = {
  id: number;
  name: string;
  code: string | null;
  manager: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

export type InventoryItem = {
  id: number;
  storeId: number;
  productName: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  unit: string | null;
  price: string | null;
  currency: string;
  minStock: number | null;
  notes: string | null;
  createdAt: string;
  storeName: string | null;
};

export type ProcessItem = {
  id: number;
  storeId: number;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  dueDate: string | null;
  createdAt: string;
  storeName: string | null;
};

export type User = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  active: number;
  lastLogin: string | null;
  createdAt: string;
  storeId: number | null;
  storeName: string | null;
};

