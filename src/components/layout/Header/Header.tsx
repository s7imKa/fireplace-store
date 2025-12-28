import { useContext, useState, type FC } from 'react'
import {
    FaBars,
    FaChevronDown,
    FaPhoneAlt,
    FaSearch,
    FaTelegramPlane,
    FaUser,
} from 'react-icons/fa'
import { SlBasket } from 'react-icons/sl'

import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../../contexts/context.tsx'
import './Header.scss'

type HeaderProps = {
    setSearchQuery: (query: string) => void
}

const Header: FC<HeaderProps> = ({ setSearchQuery }) => {
    const [inputValue, setInputValue] = useState('')
    const { user, isAdmin } = useContext(AuthContext)

    const navigate = useNavigate()

    return (
        <header className='header'>
            {/* Top */}
            <div className='header__top container'>
                {/* Logo */}
                <div className='header__logo'>
                    <a className='header__logo-link' href='/'>
                        <img
                            src='/src/assets/logo/logo.png'
                            alt='Логотип компанії'
                            className='header__logo-img'
                        />
                    </a>
                </div>

                {/* Navigation */}
                <nav className='header__nav' aria-label='Головне меню'>
                    <ul className='header__nav-list'>
                        <li className='header__nav-item'>
                            <Link className='header__nav-link header__nav-link--active' to={'/'}>
                                Головна
                            </Link>
                        </li>
                        <li className='header__nav-item'>
                            <a className='header__nav-link' href='#'>
                                Контакти
                            </a>
                        </li>
                        <li className='header__nav-item'>
                            <a className='header__nav-link' href='#'>
                                Монтаж камінів
                            </a>
                        </li>
                        {isAdmin && (
                            <li className='header__nav-item'>
                                <Link className='header__nav-link' to='/admin-panel'>
                                    Адмін-панель
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>

                {/* Actions (social/phone) */}
                <div className='header__actions'>
                    <a
                        href='https://t.me/username'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='header__action header__action--telegram'
                    >
                        <FaTelegramPlane className='header__action-icon' />
                    </a>

                    <a href='tel:+380XXXXXXXXX' className='header__action header__action--phone'>
                        <FaPhoneAlt /> +380973751342
                    </a>
                </div>
            </div>

            {/* Bottom */}
            <div className='header__bottom'>
                <div className='header__bottom-container container'>
                    <div className='header__bottom-content'>
                        <div className='header__bottom-content--catalog'>
                            <div className='header__bottom-content--catalog-text'>
                                <FaBars />
                                <span>Каталог товарів</span>
                            </div>
                            <FaChevronDown />
                        </div>

                        <div className='header__bottom-content--search'>
                            <input
                                type='text'
                                placeholder='Що ви шукаєте?'
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                className='header__bottom-content--search-input'
                            />
                            <button
                                className='header__bottom-content--search-btn'
                                onClick={() => setSearchQuery(inputValue)}
                            >
                                <FaSearch />
                            </button>
                        </div>
                    </div>

                    <div className='header__bottom-userinfo'>
                        {user ? (
                            <>
                                <span>{user?.email}</span>
                                <Link to='/profile'>
                                    <FaUser className='header__bottom-userinfo__link' />
                                </Link>
                                <Link to='/cart'>
                                    <SlBasket className='header__bottom-userinfo__link' />
                                </Link>
                            </>
                        ) : (
                            <>
                                <button
                                    className='header__bottom-userinfo__logout'
                                    onClick={() => navigate('/login')}
                                >
                                    Увійти
                                </button>
                                <Link to='/cart'>
                                    <SlBasket className='header__bottom-userinfo__link' />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
