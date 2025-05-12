export interface Transaction {
  id: string;
  date: string;
  name: string;
  category: string[];
  amount: number;
  type: string;
  recurrence: string;
  personal_finance_category_icon_url: string;
  personal_finance_category: string;
  logo_url: string;
  iso_currency_code?: string;
}
