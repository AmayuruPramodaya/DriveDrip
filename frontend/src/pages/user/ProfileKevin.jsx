import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import apiClient from "../../services/api";
import {
  UserCircle,
  Edit3,
  Save,
  XCircle,
  Camera,
  AlertCircle,
  Car,
  Store,
  Package,
  ShoppingCart,
  Star,
  Mail,
  Phone,
  Calendar,
  Lock,
} from "lucide-react";

const ProfileKevin = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  // Password update state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    orders: 0,
    reviews: 0,
    shops: 0,
    parts: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Shop creation state
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [shopFormData, setShopFormData] = useState({
    name: "",
    description: "",
    location: "",
    phone: "",
    email: "",
    website: "",
    province: "",
    district: "",
  });
  const [shopErrors, setShopErrors] = useState({});
  const [shopLoading, setShopLoading] = useState(false);
  const [shopSuccess, setShopSuccess] = useState("");

  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;

    setStatsLoading(true);
    try {
      const promises = [];

      // Fetch orders count
      promises.push(
        apiClient
          .get("/orders/")
          .then((res) => ({
            orders: res.data.results
              ? res.data.results.length
              : res.data.length || 0,
          }))
          .catch(() => ({ orders: 0 }))
      );

      // Fetch reviews count
      promises.push(
        apiClient
          .get("/reviews/")
          .then((res) => ({
            reviews: res.data.results
              ? res.data.results.length
              : res.data.length || 0,
          }))
          .catch(() => ({ reviews: 0 }))
      );

      // If user is a seller, fetch shops and parts count
      if (user.role === "SELLER") {
        promises.push(
          apiClient
            .get("/shops/")
            .then((res) => ({
              shops: res.data.results
                ? res.data.results.length
                : res.data.length || 0,
            }))
            .catch(() => ({ shops: 0 }))
        );

        promises.push(
          apiClient
            .get("/spare-parts/?owner=me")
            .then((res) => ({
              parts: res.data.results
                ? res.data.results.length
                : res.data.length || 0,
            }))
            .catch(() => ({ parts: 0 }))
        );
      }

      const results = await Promise.allSettled(promises);
      const stats = {
        orders: 0,
        reviews: 0,
        shops: 0,
        parts: 0,
      };

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          Object.assign(stats, result.value);
        }
      });

      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        dob: user.dob || "",
        nic: user.nic || "",
        mobile_no: user.mobile_no || "",
      });

      if (!profileImageFile) {
        setPreviewImage(user.profile_picture || null);
      }

      // Fetch dashboard statistics
      fetchDashboardStats();
    }
    if (!isEditing) {
      setFormErrors({});
    }
  }, [user, isEditing, profileImageFile, fetchDashboardStats]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setFormErrors((prev) => ({
          ...prev,
          profile_picture: "Please select an image file.",
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          profile_picture: "Image size should be less than 5MB.",
        }));
        return;
      }
      setFormErrors((prev) => ({ ...prev, profile_picture: null }));

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFormErrors({});

    const dataToSubmit = new FormData();
    let hasChanges = false;

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== (user[key] || "")) {
        dataToSubmit.append(key, formData[key]);
        hasChanges = true;
      }
    });

    if (profileImageFile) {
      dataToSubmit.append("profile_picture", profileImageFile);
      hasChanges = true;
    }

    if (!hasChanges) {
      setSuccess("No changes detected.");
      setLoading(false);
      setIsEditing(false);
      return;
    }

    try {
      const response = await apiClient.patch(`/user/${user.id}/`, dataToSubmit);

      try {
        await updateProfile(response.data);
      } catch (updateError) {
        console.warn(
          "UpdateProfile function error (non-critical):",
          updateError
        );
      }

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setProfileImageFile(null);
    } catch (err) {
      console.error("Error updating profile:", err.response || err);
      if (err.response?.data) {
        const backendErrors = err.response.data;
        if (
          typeof backendErrors === "object" &&
          !Array.isArray(backendErrors)
        ) {
          setFormErrors(backendErrors);
          setError("Please correct the errors below.");
        } else if (backendErrors.detail) {
          setError(backendErrors.detail);
        } else {
          setError("An error occurred. Please try again.");
        }
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError("");
    setSuccess("");
    setFormErrors({});
    setProfileImageFile(null);
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        dob: user.dob || "",
        nic: user.nic || "",
        mobile_no: user.mobile_no || "",
      });
      setPreviewImage(user.profile_picture || null);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    if (passwordErrors[name]) {
      setPasswordErrors({ ...passwordErrors, [name]: null });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordErrors({});
    setPasswordSuccess("");

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors({ confirmPassword: "Passwords do not match" });
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordErrors({
        newPassword: "Password must be at least 8 characters long",
      });
      setPasswordLoading(false);
      return;
    }

    if (!passwordData.username) {
      setPasswordErrors({ username: "Username is required" });
      setPasswordLoading(false);
      return;
    }

    try {
      await apiClient.post("/auth/change-password/", {
        username: passwordData.username,
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });

      setPasswordSuccess("Password updated successfully!");
      setPasswordData({
        username: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    } catch (err) {
      console.error("Error updating password:", err.response || err);
      if (err.response?.data) {
        const backendErrors = err.response.data;
        if (
          typeof backendErrors === "object" &&
          !Array.isArray(backendErrors)
        ) {
          setPasswordErrors(backendErrors);
        } else if (backendErrors.detail) {
          setPasswordErrors({ general: backendErrors.detail });
        } else {
          setPasswordErrors({
            general: "An error occurred. Please try again.",
          });
        }
      } else {
        setPasswordErrors({ general: "An error occurred. Please try again." });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      username: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setPasswordSuccess("");
  };

  const handleShopInputChange = (e) => {
    const { name, value } = e.target;
    setShopFormData({ ...shopFormData, [name]: value });
    if (shopErrors[name]) {
      setShopErrors({ ...shopErrors, [name]: null });
    }
  };

  const handleShopSubmit = async (e) => {
    e.preventDefault();
    setShopLoading(true);
    setShopErrors({});
    setShopSuccess("");

    try {
      await apiClient.post("/shops/", shopFormData);
      setShopSuccess("Shop created successfully!");
      setShopFormData({
        name: "",
        description: "",
        location: "",
        phone: "",
        email: "",
        website: "",
        province: "",
        district: "",
      });
      setIsCreatingShop(false);
      // Refresh dashboard stats
      fetchDashboardStats();
    } catch (err) {
      console.error("Error creating shop:", err.response || err);
      if (err.response?.data) {
        const backendErrors = err.response.data;
        if (
          typeof backendErrors === "object" &&
          !Array.isArray(backendErrors)
        ) {
          setShopErrors(backendErrors);
        } else if (backendErrors.detail) {
          setShopErrors({ general: backendErrors.detail });
        } else {
          setShopErrors({ general: "An error occurred. Please try again." });
        }
      } else {
        setShopErrors({ general: "An error occurred. Please try again." });
      }
    } finally {
      setShopLoading(false);
    }
  };

  const handleCancelShopCreation = () => {
    setIsCreatingShop(false);
    setShopFormData({
      name: "",
      description: "",
      location: "",
      phone: "",
      email: "",
      website: "",
      province: "",
      district: "",
    });
    setShopErrors({});
    setShopSuccess("");
  };

  const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-center space-x-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-shrink-0">
        {React.cloneElement(icon, { className: "w-5 h-5 text-blue-600" })}
      </div>
      <div className="flex-grow">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="text-sm text-gray-900 font-medium">
          {value || "Not set"}
        </dd>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-purple-50 py-8">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          </div>
          <p className="text-gray-600">
            Manage your personal information and settings
          </p>
        </div>

        {/* Alerts */}
        {error && !Object.keys(formErrors).length && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle size={20} className="text-red-600 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-700">{success}</span>
          </div>
        )}
        {passwordSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-700">{passwordSuccess}</span>
          </div>
        )}
        {shopSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-700">{shopSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture and Basic Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        console.error("Image load error:", e.target.src);
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <UserCircle size={64} className="text-gray-400" />
                    </div>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md transition-colors"
                      title="Change profile picture"
                    >
                      <Camera size={18} />
                    </button>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  {user.name || user.username}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2">
                  {user.role?.charAt(0) + user.role?.slice(1).toLowerCase() ||
                    "User"}
                </div>

                {parseFloat(user.average_rating || 0) > 0 && (
                  <div className="flex items-center justify-center mt-3">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">
                      {parseFloat(user.average_rating || 0).toFixed(1)} (
                      {user.total_reviews || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-1">
                  <DetailItem
                    icon={<Mail />}
                    label="Email"
                    value={user.email}
                  />
                  <DetailItem
                    icon={<Calendar />}
                    label="Date of Birth"
                    value={
                      user.dob
                        ? new Date(user.dob + "T00:00:00").toLocaleDateString()
                        : "Not set"
                    }
                  />
                  <DetailItem
                    icon={<UserCircle />}
                    label="NIC"
                    value={user.nic || "Not set"}
                  />
                  <DetailItem
                    icon={<Phone />}
                    label="Mobile"
                    value={user.mobile_no || "Not set"}
                  />

                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setError("");
                      setSuccess("");
                      setTimeout(() => setSuccess(""), 100);
                    }}
                    className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Edit3 size={18} className="mr-2" />
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="w-full">
                  <form onSubmit={handleSubmit} className="space-y-4 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.name ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-xs text-red-500">
                          {Array.isArray(formErrors.name)
                            ? formErrors.name[0]
                            : formErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.email
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        required
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-xs text-red-500">
                          {Array.isArray(formErrors.email)
                            ? formErrors.email[0]
                            : formErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob || ""}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.dob ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {formErrors.dob && (
                        <p className="mt-1 text-xs text-red-500">
                          {Array.isArray(formErrors.dob)
                            ? formErrors.dob[0]
                            : formErrors.dob}
                        </p>
                      )}
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NIC
                      </label>
                      <input
                        type="text"
                        name="nic"
                        value={formData.nic || ""}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.nic ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {formErrors.nic && (
                        <p className="mt-1 text-xs text-red-500">
                          {Array.isArray(formErrors.nic)
                            ? formErrors.nic[0]
                            : formErrors.nic}
                        </p>
                      )}
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile
                      </label>
                      <input
                        type="tel"
                        name="mobile_no"
                        value={formData.mobile_no || ""}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.mobile_no
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {formErrors.mobile_no && (
                        <p className="mt-1 text-xs text-red-500">
                          {Array.isArray(formErrors.mobile_no)
                            ? formErrors.mobile_no[0]
                            : formErrors.mobile_no}
                        </p>
                      )}
                    </div>

                    {formErrors.profile_picture && (
                      <p className="text-xs text-red-500">
                        {Array.isArray(formErrors.profile_picture)
                          ? formErrors.profile_picture[0]
                          : formErrors.profile_picture}
                      </p>
                    )}

                    <div className="flex space-x-3 pt-4 w-full">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center"
                      >
                        <XCircle size={18} className="mr-2" />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Save size={18} className="mr-2" />
                        {loading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats and Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-8 mx-auto"></div>
                    </div>
                  ) : (
                    dashboardStats.orders
                  )}
                </h3>
                <p className="text-gray-600">Orders</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-4">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-8 mx-auto"></div>
                    </div>
                  ) : (
                    dashboardStats.reviews
                  )}
                </h3>
                <p className="text-gray-600">Reviews</p>
              </div>
              {user.role === "SELLER" && (
                <>
                  <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                      <Store className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {statsLoading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-200 rounded w-8 mx-auto"></div>
                        </div>
                      ) : (
                        dashboardStats.shops
                      )}
                    </h3>
                    <p className="text-gray-600">Shops</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {statsLoading ? (
                        <div className="animate-pulse">
                          <div className="h-8 bg-gray-200 rounded w-8 mx-auto"></div>
                        </div>
                      ) : (
                        dashboardStats.parts
                      )}
                    </h3>
                    <p className="text-gray-600">Parts</p>
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/parts")}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="text-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Browse Parts</h4>
                    <p className="text-sm text-gray-500">
                      Explore available spare parts
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => navigate("/orders")}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                >
                  <div className="text-center">
                    <Package className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Order History</h4>
                    <p className="text-sm text-gray-500">
                      View your past orders
                    </p>
                  </div>
                </button>
                {user.role === "SELLER" && (
                  <>
                    <button
                      onClick={() => navigate("/my-shop")}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                    >
                      <div className="text-center">
                        <Store className="w-8 h-8 text-gray-400 group-hover:text-green-500 mx-auto mb-2" />
                        <h4 className="font-medium text-gray-900">My Shops</h4>
                        <p className="text-sm text-gray-500">
                          Manage your shops
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setIsCreatingShop(true)}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                    >
                      <div className="text-center">
                        <Store className="w-8 h-8 text-gray-400 group-hover:text-green-500 mx-auto mb-2" />
                        <h4 className="font-medium text-gray-900">
                          Create Shop
                        </h4>
                        <p className="text-sm text-gray-500">
                          Start a new shop
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate("/add-parts")}
                      className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors group"
                    >
                      <div className="text-center">
                        <Package className="w-8 h-8 text-gray-400 group-hover:text-yellow-500 mx-auto mb-2" />
                        <h4 className="font-medium text-gray-900">
                          Add New Part
                        </h4>
                        <p className="text-sm text-gray-500">
                          List a new spare part
                        </p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Account Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Account Type</span>
                  <span className="font-medium">
                    {user.role?.charAt(0) + user.role?.slice(1).toLowerCase() ||
                      "User"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {user.date_joined
                      ? new Date(user.date_joined).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                {user.average_rating && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-medium">
                        {parseFloat(user.average_rating).toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Password Update Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Password & Security
                </h3>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Lock size={16} />
                    <span>Change Password</span>
                  </button>
                )}
              </div>

              {passwordErrors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-700 text-sm">
                    {passwordErrors.general}
                  </span>
                </div>
              )}

              {!isChangingPassword ? (
                <div className="text-gray-600">
                  <p className="mb-2">
                    Keep your account secure by using a strong password.
                  </p>
                  <p className="text-sm">Last changed: Not available</p>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={passwordData.username}
                      onChange={handlePasswordChange}
                      placeholder="Enter your username"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        passwordErrors.username
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      required
                    />
                    {passwordErrors.username && (
                      <p className="mt-1 text-xs text-red-500">
                        {passwordErrors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        passwordErrors.old_password
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      required
                    />
                    {passwordErrors.old_password && (
                      <p className="mt-1 text-xs text-red-500">
                        {passwordErrors.old_password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password *
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your new password"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        passwordErrors.newPassword ||
                        passwordErrors.new_password
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      required
                    />
                    {(passwordErrors.newPassword ||
                      passwordErrors.new_password) && (
                      <p className="mt-1 text-xs text-red-500">
                        {passwordErrors.newPassword ||
                          passwordErrors.new_password}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        passwordErrors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      required
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancelPasswordChange}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center"
                    >
                      <XCircle size={18} className="mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Lock size={18} className="mr-2" />
                      {passwordLoading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Shop Creation Section - Only for Sellers */}
            {user.role === "SELLER" && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Shop Management
                  </h3>
                  {!isCreatingShop && (
                    <button
                      onClick={() => setIsCreatingShop(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Store size={16} />
                      <span>Create New Shop</span>
                    </button>
                  )}
                </div>

                {shopErrors.general && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-red-700 text-sm">
                      {shopErrors.general}
                    </span>
                  </div>
                )}

                {!isCreatingShop ? (
                  <div className="text-gray-600">
                    <p className="mb-2">
                      Create and manage your shops to start selling spare parts.
                    </p>
                    <p className="text-sm">
                      You currently have {dashboardStats.shops} shop
                      {dashboardStats.shops !== 1 ? "s" : ""}.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleShopSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shop Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={shopFormData.name}
                          onChange={handleShopInputChange}
                          placeholder="Enter shop name"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            shopErrors.name
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          required
                        />
                        {shopErrors.name && (
                          <p className="mt-1 text-xs text-red-500">
                            {Array.isArray(shopErrors.name)
                              ? shopErrors.name[0]
                              : shopErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={shopFormData.phone}
                          onChange={handleShopInputChange}
                          placeholder="Enter phone number"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            shopErrors.phone
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {shopErrors.phone && (
                          <p className="mt-1 text-xs text-red-500">
                            {Array.isArray(shopErrors.phone)
                              ? shopErrors.phone[0]
                              : shopErrors.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={shopFormData.description}
                        onChange={handleShopInputChange}
                        placeholder="Describe your shop and what you sell"
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          shopErrors.description
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {shopErrors.description && (
                        <p className="mt-1 text-xs text-red-500">
                          {Array.isArray(shopErrors.description)
                            ? shopErrors.description[0]
                            : shopErrors.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Province
                        </label>
                        <input
                          type="text"
                          name="province"
                          value={shopFormData.province}
                          onChange={handleShopInputChange}
                          placeholder="Enter province"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            shopErrors.province
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {shopErrors.province && (
                          <p className="mt-1 text-xs text-red-500">
                            {Array.isArray(shopErrors.province)
                              ? shopErrors.province[0]
                              : shopErrors.province}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          District
                        </label>
                        <input
                          type="text"
                          name="district"
                          value={shopFormData.district}
                          onChange={handleShopInputChange}
                          placeholder="Enter district"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            shopErrors.district
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {shopErrors.district && (
                          <p className="mt-1 text-xs text-red-500">
                            {Array.isArray(shopErrors.district)
                              ? shopErrors.district[0]
                              : shopErrors.district}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location/Address
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={shopFormData.location}
                        onChange={handleShopInputChange}
                        placeholder="Enter detailed address"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          shopErrors.location
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {shopErrors.location && (
                        <p className="mt-1 text-xs text-red-500">
                          {Array.isArray(shopErrors.location)
                            ? shopErrors.location[0]
                            : shopErrors.location}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={shopFormData.email}
                          onChange={handleShopInputChange}
                          placeholder="Enter shop email"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            shopErrors.email
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {shopErrors.email && (
                          <p className="mt-1 text-xs text-red-500">
                            {Array.isArray(shopErrors.email)
                              ? shopErrors.email[0]
                              : shopErrors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website (Optional)
                        </label>
                        <input
                          type="url"
                          name="website"
                          value={shopFormData.website}
                          onChange={handleShopInputChange}
                          placeholder="https://yourwebsite.com"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            shopErrors.website
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {shopErrors.website && (
                          <p className="mt-1 text-xs text-red-500">
                            {Array.isArray(shopErrors.website)
                              ? shopErrors.website[0]
                              : shopErrors.website}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCancelShopCreation}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center"
                      >
                        <XCircle size={18} className="mr-2" />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={shopLoading}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Store size={18} className="mr-2" />
                        {shopLoading ? "Creating..." : "Create Shop"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileKevin;
