import { BrowserRouter, Route, Routes } from "react-router-dom"

import Layout from "@/components/Layout"
import ProtectedRoute from "@/components/ProtectedRoute"
import AuthProvider from "@/context/AuthProvider"
import CartProvider from "@/context/CartProvider"
import Cart from "@/pages/Cart"
import Catalog from "@/pages/Catalog"
import Home from "@/pages/Home"
import Login from "@/pages/Login"
import ProductDetail from "@/pages/ProductDetail"
import Profile from "@/pages/Profile"
import Register from "@/pages/Register"
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

              {/* Rutas protegidas (el /checkout se añadirá aquí en el siguiente bloque) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}