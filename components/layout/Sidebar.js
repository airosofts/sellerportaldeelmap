'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  ChevronRight,
  LogOut,
  Building
} from 'lucide-react'

export default function Sidebar({ isOpen, setIsOpen, activeItem, setActiveItem }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('hotel_user')
    router.push('/login')
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: Building2,
      path: '/properties'
    }
  ]

  // Auto-set active item based on current pathname
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.path === pathname) {
        setActiveItem(item.id)
      }
    })
  }, [pathname])

  const handleItemClick = (item) => {
    setActiveItem(item.id)
    if (window.innerWidth < 1024) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#472F97] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        {/* Logo Header */}
        <div className="h-16 lg:h-20 flex items-center justify-between gap-2 px-3 lg:px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-11 h-11 lg:w-14 lg:h-14 bg-white/10 rounded-lg lg:rounded-xl flex items-center justify-center overflow-hidden shrink-0">
              <Building className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className="text-xs lg:text-sm font-semibold tracking-tight text-white truncate leading-tight">Deelmap</h1>
              <p className="text-[9px] lg:text-[10px] text-white/70 hidden lg:block leading-tight mt-0.5">Seller Dashboard</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <ChevronRight className="w-4 h-4 text-white/70 rotate-180" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 lg:py-6 px-3 lg:px-4 space-y-1 scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id

            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#5B3FB8] text-white'
                    : 'text-white/90 hover:bg-[#3d2680]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/80'}`} />
                <span className="text-[13px] font-medium tracking-tight">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 lg:px-4 py-3 lg:py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg lg:rounded-xl text-red-400 hover:bg-[#3d2680] transition-all duration-200"
          >
            <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-xs lg:text-[13px] font-medium tracking-tight">Logout</span>
          </button>
        </div>
      </aside>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}
