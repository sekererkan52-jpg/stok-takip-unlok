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

// Kullanıcılar tablosu
export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  username: text("username").notNull().unique(),

  fullName: text("full_name").notNull(),

  passwordHash: text("password_hash").notNull(),

  role: text("role").notNull().default("user"),

  active: integer("active").notNull().default(1),

  mustChangePassword: integer("must_change_password")
    .notNull()
    .default(1),

  lastLogin: timestamp("last_login", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  storeId: integer("store_id")
    .references(() => stores.id, { onDelete: "set null" }),
});

// Kullanıcı hareketleri / log tablosu
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  action: text("action").notNull(),

  entity: text("entity"),

  entityId: integer("entity_id"),

  details: text("details"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// Şifre sıfırlama talepleri tablosu
export const passwordResetRequests = pgTable("password_reset_requests", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  status: text("status").notNull().default("beklemede"), // "beklemede", "tamamlandi"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
export type Process = typeof processes.$inferSelect;
export type NewProcess = typeof processes.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type NewPasswordResetRequest = typeof passwordResetRequests.$inferInsert;