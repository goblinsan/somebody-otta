import { MessageRouter } from "../../src/telegram/MessageRouter";
import { AgentManager } from "../../src/agents/AgentManager";
import { TenantContext } from "../../src/models/TenantContext";

const echoHandler = async (_ctx: TenantContext, msg: string): Promise<string> =>
  `routed: ${msg}`;

describe("MessageRouter", () => {
  let manager: AgentManager;
  let router: MessageRouter;

  beforeEach(() => {
    manager = new AgentManager();
    router = new MessageRouter(manager, echoHandler);
  });

  it("routes a message to the correct tenant's agent", async () => {
    manager.onboard({
      displayName: "Eve",
      role: "member",
      telegramUserId: 55555,
    });

    const response = await router.route(55555, "test message");
    expect(response.text).toBe("routed: test message");
    expect(response.tenantId).toBeTruthy();
  });

  it("throws for an unregistered Telegram user", async () => {
    await expect(router.route(99999, "hi")).rejects.toThrow(/No agent registered/);
  });

  it("routes messages to different agents independently", async () => {
    manager.onboard({ displayName: "Alice", role: "member", telegramUserId: 11 });
    manager.onboard({ displayName: "Bob", role: "member", telegramUserId: 22 });

    const r1 = await router.route(11, "from Alice");
    const r2 = await router.route(22, "from Bob");

    expect(r1.text).toBe("routed: from Alice");
    expect(r2.text).toBe("routed: from Bob");
    expect(r1.tenantId).not.toBe(r2.tenantId);
  });
});
