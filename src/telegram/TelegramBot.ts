/**
 * TelegramBot — Telegraf-based bot that receives messages and routes them
 * to the correct family member's agent via the MessageRouter.
 *
 * Usage:
 *   const bot = new TelegramBot(token, router);
 *   await bot.launch();
 */
import { Telegraf, Context } from "telegraf";
import { MessageRouter } from "./MessageRouter";

export class TelegramBot {
  private readonly bot: Telegraf;

  constructor(
    token: string,
    private readonly router: MessageRouter
  ) {
    this.bot = new Telegraf(token);
    this.registerHandlers();
  }

  private registerHandlers(): void {
    this.bot.on("text", async (ctx: Context) => {
      const telegramUserId = ctx.from?.id;
      const text = ctx.message && "text" in ctx.message ? ctx.message.text : null;

      if (!telegramUserId || !text) return;

      try {
        const response = await this.router.route(telegramUserId, text);
        await ctx.reply(response.text);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        await ctx.reply(
          `Sorry, I could not process your request: ${message}`
        );
      }
    });
  }

  /** Start the bot and begin receiving updates. */
  async launch(): Promise<void> {
    await this.bot.launch();
  }

  /** Gracefully stop the bot. */
  stop(signal?: string): void {
    this.bot.stop(signal);
  }

  /** Expose the underlying Telegraf instance (e.g. for webhook setup). */
  get telegraf(): Telegraf {
    return this.bot;
  }
}
