import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    } catch (error) {
      toast.error("Failed to fetch users.");
    }
  };

  const toggleBan = async (userId, isBanned) => {
    try {
      await updateDoc(doc(db, "users", userId), { IsBanned: !isBanned });
      toast.success(`User ${!isBanned ? "banned" : "unbanned"}.`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user status.");
    }
  };

  const toggleWatch = async (userId, isWatched) => {
    try {
      await updateDoc(doc(db, "users", userId), { IsWatched: !isWatched });
      toast.success(`User ${!isWatched ? "flagged for watch" : "unflagged"}.`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update watch status.");
    }
  };

  const sortedUsers = users
    .filter(user => {
      if (filter === "all") return true;
      if (filter === "banned") return user.IsBanned;
      if (filter === "watched") return user.IsWatched;
      return true;
    })
    .sort((a, b) => {
      const ratingA = parseFloat(a.AvgRating || 0);
      const ratingB = parseFloat(b.AvgRating || 0);
      return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
    });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Users</h2>

      <div className="flex gap-4 mb-4">
        <select onChange={e => setFilter(e.target.value)} className="border p-2">
          <option value="all">All Users</option>
          <option value="banned">Banned Users</option>
          <option value="watched">Watched Users</option>
        </select>
        <select onChange={e => setSortOrder(e.target.value)} className="border p-2">
          <option value="desc">Sort by Rating: High to Low</option>
          <option value="asc">Sort by Rating: Low to High</option>
        </select>
      </div>

      {sortedUsers.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        sortedUsers.map(user => (
          <div key={user.id} className="border p-4 mb-2 rounded shadow bg-white">
            <p><strong>Name:</strong> {user.FullName}</p>
            <p><strong>Email:</strong> {user.Email}</p>
            <p><strong>Phone:</strong> {user.Phone}</p>
            <p><strong>Class:</strong> {user.Class}</p>
            <p><strong>Rating:</strong> {user.AvgRating} ({user.RatingCount} reviews)</p>
            <p><strong>Status:</strong> {user.IsBanned ? "Banned" : "Active"}</p>
            <p><strong>Watched:</strong> {user.IsWatched ? "Yes" : "No"}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => toggleBan(user.id, user.IsBanned)} className="bg-red-500 text-white px-3 py-1 rounded">
                {user.IsBanned ? "Unban" : "Ban"}
              </button>
              <button onClick={() => toggleWatch(user.id, user.IsWatched)} className="bg-yellow-500 text-white px-3 py-1 rounded">
                {user.IsWatched ? "Unflag" : "Flag"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
