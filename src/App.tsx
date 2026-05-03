import { useEffect, useState } from "react";
import "./App.css";
import type { Entry, Expense, Page, Party, Payment } from "./types";
import EntryTable from "./components/EntryTable";

// --- HELPERS ---
function loadData<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  return JSON.parse(saved);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const pages: Page[] = [
    "Dashboard", "Parties", "Sales", "Purchases", 
    "Payments", "Inventory", "Expenses", "Reports", "Settings"
  ];

  // --- CORE STATE ---
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [parties, setParties] = useState<Party[]>(() => loadData("minierp_parties", []));
  const [sales, setSales] = useState<Entry[]>(() => loadData("minierp_sales", []));
  const [purchases, setPurchases] = useState<Entry[]>(() => loadData("minierp_purchases", []));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadData("minierp_expenses", []));
  const [payments, setPayments] = useState<Payment[]>(() => loadData("minierp_payments", []));

  // --- FORM STATE ---
  const [party, setParty] = useState<Party>({ name: "", type: "Customer", phone: "", city: "" });
  const [sale, setSale] = useState({ date: today(), party: "", item: "Ferrous Scrap", qtyKg: "", rate: "" });
  const [purchase, setPurchase] = useState({ date: today(), party: "", item: "Ferrous Scrap", qtyKg: "", rate: "" });
  const [expense, setExpense] = useState({
    date: today(),
    category: "Rent",
    description: "",
    amount: "",
    paidVia: "Cash",
  });
  const [payment, setPayment] = useState({
    date: today(),
    party: "",
    type: "Receipt" as "Receipt" | "Payment",
    amount: "",
    method: "Cash",
    note: "",
  });

  // --- DERIVED DATA & CALCULATIONS ---
  const customers = parties.filter((item) => item.type === "Customer");
  const vendors = parties.filter((item) => item.type === "Vendor");
  const items = ["Ferrous Scrap", "Billets", "Special Steel"];

  const totalSales = sales.reduce((sum, item) => sum + item.total, 0);
  const totalPurchases = purchases.reduce((sum, item) => sum + item.total, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  const inventory = items.map((itemName) => {
    const purchasedKg = purchases.filter((i) => i.item === itemName).reduce((s, i) => s + i.qtyKg, 0);
    const soldKg = sales.filter((i) => i.item === itemName).reduce((s, i) => s + i.qtyKg, 0);
    const purchaseValue = purchases.filter((i) => i.item === itemName).reduce((s, i) => s + i.total, 0);

    const averageRate = purchasedKg > 0 ? purchaseValue / purchasedKg : 0;
    const balanceKg = purchasedKg - soldKg;
    const stockValue = balanceKg * averageRate;

    return { itemName, purchasedKg, soldKg, balanceKg, averageRate, stockValue };
  });

  const totalStockValue = inventory.reduce((sum, item) => sum + item.stockValue, 0);
  const grossProfit = totalSales - totalPurchases;
  const netProfit = grossProfit - totalExpenses;
  
  const totalReceipts = payments.filter((i) => i.type === "Receipt").reduce((s, i) => s + i.amount, 0);
  const totalPayments = payments.filter((i) => i.type === "Payment").reduce((s, i) => s + i.amount, 0);
  const cashBalance = totalReceipts - totalPayments - totalExpenses;

  const partyBalances = parties.map((p) => {
    const pSales = sales.filter((i) => i.party === p.name).reduce((s, i) => s + i.total, 0);
    const pPurchases = purchases.filter((i) => i.party === p.name).reduce((s, i) => s + i.total, 0);
    const pReceipts = payments.filter((i) => i.party === p.name && i.type === "Receipt").reduce((s, i) => s + i.amount, 0);
    const pPayments = payments.filter((i) => i.party === p.name && i.type === "Payment").reduce((s, i) => s + i.amount, 0);

    const balance = p.type === "Customer" ? pSales - pReceipts : pPurchases - pPayments;
    return { ...p, sales: pSales, purchases: pPurchases, receipts: pReceipts, payments: pPayments, balance };
  });

  // --- ACTIONS ---
  function addParty() {
    if (!party.name.trim()) return alert("Please enter party name");
    setParties([...parties, party]);
    setParty({ name: "", type: "Customer", phone: "", city: "" });
  }

  function addEntry(
    form: { date: string; party: string; item: string; qtyKg: string; rate: string },
    save: (items: Entry[]) => void,
    currentItems: Entry[],
    reset: () => void
  ) {
    if (!form.party) return alert("Please select party");
    const qtyKg = Number(form.qtyKg);
    const rate = Number(form.rate);
    if (qtyKg <= 0 || rate <= 0) return alert("Please enter valid quantity and rate");

    save([...currentItems, { date: form.date, party: form.party, item: form.item, qtyKg, rate, total: qtyKg * rate }]);
    reset();
  }

  function addExpense() {
    const amount = Number(expense.amount);
    if (!expense.description.trim()) return alert("Please enter expense description");
    if (amount <= 0) return alert("Please enter valid amount");

    setExpenses([...expenses, { ...expense, amount }]);
    setExpense({ date: today(), category: "Rent", description: "", amount: "", paidVia: "Cash" });
  }

  function addPayment() {
    const amount = Number(payment.amount);
    if (!payment.party) return alert("Please select party");
    if (amount <= 0) return alert("Please enter valid amount");

    setPayments([...payments, { ...payment, amount }]);
    setPayment({ date: today(), party: "", type: "Receipt", amount: "", method: "Cash", note: "" });
  }

  // --- DELETE HANDLERS ---
  const deleteParty = (index: number) => setParties(parties.filter((_, i) => i !== index));
  const deleteSale = (index: number) => setSales(sales.filter((_, i) => i !== index));
  const deletePurchase = (index: number) => setPurchases(purchases.filter((_, i) => i !== index));
  const deleteExpense = (index: number) => setExpenses(expenses.filter((_, i) => i !== index));
  const deletePayment = (index: number) => setPayments(payments.filter((_, i) => i !== index));

  // --- BACKUP LOGIC ---
  function exportBackup() {
    const backup = { parties, sales, purchases, expenses, payments, exportedAt: new Date().toISOString() };
    const file = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "minierp-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = JSON.parse(String(reader.result));
      setParties(data.parties || []);
      setSales(data.sales || []);
      setPurchases(data.purchases || []);
      setExpenses(data.expenses || []);
      setPayments(data.payments || []);
      alert("Backup imported successfully");
    };
    reader.readAsText(file);
  }

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem("minierp_parties", JSON.stringify(parties)) }, [parties]);
  useEffect(() => { localStorage.setItem("minierp_sales", JSON.stringify(sales)) }, [sales]);
  useEffect(() => { localStorage.setItem("minierp_purchases", JSON.stringify(purchases)) }, [purchases]);
  useEffect(() => { localStorage.setItem("minierp_expenses", JSON.stringify(expenses)) }, [expenses]);
  useEffect(() => { localStorage.setItem("minierp_payments", JSON.stringify(payments)) }, [payments]);

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>MiniERP</h2>
        <nav>
          {pages.map((page) => (
            <button key={page} className={activePage === page ? "active" : ""} onClick={() => setActivePage(page)}>
              {page}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        {/* DASHBOARD */}
        {activePage === "Dashboard" && (
          <>
            <h1>Dashboard</h1>
            <p>Welcome to MiniERP. This is your business control panel.</p>
            <section className="cards">
              <div className="card"><span>Total Sales</span><strong>PKR {totalSales.toLocaleString()}</strong></div>
              <div className="card"><span>Total Purchases</span><strong>PKR {totalPurchases.toLocaleString()}</strong></div>
              <div className="card"><span>Total Expenses</span><strong>PKR {totalExpenses.toLocaleString()}</strong></div>
              <div className="card"><span>Total Parties</span><strong>{parties.length}</strong></div>
              <div className="card"><span>Stock Value</span><strong>PKR {totalStockValue.toLocaleString()}</strong></div>
              <div className="card"><span>Net Profit</span><strong>PKR {netProfit.toLocaleString()}</strong></div>
              <div className="card"><span>Cash Balance</span><strong>PKR {cashBalance.toLocaleString()}</strong></div>
            </section>
          </>
        )}

        {/* PARTIES */}
        {activePage === "Parties" && (
          <>
            <h1>Parties</h1>
            <div className="form">
              <input placeholder="Party name" value={party.name} onChange={(e) => setParty({ ...party, name: e.target.value })} />
              <select value={party.type} onChange={(e) => setParty({ ...party, type: e.target.value as "Customer" | "Vendor" })}>
                <option>Customer</option>
                <option>Vendor</option>
              </select>
              <input placeholder="Phone" value={party.phone} onChange={(e) => setParty({ ...party, phone: e.target.value })} />
              <input placeholder="City" value={party.city} onChange={(e) => setParty({ ...party, city: e.target.value })} />
              <button onClick={addParty}>Add Party</button>
            </div>
            <table>
              <thead>
                <tr><th>Name</th><th>Type</th><th>Phone</th><th>City</th><th>Action</th></tr>
              </thead>
              <tbody>
                {parties.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td><td>{item.type}</td><td>{item.phone}</td><td>{item.city}</td>
                    <td><button className="delete-button" onClick={() => deleteParty(index)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* SALES */}
        {activePage === "Sales" && (
          <>
            <h1>Sales</h1>
            <div className="form">
              <input type="date" value={sale.date} onChange={(e) => setSale({ ...sale, date: e.target.value })} />
              <select value={sale.party} onChange={(e) => setSale({ ...sale, party: e.target.value })}>
                <option value="">Select customer</option>
                {customers.map((c, i) => <option key={i}>{c.name}</option>)}
              </select>
              <select value={sale.item} onChange={(e) => setSale({ ...sale, item: e.target.value })}>
                <option>Ferrous Scrap</option><option>Billets</option><option>Special Steel</option>
              </select>
              <input placeholder="Qty KG" type="number" value={sale.qtyKg} onChange={(e) => setSale({ ...sale, qtyKg: e.target.value })} />
              <input placeholder="Rate per KG" type="number" value={sale.rate} onChange={(e) => setSale({ ...sale, rate: e.target.value })} />
              <button onClick={() => addEntry(sale, setSales, sales, () => setSale({ date: today(), party: "", item: "Ferrous Scrap", qtyKg: "", rate: "" }))}>
                Add Sale
              </button>
            </div>
            <EntryTable entries={sales} partyLabel="Customer" onDelete={deleteSale} />
          </>
        )}

        {/* PURCHASES */}
        {activePage === "Purchases" && (
          <>
            <h1>Purchases</h1>
            <div className="form">
              <input type="date" value={purchase.date} onChange={(e) => setPurchase({ ...purchase, date: e.target.value })} />
              <select value={purchase.party} onChange={(e) => setPurchase({ ...purchase, party: e.target.value })}>
                <option value="">Select vendor</option>
                {vendors.map((v, i) => <option key={i}>{v.name}</option>)}
              </select>
              <select value={purchase.item} onChange={(e) => setPurchase({ ...purchase, item: e.target.value })}>
                <option>Ferrous Scrap</option><option>Billets</option><option>Special Steel</option>
              </select>
              <input placeholder="Qty KG" type="number" value={purchase.qtyKg} onChange={(e) => setPurchase({ ...purchase, qtyKg: e.target.value })} />
              <input placeholder="Rate per KG" type="number" value={purchase.rate} onChange={(e) => setPurchase({ ...purchase, rate: e.target.value })} />
              <button onClick={() => addEntry(purchase, setPurchases, purchases, () => setPurchase({ date: today(), party: "", item: "Ferrous Scrap", qtyKg: "", rate: "" }))}>
                Add Purchase
              </button>
            </div>
            <EntryTable entries={purchases} partyLabel="Vendor" onDelete={deletePurchase} />
          </>
        )}

        {/* EXPENSES */}
        {activePage === "Expenses" && (
          <>
            <h1>Expenses</h1>
            <div className="form">
              <input type="date" value={expense.date} onChange={(e) => setExpense({ ...expense, date: e.target.value })} />
              <select value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })}>
                <option>Rent</option><option>Salaries</option><option>Transport / Freight</option>
                <option>Utilities</option><option>Fuel</option><option>Miscellaneous</option>
              </select>
              <input placeholder="Description" value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} />
              <input placeholder="Amount" type="number" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} />
              <select value={expense.paidVia} onChange={(e) => setExpense({ ...expense, paidVia: e.target.value })}>
                <option>Cash</option><option>Cheque</option><option>Online Transfer</option><option>TT</option>
              </select>
              <button onClick={addExpense}>Add Expense</button>
            </div>
            <table>
              <thead>
                <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Paid Via</th><th>Action</th></tr>
              </thead>
              <tbody>
                {expenses.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td><td>{item.category}</td><td>{item.description}</td>
                    <td>PKR {item.amount.toLocaleString()}</td><td>{item.paidVia}</td>
                    <td><button className="delete-button" onClick={() => deleteExpense(index)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* INVENTORY */}
        {activePage === "Inventory" && (
          <>
            <h1>Inventory</h1>
            <table>
              <thead>
                <tr><th>Item</th><th>Purchased KG</th><th>Sold KG</th><th>Balance KG</th><th>Average Rate</th><th>Stock Value</th></tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.itemName}>
                    <td>{item.itemName}</td><td>{item.purchasedKg.toLocaleString()}</td><td>{item.soldKg.toLocaleString()}</td>
                    <td>{item.balanceKg.toLocaleString()}</td><td>PKR {item.averageRate.toLocaleString()}</td>
                    <td>PKR {item.stockValue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* REPORTS */}
        {activePage === "Reports" && (
          <>
            <h1>Reports</h1>
            <section className="cards">
              <div className="card"><span>Net Profit</span><strong>PKR {netProfit.toLocaleString()}</strong></div>
              <div className="card"><span>Cash Balance</span><strong>PKR {cashBalance.toLocaleString()}</strong></div>
              <div className="card"><span>Stock Value</span><strong>PKR {totalStockValue.toLocaleString()}</strong></div>
            </section>
            <h2>Party Balances</h2>
            <table>
              <thead>
                <tr><th>Party</th><th>Type</th><th>Sales</th><th>Purchases</th><th>Receipts</th><th>Payments</th><th>Balance</th></tr>
              </thead>
              <tbody>
                {partyBalances.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td><td>{item.type}</td>
                    <td>PKR {item.sales.toLocaleString()}</td><td>PKR {item.purchases.toLocaleString()}</td>
                    <td>PKR {item.receipts.toLocaleString()}</td><td>PKR {item.payments.toLocaleString()}</td>
                    <td>PKR {item.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* PAYMENTS */}
        {activePage === "Payments" && (
          <>
            <h1>Payments</h1>
            <div className="form">
              <input type="date" value={payment.date} onChange={(e) => setPayment({ ...payment, date: e.target.value })} />
              <select value={payment.type} onChange={(e) => setPayment({ ...payment, type: e.target.value as "Receipt" | "Payment" })}>
                <option>Receipt</option><option>Payment</option>
              </select>
              <select value={payment.party} onChange={(e) => setPayment({ ...payment, party: e.target.value })}>
                <option value="">Select party</option>
                {parties.map((p, i) => <option key={i}>{p.name}</option>)}
              </select>
              <input placeholder="Amount" type="number" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />
              <select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}>
                <option>Cash</option><option>Cheque</option><option>Online Transfer</option><option>TT</option>
              </select>
              <input placeholder="Note" value={payment.note} onChange={(e) => setPayment({ ...payment, note: e.target.value })} />
              <button onClick={addPayment}>Add</button>
            </div>
            <table>
              <thead>
                <tr><th>Date</th><th>Type</th><th>Party</th><th>Amount</th><th>Method</th><th>Note</th><th>Action</th></tr>
              </thead>
              <tbody>
                {payments.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td><td>{item.type}</td><td>{item.party}</td>
                    <td>PKR {item.amount.toLocaleString()}</td><td>{item.method}</td><td>{item.note}</td>
                    <td><button className="delete-button" onClick={() => deletePayment(index)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* SETTINGS */}
        {activePage === "Settings" && (
          <>
            <h1>Settings</h1>
            <button className="primary-button" onClick={exportBackup}>Download Backup</button>
            <br /><br />
            <input type="file" accept=".json" onChange={importBackup} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;