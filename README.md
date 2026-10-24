# Báo Cáo Kỹ Thuật & Tài Liệu Hướng Dẫn Sử Dụng Hệ Thống IURoomPeek

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/logo.png"  
       alt="Logo IURoomPeek"  
       width="25%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i><b>IU RoomPeek - Smart Campus Booking System</b></i></ins> 
</p> 
<br>

> **Dự án:** Hệ thống đặt và quản lý phòng học online thông minh dành cho Trường Đại học Quốc tế - ĐHQG TP.HCM (HCMIU).

---

## Mục Lục
* [I. Vấn Đề Đặt Ra](#i-vấn-đề-đặt-ra)
* [II. Lý Do Cần Giải Quyết](#ii-lý-do-cần-giải-quyết)
* [III. Đối Tượng Sử Dụng ](#iii-đối-tượng-sử-dụng)
* [IV. Ý Tưởng Giải Quyết & Tính Năng Cốt Lõi](#iv-ý-tưởng-giải-quyết--tính-năng-cốt-lõi)
* [V. Chi Tiết Giao Diện & Luồng Hoạt Động (UI/UX Flow)](#v-chi-tiết-giao-diện--luồng-hoạt-động-uiux-flow)
* [VI. Trang Quản Trị Hệ Thống - Admin Control Center](#vi-trang-quản-trị-hệ-thống--admin-control-center-devpage)
* [VII. Đánh Giá Hiệu Quả & Hướng Phát Triển](#vii-đánh-giá-hiệu-quả--hướng-phát-triển)

---

## I. Vấn Đề Đặt Ra 
* **Thực trạng:** Quy trình mượn / đặt phòng học, phòng làm việc nhóm, phòng máy tính (Lab) và giảng đường tại HCMIU hiện nay còn mang tính thủ công và phức tạp.
* **Bất cập:** Người dùng (sinh viên, giảng viên) phải qua nhiều công đoạn đăng ký, chờ phê duyệt trực tiếp hoặc làm thủ tục giấy tờ tại các văn phòng Khoa / Phòng ban liên quan.
* **Hậu quả:** Tốn nhiều thời gian, công sức, dễ dẫn đến tình trạng trùng lịch đặt phòng, chồng chéo ca mượn hoặc không nắm bắt được trạng thái phòng trống kịp thời theo thời gian thực.

---

## II. Lý Do Cần Giải Quyết 
* **Tối ưu hóa thời gian:** Giảm thiểu tối đa các thủ tục hành chính rườm rà cho cả sinh viên lẫn bộ phận quản lý phòng học.
* **Minh bạch thông tin:** Giúp sinh viên dễ dàng tra cứu trạng thái phòng (Trống / Đã đặt) theo từng khung giờ thực tế mà không cần đến tận nơi kiểm tra.

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/empty_room_2.png"  
       alt="Màn hình danh sách phòng trống"  
       width="70%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i>Giao diện tra cứu và theo dõi trạng thái phòng trống tổng quan</i></ins> 
</p> 
<br>

* **Chuyển đổi số nội bộ:** Hiện đại hóa hạ tầng quản lý tiện ích học tập trong nhà trường, nâng cao trải nghiệm học tập, thảo luận và làm việc nhóm của sinh viên IU.

---

## III. Đối Tượng Sử Dụng 
* **Sinh viên HCMIU:** Có nhu cầu mượn phòng học nhóm, phòng máy tính (Lab), hoặc không gian tự học theo ca.
* **Cán bộ / Giảng viên:** Cần đặt giảng đường, phòng họp hoặc theo dõi danh sách phê duyệt phòng học.
* **Ban Quản lý Phòng học / Quản trị viên (Admin):** Theo dõi, kiểm duyệt, phân quyền và điều phối toàn bộ lịch sử dụng phòng trong campus.

---

## IV. Ý Tưởng Giải Quyết & Tính Năng Cốt Lõi

Dự án cung cấp giải pháp **Website hỗ trợ đăng ký online thông minh** với giao diện thân thiện, tối ưu hóa thao tác người dùng.

### Các Tính Năng Chính:
1. **Trang chủ & Đăng nhập xác thực:**
   * Tích hợp đồng hồ thời gian thực và hình ảnh campus.
   * Yêu cầu đăng nhập chính chủ bằng Email sinh viên HCMIU (`@student.hcmiu.edu.vn`).
2. **Bộ lọc & Tra cứu phòng trống đa năng:**
   * Lọc theo Loại phòng (Phòng học, Giảng đường, Phòng Lab, Phòng tự học).
   * Lọc theo Tòa nhà (`A1`, `A2`, `LA1`, `LA2`, `B`) hoặc tìm kiếm chính xác theo Mã phòng.
3. **Đặt phòng tùy chỉnh & Xác nhận tức thì (Pop-up Modal):**
   * Cho phép chọn Ngày, Giờ bắt đầu và Giờ kết thúc tùy ý (Tối thiểu 60 phút/lượt).
   * Hiển thị đầy đủ thông tin xác nhận tránh nhầm lẫn.
4. **Quản lý phòng mượn & Chế tài vi phạm (Auto Penalty System):**
   * Cho phép điểm danh (Check-in), trả phòng (Check-out) hoặc hủy lịch.
   * Áp dụng quy tắc tính phạt tự động đối với các hành vi: Trả phòng trễ, Không nhận phòng (No-show), hoặc Hủy phòng quá số lần quy định.
5. **Trực quan hóa dải thời gian (Timeline Schedule):**
   * Biểu diễn tình trạng khả dụng của tất cả phòng học dưới dạng thanh timeline từ 08:00 - 17:00 với hai màu chủ đạo: **Trống** (Xanh) và **Đã đặt** (Đỏ).

---

## V. Chi Tiết Giao Diện & Luồng Hoạt Động (UI/UX Flow)

### Luồng Hoạt Động Cấu Trúc (Flowcharts)
```text
[Trang chủ: Đăng nhập Email Sinh viên / MSSV]
       │
       ├───► [Trang Phòng trống] ──► [Chọn Lọc Phòng / Tòa nhà] ──► [Pop-up Đặt Phòng] ──► [Xác Nhận Đặt]
       │
       ├───► [Trang Lịch Phòng Tổng Quát] ──► [Xem Timeline Trống / Đã Đặt Theo Giờ Real-time]
       │
       └───► [Trang Quản Lý Cá Nhân] ──────► [Check-in / Check-out / Hủy Đặt / Xem Lịch Sử Vi Phạm]
```

---

### 1. Màn Hình Trang Chủ & Đăng Nhập
* **Mô tả:** Màn hình chính giúp sinh viên đăng nhập hệ thống bằng email sinh viên trường Đại học Quốc tế.
* **Tính năng:** Đăng nhập, Đăng ký tài khoản, xem đồng hồ thời gian thực.

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/home_page.png"  
       alt="Màn hình trang chủ"  
       width="70%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i>Giao diện trang chủ và Đăng nhập hệ thống IURoomPeek</i></ins> 
</p> 
<br>

---

### 2. Màn Hình Danh Sách & Bộ Lọc Phòng Trống 
* **Mô tả:** Giao diện hiển thị danh sách phòng khả dụng theo dạng thẻ (Card) trực quan.
* **Bộ lọc tích hợp:**
  * **Loại phòng:** Tất cả loại phòng, Phòng học (30-35 người), Giảng đường (80-150 người), Phòng Lab (20-30 người).
  * **Tòa nhà:** Tòa A1, Tòa A2, Tòa LA1, Tòa LA2, Tòa B.

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/empty_room_2.png"  
       alt="Màn hình danh sách phòng trống"  
       width="70%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i>Giao diện danh sách phòng học và bộ lọc tòa nhà/loại phòng</i></ins> 
</p> 
<br>

---

### 3. Modal Tùy Chỉnh Giờ & Xác Nhận Đặt Phòng 
* **Mô tả:** Hộp thoại Pop-up cho phép sinh viên chủ động chọn thời gian bắt đầu và kết thúc ca mượn phòng.
* **Thông tin hiển thị:** Mã phòng, loại phòng, sức chứa, tài khoản đặt, ngày đặt và chọn mốc giờ (08:00 AM - 05:00 PM).

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/empty_room.png"  
       alt="Modal xác nhận đặt phòng"  
       width="70%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i>Hộp thoại tùy chỉnh khung giờ mượn phòng</i></ins> 
</p> 
<br>

---

### 4. Màn Hình Thông Báo Đặt Phòng Tức Thì 
* **Mô tả:** Cửa sổ thông báo kết quả đặt phòng kèm chi tiết thời gian và quy mô nhóm mượn.

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/booking.png"  
       alt="Màn hình thông báo đặt phòng thành công"  
       width="70%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i>Thông báo xác nhận đặt phòng và khung giờ giữ chỗ</i></ins> 
</p> 
<br>

---

### 5. Quản Lý Phòng Đang Mượn & Quy Tắc Chế Tài
* **Mô tả:** Nơi sinh viên theo dõi phòng mượn hiện tại, thực hiện **Xác nhận đã mượn phòng (Check-in)** hoặc **Xác nhận trả phòng (Check-out)**.
* **Bảng Quy tắc chế tài (Penalty Rules):**
  * **Không nhận phòng (>10p):** Cảnh cáo $\rightarrow$ Khóa 30 ngày $\rightarrow$ Khóa vĩnh viễn.
  * **Trả phòng trễ:** Cho phép trả phòng trước/sau giờ kết thúc 30 phút. Quá 30 phút phạt theo các mức: Cảnh cáo $\rightarrow$ Khóa 7 ngày $\rightarrow$ Khóa 30 ngày $\rightarrow$ Cấm vĩnh viễn.
  * **Hủy phòng:** Tối đa 3 lần miễn phí/ngày. Từ lần thứ 4 tạm cấm đặt 10 phút.

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/booked.png"  
       alt="Màn hình quản lý phòng đang mượn"  
       width="70%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i>Giao diện quản lý phòng mượn và bảng theo dõi quy tắc vi phạm</i></ins> 
</p> 
<br>

---

### 6. Biểu Đồ Timeline Trực Quan Lịch Phòng 
* **Mô tả:** Bảng theo dõi tình trạng khả dụng toàn bộ các phòng theo mốc giờ thực tế từ `08:00` đến `17:00`.
* **Mã màu:** Đoạn xanh đại diện cho phòng Trống (Có thể đặt), đoạn đỏ đại diện cho phòng Đã được đặt.

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/schedule.png"  
       alt="Màn hình dải thời gian phòng học"  
       width="70%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i>Sơ đồ dải thời gian trạng thái phòng theo giờ trong ngày</i></ins> 
</p> 
<br>

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/short_schedule.png"  
       alt="Lịch theo dõi phòng rút gọn"  
       width="70%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i>Giao diện rút gọn theo dõi lịch phòng trống nhanh</i></ins> 
</p> 
<br>

---

## VI. Trang Quản Trị Hệ Thống - Admin Control Center 

Giao diện quản trị dành riêng cho Ban Quản lý Phòng học để điều phối toàn bộ tài khoản và hoạt động mượn phòng trong campus.

### 1. Quản Lý Lịch Phòng Real-Time 
* **Mô tả:** Theo dõi danh sách phòng theo từng trạng thái chi tiết: `BOOKED` (Đã đặt), `CHECKED_IN` (Đang sử dụng), `COMPLETED` (Đã hoàn tất), hoặc `LOCKED` (Khóa/Bảo trì).
* **Công cụ:** Cho phép chuyển đổi giữa các ngày và lọc phòng theo từng Tòa nhà.

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/admin_room.png"  
       alt="Trang quản trị lịch phòng Admin"  
       width="70%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i>Trang Quản Trị Hệ Thống - Quản lý lịch phòng chi tiết và khóa phòng bảo trì</i></ins> 
</p> 
<br>

---

### 2. Quản Lý Tài Khoản, Phân Quyền & Gỡ Ban 
* **Phân quyền (Roles):** Chuyển đổi linh hoạt giữa quyền `Student` và `Admin`.
* **Xử lý vi phạm:** Xem chi tiết số lần vi phạm (No-Show, Trả trễ) và trạng thái Chế tài của từng sinh viên. Hỗ trợ Admin gỡ cấm vi phạm khi có lý do chính đáng.

<br> 
<p align="center"> 
  <img src="https://raw.githubusercontent.com/chitam3374-cyber/ROOMFINDING_GDOC/Image-for-report/Image/admin_acc.png"  
       alt="Trang quản lý tài khoản Admin"  
       width="70%"  
       style="border-radius: 30px; overflow: hidden;" /> 
  <br> 
  <ins><i>Trang Quản Trị Hệ Thống - Phân quyền tài khoản và gỡ phạt sinh viên</i></ins> 
</p> 
<br>

---

## VII. Đánh Giá Hiệu Quả & Hướng Phát Triển

### Hiệu Quả Đạt Được
* **Tối ưu hóa thời gian:** Giảm hơn 80% thời gian đăng ký và phê duyệt mượn phòng.
* **Cải thiện tỷ lệ lãng phí phòng:** Minh bạch hóa thông tin giúp gia tăng công suất sử dụng phòng học nhóm.
* **Tự động hóa quản lý:** Bảng chế tài tự động giúp giảm áp lực giám sát cho bộ phận quản lý.

### Hướng Phát Triển Tiếp Theo
* Tích hợp mã QR Code tại mỗi cửa phòng để sinh viên quét mã Check-in / Check-out tự động.
* Phát triển tính năng gửi thông báo tự động qua Email / TelegramBot nhắc giờ trả phòng.
* Áp dụng AI dự đoán nhu cầu và gợi ý phòng phù hợp cho sinh viên dựa trên thói quen sử dụng.
