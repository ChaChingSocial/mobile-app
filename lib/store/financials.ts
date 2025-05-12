
import { Transaction } from '@/types/transactions';
import { create } from 'zustand';

interface FinancialsState {
  isTransactionUpdated: boolean;
  setIsTransactionUpdated: (isTransactionUpdated: boolean) => void;
  transactions: any[];
  setTransactions: (transactions: any[]) => void;
  financialGoals: any[];
  setFinancialGoals: (financialGoals: any[]) => void;
  financialKPIs: any[];
  setFinancialKPIs: (financialKPIs: any[]) => void;
  privacySettings: {
    transactions: { privacy: boolean };
    expenseIncomeChart: { privacy: boolean };
    expenseCategoryChart: { privacy: boolean };
    kpiMetrics: { privacy: boolean };
    goals: { privacy: boolean };
    expenseInsights: { privacy: boolean };
  };
  setPrivacySettings: (privacySettings: any) => void;
}

export const useFinancialsStore = create<FinancialsState>((set) => ({
  isTransactionUpdated: false,
  setIsTransactionUpdated: (isTransactionUpdated) => set({ isTransactionUpdated }),
  transactions: [],
  setTransactions: (transactions: Transaction[]) => set({ transactions }),
  financialGoals: [],
  setFinancialGoals: (financialGoals) => set({ financialGoals }),
  financialKPIs: [],
  setFinancialKPIs: (financialKPIs) => set({ financialKPIs }),
  privacySettings: {
    transactions: { privacy: true },
    expenseIncomeChart: { privacy: true },
    expenseCategoryChart: { privacy: true },
    kpiMetrics: { privacy: true },
    goals: { privacy: true },
    expenseInsights: { privacy: true },
  },
  setPrivacySettings: (privacySettings) => set({ privacySettings }),
}));
