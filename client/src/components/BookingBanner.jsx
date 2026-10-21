import React from 'react';
import { CheckCircle, Clock, Users, Key, DoorClosed } from 'lucide-react';

export default function BookingBanner({ booking, onCheckIn, onCheckOut, onTimeoutNoShow, onTimeoutLateCheckOut }) {
  if (!booking) return null;

  // Tính cửa sổ thời gian kích hoạt nút
  const getTimeWindowStatus = () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (booking.startTime || '08:00').split(':').map(Number);
    const startMins = startH * 60 + startM;

    const [endH, endM] = (booking.endTime || '10:00').split(':').map(Number);
    const endMins = endH * 60 + endM;

    const canCheckIn = booking.status === 'BOOKED' && 
                       currentMins >= (startMins - 10) && 
                       currentMins <= (startMins + 10);

    const canCheckOut = booking.status === 'CHECKED_IN' && 
                        currentMins >= endMins && 
                        currentMins <= (endMins + 30);

    let checkInMsg = '';
    if (currentMins < startMins - 10) {
      checkInMsg = `(Kích hoạt lúc ${String(Math.floor((startMins - 10) / 60)).padStart(2, '0')}:${String((startMins - 10) % 60).padStart(2, '0')})`;
    }

    let checkOutMsg = '';
    if (currentMins < endMins) {
      checkOutMsg = `(Kích hoạt lúc ${booking.endTime})`;
    }

    return { canCheckIn, canCheckOut, checkInMsg, checkOutMsg };
  };

  const { canCheckIn, canCheckOut, checkInMsg, checkOutMsg } = getTimeWindowStatus();

  return (
    <div className="mt-8 border-2 border-dashed border-sky-400 rounded-2xl p-5 bg-sky-50/40">
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 mt-0.5">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">
            Bạn đã đặt phòng: <span className="text-sky-700">{booking.roomId}</span>
          </h3>
          <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
            <Clock className="w-4 h-4 text-slate-400" />
            TG: {booking.startTime} - {booking.endTime}, {booking.date}
          </p>
          <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
            <Users className="w-4 h-4 text-slate-400" />
            Mã xác nhận: <span className="bg-slate-200 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-700">#{booking.id}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              {booking.status === 'CHECKED_IN' ? 'Đã nhận phòng' : 'Chờ xác nhận'}
            </span>
          </p>

          <div className="flex flex-wrap gap-3 mt-4">
            <button 
              onClick={() => onCheckIn(booking.id)}
              disabled={!canCheckIn}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition ${
                canCheckIn 
                  ? 'bg-sky-500 hover:bg-sky-600 text-white cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <Key className="w-4 h-4" />
              Xác nhận đã mượn phòng {checkInMsg}
            </button>
            
            <button 
              onClick={() => onCheckOut(booking.id)}
              disabled={!canCheckOut}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition ${
                canCheckOut 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <DoorClosed className="w-4 h-4" />
              Xác nhận trả phòng {checkOutMsg}
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
            <span>Mô phỏng test:</span>
            <button onClick={() => onTimeoutNoShow(booking.id)} className="text-red-600 hover:underline">
              [Test quá 10p ko nhận]
            </button>
            <span>•</span>
            <button onClick={() => onTimeoutLateCheckOut(booking.id)} className="text-amber-600 hover:underline">
              [Test lố 30p ko trả]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}