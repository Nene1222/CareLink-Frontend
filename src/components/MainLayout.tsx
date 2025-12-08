import React from 'react'
import MenuSideBar from './MenuSideBar'
import Navbar from './Navbar'
import './MainLayout.css'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="app-container">
      <MenuSideBar />
      <div className="main-wrapper">
        <Navbar />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}