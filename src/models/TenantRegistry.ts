/**
 * TenantRegistry — central store of all TenantContexts.
 *
 * Enforces that no tenant can access another tenant's context.
 * Acts as the single source of truth for registered family members.
 */
import { TenantId, TelegramUserId } from "../types";
import { TenantContext } from "./TenantContext";

export class TenantRegistry {
  private readonly contexts: Map<TenantId, TenantContext> = new Map();
  private readonly telegramIndex: Map<TelegramUserId, TenantId> = new Map();

  /** Register a new tenant context. Throws if the tenant is already registered. */
  register(context: TenantContext): void {
    if (this.contexts.has(context.tenantId)) {
      throw new Error(
        `Tenant "${context.tenantId}" is already registered.`
      );
    }
    if (this.telegramIndex.has(context.profile.telegramUserId)) {
      throw new Error(
        `Telegram user ${context.profile.telegramUserId} is already mapped to another tenant.`
      );
    }
    this.contexts.set(context.tenantId, context);
    this.telegramIndex.set(context.profile.telegramUserId, context.tenantId);
  }

  /** Retrieve the isolated context for the given tenant. */
  getById(tenantId: TenantId): TenantContext | undefined {
    return this.contexts.get(tenantId);
  }

  /** Resolve a TenantContext from a Telegram user ID. */
  getByTelegramUserId(telegramUserId: TelegramUserId): TenantContext | undefined {
    const tenantId = this.telegramIndex.get(telegramUserId);
    return tenantId ? this.contexts.get(tenantId) : undefined;
  }

  /** Check whether a tenant ID is registered. */
  has(tenantId: TenantId): boolean {
    return this.contexts.has(tenantId);
  }

  /** Remove a tenant's context from the registry. */
  deregister(tenantId: TenantId): void {
    const context = this.contexts.get(tenantId);
    if (!context) return;
    this.telegramIndex.delete(context.profile.telegramUserId);
    this.contexts.delete(tenantId);
  }

  /** Return all registered tenant IDs. */
  listTenantIds(): TenantId[] {
    return Array.from(this.contexts.keys());
  }

  /** Total number of registered tenants. */
  get size(): number {
    return this.contexts.size;
  }
}
