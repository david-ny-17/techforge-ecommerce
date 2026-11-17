import { BrowserRouter, Route, Routes } from "react-router-dom"

import AdminLayout from "@/components/admin/AdminLayout"
import AdminRoute from "@/components/admin/AdminRoute"
import Layout from "@/components/Layout"
import ProtectedRoute from "@/components/ProtectedRoute"
import AuthProvider from "@/context/AuthProvider"
import CartProvider from "@/context/CartProvider"
import AdminCustomers from "@/pages/admin/AdminCustomers"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import AdminOrders from "@/pages/admin/AdminOrders"
import AdminProducts from "@/pages/admin/AdminProducts"
import Cart from "@/pages/Cart"
import Catalog from "@/pages/Catalog"
import Checkout from "@/pages/Checkout"
import Home from "@/pages/Home"
import Login from "@/pages/Login"
import OrderSuccess from "@/pages/OrderSuccess"
import Orders from "@/pages/Orders"
import ProductDetail from "@/pages/ProductDetail"
import Profile from "@/pages/Profile"
import Register from "@/pages/Register"
import SavedBuilds from "@/pages/SavedBuilds"
import SmartBuilder from "@/pages/SmartBuilder"

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/builder" element={<SmartBuilder />} />

              {/* Rutas protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/builds" element={<SavedBuilds />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
              </Route>
            </Route>

            {/* Panel de administración: solo is_staff, con su propio diseño */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}