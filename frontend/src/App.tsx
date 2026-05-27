import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LangSelect from './pages/LangSelect'
import QuestList from './pages/QuestList'
import QuestDetail from './pages/QuestDetail'
import QuestPlay from './pages/QuestPlay'
import MyQuests from './pages/MyQuests'
import Auth from './pages/Auth'
import AdminStats from './pages/admin/AdminStats'
import AdminQuests from './pages/admin/AdminQuests'
import AdminQuestEdit from './pages/admin/AdminQuestEdit'
import AdminReviews from './pages/admin/AdminReviews'
import AdminPromo from './pages/admin/AdminPromo'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSales from './pages/admin/AdminSales'
import AdminCities from './pages/admin/AdminCities'
import AdminEvents from './pages/admin/AdminEvents'
import CitySelect from './pages/CitySelect'
import Profile from './pages/Profile'
import FAQ from './pages/FAQ'
import QuestReview from './pages/QuestReview'
import QuestAlbum from './pages/QuestAlbum'
import Reviews from './pages/Reviews'
import Contacts from './pages/Contacts'
import QuestPay from './pages/QuestPay'
import Payment from './pages/Payment'
import PartnerDashboard from './pages/partner/PartnerDashboard'
import PartnerQuests from './pages/partner/PartnerQuests'
import PartnerQuestEdit from './pages/partner/PartnerQuestEdit'
import PartnerEarnings from './pages/partner/PartnerEarnings'
import AdminPartners from './pages/admin/AdminPartners'
import AdminAchievements from './pages/admin/AdminAchievements'
import Cities from './pages/Cities'
import { AuthProvider } from './context/AuthContext'
import { AdminNotifProvider } from './context/AdminNotifContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import PartnerRoute from './components/PartnerRoute'

export default function App() {
  return (
    <AuthProvider>
      <AdminNotifProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LangSelect />} />
          <Route path="/city" element={<CitySelect />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/quests" element={<QuestList />} />
          <Route path="/cities" element={<Cities />} />
          <Route path="/quest/:id" element={<QuestDetail />} />
          <Route path="/quest/:id/play" element={
            <ProtectedRoute><QuestPlay /></ProtectedRoute>
          } />
          <Route path="/my-quests" element={
            <ProtectedRoute><MyQuests /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/quest/:id/pay" element={
            <ProtectedRoute><QuestPay /></ProtectedRoute>
          } />
          <Route path="/quest/:id/review" element={
            <ProtectedRoute><QuestReview /></ProtectedRoute>
          } />
          <Route path="/quest/:id/album" element={
            <ProtectedRoute><QuestAlbum /></ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute><Payment /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><AdminStats /></AdminRoute>
          } />
          <Route path="/admin/quests" element={
            <AdminRoute><AdminQuests /></AdminRoute>
          } />
          <Route path="/admin/quests/:id" element={
            <AdminRoute><AdminQuestEdit /></AdminRoute>
          } />
          <Route path="/admin/reviews" element={
            <AdminRoute><AdminReviews /></AdminRoute>
          } />
          <Route path="/admin/promo" element={
            <AdminRoute><AdminPromo /></AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute><AdminUsers /></AdminRoute>
          } />
          <Route path="/admin/sales" element={
            <AdminRoute><AdminSales /></AdminRoute>
          } />
          <Route path="/admin/cities" element={
            <AdminRoute><AdminCities /></AdminRoute>
          } />
          <Route path="/admin/events" element={
            <AdminRoute><AdminEvents /></AdminRoute>
          } />
          <Route path="/admin/partners" element={
            <AdminRoute><AdminPartners /></AdminRoute>
          } />
          <Route path="/admin/achievements" element={
            <AdminRoute><AdminAchievements /></AdminRoute>
          } />
          <Route path="/partner" element={
            <PartnerRoute><PartnerDashboard /></PartnerRoute>
          } />
          <Route path="/partner/quests" element={
            <PartnerRoute><PartnerQuests /></PartnerRoute>
          } />
          <Route path="/partner/quests/:id" element={
            <PartnerRoute><PartnerQuestEdit /></PartnerRoute>
          } />
          <Route path="/partner/earnings" element={
            <PartnerRoute><PartnerEarnings /></PartnerRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      </AdminNotifProvider>
    </AuthProvider>
  )
}
