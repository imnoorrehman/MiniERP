export type Page =
  | "Dashboard"
  | "Parties"
  | "Sales"
  | "Purchases"
  | "Payments"
  | "Inventory"
  | "Expenses"
  | "Reports"
  | "Settings";

export type Party = {
  name: string;
  type: "Customer" | "Vendor";
  phone: string;
  city: string;
};

export type Entry = {
  date: string;
  party: string;
  item: string;
  qtyKg: number;
  rate: number;
  total: number;
};

export type Expense = {
  date: string;
  category: string;
  description: string;
  amount: number;
  paidVia: string;
};

export type Payment = {
  date: string;
  party: string;
  type: "Receipt" | "Payment";
  amount: number;
  method: string;
  note: string;
};
