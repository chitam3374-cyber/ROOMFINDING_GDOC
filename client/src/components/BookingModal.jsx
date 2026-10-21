import React from 'react';
import { Calendar } from 'lucide-react';

export default function BookingModal({ modalState, setModalState, studentInput, setStudentInput, memberCount, setMemberCount, onConfirm }) {
  if (!modalState.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Xác nhận đặt phòng</h3>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-2">
          <div className="text-lg font-bold text-slate-800">
            Phòng: <span className="text-sky-700">{modalState.room?.id}</span>
          </div>
          <div className="text-xs text-slate-500">
            {modalState.room?.category} • Sức chứa: {modalState.room?.capacity} người
          </div>
        </div>

        {modalState.isQuickBook && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã số sinh viên (MSSV)</label>
              <input 
                type="text" 
                value={studentInput} 
                onChange={(e) => setStudentInput(e.target.value)}
                placeholder="VD: 20000"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng người tham gia</label>
              <input 
                type="number" 
                value={memberCount} 
                onChange={(e) => setMemberCount(e.target.value)}
                placeholder="VD: 4"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
  <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ bắt đầu</label>
  <input 
    type="time" 
    value={modalState.startTime}
    onChange={(e) => {
      const newStart = e.target.value;
      const [h, m] = newStart.split(':').map(Number);
      
      // Tự động tính giờ kết thúc tối thiểu = giờ bắt đầu + 1 tiếng
      const nextH = Math.min(17, h + 1);
      const newEnd = `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      setModalState({ 
        ...modalState, 
        startTime: newStart,
        endTime: newEnd
      });
    }}
    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
  />
</div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ kết thúc</label>
            <input 
              type="time" 
              value={modalState.endTime}
              onChange={(e) => setModalState({ ...modalState, endTime: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={() => setModalState({ ...modalState, isOpen: false })}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
          >
            Hủy
          </button>
          <button 
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-sm font-semibold shadow-md transition"
          >
            Đồng ý đặt
          </button>
        </div>
      </div>
    </div>
  );
}