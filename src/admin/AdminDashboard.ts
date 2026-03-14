/**
 * AdminDashboard — central view for the service manager to monitor all agents.
 *
 * Provides health reports, per-agent status, and summary statistics.
 * Designed to be queried programmatically or rendered to the console.
 */
import { AgentHealthReport } from "../types";
import { AgentManager } from "../agents/AgentManager";

export interface DashboardSummary {
  totalAgents: number;
  activeAgents: number;
  suspendedAgents: number;
  provisionedAgents: number;
  totalMessages: number;
  reports: AgentHealthReport[];
}

export class AdminDashboard {
  constructor(private readonly manager: AgentManager) {}

  /** Collect and return a full health summary for all managed agents. */
  getSummary(): DashboardSummary {
    const reports = this.manager.getHealthReports();

    const activeAgents = reports.filter((r) => r.status === "active").length;
    const suspendedAgents = reports.filter((r) => r.status === "suspended").length;
    const provisionedAgents = reports.filter((r) => r.status === "provisioned").length;
    const totalMessages = reports.reduce((sum, r) => sum + r.messageCount, 0);

    return {
      totalAgents: reports.length,
      activeAgents,
      suspendedAgents,
      provisionedAgents,
      totalMessages,
      reports,
    };
  }

  /** Print a formatted health summary to the console. */
  printSummary(): void {
    const summary = this.getSummary();
    console.log("=== Agent Dashboard ===");
    console.log(`Total agents   : ${summary.totalAgents}`);
    console.log(`Active         : ${summary.activeAgents}`);
    console.log(`Suspended      : ${summary.suspendedAgents}`);
    console.log(`Provisioned    : ${summary.provisionedAgents}`);
    console.log(`Total messages : ${summary.totalMessages}`);
    console.log("");
    console.log("Agent Details:");
    for (const report of summary.reports) {
      const lastActive = report.lastActiveAt
        ? report.lastActiveAt.toISOString()
        : "never";
      console.log(
        `  [${report.status.toUpperCase().padEnd(12)}] ${report.displayName.padEnd(20)} ` +
        `| msgs: ${report.messageCount} | last active: ${lastActive}`
      );
    }
    console.log("======================");
  }
}
