import { useEffect, useState } from "react";
import "./App.css";
import type { Entry, Expense, Page, Party, Payment } from "./types";
import EntryTable from "./components/EntryTable";



type Page = "Dashboard" | "Parties" | "Sales" | "Purchases" | "Payments" | "Inventory" | "Expenses" | "Reports" | "Settings";


function loadData<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);

  if (!saved) {
    return fallback;
  }

  return JSON.parse(saved);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}


function App() {
  const pages: Page[] = ["Dashboard", "Parties", "Sales", "Purchases", "Payments", "Inventory", "Expenses", "Reports", "Settings"];


  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [parties, setParties] = useState<Party[]>(() =>
  loadData("minierp_parties", [])
);

const [sales, setSales] = useState<Entry[]>(() =>
  loadData("minierp_sales", [])
);

const [purchases, setPurchases] = useState<Entry[]>(() =>
  loadData("minierp_purchases", [])
);

const [expenses, setExpenses] = useState<Expense[]>(() =>
  loadData("minierp_expenses", [])
);

const [payments, setPayments] = useState<Payment[]>(() =>
  loadData("minierp_payments", [])
);




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




  const customers = parties.filter((item) => item.type === "Customer");
  const vendors = parties.filter((item) => item.type === "Vendor");

  const totalSales = sales.reduce((sum, item) => sum + item.total, 0);
  const totalPurchases = purchases.reduce((sum, item) => sum + item.total, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  const items = ["Ferrous Scrap", "Billets", "Special Steel"];

  const inventory = items.map((itemName) => {
  const purchasedKg = purchases
    .filter((item) => item.item === itemName)
    .reduce((sum, item) => sum + item.qtyKg, 0);

  const soldKg = sales
    .filter((item) => item.item === itemName)
    .reduce((sum, item) => sum + item.qtyKg, 0);

  const purchaseValue = purchases
    .filter((item) => item.item === itemName)
    .reduce((sum, item) => sum + item.total, 0);

  const averageRate = purchasedKg > 0 ? purchaseValue / purchasedKg : 0;
  const balanceKg = purchasedKg - soldKg;
  const stockValue = balanceKg * averageRate;

  return {
    itemName,
    purchasedKg,
    soldKg,
    balanceKg,
    averageRate,
    stockValue,
  };
});

const totalStockValue = inventory.reduce((sum, item) => sum + item.stockValue, 0);
const grossProfit = totalSales - totalPurchases;
const netProfit = grossProfit - totalExpenses;
const totalReceipts = payments
  .filter((item) => item.type === "Receipt")
  .reduce((sum, item) => sum + item.amount, 0);

const totalPayments = payments
  .filter((item) => item.type === "Payment")
  .reduce((sum, item) => sum + item.amount, 0);

const cashBalance = totalReceipts - totalPayments - totalExpenses;
const partyBalances = parties.map((party) => {
  const partySales = sales
    .filter((item) => item.party === party.name)
    .reduce((sum, item) => sum + item.total, 0);

  const partyPurchases = purchases
    .filter((item) => item.party === party.name)
    .reduce((sum, item) => sum + item.total, 0);

  const partyReceipts = payments
    .filter((item) => item.party === party.name && item.type === "Receipt")
    .reduce((sum, item) => sum + item.amount, 0);

  const partyPayments = payments
    .filter((item) => item.party === party.name && item.type === "Payment")
    .reduce((sum, item) => sum + item.amount, 0);

  const balance =
    party.type === "Customer"
      ? partySales - partyReceipts
      : partyPurchases - partyPayments;

  return {
    ...party,
    sales: partySales,
    purchases: partyPurchases,
    receipts: partyReceipts,
    payments: partyPayments,
    balance,
  };
});




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

  setExpenses([
  ...expenses,
  {
    date: expense.date,
    category: expense.category,
    description: expense.description,
    amount,
    paidVia: expense.paidVia,
  },
]);


  setExpense({
  date: today(),
  category: "Rent",
  description: "",
  amount: "",
  paidVia: "Cash",
});

}

function addPayment() {
  const amount = Number(payment.amount);

  if (!payment.party) return alert("Please select party");
  if (amount <= 0) return alert("Please enter valid amount");

  setPayments([
    ...payments,
    {
      date: payment.date,
      party: payment.party,
      type: payment.type,
      amount,
      method: payment.method,
      note: payment.note,
    },
  ]);

  setPayment({
    date: today(),
    party: "",
    type: "Receipt",
    amount: "",
    method: "Cash",
    note: "",
  });
}

function deleteParty(index: number) {
  setParties(parties.filter((_, itemIndex) => itemIndex !== index));
}

function deleteSale(index: number) {
  setSales(sales.filter((_, itemIndex) => itemIndex !== index));
}

function deletePurchase(index: number) {
  setPurchases(purchases.filter((_, itemIndex) => itemIndex !== index));
}

function deleteExpense(index: number) {
  setExpenses(expenses.filter((_, itemIndex) => itemIndex !== index));
}

function deletePayment(index: number) {
  setPayments(payments.filter((_, itemIndex) => itemIndex !== index));
}

function exportBackup() {
  const backup = {
    parties,
    sales,
    purchases,
    expenses,
    payments,
    exportedAt: new Date().toISOString(),
  };

  const file = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });

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





useEffect(() => {
  localStorage.setItem("minierp_parties", JSON.stringify(parties));
}, [parties]);

useEffect(() => {
  localStorage.setItem("minierp_sales", JSON.stringify(sales));
}, [sales]);

useEffect(() => {
  localStorage.setItem("minierp_purchases", JSON.stringify(purchases));
}, [purchases]);

useEffect(() => {
  localStorage.setItem("minierp_expenses", JSON.stringify(expenses));
}, [expenses]);

useEffect(() => {
  localStorage.setItem("minierp_payments", JSON.stringify(payments));
}, [payments]);


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
        {activePage === "Dashboard" && (
          <>
            <h1>Dashboard</h1>
            <p>Welcome to MiniERP. This is your business control panel.</p>

            <section className="cards">
              <div className="card"><span>Total Sales</span><strong>PKR {totalSales.toLocaleString()}</strong></div>
              <div className="card"><span>Total Purchases</span><strong>PKR {totalPurchases.toLocaleString()}</strong></div>
              <div className="card">
  <span>Total Expenses</span>
  <strong>PKR {totalExpenses.toLocaleString()}</strong>
</div>

              <div className="card"><span>Total Parties</span><strong>{parties.length}</strong></div>
              <div className="card">
  <span>Stock Value</span>
  <strong>PKR {totalStockValue.toLocaleString()}</strong>
</div>
<div className="card">
  <span>Net Profit</span>
  <strong>PKR {netProfit.toLocaleString()}</strong>
</div>

<div className="card">
  <span>Cash Balance</span>
  <strong>PKR {cashBalance.toLocaleString()}</strong>
</div>


            </section>
          </>
        )}

        {activePage === "Parties" && (
          <>
            <h1>Parties</h1>
            <p>Add customers and vendors here.</p>

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
  <td>{item.name}</td>
  <td>{item.type}</td>
  <td>{item.phone}</td>
  <td>{item.city}</td>
  <td>
    <button className="delete-button" onClick={() => deleteParty(index)}>
      Delete
    </button>
  </td>
</tr>

                ))}
              </tbody>
            </table>
          </>
        )}

        {activePage === "Sales" && (
          <>
            <h1>Sales</h1>
            <p>Create sales entries here.</p>

            <div className="form">
              <input
  type="date"
  value={sale.date}
  onChange={(e) => setSale({ ...sale, date: e.target.value })}
/>

              <select value={sale.party} onChange={(e) => setSale({ ...sale, party: e.target.value })}>
                <option value="">Select customer</option>
                {customers.map((customer, index) => <option key={index}>{customer.name}</option>)}
              </select>

              <select value={sale.item} onChange={(e) => setSale({ ...sale, item: e.target.value })}>
                <option>Ferrous Scrap</option><option>Billets</option><option>Special Steel</option>
              </select>

              <input placeholder="Qty KG" type="number" value={sale.qtyKg} onChange={(e) => setSale({ ...sale, qtyKg: e.target.value })} />
              <input placeholder="Rate per KG" type="number" value={sale.rate} onChange={(e) => setSale({ ...sale, rate: e.target.value })} />

              <button onClick={() => addEntry(sale, setSales, sales, () => setSale({ date: today(), party: "", item: "Ferrous Scrap", qtyKg: "", rate: "" })
              )
            }
            >
                Add Sale
              </button>
            </div>

            <EntryTable entries={sales} partyLabel="Customer" onDelete={deleteSale} />

          </>
        )}

        {activePage === "Purchases" && (
          <>
            <h1>Purchases</h1>
            <p>Record purchase entries from vendors.</p>

            <div className="form">
              <input
  type="date"
  value={purchase.date}
  onChange={(e) => setPurchase({ ...purchase, date: e.target.value })}
/>

              <select value={purchase.party} onChange={(e) => setPurchase({ ...purchase, party: e.target.value })}>
                <option value="">Select vendor</option>
                {vendors.map((vendor, index) => <option key={index}>{vendor.name}</option>)}
              </select>

              <select value={purchase.item} onChange={(e) => setPurchase({ ...purchase, item: e.target.value })}>
                <option>Ferrous Scrap</option><option>Billets</option><option>Special Steel</option>
              </select>

              <input placeholder="Qty KG" type="number" value={purchase.qtyKg} onChange={(e) => setPurchase({ ...purchase, qtyKg: e.target.value })} />
              <input placeholder="Rate per KG" type="number" value={purchase.rate} onChange={(e) => setPurchase({ ...purchase, rate: e.target.value })} />

              <button onClick={() => addEntry(purchase, setPurchases, purchases, () => setPurchase({ date: today(), party: "", item: "Ferrous Scrap", qtyKg: "", rate: "" })
              )
            }
            >

                Add Purchase
              </button>
            </div>

            <EntryTable entries={purchases} partyLabel="Vendor" onDelete={deletePurchase} />

          </>
        )}

        {activePage === "Expenses" && (
  <>
    <h1>Expenses</h1>
    <p>Record business expenses here.</p>

    <div className="form">
      <input
  type="date"
  value={expense.date}
  onChange={(e) => setExpense({ ...expense, date: e.target.value })}
/>

      <select value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })}>
        <option>Rent</option>
        <option>Salaries</option>
        <option>Transport / Freight</option>
        <option>Utilities</option>
        <option>Fuel</option>
        <option>Miscellaneous</option>
      </select>

      <input placeholder="Description" value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} />
      <input placeholder="Amount" type="number" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} />

      <select value={expense.paidVia} onChange={(e) => setExpense({ ...expense, paidVia: e.target.value })}>
        <option>Cash</option>
        <option>Cheque</option>
        <option>Online Transfer</option>
        <option>TT</option>
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
            <td>{item.date}</td>
            <td>{item.category}</td>
            <td>{item.description}</td>
            <td>PKR {item.amount.toLocaleString()}</td>
            <td>{item.paidVia}</td>
            <td>
  <button className="delete-button" onClick={() => deleteExpense(index)}>
    Delete
  </button>
</td>

          </tr>
        ))}
      </tbody>
    </table>
  </>
)}

{activePage === "Inventory" && (
  <>
    <h1>Inventory</h1>
    <p>Stock is calculated from purchases and sales.</p>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Purchased KG</th>
          <th>Sold KG</th>
          <th>Balance KG</th>
          <th>Average Rate</th>
          <th>Stock Value</th>
        </tr>
      </thead>

      <tbody>
        {inventory.map((item) => (
          <tr key={item.itemName}>
            <td>{item.itemName}</td>
            <td>{item.purchasedKg.toLocaleString()}</td>
            <td>{item.soldKg.toLocaleString()}</td>
            <td>{item.balanceKg.toLocaleString()}</td>
            <td>PKR {item.averageRate.toLocaleString()}</td>
            <td>PKR {item.stockValue.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
)}

{activePage === "Reports" && (
  <>
    <h1>Reports</h1>
    <p>Basic profit and stock report.</p>

    <section className="cards">
      <div className="card">
        <span>Total Sales</span>
        <strong>PKR {totalSales.toLocaleString()}</strong>
      </div>

      <div className="card">
        <span>Total Purchases</span>
        <strong>PKR {totalPurchases.toLocaleString()}</strong>
      </div>

      <div className="card">
        <span>Total Expenses</span>
        <strong>PKR {totalExpenses.toLocaleString()}</strong>
      </div>

      <div className="card">
        <span>Gross Profit</span>
        <strong>PKR {grossProfit.toLocaleString()}</strong>
      </div>

      <div className="card">
        <span>Net Profit</span>
        <strong>PKR {netProfit.toLocaleString()}</strong>
      </div>

      <div className="card">
  <span>Cash Balance</span>
  <strong>PKR {cashBalance.toLocaleString()}</strong>
</div>


      <div className="card">
        <span>Stock Value</span>
        <strong>PKR {totalStockValue.toLocaleString()}</strong>
      </div>
    </section>

    <h2>Inventory Summary</h2>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Balance KG</th>
          <th>Average Rate</th>
          <th>Stock Value</th>
        </tr>
      </thead>

      <tbody>
        {inventory.map((item) => (
          <tr key={item.itemName}>
            <td>{item.itemName}</td>
            <td>{item.balanceKg.toLocaleString()}</td>
            <td>PKR {item.averageRate.toLocaleString()}</td>
            <td>PKR {item.stockValue.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <h2>Party Balances</h2>

<table>
  <thead>
    <tr>
      <th>Party</th>
      <th>Type</th>
      <th>Sales</th>
      <th>Purchases</th>
      <th>Receipts</th>
      <th>Payments</th>
      <th>Balance</th>
    </tr>
  </thead>

  <tbody>
    {partyBalances.map((item) => (
      <tr key={item.name}>
        <td>{item.name}</td>
        <td>{item.type}</td>
        <td>PKR {item.sales.toLocaleString()}</td>
        <td>PKR {item.purchases.toLocaleString()}</td>
        <td>PKR {item.receipts.toLocaleString()}</td>
        <td>PKR {item.payments.toLocaleString()}</td>
        <td>PKR {item.balance.toLocaleString()}</td>
      </tr>
    ))}
  </tbody>
</table>

  </>
)}

{activePage === "Payments" && (
  <>
    <h1>Payments</h1>
    <p>Record customer receipts and vendor payments.</p>

    <div className="form">
      <input
  type="date"
  value={payment.date}
  onChange={(e) => setPayment({ ...payment, date: e.target.value })}
/>

      <select value={payment.type} onChange={(e) => setPayment({ ...payment, type: e.target.value as "Receipt" | "Payment" })}>
        <option>Receipt</option>
        <option>Payment</option>
      </select>

      <select value={payment.party} onChange={(e) => setPayment({ ...payment, party: e.target.value })}>
        <option value="">Select party</option>
        {parties.map((party, index) => (
          <option key={index}>{party.name}</option>
        ))}
      </select>

      <input placeholder="Amount" type="number" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />

      <select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}>
        <option>Cash</option>
        <option>Cheque</option>
        <option>Online Transfer</option>
        <option>TT</option>
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
            <td>{item.date}</td>
            <td>{item.type}</td>
            <td>{item.party}</td>
            <td>PKR {item.amount.toLocaleString()}</td>
            <td>{item.method}</td>
            <td>{item.note}</td>
            <td>
  <button className="delete-button" onClick={() => deletePayment(index)}>
    Delete
  </button>
</td>

          </tr>
        ))}
      </tbody>
    </table>
  </>
)}


        {activePage === "Settings" && (
  <>
    <h1>Settings</h1>
    <p>Manage MiniERP backup and basic settings.</p>

    <button className="primary-button" onClick={exportBackup}>
      Download Backup
    </button>
    <br />
<br />

<input type="file" accept=".json" onChange={importBackup} />

  </>
  
)}

      </main>
    </div>
  );
}

export default App;
