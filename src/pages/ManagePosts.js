import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"

const ManagePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsCol = collection(db, "post");
        const postsSnapshot = await getDocs(postsCol);

        const userPosts = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const productPromises = userPosts.map(async (post) => {
          const productsCol = collection(db, "products");
          const productQuery = query(productsCol, where("PostID", "==", post.id), where("showOnHome", "==", false));
          const productSnapshot = await getDocs(productQuery);

          return productSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        });

        const postsArray = await Promise.all(productPromises);
        setPosts(postsArray.flat());
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast.error("Failed to fetch posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

//   const handleApprove = async (postId) => {
//     try {
//       const postRef = doc(db, "post", postId);
//       await updateDoc(postRef, { approved: true });
//       toast.success("Post approved successfully.");
//       setPosts(posts.filter((post) => post.id !== postId));
//     } catch (error) {
//       console.error("Error approving post:", error);
//       toast.error("Failed to approve post.");
//     }
//   };

//   const handleReject = async (postId) => {
//     try {
//       const postRef = doc(db, "post", postId);
//       await updateDoc(postRef, { approved: false });
//       toast.success("Post rejected successfully.");
//       setPosts(posts.filter((post) => post.id !== postId));
//     } catch (error) {
//       console.error("Error rejecting post:", error);
//       toast.error("Failed to reject post.");
//     }
//   };

    const handlePostClick = (postId) => {
        navigate(`/manage-posts/${postId}`); // Navigate to PostDetail page
    };


  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Posts</h1>
      {posts.length === 0 ? (
        <p>No posts to review.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div 
                key={post.id}
                className="p-4 border rounded-lg shadow hover:shadow-lg transition"
                onClick={() => handlePostClick(post.id)}
            >
              <h2 className="text-lg font-semibold text-gray-800">{post.ProductName || "Untitled Post"}</h2>
              <p className="text-gray-600 text-sm mb-4">{post.Description || "No content available."}</p>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagePosts;
