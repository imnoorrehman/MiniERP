import type { Entry } from "../types";

type EntryTableProps = {
  entries: Entry[];
  partyLabel: string;
  onDelete: (index: number) => void;
};

function EntryTable({ entries, partyLabel, onDelete }: EntryTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>{partyLabel}</th>
          <th>Item</th>
          <th>Qty KG</th>
          <th>Rate</th>
          <th>Total</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {entries.map((item, index) => (
          <tr key={index}>
            <td>{item.date}</td>
            <td>{item.party}</td>
            <td>{item.item}</td>
            <td>{item.qtyKg}</td>
            <td>PKR {item.rate.toLocaleString()}</td>
            <td>PKR {item.total.toLocaleString()}</td>
            <td>
              <button className="delete-button" onClick={() => onDelete(index)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default EntryTable;
