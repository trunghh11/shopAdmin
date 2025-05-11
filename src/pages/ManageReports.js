import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

export default function ManageReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "post_reports"));
      const reportList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      reportList.sort((a, b) => new Date(b.Timestamp?.seconds * 1000) - new Date(a.Timestamp?.seconds * 1000));
      setReports(reportList);
    } catch (error) {
      toast.error("Failed to fetch reports.");
    }
  };

  const deleteReport = async (id) => {
    try {
      await deleteDoc(doc(db, "post_reports", id));
      toast.success("Report deleted.");
      fetchReports();
    } catch (error) {
      toast.error("Failed to delete report.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Post Reports</h2>

      {reports.length === 0 ? (
        <p className="text-gray-500">No reports available.</p>
      ) : (
        reports.map(report => (
          <div key={report.id} className="border p-4 mb-2 rounded shadow bg-white">
            <p><strong>Post ID:</strong> {report.PostID}</p>
            <p><strong>Reporter ID:</strong> {report.ReporterID}</p>
            <p><strong>Reason:</strong> {report.Reason}</p>
            <p><strong>Timestamp:</strong> {new Date(report.Timestamp?.seconds * 1000).toLocaleString()}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => deleteReport(report.id)} className="bg-red-600 text-white px-3 py-1 rounded">Delete Report</button>
              <button onClick={() => window.open(`/post/${report.PostID}`, '_blank')} className="bg-blue-600 text-white px-3 py-1 rounded">View Post</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
