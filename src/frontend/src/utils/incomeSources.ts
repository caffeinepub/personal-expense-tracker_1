export interface IncomeSource {
  id: string;
  name: string;
  color: string;
  monthlyBudget: number;
}

const KEY = "pe_income_sources";

export function getIncomeSources(): IncomeSource[] {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export function saveIncomeSources(sources: IncomeSource[]): void {
  localStorage.setItem(KEY, JSON.stringify(sources));
}
