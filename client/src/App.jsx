import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { Logout } from "./pages/Logout";
import { PGList } from "./pages/PGList";
import { PGDetail } from "./pages/PGDetail";
import { Wishlist } from "./pages/Wishlist";
import { Booking } from "./pages/Booking";
import { PaymentCheckout } from "./pages/PaymentCheckout";
import { Profile } from "./pages/Profile";
import { OwnerDashboard } from "./pages/OwnerDashboard";
import { AddPG } from "./pages/AddPG";
import { ManagePG } from "./pages/ManagePG";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ApprovePG } from "./pages/ApprovePG";
import { Users } from "./pages/Users";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";
const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-shell">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/listings" element={<PGList />} />
            <Route path="/listings/:id" element={<PGDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/book/:id" element={<Booking />} />
            <Route path="/payment/:bookingId" element={<PaymentCheckout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/owner/add" element={<AddPG />} />
            <Route path="/owner/manage" element={<ManagePG />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/approve" element={<ApprovePG />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/add-listing" element={<AddPG />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
