import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Users from "./pages/Users";
import ProductManager from "./pages/ProductManagement/ProductManager";
import AddProduct from "./pages/ProductManagement/AddProduct";
import EditProduct from "./pages/ProductManagement/EditProduct";
import Login from "./pages/Login";
import AdminHome from "./pages/AdminHome";
import ManagePosts from "./pages/ManagePosts"; // Import ManagePosts
import ManageFunds from './pages/ManageFunds';
import ManageUsers from './pages/ManageUsers';
import ManageReports from './pages/ManageReports';
import PostDetail from "./pages/PostDetail"; // Import PostDetail
import { ToastContainer } from "react-toastify"; 
import 'react-toastify/dist/ReactToastify.css'; 
import { AuthProvider } from "./contexts/AuthContext"; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer /> {/* Add ToastContainer for notifications */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminHome />
              </ProtectedRoute>
            }
          >
            <Route path="users" element={<Users />} />
            <Route path="products" element={<ProductManager />} />
            <Route path="products/add" element={<AddProduct />} />
            <Route path="products/edit/:id" element={<EditProduct />} />
            <Route path="manage-posts" element={<ManagePosts />} />
            <Route path="manage-funds" element={<ManageFunds />} />
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="manage-reports" element={<ManageReports />} />
            <Route path="manage-posts/:postId" element={<PostDetail />} /> {/* Add PostDetail route */}
          </Route>
          {/* Optionally, handle 404 Not Found */}
          <Route path="*" element={<div className="p-4">404 Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
