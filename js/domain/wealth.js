import { sumCents } from "./money.js";

const INVESTMENT_TYPES = new Set(["etf", "bond"]);
const LIQUIDITY_TYPES = new Set(["checking", "deposit", "cash"]);

export function calculateWealthSummary(positions) {
  const active = positions.filter((position) => position.status !== "archived");
  const totalCents = sumCents(active.map((position) => position.currentValueCents));
  const liquidity = active.filter((position) => LIQUIDITY_TYPES.has(position.type));
  const investments = active.filter((position) => INVESTMENT_TYPES.has(position.type));
  const lockedDepositCents = sumCents(liquidity
    .filter((position) => position.type === "deposit" && position.depositType === "locked")
    .map((position) => position.currentValueCents));
  const liquidityCents = sumCents(liquidity.map((position) => position.currentValueCents));
  const investmentValueCents = sumCents(investments.map((position) => position.currentValueCents));
  const investedCapitalCents = sumCents(investments.map((position) => position.investedCapitalCents ?? 0));
  const unrealizedGainCents = investmentValueCents - investedCapitalCents;
  return {
    totalCents,
    liquidityCents,
    immediatelyAvailableCents: liquidityCents - lockedDepositCents,
    lockedDepositCents,
    investmentValueCents,
    investedCapitalCents,
    unrealizedGainCents,
    unrealizedGainPercent: investedCapitalCents > 0 ? (unrealizedGainCents / investedCapitalCents) * 100 : null
  };
}

export function calculateInvestmentGain(position) {
  if (!INVESTMENT_TYPES.has(position.type)) return null;
  const capital = position.investedCapitalCents ?? 0;
  const gainCents = position.currentValueCents - capital;
  return { gainCents, percent: capital > 0 ? (gainCents / capital) * 100 : null };
}
