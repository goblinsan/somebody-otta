/**
 * Core types for the multi-tenant family agent architecture.
 */

/** Unique identifier for a tenant (family member). */
export type TenantId = string;

/** Unique identifier for a Telegram user. */
export type TelegramUserId = number;

/** Roles within the managed service. */
export type Role = "admin" | "member";

/** Possible lifecycle states for a managed agent. */
export type AgentStatus = "provisioned" | "active" | "suspended" | "deprovisioned";

/** A key-value store for isolated tenant memory entries. */
export type MemoryStore = Record<string, unknown>;

/** Credential entry stored in isolated tenant storage. */
export interface Credential {
  service: string;
  token: string;
  expiresAt?: Date;
}

/** Permissions granted to a tenant's agent. */
export interface AgentPermissions {
  canAccessCalendar: boolean;
  canAccessEmail: boolean;
  canAccessReminders: boolean;
  canAccessHomeAutomation: boolean;
}

/** Immutable profile for a family member. */
export interface UserProfile {
  tenantId: TenantId;
  displayName: string;
  role: Role;
  telegramUserId: TelegramUserId;
  createdAt: Date;
}

/** Configuration used when provisioning a new agent. */
export interface AgentProvisioningConfig {
  displayName: string;
  role: Role;
  telegramUserId: TelegramUserId;
  permissions?: Partial<AgentPermissions>;
}

/** Snapshot of an agent's health and usage for the admin dashboard. */
export interface AgentHealthReport {
  tenantId: TenantId;
  displayName: string;
  status: AgentStatus;
  messageCount: number;
  lastActiveAt: Date | null;
  credentialCount: number;
  memoryEntryCount: number;
}
