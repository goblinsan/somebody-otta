/**
 * Main entry point for the somebody-otta managed family agent service.
 *
 * In production, set the following environment variables:
 *   TELEGRAM_BOT_TOKEN  — token issued by @BotFather
 *
 * Family members are onboarded via AgentManager.onboard(). Their Telegram
 * user IDs are used to route all future messages to the correct isolated agent.
 */
import { AgentManager } from "./agents/AgentManager";
import { AdminDashboard } from "./admin/AdminDashboard";
import { MessageRouter, AiHandler } from "./telegram/MessageRouter";
import { TelegramBot } from "./telegram/TelegramBot";
import { TenantContext } from "./models/TenantContext";

/** Placeholder AI handler — replace with a real AI service integration. */
const defaultAiHandler: AiHandler = async (
  context: TenantContext,
  message: string
): Promise<string> => {
  return `Hello ${context.profile.displayName}! You said: "${message}"`;
};

async function main(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is required.");
  }

  const manager = new AgentManager();
  const router = new MessageRouter(manager, defaultAiHandler);
  const bot = new TelegramBot(token, router);
  const dashboard = new AdminDashboard(manager);

  // Graceful shutdown
  process.once("SIGINT", () => {
    dashboard.printSummary();
    bot.stop("SIGINT");
  });
  process.once("SIGTERM", () => {
    dashboard.printSummary();
    bot.stop("SIGTERM");
  });

  await bot.launch();
  console.log("somebody-otta is running.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
