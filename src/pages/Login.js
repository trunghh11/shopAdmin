import { useState} from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth"; 
import { auth, db } from "../firebase"; 
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore"; 
import { toast } from "react-toastify"; 

const Login = () => {
  const [adminID, setAdminID] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {

    try {
      const userCredential = await signInWithEmailAndPassword(auth, `${adminID}@example.com`, password);
      const admin = userCredential.user;
      console.log(admin.uid);

      const userDocRef = doc(db, "admins", admin.uid);
      const userDoc = await getDoc(userDocRef);
      console.log(2);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.UserRole === "Admin") {
          navigate("/");
        } else {
          await signOut(auth);
          setErrorMessage("Access denied. Admins only.");
          toast.error("Access denied. Admins only.");
        }
      } else {
        await signOut(auth);
        setErrorMessage("User role not found.");
        toast.error("User role not found.");
      }
    } catch (error) {
      setErrorMessage("Invalid email or password.");
      toast.error("Invalid email or password.");
      console.log(`${adminID}@example.com`);
      console.log(error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
        {errorMessage && <div className="mb-4 text-red-500">{errorMessage}</div>}
        <input
          className="border p-2 w-full mb-4"
          type="text"
          name="AdminID"
          placeholder="Admin ID"
          value={adminID}
          required
          onChange={(e) => setAdminID(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-6"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
