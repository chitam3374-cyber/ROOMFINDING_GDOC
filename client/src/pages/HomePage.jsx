import React from 'react';
import { Users, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';
import RoomCard from '../components/RoomCard';
import BookingBanner from '../components/BookingBanner';

export default function HomePage({
  studentInput, setStudentInput,
  memberCount, setMemberCount,
  studentStatus, handleStudentAction,
  marqueeRooms, onOpenBookModal,
  onCheckIn, onCheckOut, onTimeoutNoShow, onTimeoutLateCheckOut
}) {
  return (
    <div className="space-y-12">
      {/* KHU VỰC HERO CÓ HÌNH NỀN TRƯỜNG & KHUNG KÍNH TRONG SUỐT */}
      <div 
        className="relative rounded-3xl overflow-hidden p-6 sm:p-12 mb-10 bg-cover bg-center shadow-lg border border-slate-200"
        style={{ backgroundImage: `url('/campus.jpg')` }}
      >
        {/* Lớp phủ sẫm màu nhẹ giúp chữ và khung kính luôn nổi bật */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>

        {/* LƯỚI BỐ CỤC CHÍNH BÊN TRONG HERO */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-6xl mx-auto w-full">
          
          {/* CỘT TRÁI: FORM TRA CỨU DẠNG KÍNH MỜ TRONG SUỐT (GLASSMORPHISM) */}
          <div className={`${studentStatus ? 'lg:col-span-2' : 'lg:col-span-3 max-w-xl mx-auto w-full'} bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 sm:p-8 shadow-2xl transition-all`}>
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-6 drop-shadow-sm">
              Thông tin mượn phòng
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  {studentStatus?.hasActiveBooking ? 'MSSV (Mã số sinh viên)' : 'Nhập email hoặc MSSV'}
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={studentInput} 
                    onChange={(e) => setStudentInput(e.target.value)}
                    placeholder="VD: 20000 hoặc ITITIU20000@student.hcmiu.edu.vn" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/85 border border-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm shadow-inner transition"
                  />
                  <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  {studentStatus?.hasActiveBooking ? 'Quy mô nhóm' : 'Số lượng thành viên'}
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={memberCount} 
                    onChange={(e) => setMemberCount(e.target.value)}
                    placeholder="VD: 3 hoặc 5" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/85 border border-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm shadow-inner transition"
                  />
                  <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button 
                onClick={handleStudentAction}
                className="w-full bg-indigo-900/95 hover:bg-indigo-950 text-white font-medium py-3 rounded-xl transition duration-200 shadow-lg hover:shadow-indigo-900/30 flex items-center justify-center gap-2 mt-2"
              >
                <ArrowRight className="w-4 h-4" />
                {studentStatus?.hasActiveBooking ? 'Xem thông tin' : 'ĐẶT PHÒNG'}
              </button>
            </div>

            <BookingBanner 
              booking={studentStatus?.booking}
              onCheckIn={onCheckIn}
              onCheckOut={onCheckOut}
              onTimeoutNoShow={onTimeoutNoShow}
              onTimeoutLateCheckOut={onTimeoutLateCheckOut}
            />
          </div>

          {/* CỘT PHẢI: LỊCH SỬ BỊ PHẠT CỦA SINH VIÊN (KÍNH MỜ ĐỒNG BỘ) */}
          {studentStatus && (
            <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 text-red-600 font-bold mb-4">
                <ShieldAlert className="w-5 h-5" />
                <span>Lịch sử vi phạm & Chế tài</span>
              </div>

              {!studentStatus.penalties?.violations?.length ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                  Sinh viên chưa có vi phạm nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentStatus.penalties.violations.map((v, idx) => (
                    <div key={idx} className="p-3 bg-red-50/90 border border-red-200 rounded-xl text-xs text-red-800">
                      <div className="font-semibold">{v.reason}</div>
                      <div className="text-slate-500 mt-1">{v.date}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Quy tắc chế tài:</p>
                <p>• Không nhận (quá 10p): Cảnh cáo → Khóa 30 ngày → Khóa vĩnh viễn.</p>
                <p>• Trả trễ (lố 30p): Cảnh cáo → Khóa 7 ngày → Khóa 30 ngày → Ban.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MỤC "⚡ CHỌN PHÒNG NHANH" (BĂNG CHUYỀN) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-amber-500 text-2xl">⚡</span> Chọn phòng nhanh
          </h3>
          <span className="text-xs text-slate-600 bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-full border border-emerald-200">
            Chỉ hiển thị {marqueeRooms.length} phòng đang TRỐNG
          </span>
        </div>

        <div className="overflow-hidden relative w-full rounded-2xl py-2">
          <div className="flex gap-4 animate-marquee pause-hover w-max">
            {[...marqueeRooms, ...marqueeRooms].map((room, idx) => (
              <RoomCard 
                key={`${room.id}-${idx}`} 
                room={room} 
                onBook={onOpenBookModal} 
                isMarquee={true} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}