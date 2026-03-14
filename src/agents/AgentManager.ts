/**
 * AgentManager — central coordinator for all managed family agents.
 *
 * Delegates provisioning to AgentProvisioner and exposes a unified interface
 * for message routing, lifecycle management, and health reporting.
 */
import {
  AgentHealthReport,
  AgentProvisioningConfig,
  TenantId,
  TelegramUserId,
} from "../types";
import { TenantRegistry } from "../models/TenantRegistry";
import { FamilyMemberAgent, AgentResponse } from "./FamilyMemberAgent";
import { AgentProvisioner } from "./AgentProvisioner";
import { TenantContext } from "../models/TenantContext";

export class AgentManager {
  private readonly registry: TenantRegistry;
  private readonly provisioner: AgentProvisioner;
  private readonly agents: Map<TenantId, FamilyMemberAgent> = new Map();

  constructor() {
    this.registry = new TenantRegistry();
    this.provisioner = new AgentProvisioner(this.registry);
  }

  /**
   * Onboard a new family member: provision an isolated context and start their agent.
   * @returns The new tenant ID.
   */
  onboard(config: AgentProvisioningConfig): TenantId {
    const { tenantId, agent } = this.provisioner.provision(config);
    this.agents.set(tenantId, agent);
    return tenantId;
  }

  /**
   * Route an inbound message to the correct agent by Telegram user ID.
   *
   * @param telegramUserId - The sender's Telegram user ID.
   * @param message - The raw message text.
   * @param handler - The AI service handler to process the message.
   */
  async routeMessage(
    telegramUserId: TelegramUserId,
    message: string,
    handler: (context: TenantContext, message: string) => Promise<string>
  ): Promise<AgentResponse> {
    const context = this.registry.getByTelegramUserId(telegramUserId);
    if (!context) {
      throw new Error(
        `No agent registered for Telegram user ${telegramUserId}.`
      );
    }

    const agent = this.agents.get(context.tenantId);
    if (!agent) {
      throw new Error(
        `Agent for tenant "${context.tenantId}" not found in AgentManager.`
      );
    }

    return agent.handleMessage(message, handler);
  }

  /** Retrieve an agent by tenant ID. */
  getAgent(tenantId: TenantId): FamilyMemberAgent | undefined {
    return this.agents.get(tenantId);
  }

  /** Suspend a tenant's agent. */
  suspendAgent(tenantId: TenantId): void {
    this.requireAgent(tenantId).suspend();
  }

  /** Reactivate a suspended agent. */
  activateAgent(tenantId: TenantId): void {
    this.requireAgent(tenantId).activate();
  }

  /** Permanently remove a tenant's agent and deregister their context. */
  removeAgent(tenantId: TenantId): void {
    const agent = this.requireAgent(tenantId);
    this.provisioner.deprovision(tenantId, agent);
    this.agents.delete(tenantId);
  }

  /** Generate health reports for all registered agents. */
  getHealthReports(): AgentHealthReport[] {
    const reports: AgentHealthReport[] = [];
    for (const [tenantId, agent] of this.agents) {
      const context = this.registry.getById(tenantId);
      if (!context) continue;
      reports.push({
        tenantId,
        displayName: context.profile.displayName,
        status: agent.currentStatus,
        messageCount: agent.totalMessageCount,
        lastActiveAt: agent.lastActive,
        credentialCount: context.credentialCount,
        memoryEntryCount: context.memoryEntryCount,
      });
    }
    return reports;
  }

  /** Total number of managed agents. */
  get agentCount(): number {
    return this.agents.size;
  }

  private requireAgent(tenantId: TenantId): FamilyMemberAgent {
    const agent = this.agents.get(tenantId);
    if (!agent) {
      throw new Error(`No agent found for tenant "${tenantId}".`);
    }
    return agent;
  }
}
