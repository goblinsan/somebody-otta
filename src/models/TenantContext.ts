/**
 * TenantContext — isolated data container for a single family member.
 *
 * Enforces strict data separation: all memory, credentials, and preferences
 * are scoped to one TenantId and cannot be accessed cross-tenant.
 */
import {
  AgentPermissions,
  Credential,
  MemoryStore,
  TenantId,
  UserProfile,
} from "../types";

const DEFAULT_PERMISSIONS: AgentPermissions = {
  canAccessCalendar: false,
  canAccessEmail: false,
  canAccessReminders: true,
  canAccessHomeAutomation: false,
};

export class TenantContext {
  readonly tenantId: TenantId;
  readonly profile: UserProfile;
  readonly permissions: AgentPermissions;

  private readonly memory: MemoryStore;
  private readonly credentials: Map<string, Credential>;

  constructor(
    profile: UserProfile,
    permissions: Partial<AgentPermissions> = {}
  ) {
    this.tenantId = profile.tenantId;
    this.profile = Object.freeze({ ...profile });
    this.permissions = Object.freeze({ ...DEFAULT_PERMISSIONS, ...permissions });
    this.memory = {};
    this.credentials = new Map();
  }

  // ── Memory ────────────────────────────────────────────────────────────────

  /** Store an arbitrary value in this tenant's isolated memory. */
  setMemory(key: string, value: unknown): void {
    this.assertKey(key);
    this.memory[key] = value;
  }

  /** Retrieve a value from this tenant's memory, or undefined if absent. */
  getMemory(key: string): unknown {
    this.assertKey(key);
    return this.memory[key];
  }

  /** Remove an entry from this tenant's memory. */
  deleteMemory(key: string): void {
    this.assertKey(key);
    delete this.memory[key];
  }

  /** Return the number of memory entries stored for this tenant. */
  get memoryEntryCount(): number {
    return Object.keys(this.memory).length;
  }

  // ── Credentials ───────────────────────────────────────────────────────────

  /** Store a credential for a named third-party service. */
  setCredential(credential: Credential): void {
    if (!credential.service) {
      throw new Error("Credential must have a non-empty service name.");
    }
    this.credentials.set(credential.service, { ...credential });
  }

  /** Retrieve a stored credential for the given service. */
  getCredential(service: string): Credential | undefined {
    const cred = this.credentials.get(service);
    return cred ? { ...cred } : undefined;
  }

  /** Remove a stored credential by service name. */
  deleteCredential(service: string): void {
    this.credentials.delete(service);
  }

  /** Return the number of stored credentials for this tenant. */
  get credentialCount(): number {
    return this.credentials.size;
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private assertKey(key: string): void {
    if (!key || key.trim() === "") {
      throw new Error("Memory key must be a non-empty string.");
    }
  }
}
