/**
 * FamilyMemberAgent — a managed AI agent scoped to a single tenant.
 *
 * Wraps the AI service call and enforces that all context, memory,
 * and credentials used belong exclusively to the owning tenant.
 */
import { AgentStatus, TenantId } from "../types";
import { TenantContext } from "../models/TenantContext";

export interface AgentResponse {
  tenantId: TenantId;
  text: string;
  timestamp: Date;
}

export class FamilyMemberAgent {
  private status: AgentStatus = "provisioned";
  private messageCount = 0;
  private lastActiveAt: Date | null = null;

  constructor(private readonly context: TenantContext) {}

  get tenantId(): TenantId {
    return this.context.tenantId;
  }

  get currentStatus(): AgentStatus {
    return this.status;
  }

  get totalMessageCount(): number {
    return this.messageCount;
  }

  get lastActive(): Date | null {
    return this.lastActiveAt;
  }

  /** Activate the agent so it can process messages. */
  activate(): void {
    if (this.status === "deprovisioned") {
      throw new Error(
        `Agent for tenant "${this.tenantId}" has been deprovisioned and cannot be reactivated.`
      );
    }
    this.status = "active";
  }

  /** Suspend the agent, preventing it from processing messages. */
  suspend(): void {
    if (this.status === "deprovisioned") return;
    this.status = "suspended";
  }

  /** Permanently decommission the agent. */
  deprovision(): void {
    this.status = "deprovisioned";
  }

  /**
   * Process an inbound message and return a response.
   * The handler function receives the tenant's isolated context so that
   * any AI service call can retrieve memory and credentials safely.
   *
   * @param message - The raw text message from the user.
   * @param handler - Injectable AI service handler for testability.
   */
  async handleMessage(
    message: string,
    handler: (context: TenantContext, message: string) => Promise<string>
  ): Promise<AgentResponse> {
    if (this.status !== "active") {
      throw new Error(
        `Agent for tenant "${this.tenantId}" is not active (status: ${this.status}).`
      );
    }

    const text = await handler(this.context, message);
    this.messageCount++;
    this.lastActiveAt = new Date();

    return {
      tenantId: this.tenantId,
      text,
      timestamp: this.lastActiveAt,
    };
  }
}
