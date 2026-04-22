import { headerDateStr } from '../utils/dateUtils'

export default function Header() {
  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__mark">
          {/* Route/arrow wordmark */}
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M2 11L7.5 4L13 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7.5" cy="13" r="1.5" fill="white" />
          </svg>
        </div>
        <span className="header__name">MiRuta</span>
      </div>
      <span className="header__date">{headerDateStr()}</span>
    </header>
  )
}
