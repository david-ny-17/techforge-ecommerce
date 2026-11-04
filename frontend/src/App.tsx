import { BrowserRouter, Route, Routes } from "react-router-dom"

import Layout from "@/components/Layout"
import Catalog from "@/pages/Catalog"
import Home from "@/pages/Home"
import Login from "@/pages/Login"
import ProductDetail from "@/pages/ProductDetail"
import SmartBuilder from "@/pages/SmartBuilder"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/builder" element={<SmartBuilder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}