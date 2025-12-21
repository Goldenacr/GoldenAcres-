
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { CartProvider } from '@/hooks/useCart';
import { ThemeProvider } from "@/components/ThemeProvider";
import { motion } from 'framer-motion';
import { BookOpen, MapPin } from 'lucide-react';

import MainLayout from '@/components/MainLayout';
import AdminLayout from '@/components/AdminLayout';
import ScrollToTop from '@/components/ScrollToTop';
import RequireProfileCompletion from '@/components/RequireProfileCompletion';

// Lazy-loaded pages for code splitting
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage'));
const MarketplacePage = React.lazy(() => import('@/pages/MarketplacePage'));
const ProductDetailPage = React.lazy(() => import('@/pages/ProductDetailPage'));
const FarmerOnboardingPage = React.lazy(() => import('@/pages/FarmerOnboardingPage'));
const LogisticsPage = React.lazy(() => import('@/pages/LogisticsPage'));
const ContactPage = React.lazy(() => import('@/pages/ContactPage'));
const BlogPage = React.lazy(() => import('@/pages/BlogPage'));
const BlogPostDetailPage = React.lazy(() => import('@/pages/BlogPostDetailPage'));
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const RegisterPage = React.lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@/pages/ForgotPasswordPage'));
const FarmerDashboard = React.lazy(() => import('@/pages/FarmerDashboard'));
const FarmerRevenuePage = React.lazy(() => import('@/pages/FarmerRevenuePage'));
const FarmerVerificationPage = React.lazy(() => import('@/pages/FarmerVerificationPage'));
const CustomerDashboard = React.lazy(() => import('@/pages/CustomerDashboard'));
const AdminDashboard = React.lazy(() => import('@/pages/AdminDashboard'));
const AdminUserDetailsPage = React.lazy(() => import('@/pages/AdminUserDetailsPage'));
const CheckoutPage = React.lazy(() => import('@/pages/CheckoutPage'));
const SuccessPage = React.lazy(() => import('@/pages/SuccessPage'));
const MyOrdersPage = React.lazy(() => import('@/pages/MyOrdersPage'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const SettingsMenuPage = React.lazy(() => import('@/pages/SettingsMenuPage'));
const ProfileSettingsPage = React.lazy(() => import('@/pages/ProfileSettingsPage'));
const SecuritySettingsPage = React.lazy(() => import('@/pages/SecuritySettingsPage'));
const OrderTrackingPage = React.lazy(() => import('@/pages/OrderTrackingPage'));
const FarmerProfilePage = React.lazy(() => import('@/pages/FarmerProfilePage'));
const CompleteRegistrationPage = React.lazy(() => import('@/pages/CompleteRegistrationPage'));

// New Admin Pages
const AdminOrdersPage = React.lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminProductsPage = React.lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminUsersPage = React.lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminFarmersPage = React.lazy(() => import('@/pages/admin/AdminFarmersPage'));
const AdminBlogPage = React.lazy(() => import('@/pages/admin/AdminBlogPage'));
const AdminActivityPage = React.lazy(() => import('@/pages/admin/AdminActivityPage'));
const AdminReviewsPage = React.lazy(() => import('@/pages/admin/AdminReviewsPage'));
const AdminPickupHubsPage = React.lazy(() => import('@/pages/admin/AdminPickupHubsPage'));
const AdminSettingsPage = React.lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminMassDeliveryPage = React.lazy(() => import('@/pages/admin/AdminMassDeliveryPage'));
const AdminCountriesPage = React.lazy(() => import('@/pages/admin/AdminCountriesPage'));


const PageLoader = () => (
    <div className="flex justify-center items-center h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900">
        <motion.div
            className="fancy-loader"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        ></motion.div>
    </div>
);


function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
              <Suspense fallback={<PageLoader />}>
                  <Routes>
                      <Route path="/complete-profile" element={<CompleteRegistrationPage />} />
                      
                      <Route path="/admin-dashboard/*" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="users" element={<AdminUsersPage />} />
                        <Route path="users/:id" element={<AdminUserDetailsPage />} />
                        <Route path="farmers" element={<AdminFarmersPage />} />
                        <Route path="products" element={<AdminProductsPage />} />
                        <Route path="orders" element={<AdminOrdersPage />} />
                        <Route path="mass-delivery" element={<AdminMassDeliveryPage />} />
                        <Route path="blog" element={<AdminBlogPage />} />
                        <Route path="activity" element={<AdminActivityPage />} />
                        <Route path="reviews" element={<AdminReviewsPage />} />
                        <Route path="pickup-hubs" element={<AdminPickupHubsPage />} />
                        <Route path="settings" element={<AdminSettingsPage />} />
                        <Route path="countries" element={<AdminCountriesPage />} />
                      </Route>
                      <Route path="/*" element={
                        <RequireProfileCompletion>
                            <MainLayout>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/marketplace" element={<MarketplacePage />} />
                                <Route path="/marketplace/:id" element={<ProductDetailPage />} />
                                <Route path="/farmer/:id" element={<FarmerProfilePage />} />
                                <Route path="/farmer-onboarding" element={<FarmerOnboardingPage />} />
                                <Route path="/farmer-verification" element={<FarmerVerificationPage />} />
                                <Route path="/logistics" element={<LogisticsPage />} />
                                <Route path="/contact" element={<ContactPage />} />
                                <Route path="/blog" element={<BlogPage />} />
                                <Route path="/blog/:id" element={<BlogPostDetailPage />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
                                <Route path="/farmer-dashboard/revenue" element={<FarmerRevenuePage />} />
                                <Route path="/customer-dashboard" element={<CustomerDashboard />} />
                                <Route path="/my-orders" element={<MyOrdersPage />} />
                                <Route path="/track-order/:orderId" element={<OrderTrackingPage />} />
                                <Route path="/checkout" element={<CheckoutPage />} />
                                <Route path="/success" element={<SuccessPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="/settings/profile" element={<ProfileSettingsPage />} />
                                <Route path="/settings/security" element={<SecuritySettingsPage />} />
                            </Routes>
                            </MainLayout>
                        </RequireProfileCompletion>
                      } />
                  </Routes>
              </Suspense>
            <Toaster />
            <Link to="/blog">
              <motion.div
                className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg flex items-center justify-center cursor-pointer z-50"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ scale: 1.15, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                <BookOpen className="w-6 h-6" />
              </motion.div>
            </Link>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
