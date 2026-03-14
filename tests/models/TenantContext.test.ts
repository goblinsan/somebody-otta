import { TenantContext } from "../../src/models/TenantContext";
import { UserProfile } from "../../src/types";

const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  tenantId: "tenant-abc",
  displayName: "Alice",
  role: "member",
  telegramUserId: 111111,
  createdAt: new Date("2026-01-01"),
  ...overrides,
});

describe("TenantContext", () => {
  describe("construction", () => {
    it("freezes the profile so it cannot be mutated", () => {
      const profile = makeProfile();
      const ctx = new TenantContext(profile);
      expect(() => {
        // Attempt mutation — TypeScript won't allow this at compile time,
        // but Object.freeze enforces it at runtime.
        (ctx.profile as unknown as Record<string, unknown>)["displayName"] = "Hacker";
      }).toThrow();
      expect(ctx.profile.displayName).toBe("Alice");
    });

    it("applies default permissions when none are provided", () => {
      const ctx = new TenantContext(makeProfile());
      expect(ctx.permissions.canAccessReminders).toBe(true);
      expect(ctx.permissions.canAccessCalendar).toBe(false);
    });

    it("merges provided permissions over defaults", () => {
      const ctx = new TenantContext(makeProfile(), { canAccessCalendar: true });
      expect(ctx.permissions.canAccessCalendar).toBe(true);
      expect(ctx.permissions.canAccessReminders).toBe(true);
    });

    it("freezes permissions so they cannot be mutated", () => {
      const ctx = new TenantContext(makeProfile());
      expect(() => {
        (ctx.permissions as unknown as Record<string, unknown>)["canAccessEmail"] = true;
      }).toThrow();
    });
  });

  describe("memory isolation", () => {
    it("stores and retrieves memory entries", () => {
      const ctx = new TenantContext(makeProfile());
      ctx.setMemory("preferredLanguage", "en");
      expect(ctx.getMemory("preferredLanguage")).toBe("en");
    });

    it("returns undefined for unknown keys", () => {
      const ctx = new TenantContext(makeProfile());
      expect(ctx.getMemory("nonexistent")).toBeUndefined();
    });

    it("deletes memory entries", () => {
      const ctx = new TenantContext(makeProfile());
      ctx.setMemory("foo", "bar");
      ctx.deleteMemory("foo");
      expect(ctx.getMemory("foo")).toBeUndefined();
    });

    it("tracks memoryEntryCount correctly", () => {
      const ctx = new TenantContext(makeProfile());
      expect(ctx.memoryEntryCount).toBe(0);
      ctx.setMemory("a", 1);
      ctx.setMemory("b", 2);
      expect(ctx.memoryEntryCount).toBe(2);
      ctx.deleteMemory("a");
      expect(ctx.memoryEntryCount).toBe(1);
    });

    it("throws for empty-string memory keys", () => {
      const ctx = new TenantContext(makeProfile());
      expect(() => ctx.setMemory("", "value")).toThrow();
      expect(() => ctx.getMemory("   ")).toThrow();
    });

    it("two contexts do not share memory", () => {
      const ctxA = new TenantContext(makeProfile({ tenantId: "a", telegramUserId: 1 }));
      const ctxB = new TenantContext(makeProfile({ tenantId: "b", telegramUserId: 2 }));
      ctxA.setMemory("key", "A's value");
      expect(ctxB.getMemory("key")).toBeUndefined();
    });
  });

  describe("credential isolation", () => {
    it("stores and retrieves a credential", () => {
      const ctx = new TenantContext(makeProfile());
      ctx.setCredential({ service: "google", token: "tok-123" });
      const cred = ctx.getCredential("google");
      expect(cred?.token).toBe("tok-123");
    });

    it("returns a copy to prevent external mutation", () => {
      const ctx = new TenantContext(makeProfile());
      ctx.setCredential({ service: "google", token: "original" });
      const cred = ctx.getCredential("google")!;
      cred.token = "mutated";
      expect(ctx.getCredential("google")?.token).toBe("original");
    });

    it("returns undefined for unregistered service", () => {
      const ctx = new TenantContext(makeProfile());
      expect(ctx.getCredential("nonexistent")).toBeUndefined();
    });

    it("deletes a credential", () => {
      const ctx = new TenantContext(makeProfile());
      ctx.setCredential({ service: "google", token: "tok" });
      ctx.deleteCredential("google");
      expect(ctx.getCredential("google")).toBeUndefined();
    });

    it("tracks credentialCount correctly", () => {
      const ctx = new TenantContext(makeProfile());
      expect(ctx.credentialCount).toBe(0);
      ctx.setCredential({ service: "google", token: "t1" });
      ctx.setCredential({ service: "apple", token: "t2" });
      expect(ctx.credentialCount).toBe(2);
      ctx.deleteCredential("google");
      expect(ctx.credentialCount).toBe(1);
    });

    it("throws for credentials with empty service name", () => {
      const ctx = new TenantContext(makeProfile());
      expect(() => ctx.setCredential({ service: "", token: "tok" })).toThrow();
    });

    it("two contexts do not share credentials", () => {
      const ctxA = new TenantContext(makeProfile({ tenantId: "a", telegramUserId: 1 }));
      const ctxB = new TenantContext(makeProfile({ tenantId: "b", telegramUserId: 2 }));
      ctxA.setCredential({ service: "google", token: "secret" });
      expect(ctxB.getCredential("google")).toBeUndefined();
    });
  });
});
