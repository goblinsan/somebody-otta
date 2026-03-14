import { TenantRegistry } from "../../src/models/TenantRegistry";
import { TenantContext } from "../../src/models/TenantContext";
import { UserProfile } from "../../src/types";

const makeContext = (tenantId: string, telegramUserId: number): TenantContext => {
  const profile: UserProfile = {
    tenantId,
    displayName: `User-${tenantId}`,
    role: "member",
    telegramUserId,
    createdAt: new Date(),
  };
  return new TenantContext(profile);
};

describe("TenantRegistry", () => {
  let registry: TenantRegistry;

  beforeEach(() => {
    registry = new TenantRegistry();
  });

  it("registers a tenant and retrieves by ID", () => {
    const ctx = makeContext("t1", 100);
    registry.register(ctx);
    expect(registry.getById("t1")).toBe(ctx);
  });

  it("retrieves a tenant by Telegram user ID", () => {
    const ctx = makeContext("t1", 100);
    registry.register(ctx);
    expect(registry.getByTelegramUserId(100)).toBe(ctx);
  });

  it("returns undefined for unknown tenant ID", () => {
    expect(registry.getById("unknown")).toBeUndefined();
  });

  it("returns undefined for unknown Telegram user ID", () => {
    expect(registry.getByTelegramUserId(999)).toBeUndefined();
  });

  it("throws when registering a duplicate tenant ID", () => {
    const ctx = makeContext("t1", 100);
    registry.register(ctx);
    const duplicate = makeContext("t1", 200);
    expect(() => registry.register(duplicate)).toThrow(/already registered/);
  });

  it("throws when registering a duplicate Telegram user ID", () => {
    registry.register(makeContext("t1", 100));
    const samePhone = makeContext("t2", 100);
    expect(() => registry.register(samePhone)).toThrow(/already mapped/);
  });

  it("deregisters a tenant by ID", () => {
    const ctx = makeContext("t1", 100);
    registry.register(ctx);
    registry.deregister("t1");
    expect(registry.getById("t1")).toBeUndefined();
    expect(registry.getByTelegramUserId(100)).toBeUndefined();
  });

  it("deregister is a no-op for unknown IDs", () => {
    expect(() => registry.deregister("ghost")).not.toThrow();
  });

  it("tracks size correctly", () => {
    expect(registry.size).toBe(0);
    registry.register(makeContext("t1", 100));
    registry.register(makeContext("t2", 200));
    expect(registry.size).toBe(2);
    registry.deregister("t1");
    expect(registry.size).toBe(1);
  });

  it("lists all tenant IDs", () => {
    registry.register(makeContext("t1", 100));
    registry.register(makeContext("t2", 200));
    expect(registry.listTenantIds().sort()).toEqual(["t1", "t2"]);
  });

  it("has() returns true for registered tenants", () => {
    const ctx = makeContext("t1", 100);
    registry.register(ctx);
    expect(registry.has("t1")).toBe(true);
    expect(registry.has("t2")).toBe(false);
  });
});
