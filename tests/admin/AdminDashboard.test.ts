import { AdminDashboard } from "../../src/admin/AdminDashboard";
import { AgentManager } from "../../src/agents/AgentManager";
import { TenantContext } from "../../src/models/TenantContext";

const echoHandler = async (_ctx: TenantContext, msg: string): Promise<string> =>
  `echo: ${msg}`;

describe("AdminDashboard", () => {
  let manager: AgentManager;
  let dashboard: AdminDashboard;

  beforeEach(() => {
    manager = new AgentManager();
    dashboard = new AdminDashboard(manager);
  });

  it("returns an empty summary when no agents are onboarded", () => {
    const summary = dashboard.getSummary();
    expect(summary.totalAgents).toBe(0);
    expect(summary.activeAgents).toBe(0);
    expect(summary.totalMessages).toBe(0);
    expect(summary.reports).toEqual([]);
  });

  it("counts active agents correctly", () => {
    manager.onboard({ displayName: "Alice", role: "member", telegramUserId: 1 });
    manager.onboard({ displayName: "Bob", role: "member", telegramUserId: 2 });
    const summary = dashboard.getSummary();
    expect(summary.totalAgents).toBe(2);
    expect(summary.activeAgents).toBe(2);
  });

  it("counts suspended agents correctly", () => {
    const t1 = manager.onboard({ displayName: "Alice", role: "member", telegramUserId: 1 });
    manager.onboard({ displayName: "Bob", role: "member", telegramUserId: 2 });
    manager.suspendAgent(t1);
    const summary = dashboard.getSummary();
    expect(summary.activeAgents).toBe(1);
    expect(summary.suspendedAgents).toBe(1);
  });

  it("accumulates total message count across all agents", async () => {
    manager.onboard({ displayName: "Alice", role: "member", telegramUserId: 1 });
    manager.onboard({ displayName: "Bob", role: "member", telegramUserId: 2 });
    await manager.routeMessage(1, "hi", echoHandler);
    await manager.routeMessage(1, "hello", echoHandler);
    await manager.routeMessage(2, "hey", echoHandler);
    const summary = dashboard.getSummary();
    expect(summary.totalMessages).toBe(3);
  });

  it("printSummary outputs to console without throwing", () => {
    manager.onboard({ displayName: "Alice", role: "member", telegramUserId: 1 });
    const spy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    expect(() => dashboard.printSummary()).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("includes each agent's details in the report", async () => {
    const t1 = manager.onboard({ displayName: "Alice", role: "member", telegramUserId: 1 });
    await manager.routeMessage(1, "test", echoHandler);
    const report = dashboard.getSummary().reports.find((r) => r.tenantId === t1);
    expect(report?.displayName).toBe("Alice");
    expect(report?.messageCount).toBe(1);
    expect(report?.lastActiveAt).toBeInstanceOf(Date);
  });
});
