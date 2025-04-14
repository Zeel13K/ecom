import { Route, Routes } from 'react-router-dom';
import './App.css';
import Shop from './pages/Shop';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ProductDetail from './pages/ProductDetail';
import Cart from './components/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import PrivateRoute from './components/PrivateRoute';

// Admin pages
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminOrderDetails from './pages/Admin/AdminOrderDetails';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminMessages from './pages/Admin/AdminMessages';
import AdminProductCreate from './pages/Admin/AdminProductCreate';
import AdminProductEdit from './pages/Admin/AdminProductEdit';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      
      {/* Protected User Routes */}
      <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
      <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
      <Route path="/orders/:id" element={<PrivateRoute><OrderDetails /></PrivateRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/orders" element={<PrivateRoute><AdminOrders /></PrivateRoute>} />
      <Route path="/admin/orders/:id" element={<PrivateRoute><AdminOrderDetails /></PrivateRoute>} />
      <Route path="/admin/products" element={<PrivateRoute><AdminProducts /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
      <Route path="/admin/products/create" element={<PrivateRoute><AdminProductCreate /></PrivateRoute>} />
      <Route path="/admin/products/edit/:id" element={<PrivateRoute><AdminProductEdit /></PrivateRoute>} />
      <Route path="/admin/messages" element={<PrivateRoute><AdminMessages /></PrivateRoute>} />
    </Routes>
  );
}

export default App;
