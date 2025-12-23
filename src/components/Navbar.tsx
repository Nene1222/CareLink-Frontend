import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, User, HomeIcon, CameraIcon } from 'lucide-react'
import { usePusherNotifications } from '../hooks/usePusherNotifications'
import './Navbar.css'

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const current = location.pathname
  const { notifications, unreadCount, markAsRead, clearAllNotifications } = usePusherNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const tabs = [
    { path: '/dashboard', label: 'Home', icon: HomeIcon },
    { path: '/attendance?mode=scan', label: 'Scan QR', icon: CameraIcon }, // changed route
    { path: '/profile', label: 'Profile', icon: User },
    // { path: '/attendance', label: 'Attendance', icon: ClipboardList },
    // { path: '/appointment', label: 'Appointment', icon: Calendar },
  ]

  return (
    <header className="topbar">
      <div className="topbar-content">
        {/* Left - Logo */}
        {/* <div className="topbar-left">
          <Link to="/dashboard" className="brand-link">
            <div className="brand-icon">📋</div>
            <span className="brand-text">CareLink</span>
          </Link>
        </div> */}

        {/* Center - Navigation */}
        <nav className="topbar-center">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = current === tab.path
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`nav-tab ${isActive ? 'active' : ''}`}
                title={tab.label}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{tab.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right - Actions */}
        <div className="topbar-right">
          <div className="notification-container">
            <button
              className="action-btn"
              aria-label="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ position: 'relative' }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="clear-btn"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <p className="no-notifications">No notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notification-item ${notif.type} ${
                          notif.read ? 'read' : 'unread'
                        }`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="notification-content">
                          <p className="notification-message">{notif.message}</p>
                          <span className="notification-time">
                            {notif.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <span className={`notification-type-badge notification-type-${notif.type}`}>
                          {notif.type}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="user-profile-container">
            <Link to="/profile" className="user-profile" aria-label="Profile">
              <div className="avatar">
                U
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar