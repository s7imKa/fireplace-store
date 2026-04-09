import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminPanel from './components/features/AdminPanel'
import Login from './components/features/Login'
import Profile from './components/features/Profile'
import Header from './components/layout/Header/Header'
import Cart from './pages/Cart/Cart'
import Home from './pages/Home/Home'
import ProductDetail from './pages/ProductDetail/ProductDetail'

function App() {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <>
            <Header setSearchQuery={setSearchQuery} />
            <main>
                <Routes>
                    <Route path='/' element={<Home searchQuery={searchQuery} />} />
                    <Route path='/index.html' element={<Navigate to='/' replace />} />
                    <Route path='/product-detail/:id' element={<ProductDetail />} />
                    <Route path='/profile' element={<Profile />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/admin-panel' element={<AdminPanel />} />
                    <Route path='/cart' element={<Cart />} />
                    <Route path='*' element={<Navigate to='/' replace />} />
                </Routes>
            </main>
        </>
    )
}

export default App
