# Hướng dẫn sử dụng Theme System

## A. Cấu hình Theme Mode

Trong các file JavaScript, bạn có thể thay đổi biến `THEME_MODE` để điều khiển cách màu header/footer được xác định:

### app.js (vong1.html):
```javascript
// THEME CONFIGURATION - Global variable to control header/footer theme
// Options: 'default', 'category', 'round'
const THEME_MODE = 'round'; // Default: round mode (màu đỏ cho vong1)
```

### app2.js (vong2.html):
```javascript
// THEME CONFIGURATION - Global variable to control header/footer theme
// Options: 'default', 'category', 'round'
const THEME_MODE = 'category'; // Default: category mode 
```

### app3.js (vong3.html):
```javascript
// THEME CONFIGURATION - Global variable to control header/footer theme
// Options: 'default', 'category', 'round'
const THEME_MODE = 'round'; // Default: round mode (màu tím cho vong3)
```

### Các options available:

1. **`'default'`** - Luôn sử dụng màu xanh lá mặc định
2. **`'category'`** - Màu dựa trên loại câu hỏi (CSPL, PCCC, Y tế, KTM, BQ-BX-VC)  
3. **`'round'`** - Màu dựa trên vòng thi (vong1: đỏ, vong2: xanh dương, vong3: tím)

## B. Theme Colors

### Round-based themes:
- **Vòng 1** (`vong1`) - Red gradient: `#dc2626 → #ef4444 → #f87171`
- **Vòng 2** (`vong2`) - Blue gradient: `#2563eb → #3b82f6 → #60a5fa`
- **Vòng 3** (`vong3`) - Purple gradient: `#7c3aed → #a855f7 → #c084fc`

### Category-based themes:
- **CSPL** - Green gradient: `#065f46 → #047857`
- **PCCC** - Red gradient: `#991b1b → #b91c1c`
- **Y tế** - Purple gradient: `#5b21b6 → #7c3aed`
- **KTM** - Brown gradient: `#78350f → #9a3412`
- **BQ-BX-VC** - Blue gradient: `#1e40af → #1d4ed8`

## C. Testing trong Console

Bạn có thể test các theme khác nhau bằng cách mở Developer Console và chạy:

### Trên tất cả các trang (vong1.html, vong2.html, vong3.html):

```javascript
// Thay đổi theme mode
changeThemeMode('round');    // Sử dụng theme theo vòng
changeThemeMode('category'); // Sử dụng theme theo loại câu hỏi
changeThemeMode('default');  // Sử dụng màu mặc định

// Thay đổi vòng hiện tại (khi ở mode 'round')
changeCurrentRound('vong1'); // Đỏ
changeCurrentRound('vong2'); // Xanh dương  
changeCurrentRound('vong3'); // Tím
```

### Ví dụ sử dụng:
- **Trên vong1.html**: Mặc định là theme đỏ (vong1), có thể test các theme khác
- **Trên vong2.html**: Mặc định là theme theo category, có thể chuyển sang round mode
- **Trên vong3.html**: Mặc định là theme tím (vong3), có thể test các theme khác

## D. Visual Effects

### Hiệu ứng đã thêm:
1. **Shimmer effect** - Hiệu ứng ánh sáng di chuyển trên header/footer
2. **Slide animations** - Header slide down, footer slide up khi tải trang
3. **Fade in scale** - Các element con xuất hiện với animation scale
4. **Glow pulse** - Hiệu ứng phát sáng khi hover
5. **Button ripple** - Hiệu ứng khi click button
6. **Progress bar shimmer** - Thanh progress có hiệu ứng ánh sáng
7. **Rainbow progress bar** - Thanh tiến trình ở đầu trang với nhiều màu

### Animation timing:
- Header elements: 0.1s - 0.5s delay
- Footer elements: 0.1s - 0.5s delay  
- Responsive: Giảm duration xuống 0.8s cho màn hình nhỏ

## E. Cấu trúc CSS Classes

Các theme classes được áp dụng cho `slideContainer`:
- `header-footer-theme-default`
- `header-footer-theme-vong1`
- `header-footer-theme-vong2` 
- `header-footer-theme-vong3`
- `header-footer-theme-cspl`
- `header-footer-theme-pccc`
- `header-footer-theme-yte`
- `header-footer-theme-ktm`
- `header-footer-theme-bq-bx-vc`

CSS sẽ tự động áp dụng cho `.header` và `.footer` dựa trên class của container.
