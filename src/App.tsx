import { Route, Routes } from 'react-router'
import AdminPanel from './components/features/AdminPanel'
import Login from './components/features/Login'
import Profile from './components/features/Profile'
import Header from './components/layout/Header/Header'
import Cart from './pages/Cart/Cart'
import Home from './pages/Home/Home'

function App() {
    return (
        <>
            <Header />
            <main>
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/profile' element={<Profile />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/admin-panel' element={<AdminPanel />} />
                    <Route path='/cart' element={<Cart />} />
                </Routes>
            </main>
        </>
    )
}

export default App
