import React from 'react';
import { Users, ArrowRight, Monitor, Wifi, Wind, MapPin } from 'lucide-react';

export default function RoomCard({ room, onBook, isMarquee = false }) {
  // Tự động phân tích Tòa nhà và Tầng từ mã phòng (VD: A1.101 -> Tòa A1, Tầng 1)
  const buildingName = room.building || room.id?.split('.')[0] || 'A1';
  const floorNumber = room.floor || (room.id?.split('.')[1] ? room.id.split('.')[1][0] : '1');

  return (
    <div 
      className={`${
        isMarquee ? 'w-72 flex-shrink-0' : 'w-full'
      } group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative`}
    >
      {/* PHẦN HEADER: Nền Gradient xanh dương sắc nét & Huy hiệu trạng thái */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white p-5 relative overflow-hidden">
        {/* Vệt sáng trang trí chìm */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-sky-400/20 rounded-full blur-xl group-hover:bg-sky-400/35 transition-all duration-500"></div>

        <div className="flex items-center justify-between relative z-10">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-full tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            TRỐNG
          </span>

          <span className="text-xs text-slate-200 flex items-center gap-1 font-medium bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs">
            <MapPin className="w-3.5 h-3.5 text-sky-300" />
            Tòa {buildingName} - Tầng {floorNumber}
          </span>
        </div>

        {/* Mã phòng to đậm */}
        <div className="text-3xl font-black tracking-wider text-white mt-3 group-hover:text-sky-200 transition-colors">
          {room.id}
        </div>
      </div>

      {/* PHẦN BODY: Chi tiết loại phòng, sức chứa và tiện ích */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-md">
              {room.category || 'Phòng học nhóm'}
            </span>
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Sức chứa: <strong className="text-slate-900">{room.capacity} chỗ</strong>
            </span>
          </div>

          <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-900 transition">
            {room.name || `Phòng tự học ${room.id}`}
          </h4>

          {/* Hàng icon tiện ích phòng thực tế */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 text-slate-500 text-xs mt-3">
            <span className="flex items-center gap-1 text-[11px]" title="Có điều hòa không khí">
              <Wind className="w-3.5 h-3.5 text-sky-500" /> Máy lạnh
            </span>
            <span className="flex items-center gap-1 text-[11px]" title="Có máy chiếu/Màn hình lớn">
              <Monitor className="w-3.5 h-3.5 text-indigo-500" /> Màn hình
            </span>
            <span className="flex items-center gap-1 text-[11px]" title="Wifi phủ sóng">
              <Wifi className="w-3.5 h-3.5 text-emerald-500" /> Wifi
            </span>
          </div>
        </div>

        {/* NÚT ĐẶT PHÒNG GRADIENT */}
        <button 
          onClick={() => onBook(room, isMarquee)}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-900 hover:bg-gradient-to-r hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs hover:shadow-md hover:shadow-sky-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <span>Đặt ngay</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
