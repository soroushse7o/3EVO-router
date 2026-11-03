import { getSettings } from "@/lib/db/repos/settingsRepo.js";
import { getUsageHistory } from "@/lib/db/repos/usageRepo.js";
import { estimateCost } from "@/lib/db";

export async function checkBudget(provider: string, model: string, tokensIn: number, tokensOut: number): Promise<{ exceeded: boolean; remaining?: number }> {
  const settings = await getSettings();
  const budget = Number(settings.monthlyBudgetUsd || 0);
  if (budget <= 0) return { exceeded: false };

  const now = Date.now();
  const monthStart = new Date(now);
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const rows = await getUsageHistory(1000);
  const monthUsage = rows
    .filter((r: any) => r.ts >= monthStart.getTime())
    .reduce((sum: number, r: any) => {
      const cost = estimateCost(r.model || model, r.tokens_in || 0, r.tokens_out || 0, r.provider || provider);
      return sum + cost;
    }, 0);

  const requestCost = estimateCost(model, tokensIn, tokensOut, provider);
  const totalAfter = monthUsage + requestCost;

  if (totalAfter > budget) {
    return { exceeded: true, remaining: Math.max(0, budget - monthUsage) };
  }

  return { exceeded: false, remaining: budget - totalAfter };
}
