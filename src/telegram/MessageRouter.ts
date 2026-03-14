/**
 * MessageRouter — routes inbound Telegram messages to the correct family agent.
 *
 * Resolves the sender's Telegram user ID to a registered tenant and delegates
 * message handling to the AgentManager. Unknown users receive a clear error.
 */
import { TelegramUserId } from "../types";
import { AgentManager } from "../agents/AgentManager";
import { TenantContext } from "../models/TenantContext";
import { AgentResponse } from "../agents/FamilyMemberAgent";

export type AiHandler = (
  context: TenantContext,
  message: string
) => Promise<string>;

export class MessageRouter {
  constructor(
    private readonly manager: AgentManager,
    private readonly aiHandler: AiHandler
  ) {}

  /**
   * Route a message from a Telegram user to their registered agent.
   *
   * @param telegramUserId - The sender's Telegram user ID.
   * @param text - The message text received from Telegram.
   * @returns The agent's response.
   * @throws If the Telegram user is not mapped to any tenant.
   */
  async route(
    telegramUserId: TelegramUserId,
    text: string
  ): Promise<AgentResponse> {
    return this.manager.routeMessage(telegramUserId, text, this.aiHandler);
  }
}
