import { AgentProvisioner } from "../../src/agents/AgentProvisioner";
import { TenantRegistry } from "../../src/models/TenantRegistry";
import { AgentProvisioningConfig } from "../../src/types";

const makeConfig = (
  overrides: Partial<AgentProvisioningConfig> = {}
): AgentProvisioningConfig => ({
  displayName: "Carol",
  role: "member",
  telegramUserId: 99999,
  ...overrides,
});

describe("AgentProvisioner", () => {
  let registry: TenantRegistry;
  let provisioner: AgentProvisioner;

  beforeEach(() => {
    registry = new TenantRegistry();
    provisioner = new AgentProvisioner(registry);
  });

  it("provisions an agent with a unique tenant ID", () => {
    const result = provisioner.provision(makeConfig());
    expect(result.tenantId).toBeTruthy();
    expect(typeof result.tenantId).toBe("string");
  });

  it("provisions different tenant IDs for different family members", () => {
    const r1 = provisioner.provision(makeConfig({ telegramUserId: 1 }));
    const r2 = provisioner.provision(makeConfig({ telegramUserId: 2 }));
    expect(r1.tenantId).not.toBe(r2.tenantId);
  });

  it("registers the tenant in the registry", () => {
    const { tenantId } = provisioner.provision(makeConfig());
    expect(registry.has(tenantId)).toBe(true);
  });

  it("activates the agent after provisioning", () => {
    const { agent } = provisioner.provision(makeConfig());
    expect(agent.currentStatus).toBe("active");
  });

  it("stores the correct display name on the profile", () => {
    const { context } = provisioner.provision(makeConfig({ displayName: "Dave" }));
    expect(context.profile.displayName).toBe("Dave");
  });

  it("stores the admin role when specified", () => {
    const { context } = provisioner.provision(makeConfig({ role: "admin" }));
    expect(context.profile.role).toBe("admin");
  });

  it("applies custom permissions", () => {
    const { context } = provisioner.provision(
      makeConfig({ permissions: { canAccessCalendar: true } })
    );
    expect(context.permissions.canAccessCalendar).toBe(true);
  });

  describe("deprovisioning", () => {
    it("deprovisions an agent and removes it from the registry", () => {
      const { tenantId, agent } = provisioner.provision(makeConfig());
      provisioner.deprovision(tenantId, agent);
      expect(registry.has(tenantId)).toBe(false);
      expect(agent.currentStatus).toBe("deprovisioned");
    });

    it("deprovisioned agent cannot be reactivated", () => {
      const { tenantId, agent } = provisioner.provision(makeConfig());
      provisioner.deprovision(tenantId, agent);
      expect(() => agent.activate()).toThrow(/deprovisioned/);
    });
  });
});
