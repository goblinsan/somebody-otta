/**
 * AgentProvisioner — repeatable onboarding workflow for new family members.
 *
 * Creates a TenantContext with a unique tenant ID, registers it in the
 * TenantRegistry, constructs a FamilyMemberAgent, and activates it.
 */
import { randomUUID } from "crypto";
import { AgentProvisioningConfig, TenantId, UserProfile } from "../types";
import { TenantContext } from "../models/TenantContext";
import { TenantRegistry } from "../models/TenantRegistry";
import { FamilyMemberAgent } from "./FamilyMemberAgent";

export interface ProvisioningResult {
  tenantId: TenantId;
  agent: FamilyMemberAgent;
  context: TenantContext;
}

export class AgentProvisioner {
  constructor(private readonly registry: TenantRegistry) {}

  /**
   * Provision a new managed agent for a family member.
   *
   * Steps:
   *  1. Generate a unique tenant ID.
   *  2. Build an immutable UserProfile.
   *  3. Create an isolated TenantContext.
   *  4. Register the context in the TenantRegistry.
   *  5. Construct and activate a FamilyMemberAgent.
   *
   * @param config - Configuration describing the new family member.
   * @returns The provisioning result containing the tenant ID, agent, and context.
   */
  provision(config: AgentProvisioningConfig): ProvisioningResult {
    const tenantId: TenantId = randomUUID();

    const profile: UserProfile = {
      tenantId,
      displayName: config.displayName,
      role: config.role,
      telegramUserId: config.telegramUserId,
      createdAt: new Date(),
    };

    const context = new TenantContext(profile, config.permissions ?? {});
    this.registry.register(context);

    const agent = new FamilyMemberAgent(context);
    agent.activate();

    return { tenantId, agent, context };
  }

  /**
   * Deprovision and deregister an existing agent.
   *
   * @param tenantId - The tenant whose agent should be removed.
   * @param agent - The agent instance to deprovision.
   */
  deprovision(tenantId: TenantId, agent: FamilyMemberAgent): void {
    agent.deprovision();
    this.registry.deregister(tenantId);
  }
}
