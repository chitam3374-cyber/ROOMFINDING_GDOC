import React from 'react';
import { Users, Filter, Sparkles, Building2 } from 'lucide-react';
import RoomCard from '../components/RoomCard';

export default function RoomsPage({ 
  memberCount, 
  setMemberCount, 
  availableRooms, 
  onOpenBookModal, 
  onRefreshRooms 
}) {
  // Các mốc quy mô nhóm phổ biến để bấm lọc nhanh
  const quickSizes = [2, 4, 6, 8, 12];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* KHỐI HEADER TRANG & BỘ LỌC QUY MÔ NHÓM CHUYÊN NGHIỆP */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold mb-2 border border-sky-100">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            Hệ thống phân bổ phòng thông minh
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Danh sách phòng khả dụng
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span>Tìm thấy <strong className="text-sky-700 font-bold">{availableRooms?.length || 0}</strong> phòng phù hợp</span>
            <span>•</span>
            <span>Ưu tiên sức chứa gần nhất với: <strong className="text-indigo-900 font-bold">{memberCount || 1} người</strong></span>
          </p>
        </div>

        {/* BỘ ĐIỀU KHIỂN LỌC QUY MÔ (FILTER TOOLBAR) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Ô nhập số lượng thành viên có icon tích hợp */}
          <div className="relative">
            <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="number" 
              min="1"
              max="50"
              value={memberCount} 
              onChange={(e) => {
                setMemberCount(e.target.value);
                onRefreshRooms(e.target.value);
              }}
              placeholder="Quy mô nhóm..."
              className="w-full sm:w-44 pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition shadow-inner"
            />
          </div>

          {/* Các nút bấm chọn nhanh số người */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Nhanh:
            </span>
            {quickSizes.map((size) => (
              <button
                key={size}
                onClick={() => {
                  setMemberCount(size);
                  onRefreshRooms(size);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  parseInt(memberCount) === size
                    ? 'bg-white text-indigo-950 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {size} chỗ
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LƯỚI CARD PHÒNG HIỆN ĐẠI HOẶC EMPTY STATE */}
      {!availableRooms || availableRooms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-12 shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">Không tìm thấy phòng phù hợp</h3>
          <p className="text-sm text-slate-500 mt-1">
            Vui lòng thử điều chỉnh lại quy mô nhóm hoặc kiểm tra bảng lịch phòng tổng quát.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {availableRooms.map((room) => (
            <RoomCard 
              key={room.id} 
              room={room} 
              onBook={onOpenBookModal} 
            />
          ))}
        </div>
      )}
    </div>
  );
}