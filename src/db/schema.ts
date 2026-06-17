import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- Utilisateurs ----------
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["STUDENT", "ADMIN"] })
    .notNull()
    .default("STUDENT"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// ---------- Catégories de cours ----------
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
});

// ---------- Cours ----------
export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  priceXAF: integer("price_xaf").notNull(), // Prix en Francs CFA
  coverImageUrl: text("cover_image_url"),
  fileUrl: text("file_url").notNull(), // chemin/URL du fichier du cours
  fileName: text("file_name").notNull(), // nom affiché au téléchargement
  isPublished: boolean("is_published").notNull().default(true),
  categoryId: text("category_id").references(() => categories.id),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// ---------- Commandes / Paiements ----------
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  amountXAF: integer("amount_xaf").notNull(),
  status: text("status", {
    enum: ["PENDING", "PAID", "FAILED", "CANCELLED"],
  })
    .notNull()
    .default("PENDING"),
  paymentMethod: text("payment_method", {
    enum: ["ORANGE_MONEY", "MTN_MOMO", "SIMULATION"],
  })
    .notNull()
    .default("SIMULATION"),
  operatorPhone: text("operator_phone"),
  externalTxId: text("external_tx_id"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  createdAt: timestamp("created_at").notNull(),
  paidAt: timestamp("paid_at"),
});

// ---------- Téléchargements (preuve d'accès) ----------
export const downloads = pgTable("downloads", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  ipAddress: text("ip_address"),
  downloadedAt: timestamp("downloaded_at").notNull(),
});

// ---------- Relations (pour les requêtes avec jointures) ----------
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  downloads: many(downloads),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  orders: many(orders),
  downloads: many(downloads),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  course: one(courses, {
    fields: [orders.courseId],
    references: [courses.id],
  }),
  downloads: many(downloads),
}));

export const downloadsRelations = relations(downloads, ({ one }) => ({
  user: one(users, { fields: [downloads.userId], references: [users.id] }),
  course: one(courses, {
    fields: [downloads.courseId],
    references: [courses.id],
  }),
  order: one(orders, { fields: [downloads.orderId], references: [orders.id] }),
}));
