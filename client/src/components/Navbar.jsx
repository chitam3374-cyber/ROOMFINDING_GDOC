import React from 'react';
import { Calendar, Home, DoorOpen } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSchedule }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        
        {/* LOGO & BRAND NAME */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3.5 cursor-pointer group select-none py-1"
        >
          <div className="relative flex items-center justify-center p-1.5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200/60 shadow-xs group-hover:shadow transition duration-200">
            <img 
              src="/logo.png" 
              alt="Logo HCMIU" 
              className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
          </div>
          <div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1 leading-none">
              <span>IU</span>
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                RoomPeek
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Smart Campus Booking
            </p>
          </div>
        </div>

        {/* NAVIGATION CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nút Trang chủ */}
          <button 
            onClick={() => setActiveTab('home')} 
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'home' 
                ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-200/80' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Home className={`w-4 h-4 ${activeTab === 'home' ? 'text-sky-600' : 'text-slate-500'}`} />
            <span>Trang chủ</span>
          </button>

          {/* Nút Phòng trống */}
          <button 
            onClick={() => setActiveTab('available')} 
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === 'available' 
                ? 'bg-sky-50 text-sky-700 shadow-xs border border-sky-200/80' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <DoorOpen className={`w-4 h-4 ${activeTab === 'available' ? 'text-sky-600' : 'text-slate-500'}`} />
            <span>Phòng trống</span>
          </button>

          {/* Vạch ngăn cách dọc */}
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Nút Lịch phòng tổng quát */}
          <button 
            onClick={onOpenSchedule}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-sky-100" />
            <span>Lịch phòng</span>
          </button>
        </div>

      </div>
    </header>
  );
}