import { FaPhoneAlt, FaTelegramPlane } from 'react-icons/fa'
import './Header.scss'

const Header = () => {
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
                            <a className='header__nav-link header__nav-link--active' href='/'>
                                Головна
                            </a>
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
                        <FaTelegramPlane className='header__action-icon' /> Перейти в Telegram
                    </a>

                    <a href='tel:+380XXXXXXXXX' className='header__action header__action--phone'>
                        <FaPhoneAlt className='header__action-icon' /> 0973751342
                    </a>
                </div>
            </div>

            {/* Bottom */}
            <div className='header__bottom'>
                <div className='header__container'>{/* Додатковий контент нижньої частини */}</div>
            </div>
        </header>
    )
}

export default Header
