import React, { useState, useMemo } from 'react';
import { Sparkles, Building2, BookOpen, GraduationCap, FlaskConical, Search, X, SlidersHorizontal } from 'lucide-react';
import RoomCard from '../components/RoomCard';

export default function RoomsPage({ 
  availableRooms, 
  onOpenBookModal 
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'Tất cả loại phòng', icon: Building2, desc: '122 phòng' },
    { id: 'Phòng học', label: 'Phòng học', icon: BookOpen, desc: '30 - 35 người' },
    { id: 'Giảng đường', label: 'Giảng đường', icon: GraduationCap, desc: '80 - 150 người' },
    { id: 'Phòng Lab', label: 'Phòng Lab', icon: FlaskConical, desc: '20 - 30 người' },
  ];

  const buildings = [
    { id: 'all', label: 'Tất cả tòa' },
    { id: 'A1', label: 'Tòa A1' },
    { id: 'A2', label: 'Tòa A2' },
    { id: 'LA1', label: 'Tòa LA1 (Lab)' },
    { id: 'LA2', label: 'Tòa LA2 (Lab)' },
    { id: 'B', label: 'Tòa B' },
  ];

  // Lọc danh sách phòng theo Category, Tòa nhà và Từ khóa tìm kiếm
  const filteredRooms = useMemo(() => {
    if (!availableRooms) return [];

    return availableRooms.filter(room => {
      // 1. Lọc theo Category
      if (selectedCategory !== 'all') {
        if (!room.category || !room.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }

      // 2. Lọc theo Tòa nhà
      if (selectedBuilding !== 'all') {
        if (room.building !== selectedBuilding) {
          return false;
        }
      }

      // 3. Lọc theo Ô tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchId = room.id.toLowerCase().includes(query);
        const matchName = room.name ? room.name.toLowerCase().includes(query) : false;
        if (!matchId && !matchName) return false;
      }

      return true;
    });
  }, [availableRooms, selectedCategory, selectedBuilding, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER & THANH CÔNG CỤ LỌC CATEGORY */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold mb-2 border border-sky-100">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              Khuôn viên trường ĐH Quốc Tế (HCMIU)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Phòng học & Giảng đường khả dụng
            </h2>
            <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>Hiển thị <strong className="text-sky-700 font-bold">{filteredRooms.length}</strong> / {availableRooms?.length || 0} phòng</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">
                Sẵn sàng đặt chỗ
              </span>
            </p>
          </div>

          {/* Ô TÌM NHANH MÃ PHÒNG */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã phòng (VD: A1.101, LA1.201)..." 
              className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* BỘ LỌC PHÂN LOẠI CATEGORY */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
            Phân loại phòng:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-800 text-white border-transparent shadow-md shadow-sky-900/20 scale-101'
                      : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-sky-700 shadow-2xs border border-slate-200/60'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold truncate">{cat.label}</div>
                    <div className={`text-[11px] font-medium truncate ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                      {cat.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* BỘ LỌC TÒA NHÀ (BUILDINGS) */}
          <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Tòa nhà:</span>
            {buildings.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBuilding(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedBuilding === b.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LƯỚI CARD PHÒNG HIỆN ĐẠI HOẶC EMPTY STATE */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-12 shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">Không tìm thấy phòng phù hợp</h3>
          <p className="text-sm text-slate-500 mt-1">
            Vui lòng thử chọn phân loại khác hoặc xóa từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
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
