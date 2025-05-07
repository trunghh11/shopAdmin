import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc} from 'firebase/firestore';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const PostDetail = () => {
  const { postId } = useParams();
  const [product, setProduct] = useState(null);
  const [post, setPost] = useState(null);
  const [poster, setPoster] = useState(null); // Add state for poster information
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPostDetails = async () => {
        try {
            const productDocRef = doc(db, "products", postId);
            const productDocSnap = await getDoc(productDocRef);

            if (productDocSnap.exists()) {
                const productData = { id: productDocSnap.id, ...productDocSnap.data() };
                setProduct(productData);
                setActiveImage(productData.image);

                // Fetch the associated post using PostID
                const postDocRef = doc(db, "post", productData.PostID);
                const postDocSnap = await getDoc(postDocRef);

                if (postDocSnap.exists()) {
                const postData = postDocSnap.data();
                setPost(postData);

                // Fetch the poster's information
                const posterDocRef = doc(db, "users", postData.PosterID);
                const posterDocSnap = await getDoc(posterDocRef);
                if (posterDocSnap.exists()) {
                    setPoster(posterDocSnap.data());
                }
                }

            } else {
                toast.error("Product not found!");
            }
        } catch (error) {
            console.error("Error fetching product, post, or poster:", error);
            toast.error("An error occurred while fetching the product or post.");
        } finally {
            setLoading(false);
        }
    };

    fetchPostDetails();
  }, [postId, user, navigate]);

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '0 ₫'; // Handle undefined, null, or invalid price
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleImageClick = (image) => {
    setActiveImage(image);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link to="/products" className="text-blue-600 hover:underline">Return to Products</Link>
      </div>
    );
  }

  const handleApprove = async () => {
    try {
      if (!product || !product.PostID) {
        toast.error("Invalid product or PostID.");
        return;
      }
  
      const postRef = doc(db, "post", product.PostID); // Sử dụng PostID từ product
      const productRef = doc(db, "products", postId);
  
      await updateDoc(postRef, { Status: "Đã phê duyệt" });
      await updateDoc(productRef, { showOnHome: true });
  
      toast.success("Post approved successfully.");
      navigate("/manage-posts");
    } catch (error) {
      console.error("Error approving post:", error);
      toast.error("Failed to approve post.");
    }
  };

  const handleReject = async () => {
    try {
      if (!product || !product.PostID) {
        toast.error("Invalid product or PostID.");
        return;
      }
  
      const postRef = doc(db, "post", product.PostID); // Sử dụng PostID từ product
      const productRef = doc(db, "products", postId);
  
      await updateDoc(postRef, { Status: "Đã từ chối" });
      await updateDoc(productRef, { showOnHome: false });
  
      toast.success("Post rejected successfully.");
      navigate("/manage-posts");
    } catch (error) {
      console.error("Error rejecting post:", error);
      toast.error("Failed to reject post.");
    }
  };

  return (

    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Nút Back và các nút Approve/Reject */}
      <div className="flex items-center justify-start mb-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center text-blue-600 hover:underline"
        >
          <span className="mr-2">&larr;</span> Back
        </button>
        <div className="flex space-x-4 ml-12"> {/* Cách nút Back 30px */}
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleApprove}
          >
            Phê duyệt
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={handleReject}
          >
            Từ chối
          </button>
        </div>
      </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-12">
          <div className="p-6">
            {/* Poster Information */}
            {poster && post && (
              <div className="flex items-center mb-6">
                <img
                  src={poster.avatar || 'https://img.freepik.com/vecteurs-premium/icones-utilisateur-comprend-icones-utilisateur-symboles-icones-personnes-elements-conception-graphique-qualite-superieure_981536-526.jpg?semt=ais_hybrid&w=740'}
                  alt={poster.FullName}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <p
                    className="text-lg font-semibold text-blue-600"
                  >
                    {poster.FullName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Posted on {new Date(post.CreatedAt.seconds * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Product Details */}
            <h1 className="text-4xl font-bold mb-4 text-gray-900">{product.ProductName}</h1>
            <p className="text-gray-700 mb-4">
              <strong>Post Content:</strong> {post?.Content}
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Condition:</strong> {product.Condition}
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Description:</strong> {product.Description}
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Price:</strong> {formatPrice(product.Price)}
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Stock:</strong> {product.Stock}
            </p>
          </div>

          {/* Product Images Section */}
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2 p-4">
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={activeImage}
                  alt={product.ProductName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex mt-4 space-x-4">
                {product.image && (
                  <img
                    src={product.image}
                    alt="Thumbnail 1"
                    onClick={() => handleImageClick(product.image)}
                    className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${activeImage === product.image ? 'border-blue-500' : 'border-gray-300'}`}
                  />
                )}
                {product.image2 && (
                  <img
                    src={product.image2}
                    alt="Thumbnail 2"
                    onClick={() => handleImageClick(product.image2)}
                    className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${activeImage === product.image2 ? 'border-blue-500' : 'border-gray-300'}`}
                  />
                )}
                {product.image3 && (
                  <img
                    src={product.image3}
                    alt="Thumbnail 3"
                    onClick={() => handleImageClick(product.image3)}
                    className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${activeImage === product.image3 ? 'border-blue-500' : 'border-gray-300'}`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
