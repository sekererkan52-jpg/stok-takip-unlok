import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

// Mağazalar tablosu
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  manager: text("manager"),
  phone: text("phone"),
  email: text("email"),
  city: text("city"),
  address: text("address"),
  status: text("status").notNull().default("aktif"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Envanter tablosu
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  productName: text("product_name").notNull(),
  sku: text("sku"),
  category: text("category"),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").default("adet"),
  price: numeric("price", { precision: 12, scale: 2 }),
  minStock: integer("min_stock").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Süreçler tablosu
export const processes = pgTable("processes", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  status: text("status").notNull().default("beklemede"),
  priority: text("priority").notNull().default("orta"),
  assignedTo: text("assigned_to"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
export type Process = typeof processes.$inferSelect;
export type NewProcess = typeof processes.$inferInsert;
