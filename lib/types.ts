export type Primitive = string | number | boolean | null;

export type RecordMeta = Record<string, Primitive | Primitive[]>;

export type AppUser = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  department: string;
  phone?: string | null;
  status: string;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppRecord = {
  id: string;
  module: string;
  code?: string | null;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  owner?: string | null;
  department?: string | null;
  dueDate?: string | null;
  costMonthly?: number | null;
  meta: RecordMeta;
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  actorId?: string | null;
  actorName: string;
  module: string;
  action: string;
  recordId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

export type AppSetting = {
  key: string;
  value: RecordMeta;
  updatedAt: string;
};

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "textarea"
  | "select"
  | "date"
  | "number"
  | "checkbox"
  | "color";

export type FieldTarget =
  | "title"
  | "description"
  | "status"
  | "priority"
  | "category"
  | "owner"
  | "department"
  | "dueDate"
  | "costMonthly"
  | "meta";

export type FieldDefinition = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  target?: FieldTarget;
};

export type ColumnDefinition = {
  key: string;
  label: string;
  width?: string;
  tone?: "default" | "strong" | "muted" | "status" | "money" | "date";
};

export type ModuleDefinition = {
  id: string;
  path: string;
  icon: string;
  title: string;
  subtitle: string;
  group: string;
  badge?: string;
  primaryAction?: string;
  createTitle?: string;
  emptyTitle?: string;
  emptyBody?: string;
  filters?: FieldDefinition[];
  columns?: ColumnDefinition[];
  createFields?: FieldDefinition[];
  defaultStatus?: string;
  codePrefix?: string;
  special?: "calendar" | "qr" | "reports" | "settings" | "profile";
};
