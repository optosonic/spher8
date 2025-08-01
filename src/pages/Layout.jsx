

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Music, Info, Crown, LogOut } from "lucide-react";
import Logo from '@/components/Logo';
import { User } from '@/api/entities';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Layout({ children }) {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutConfirm = async () => {
    try {
      await User.logout();
    } catch (error) {
      console.error("Logout failed", error);
      // If logout fails, just reload to force a state check
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%)' }}>
      {/* Purple Haze Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%]">
            <div className="absolute -translate-x-[50%] -translate-y-[20%] w-[800px] h-[800px] bg-purple-600/20 rounded-full filter blur-[150px] animate-pulse-slow"></div>
            <div className="absolute translate-x-[50%] translate-y-[20%] w-[600px] h-[600px] bg-blue-500/20 rounded-full filter blur-[150px] animate-pulse-slow animation-delay-4000"></div>
        </div>
      </div>

      {/* Glass navigation header */}
      <nav className="relative z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <a href="https://www.spher8.com" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
              <Logo />
            </a>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link 
                to={createPageUrl("synthesizer")}
                title="Synthesizer"
                className={`p-2 md:px-4 md:py-2 rounded-lg transition-all duration-300 flex items-center ${
                  location.pathname === createPageUrl("synthesizer")
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Music className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline ml-2">Synthesizer</span>
              </Link>
              <Link 
                to={createPageUrl("about")}
                title="About"
                className={`p-2 md:px-4 md:py-2 rounded-lg transition-all duration-300 flex items-center ${
                  location.pathname === createPageUrl("about")
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Info className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline ml-2">About</span>
              </Link>
              <Link 
                to={createPageUrl("subscription")}
                title="Subscription"
                className={`p-2 md:px-4 md:py-2 rounded-lg transition-all duration-300 flex items-center ${
                  location.pathname === createPageUrl("subscription")
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Crown className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline ml-2">Subscription</span>
              </Link>
              
              <AlertDialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-2 rounded-lg transition-all duration-300 flex items-center text-slate-300 hover:text-white hover:bg-purple-500/20"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-0 bg-transparent max-w-md">
                  <div className="relative">
                    {/* Multiple layered gradient backgrounds for depth */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-2xl blur-2xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
                    
                    {/* Glass panel with gradient background */}
                    <div className="relative glass-panel rounded-2xl p-8 border border-white/20" style={{ 
                      background: 'linear-gradient(135deg, rgba(29, 20, 53, 0.8) 0%, rgba(42, 13, 69, 0.8) 50%, rgba(30, 27, 75, 0.8) 100%)'
                    }}>
                      <AlertDialogHeader className="text-center">
                        {/* Enhanced glowing icon */}
                        <div className="mx-auto bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-full p-4 w-fit mb-6 border border-purple-400/50 relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-lg"></div>
                          <LogOut className="w-8 h-8 text-purple-200 relative z-10" />
                        </div>
                        
                        {/* Enhanced title with gradient */}
                        <AlertDialogTitle className="text-2xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent">
                          Confirm Logout
                        </AlertDialogTitle>
                        
                        {/* Enhanced description */}
                        <AlertDialogDescription className="text-slate-100 text-base leading-relaxed">
                          Are you sure you want to end your Spher8 session? You will be securely signed out.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      
                      <AlertDialogFooter className="!mt-8 flex-col gap-3">
                        {/* Enhanced gradient button */}
                        <AlertDialogAction
                          onClick={handleLogoutConfirm}
                          className="w-full bg-gradient-to-r from-purple-500 via-purple-600 to-blue-600 hover:from-purple-600 hover:via-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/40 border border-purple-400/30"
                        >
                          <LogOut className="w-5 h-5 mr-2" />
                          Yes, Log Me Out
                        </AlertDialogAction>
                        
                        {/* Enhanced cancel button */}
                        <AlertDialogCancel
                          className="w-full border-slate-400/50 text-slate-100 hover:bg-white/10 hover:text-white py-3 rounded-lg transition-all duration-300 bg-transparent backdrop-blur-sm"
                        >
                          Cancel
                        </AlertDialogCancel>
                      </AlertDialogFooter>
                    </div>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10">
        {children}
      </main>

      <style>{`
        body, html, #root {
          background-color: #1d1435 !important;
          background: linear-gradient(135deg, #1d1435 0%, #2a0d45 50%, #1e1b4b 100%) !important;
          margin: 0;
          padding: 0;
        }
        
        /* Prevent text selection throughout the app */
        * {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        /* Allow text selection only for input fields */
        input, textarea {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
        
        .glass-panel {
          backdrop-filter: blur(20px);
          background: rgba(10, 10, 15, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        
        /* Shadcn/UI Slider Styling - Target the actual rendered elements */
        [data-radix-slider-root] {
          position: relative;
          display: flex;
          align-items: center;
          user-select: none;
          touch-action: none;
        }

        [data-radix-slider-track] {
          background-color: #334155 !important; /* Dark slate for the track */
          position: relative;
          flex-grow: 1;
          border-radius: 9999px;
          height: 4px;
        }

        [data-radix-slider-range] {
          background-color: #0ea5e9 !important; /* Galactic blue for the filled range */
          position: absolute;
          border-radius: 9999px;
          height: 100%;
        }

        [data-radix-slider-thumb] {
          display: block;
          width: 14px !important;
          height: 14px !important;
          background-color: #0ea5e9 !important; /* Galactic blue for the thumb */
          border: 2px solid #0ea5e9 !important;
          border-radius: 50%;
          box-shadow: 0 0 10px #0ea5e9 !important;
          cursor: pointer;
        }

        [data-radix-slider-thumb]:hover {
          background-color: #0284c7 !important;
          border-color: #0284c7 !important;
          box-shadow: 0 0 15px #0284c7 !important;
        }

        [data-radix-slider-thumb]:focus {
          outline: none;
          box-shadow: 0 0 0 2px #1e1b4b, 0 0 0 4px #0ea5e9 !important;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .text-shadow-glow {
          text-shadow: 0 0 10px currentColor;
        }

        .border-glow {
          box-shadow: 0 0 10px currentColor;
        }

        .bg-glow {
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

