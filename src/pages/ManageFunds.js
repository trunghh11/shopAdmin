import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

export default function ManageFunds() {
  const [funds, setFunds] = useState([]);
  const [newFund, setNewFund] = useState({ FundName: '', StartDate: '', EndDate: '', TargetAmount: '', Status: 'Open' });
  const [isLoading, setIsLoading] = useState(false);
  const excelRows = [];


  const handleStatusUpdate = async (fundId, newStatus) => {
  try {
    const snapshot = await getDocs(collection(db, "fund_transaction"));

    // Lọc các transaction liên quan đến fundId và đã được xác nhận
    const verifiedTransactions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(tx => tx.FundID === fundId && tx.IsVerified);

    const totalAmount = verifiedTransactions.reduce(
      (sum, tx) => sum + parseInt(tx.Amount || 0), 0
    );

    // Cập nhật vào fund
    await updateDoc(doc(db, "fund", fundId), {
      Status: newStatus,
      CollectedAmount: totalAmount
    });

    // ✅ Xuất Excel
    const worksheetData = verifiedTransactions.map(tx => ({
      DonorID: tx.DonorID,
      FundID: tx.FundID,
      Amount: tx.Amount,
      Verified: tx.IsVerified,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Verified Transactions");

    XLSX.writeFile(workbook, `Report_Fund_${fundId}.xlsx`);

    toast.success(`${verifiedTransactions.length} verified transactions exported. Total: ${totalAmount} VND`);
  } catch (err) {
    toast.error("Failed to update fund status or export.");
    console.error(err);
  }
};

  const fetchFunds = async () => {
    const q = collection(db, "fund");
    const querySnapshot = await getDocs(q);
    setFunds(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  const createFund = async () => {
    if (!newFund.FundName || !newFund.StartDate || !newFund.EndDate || !newFund.TargetAmount || !newFund.Type) {
      toast.error("Please fill all fields.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...newFund,
        StartDate: new Date(newFund.StartDate),
        EndDate: new Date(newFund.EndDate),
        TargetAmount: parseInt(newFund.TargetAmount)
      };
      await addDoc(collection(db, "fund"), payload);
      toast.success("Fund created successfully!");
      setNewFund({ FundName: '', StartDate: '', EndDate: '', TargetAmount: '', Status: 'Open' });
      fetchFunds();
    } catch (error) {
      toast.error("Failed to create fund.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id, Status) => {
    try {
      await updateDoc(doc(db, "fund", id), { Status });
      toast.success("Status updated.");
      fetchFunds();
    } catch (error) {
      toast.error("Failed to update status.");
    }
  };

  const deleteFund = async (id) => {
    try {
      await deleteDoc(doc(db, "fund", id));
      toast.success("Fund deleted.");
      fetchFunds();
    } catch (error) {
      toast.error("Failed to delete fund.");
    }
  };

  const uploadStatement = async (fundId) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".xlsx,.xls";

    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range(sheet["!ref"]);

        const matched = [];

        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellE = sheet[XLSX.utils.encode_cell({ c: 4, r: row })];
          const cellF = sheet[XLSX.utils.encode_cell({ c: 5, r: row })];
          const content = `${cellE?.v || ""} ${cellF?.v || ""}`.trim();
          console.log(`Row ${row + 1} E-F:`, content);

          const regex = /Hoc sinh (\w+) chuyen tien cho quy (\w+)/gi;
          let match;
          while ((match = regex.exec(content)) !== null) {
            const DonorID = match[1];
            const FundID = match[2];

            if (FundID === fundId) {
              matched.push({ DonorID, FundID });
              excelRows.push({ DonorID, FundID });
              console.log("Matched row:", { DonorID, FundID });
            }
          }
        }

        const transactionsSnapshot = await getDocs(collection(db, "fund_transaction"));
        let verifiedCount = 0;
        let totalAmount = 0;

        for (const docSnap of transactionsSnapshot.docs) {
          const data = docSnap.data();
          const isMatched = matched.find(item => item.DonorID === data.DonorID && item.FundID === data.FundID);

          if (isMatched && !data.IsVerified) {
            await updateDoc(doc(db, "fund_transaction", docSnap.id), { IsVerified: true });
            verifiedCount++;
            totalAmount += parseInt(data.Amount || 0);
          }
        }

        // Update fund total amount
        const fundRef = doc(db, "fund", fundId);
        const fundSnapshot = await getDocs(collection(db, "fund"));
        const fundData = fundSnapshot.docs.find(f => f.id === fundId)?.data();
        const currentCollected = fundData?.CollectedAmount || 0;
        await updateDoc(fundRef, {
          CollectedAmount: currentCollected + totalAmount
        });

        toast.success(`${verifiedCount} transaction(s) verified. Total added: ${totalAmount} VND`);

        const verifiedSet = new Set(
          transactionsSnapshot.docs
            .filter(docSnap => docSnap.data().IsVerified)
            .map(docSnap => `${docSnap.data().DonorID}_${docSnap.data().FundID}`)
        );


        const summaryWindow = window.open("", "_blank", "width=800,height=600");
        summaryWindow.document.write("<html><head><title>Transaction Match Summary</title>");
        summaryWindow.document.write("<style>table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;}tr.matched{background-color:#c6f6d5;}</style></head><body>");
        summaryWindow.document.write("<h2>Comparison of Excel & Firestore</h2>");
        summaryWindow.document.write("<table><thead><tr><th>#</th><th>DonorID</th><th>FundID</th><th>Status</th></tr></thead><tbody>");

        matched.forEach((row, index) => {
          const key = `${row.DonorID}_${row.FundID}`;
          const matchedStatus = verifiedSet.has(key);
          summaryWindow.document.write(
            `<tr class='${matchedStatus ? "matched" : ""}'>` +
            `<td>${index + 1}</td>` +
            `<td>${row.DonorID}</td>` +
            `<td>${row.FundID}</td>` +
            `<td>${matchedStatus ? "✔ Verified" : "✔ Verified"}</td>` +
            `</tr>`
          );
        });

        summaryWindow.document.write("</tbody></table></body></html>");
        summaryWindow.document.close();
      };

      reader.readAsArrayBuffer(file);
    };

    fileInput.click();
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const d = timestamp.toDate();
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Funds</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold">Create New Fund</h3>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium">Fund Name</label>
            <input type="text" value={newFund.FundName} onChange={e => setNewFund({ ...newFund, FundName: e.target.value })} className="border p-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Goal Amount</label>
            <input type="number" value={newFund.TargetAmount} onChange={e => setNewFund({ ...newFund, TargetAmount: e.target.value })} className="border p-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input type="date" value={newFund.StartDate} onChange={e => setNewFund({ ...newFund, StartDate: e.target.value })} className="border p-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input type="date" value={newFund.EndDate} onChange={e => setNewFund({ ...newFund, EndDate: e.target.value })} className="border p-2 w-full" />
          </div>
          <div>
        <label className="block text-sm font-medium">Type</label>
        <select
          value={newFund.Type}
          onChange={e => setNewFund({ ...newFund, Type: e.target.value })}
          className="border p-2 w-full"
        >
          <option value="Sell">Gây quỹ bằng bán đồ vật</option>
          <option value="Item">Gây quỹ bằng đồ vật</option>
          <option value="Cash">Gây quỹ bằng tiền mặt</option>
        </select>
      </div>
        </div>
        <button className="mt-2 bg-blue-500 text-white px-4 py-2" onClick={createFund} disabled={isLoading}>Create Fund</button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Existing Funds</h3>
        {funds.length === 0 ? (
          <p className="text-gray-500">No funds available.</p>
        ) : (
          funds.map(fund => (
            <div key={fund.id} className="border p-4 mb-2 rounded shadow bg-white">
              <p><strong>Name:</strong> {fund.FundName}</p>
              <p><strong>Start:</strong> {formatDate(fund.StartDate)}</p>
              <p><strong>End:</strong> {formatDate(fund.EndDate)}</p>
              <p><strong>Goal:</strong> {fund.TargetAmount?.toLocaleString()} VND</p>
              <p><strong>Progress:</strong> {((fund.CollectedAmount || 0) / fund.TargetAmount * 100).toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(fund.CollectedAmount || 0) / fund.TargetAmount * 100}%` }}
                ></div>
              </div>
              <p><strong>Status:</strong> {fund.Status}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={() => {
                  const newDate = prompt('Enter new end date (YYYY-MM-DD):', fund.EndDate?.toDate?.().toISOString().split('T')[0] || '');
                  if (newDate) {
                    const parsedDate = new Date(newDate);
                    if (!isNaN(parsedDate)) {
                      updateDoc(doc(db, 'fund', fund.id), { EndDate: parsedDate, Status: 'Extended' })
                        .then(() => {
                          toast.success('Fund extended successfully!');
                          handleStatusUpdate(fund.id, 'Extended');
                          fetchFunds();
                        })
                        .catch(() => toast.error('Failed to extend fund.'));
                    } else {
                      toast.error('Invalid date format.');
                    }
                  }
                }} className="bg-yellow-500 text-white px-3 py-1 rounded">Extend</button>
                <button onClick={() => handleStatusUpdate(fund.id, 'Closed')} className="bg-red-500 text-white px-3 py-1 rounded">Close</button>
                <button onClick={() => uploadStatement(fund.id)} className="bg-green-600 text-white px-3 py-1 rounded">Upload Bank Statement</button>
                <button onClick={() => deleteFund(fund.id)} className="bg-gray-600 text-white px-3 py-1 rounded">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
