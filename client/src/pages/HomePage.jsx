import React from 'react';
import { Users, ArrowRight, ShieldAlert, CheckCircle, Ban } from 'lucide-react';
import RoomCard from '../components/RoomCard';
import BookingBanner from '../components/BookingBanner';

export default function HomePage({
  studentInput, setStudentInput,
  memberCount, setMemberCount,
  studentStatus, handleStudentAction,
  marqueeRooms, onOpenBookModal,
  onCheckIn, onCheckOut, onCancelBooking,
  onTimeoutNoShow, onTimeoutLateCheckOut
}) {
  return (
    <div className="space-y-12">
      {/* KHU VỰC HERO CÓ HÌNH NỀN TRƯỜNG & KHUNG KÍNH TRONG SUỐT */}
      <div 
        className="relative rounded-3xl overflow-hidden p-6 sm:p-12 mb-10 bg-cover bg-center shadow-lg border border-slate-200"
        style={{ backgroundImage: `url('/campus.jpg')` }}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>

        {/* LƯỚI BỐ CỤC CHÍNH BÊN TRONG HERO */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-6xl mx-auto w-full">
          
          {/* CỘT TRÁI: FORM TRA CỨU DẠNG KÍNH MỜ TRONG SUỐT (GLASSMORPHISM) */}
          <div className={`${studentStatus ? 'lg:col-span-2' : 'lg:col-span-3 max-w-xl mx-auto w-full'} bg-white/85 backdrop-blur-md border border-white/60 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all`}>
            <h2 className="text-2xl font-black text-center text-slate-900 mb-6 tracking-tight">
              Thông tin mượn phòng
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                  {studentStatus?.hasActiveBooking ? 'MSSV (Mã số sinh viên)' : 'Nhập email hoặc MSSV'}
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={studentInput} 
                    onChange={(e) => setStudentInput(e.target.value)}
                    placeholder="VD: 20000 hoặc ITITIU20000@student.hcmiu.edu.vn" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/90 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold shadow-inner transition"
                  />
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                  {studentStatus?.hasActiveBooking ? 'Quy mô nhóm' : 'Số lượng thành viên'}
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={memberCount} 
                    onChange={(e) => setMemberCount(e.target.value)}
                    placeholder="VD: 3 hoặc 5" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/90 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold shadow-inner transition"
                  />
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button 
                onClick={handleStudentAction}
                className="w-full bg-gradient-to-r from-sky-600 to-indigo-900 hover:from-sky-500 hover:to-indigo-950 text-white font-bold py-3 rounded-2xl transition duration-200 shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-98"
              >
                <ArrowRight className="w-4 h-4" />
                {studentStatus?.hasActiveBooking ? 'Xem thông tin' : 'ĐẶT PHÒNG'}
              </button>
            </div>

            {/* KHỐI HIỂN THỊ PHÒNG ĐANG ĐẶT & NÚT HỦY PHÒNG */}
            {studentStatus?.hasActiveBooking && (
              <div className="mt-6 pt-5 border-t border-slate-200/80">
                <BookingBanner 
                  booking={studentStatus?.booking}
                  onCheckIn={onCheckIn}
                  onCheckOut={onCheckOut}
                  onTimeoutNoShow={onTimeoutNoShow}
                  onTimeoutLateCheckOut={onTimeoutLateCheckOut}
                />

                {/* Nút hủy phòng (chỉ xuất hiện khi ở trạng thái BOOKED, chưa Check-in) */}
                {studentStatus.booking.status === 'BOOKED' && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => onCancelBooking(studentStatus.booking.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Hủy đặt phòng (Tối đa 3 lần/ngày)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: LỊCH SỬ BỊ PHẠT CỦA SINH VIÊN */}
          {studentStatus && (
            <div className="bg-white/85 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-600 font-black mb-4">
                <ShieldAlert className="w-5 h-5" />
                <span className="tracking-tight">Lịch sử vi phạm & Chế tài</span>
              </div>

              {!studentStatus.penalties?.violations?.length ? (
                <div className="text-center py-6 text-slate-500 text-sm font-medium">
                  <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                  Sinh viên chưa có vi phạm nào.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {studentStatus.penalties.violations.map((v, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/90 border border-rose-200/80 rounded-2xl text-xs text-rose-900 shadow-2xs">
                      <div className="font-bold">{v.reason}</div>
                      <div className="text-slate-500 mt-1 font-mono text-[11px]">{v.date}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1 font-medium">
                <p className="font-bold text-slate-800">Quy tắc chế tài:</p>
                <p>• Không nhận phòng (&gt;10p): Cảnh cáo → Khóa 30 ngày → Khóa vĩnh viễn.</p>
                <p>• Trả phòng trễ (&gt;30p): Cảnh cáo → Khóa 7 ngày → Khóa 30 ngày → Cấm vĩnh viễn.</p>
                <p>• Hủy phòng: Tối đa 3 lần trong ngày.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MỤC "⚡ CHỌN PHÒNG NHANH" (BĂNG CHUYỀN) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <span className="text-amber-500 text-2xl">⚡</span> Chọn phòng nhanh
          </h3>
          <span className="text-xs text-emerald-800 bg-emerald-50 font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
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