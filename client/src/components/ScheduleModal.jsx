import React, { useState, useMemo } from 'react';
import { Calendar, X, Search, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function ScheduleModal({ isOpen, onClose, scheduleMatrix }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Lọc nhanh phòng theo từ khóa người dùng nhập (A1, LA1, 101,...)
  const filteredMatrix = useMemo(() => {
    if (!scheduleMatrix) return [];
    if (!searchQuery.trim()) return scheduleMatrix;
    return scheduleMatrix.filter(row => 
      row.roomId.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [scheduleMatrix, searchQuery]);

  if (!isOpen) return null;

  const timeSlots = ['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '15:00 - 17:00'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Lịch phòng tổng quát
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Hôm nay
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi tình trạng 140 phòng học theo 4 ca vận hành trong ngày
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* THANH TÌM KIẾM MÃ PHÒNG NHANH */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã phòng (VD: A1.101)..." 
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* NÚT ĐÓNG */}
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BẢNG LỊCH PHÒNG VỚI STICKY HEADER & SCROLLBAR */}
        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[60vh] p-4 sm:p-6">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-center border-collapse">
              <thead className="sticky top-0 bg-slate-900 text-white z-20 shadow-md">
                <tr className="text-xs uppercase font-extrabold tracking-wider">
                  <th className="py-3.5 px-6 text-left w-36 bg-slate-900 border-b border-slate-800">
                    Phòng
                  </th>
                  {timeSlots.map((slot) => (
                    <th key={slot} className="py-3.5 px-4 bg-slate-900 border-b border-slate-800">
                      <div className="flex items-center justify-center gap-1.5 text-slate-200 font-bold">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <span>{slot}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm font-medium">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-slate-400 text-sm font-semibold">
                      Không tìm thấy phòng nào khớp với "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((row) => (
                    <tr key={row.roomId} className="hover:bg-sky-50/50 transition-colors">
                      {/* Cột mã phòng */}
                      <td className="py-3 px-6 text-left font-black text-slate-900 bg-slate-50/40">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs font-mono">
                          {row.roomId}
                        </span>
                      </td>

                      {/* 4 Ca phòng trong ngày */}
                      {timeSlots.map((slot) => {
                        const status = row.slots[slot];
                        const isAvailable = status === 'Trống';

                        return (
                          <td key={slot} className="py-3 px-3">
                            <span 
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                                isAvailable
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                              }`}
                            >
                              <span 
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`}
                              ></span>
                              {status}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER MODAL & CHÚ THÍCH */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Hiển thị: <strong className="text-slate-900 font-bold">{filteredMatrix.length}</strong> / {scheduleMatrix?.length || 0} phòng</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Có thể đặt
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-rose-700">
              <XCircle className="w-4 h-4 text-rose-500" /> Đã có người đặt
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}