"use client"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabase"
import { User, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"

export default function Navbar() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className="bg-primary/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a
              href="/"
              className="text-primary-foreground text-xl font-bold tracking-tight hover:text-accent transition-colors duration-200"
            >
              MyApp
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <div className="bg-card/10 backdrop-blur-sm px-6 py-2 rounded-full border border-border/20">
              <div className="flex space-x-6">
                <a
                  href="/perfil"
                  className="text-primary-foreground/80 hover:text-accent font-medium transition-all duration-200 hover:scale-105"
                >
                  Perfil
                </a>
                <a
                  href="/produtos"
                  className="text-primary-foreground/80 hover:text-accent font-medium transition-all duration-200 hover:scale-105"
                >
                  Produtos
                </a>
                <a
                  href="/pedidos"
                  className="text-primary-foreground/80 hover:text-accent font-medium transition-all duration-200 hover:scale-105"
                >
                  Pedidos
                </a>
                <a
                  href="/servicos"
                  className="text-primary-foreground/80 hover:text-accent font-medium transition-all duration-200 hover:scale-105"
                >
                  Serviços
                </a>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <a
              href="/dashboard"
              className="flex items-center space-x-2 text-primary-foreground/80 hover:text-accent font-medium transition-all duration-200 hover:scale-105"
            >
              <User size={18} />
              <span>Dashboard</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-primary-foreground hover:text-accent transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden animate-fade-in-up">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-card/10 backdrop-blur-sm rounded-lg mt-2 border border-border/20">
              <a
                href="/perfil"
                className="block px-3 py-2 text-primary-foreground/80 hover:text-accent font-medium transition-colors duration-200"
              >
                Perfil
              </a>
              <a
                href="/dashboard/produto"
                className="block px-3 py-2 text-primary-foreground/80 hover:text-accent font-medium transition-colors duration-200"
              >
                Produtos
              </a>
              <a
                href="/pedidos"
                className="block px-3 py-2 text-primary-foreground/80 hover:text-accent font-medium transition-colors duration-200"
              >
                Pedidos
              </a>
              <a
                href="/servicos"
                className="block px-3 py-2 text-primary-foreground/80 hover:text-accent font-medium transition-colors duration-200"
              >
                Serviços
              </a>
              <div className="border-t border-border/20 pt-2">
                <a
                  href="/dashboard"
                  className="flex items-center space-x-2 px-3 py-2 text-primary-foreground/80 hover:text-accent font-medium transition-colors duration-200"
                >
                  <User size={18} />
                  <span>Dashboard</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 text-primary-foreground/80 hover:text-accent font-medium transition-colors duration-200"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
