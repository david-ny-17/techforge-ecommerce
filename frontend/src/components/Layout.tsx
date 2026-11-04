import { Outlet } from "react-router-dom"

import Footer from "./Footer"
import Navbar from "./Navbar"

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-gray-100">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}