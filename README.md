# IURoomPeek - Hệ Thống Đặt Phòng Học Online (HCMIU)

> Báo cáo kỹ thuật dự án và tài liệu hướng dẫn giao diện người dùng cho IURoomPeek.

---

## I. Vấn Đề Đặt Ra (Problem Statement)
* **Thực trạng:** Quy trình mượn / đặt phòng học, phòng nhóm, phòng máy tính và giảng đường tại HCMIU hiện nay còn mang tính thủ công và phức tạp.
* **Bất cập:** Người dùng (sinh viên, giảng viên) phải qua nhiều công đoạn đăng ký, chờ phê duyệt trực tiếp hoặc thủ tục tại các văn phòng Khoa/Phòng ban liên quan.
* **Hậu quả:** Tốn nhiều thời gian, công sức, dễ dẫn đến tình trạng trùng lịch đặt phòng hoặc không nắm bắt được trạng thái phòng trống kịp thời.

---

## II. Lý Do Cần Giải Quyết (Motivation)
* **Tối ưu hóa thời gian:** Giảm thiểu tối đa các thủ tục hành chính rườm rà cho cả sinh viên lẫn bộ phận quản lý phòng học.
* **Minh bạch thông tin:** Giúp sinh viên dễ dàng tra cứu trạng thái phòng (Trống / Đã đặt) theo khung giờ thực tế mà không cần đến tận nơi

<br>
<p align="center">
  <img src="https://raw.githubusercontent.com/Ratioliber-Nguyen/ROOMFINDING_GDOC/Image-for-report/Image/list_of_rooms.png" 
       alt="Màn hình danh sách phòng trống" 
       width="70%" 
       style="border-radius: 30px; overflow: hidden;" />
  <br>
  <ins><i>Giao diện tra cứu và theo dõi trạng thái phòng trống</i></ins>
</p>

<br>

* **Chuyển đổi số nội bộ:** Hiện đại hóa hạ tầng quản lý tiện ích học tập trong nhà trường, nâng cao trải nghiệm học tập và làm việc nhóm của sinh viên IU.

---

## III. Đối Tượng Sử Dụng (Target Users)
* **Sinh viên HCMIU:** Có nhu cầu mượn phòng học nhóm, phòng máy tính (Lab), hoặc không gian tự học.
* **Cán bộ / Giảng viên:** Cần đặt giảng đường, phòng họp hoặc quản lý danh sách duyệt phòng.
* **Ban Quản lý Phòng học / Quản trị viên (Admin):** Theo dõi, kiểm duyệt và điều phối lịch sử dụng phòng trong toàn trường.

---

## IV. Ý Tưởng Giải Quyết & Tính Năng (Core Features)

Dự án cung cấp giải pháp **Website hỗ trợ đăng ký online** với giao diện thân thiện, hiện đại, tối ưu thao tác cho người dùng.
### Các tính năng chính (qua giao diện UI):
1. **Trang chủ & Chọn phòng nhanh:** 
   - Nhập thông tin nhanh: Email sinh viên (`MSSV@student.hcmiu.edu.vn`) / MSSV và số lượng thành viên nhóm.
   - Danh sách phòng gợi ý nhanh (Phòng học nhóm A1.101, A1.102, Giảng đường A2.205, Phòng máy tính LA1.301, LA1.305, Lib.01...) hiển thị rõ sức chứa và loại phòng.
    <br>
    <p align="center">
      <img src="https://github.com/Ratioliber-Nguyen/ROOMFINDING_GDOC/blob/Image-for-report/Image/book.png" 
           alt="Màn hình danh sách phòng trống" 
           width="75%" 
           style="border-radius: 30px; overflow: hidden;" />
      <br>
      <ins><i>Giao diện đặt và xem nhanh phòng trống</i></ins>
    </p>
    <br>
2. **Xem trạng thái & Đã đặt phòng:**
   - Kiểm tra thông tin đặt phòng hiện tại thông qua MSSV/mã xác nhận (vd: `#BK8X92`).
   - Tùy chọn nút hành động: *Xác nhận đã mượn phòng* hoặc *Xác nhận trả phòng*.
     
     <br>
     <p align="center">
      <img src="https://github.com/Ratioliber-Nguyen/ROOMFINDING_GDOC/blob/Image-for-report/Image/exp_booking.png" 
           alt="Màn hình danh sách phòng trống" 
           width="75%" 
           style="border-radius: 30px; overflow: hidden;" />
      <br>
      <ins><i>Giao diện đã đặt phòng</i></ins>
    </p>
     <br>
3. **Lịch phòng tổng quát (Trực quan hóa thời gian):**
   - Bảng tổng hợp trạng thái tất cả các phòng theo các khung giờ cố định trong ngày (08:00 - 10:00, 10:00 - 12:00, 13:00 - 15:00, 15:00 - 17:00) với mã màu phân biệt: **Trống** (Xanh) / **Đã đặt** (Đỏ).
   - Hỗ trợ hiển thị các ca đặt chèn / mốc giờ lẻ linh hoạt (vd: `10:30 - 13:30`).
   
     <br>
      <p align="center">
        <img src="https://github.com/Ratioliber-Nguyen/ROOMFINDING_GDOC/blob/Image-for-report/Image/schedule.png" 
             alt="Màn hình danh sách phòng trống" 
             width="70%" 
             style="border-radius: 30px; overflow: hidden;" />
        <br>
        <ins><i>Lịch theo dõi trạng thái phòng</i></ins>
      </p>
      
      <br>
4. **Xác nhận đặt phòng (Pop-up Modal):**
   - Cho phép chọn mốc giờ điểm danh và mốc giờ trả phòng tùy chỉnh.
   - Hiển thị hộp thoại xác nhận chi tiết (Mã phòng, khung giờ) trước khi gửi yêu cầu.
   
     <br>
      <p align="center">
        <img src="https://github.com/Ratioliber-Nguyen/ROOMFINDING_GDOC/blob/Image-for-report/Image/announce_booking.png" 
             alt="Màn hình danh sách phòng trống" 
             width="70%" 
             style="border-radius: 30px; overflow: hidden;" />
        <br>
        <ins><i>Thông báo xác nhận đặt phòng</i></ins>
      </p>
      
      <br>

---

## V. Phân Tích Chi Tiết Cấu Trúc Dự Án (Project Breakdown)

### 5.1. Luồng Hoạt Động Của Giao Diện (UI/UX Flow)
```text
[Trang chủ: Nhập Email/MSSV & Sức chứa] 
       │
       ├───► (Nếu đã đặt phòng) ──────► [Màn hình xem mã xác nhận / Trả phòng]
       │
       ├───► [Trang xem Phòng trống] ──► [Chọn phòng & Chọn khung giờ tùy chỉnh] ──► [Pop-up Xác nhận đặt]
       │
       └───► [Trang Lịch phòng tổng quát] (Hiển thị các ca trống / đã đặt trong ngày)

