import { Routes, Route } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Register from '../pages/Register'
import Login from '../pages/Login'
import Cart from '../pages/Cart'
import ContactPage from '../components/contact'
import Banner from '../components/Banner'
import Legit from '../components/Letgit'
import TitleWithEffect from '../components/TitleProduct'
import ProductList from '../pages/ProductList'
import TitleWithEffect1 from '../components/TitleProduct1'
import ProductHot from '../pages/ProductHot'
import ProductSale from '../pages/ProductSale'
import NotFound from '../components/NotFound'
import ForgotPassword from '../pages/ForgotPassword'
import ProfilePage from '../components/Profile'
import ChangePasswordPage from '../pages/ChangePasswordPage'
import ProtectedRoute from '../components/ProtectedRoute'
import Navbar from '../components/TopHeader'
import ProductDetail from '../pages/DetailsProduct'
import ScrollToTop from '../components/ScrollToTop'
import SearchContainer from '../components/Search'
import SearchResults from '../components/SearchResults'
import BackToTop from '../components/BackToTop'
import AboutUs from '../components/Footer_Components/About'
import PurchaseNotification from '../components/PurchaseNotification'
import Checkout from '../pages/Checkout'
import WarrantyPolicy from '../components/Footer_Components/PrivacyPolicy'
import NewsDetail from '../pages/DetailsNew'
import NewsList from '../pages/New'
import ProductCate from '../components/product_categories/ShoeCategories'
import Payment from '../pages/Payment'
import MomoCallback from '../pages/MomoCallback'
import OrderSuccess from '../components/SuccesOrder'
import OrdersPage from '../pages/OrdersPage'
import ChatPopup from '../components/ChatPopup'
import Wishlist from '../components/Wishlist'

const RoutesConfig = () => {
  return (
    <>
      <Navbar />
      <Header />
      <ScrollToTop />
      <Routes>
        <Route
          path='/'
          element={
            <>
              <Banner />
              <Legit />
              <TitleWithEffect />
              <ProductList />
              <TitleWithEffect1 />
              <ProductHot />
              <PurchaseNotification />
              <ChatPopup />
            </>
          }
        />
        <Route path='/product-sale' element={<ProductSale />} />
        <Route path='/contact' element={<ContactPage />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/:slug' element={<ProductDetail />} />
        <Route path='/checkout' element={<Checkout />} />
        <Route path='/news' element={<NewsList />} />
        <Route path='/category/:id' element={<ProductCate />} />
        <Route path='/news/:id' element={<NewsDetail />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/wishlist' element={<Wishlist />} />
        <Route path='/orders' element={<OrdersPage />} />
        <Route path='/payment' element={<Payment />} />
        <Route path='*' element={<NotFound />} />
        <Route path='/search' element={<SearchResults />} />
        <Route path='/momo-callback' element={<MomoCallback />} />
        <Route path='/order-success' element={<OrderSuccess />} />
        <Route path='/about' element={<AboutUs />} />
        <Route path='/privacy-policy' element={<WarrantyPolicy />} />
        <Route element={<ProtectedRoute />}>
          <Route path='/profile' element={<ProfilePage />} />
          <Route path='/change-password' element={<ChangePasswordPage />} />
        </Route>
      </Routes>
      <Footer />
      <BackToTop />
    </>
  )
}

export default RoutesConfig
