import { AgentManager } from "../../src/agents/AgentManager";
import { TenantContext } from "../../src/models/TenantContext";
import { AgentProvisioningConfig } from "../../src/types";

const echoHandler = async (_ctx: TenantContext, msg: string): Promise<string> =>
  `echo: ${msg}`;

const makeConfig = (
  overrides: Partial<AgentProvisioningConfig> = {}
): AgentProvisioningConfig => ({
  displayName: "Bob",
  role: "member",
  telegramUserId: 12345,
  ...overrides,
});

describe("AgentManager", () => {
  let manager: AgentManager;

  beforeEach(() => {
    manager = new AgentManager();
  });

  describe("onboarding", () => {
    it("onboards a new agent and returns a tenant ID", () => {
      const tenantId = manager.onboard(makeConfig());
      expect(tenantId).toBeTruthy();
      expect(manager.agentCount).toBe(1);
    });

    it("onboards multiple family members independently", () => {
      const id1 = manager.onboard(makeConfig({ displayName: "Alice", telegramUserId: 1 }));
      const id2 = manager.onboard(makeConfig({ displayName: "Bob", telegramUserId: 2 }));
      expect(id1).not.toBe(id2);
      expect(manager.agentCount).toBe(2);
    });
  });

  describe("message routing", () => {
    it("routes a message to the correct agent", async () => {
      manager.onboard(makeConfig({ telegramUserId: 5000 }));
      const response = await manager.routeMessage(5000, "hello", echoHandler);
      expect(response.text).toBe("echo: hello");
    });

    it("throws for an unregistered Telegram user", async () => {
      await expect(
        manager.routeMessage(9999, "hi", echoHandler)
      ).rejects.toThrow(/No agent registered/);
    });

    it("tracks message counts on the agent", async () => {
      const tenantId = manager.onboard(makeConfig({ telegramUserId: 5001 }));
      await manager.routeMessage(5001, "msg1", echoHandler);
      await manager.routeMessage(5001, "msg2", echoHandler);
      expect(manager.getAgent(tenantId)?.totalMessageCount).toBe(2);
    });
  });

  describe("lifecycle management", () => {
    it("suspends an agent so it cannot process messages", async () => {
      const tenantId = manager.onboard(makeConfig({ telegramUserId: 6000 }));
      manager.suspendAgent(tenantId);
      await expect(
        manager.routeMessage(6000, "hi", echoHandler)
      ).rejects.toThrow(/not active/);
    });

    it("reactivates a suspended agent", async () => {
      const tenantId = manager.onboard(makeConfig({ telegramUserId: 6001 }));
      manager.suspendAgent(tenantId);
      manager.activateAgent(tenantId);
      const response = await manager.routeMessage(6001, "hi", echoHandler);
      expect(response.text).toBe("echo: hi");
    });

    it("removes an agent permanently", () => {
      const tenantId = manager.onboard(makeConfig({ telegramUserId: 7000 }));
      manager.removeAgent(tenantId);
      expect(manager.agentCount).toBe(0);
      expect(manager.getAgent(tenantId)).toBeUndefined();
    });

    it("throws when suspending a non-existent agent", () => {
      expect(() => manager.suspendAgent("ghost")).toThrow(/No agent found/);
    });
  });

  describe("health reports", () => {
    it("returns an empty array when no agents exist", () => {
      expect(manager.getHealthReports()).toEqual([]);
    });

    it("includes all onboarded agents in health reports", () => {
      manager.onboard(makeConfig({ displayName: "Alice", telegramUserId: 1 }));
      manager.onboard(makeConfig({ displayName: "Bob", telegramUserId: 2 }));
      const reports = manager.getHealthReports();
      expect(reports).toHaveLength(2);
      const names = reports.map((r) => r.displayName).sort();
      expect(names).toEqual(["Alice", "Bob"]);
    });

    it("reports correct status in health reports", () => {
      const tenantId = manager.onboard(makeConfig({ telegramUserId: 8000 }));
      manager.suspendAgent(tenantId);
      const report = manager.getHealthReports().find((r) => r.tenantId === tenantId);
      expect(report?.status).toBe("suspended");
    });
  });
});
