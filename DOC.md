KẾ HOẠCH PHÁT TRIỂN WEB APP TRÌNH CHIẾU HỘI THI ATVSV GIỎI

Mục tiêu chung: Xây dựng một ứng dụng trình chiếu web toàn màn hình, responsive, chuyên nghiệp, hiển thị nội dung câu hỏi từ JSON, tích hợp chức năng đọc tự động (TTS) và các công cụ quản lý thi đấu.

Công nghệ sử dụng:

Framework: Next.js (App Router)

UI Library: Shadcn UI (sử dụng React components và Tailwind CSS)

State Management: React Context API (đơn giản và hiệu quả cho dự án này)

Audio Playback: HTML5 Audio API (thông qua React hooks)

PHA 1: KHỞI TẠO DỰ ÁN & CẤU TRÚC CƠ BẢN

Bước 1.1: Khởi tạo dự án Next.js và cài đặt Shadcn UI

Yêu cầu AI:

Tạo một dự án Next.js mới bằng create-next-app. Đảm bảo sử dụng:

TypeScript.

ESLint.

Tailwind CSS.

App Router.

Không cần @/src directory.

Sau khi dự án được tạo, tiến hành cài đặt và khởi tạo Shadcn UI theo hướng dẫn chính thức. Chọn cấu hình mặc định (TypeScript, Tailwind, components.json trong thư mục gốc, aliases @/components và @/lib).

Thêm các component cơ bản của Shadcn UI cần thiết cho layout ban đầu: button, card, progress.

Bước 1.2: Cấu trúc thư mục và quản lý dữ liệu JSON

Yêu cầu AI:

Tạo một thư mục data ở thư mục gốc của dự án (/data).

Trong thư mục data, tạo file quizData.json và paste toàn bộ nội dung JSON bạn đã cung cấp vào đó (bao gồm quy_che_thi và ngan_hang_cau_hoi).

Tạo thư mục public/images để chứa các file hình ảnh (ví dụ: KTM_HA_1.jpg).

Tạo thư mục public/audio để chứa các file âm thanh TTS (ví dụ: CSPL_TN_1.mp3, CSPL_TN_1_A.mp3).

Trong lib/utils.ts (được tạo bởi Shadcn), thêm một hàm tiện ích để đọc dữ liệu JSON từ data/quizData.json.

Bước 1.3: Cấu hình CSS toàn cục và Layout cơ bản

Yêu cầu AI:

Mở app/globals.css. Thêm CSS sau để đảm bảo ứng dụng luôn hiển thị toàn màn hình và không có thanh cuộn:

html, body, #__next {
  height: 100%;
  overflow: hidden; /* Quan trọng để loại bỏ scrollbar */
  margin: 0;
  padding: 0;
}

/* Đảm bảo flexbox hoặc grid layout chiếm toàn bộ chiều cao */
body {
  display: flex;
  flex-direction: column;
}
#__next {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}


Tạo các component layout cơ bản trong components/layout/:

Header.tsx:

Hiển thị tên hội thi (quy_che_thi.ten_hoi_thi).

Có thể có một biểu tượng nhỏ (dùng @radix-ui/react-icons hoặc đơn giản là text icon).

Sử dụng Tailwind CSS để định vị ở trên cùng, có padding và màu nền phù hợp (ví dụ: bg-primary text-primary-foreground).

Footer.tsx:

Hiển thị thông tin chung hoặc các điều khiển cơ bản (ví dụ: số câu hỏi hiện tại, trạng thái timer - sẽ bổ sung sau).

Sử dụng Tailwind CSS để định vị ở dưới cùng, có padding và màu nền.

Tạo file app/layout.tsx để bọc toàn bộ ứng dụng bằng Header và Footer. Main content sẽ nằm giữa chúng.

PHA 2: TRANG CHỦ & ĐIỀU HƯỚNG VÒNG THI

Bước 2.1: Tạo React Context cho quản lý trạng thái thi đấu

Yêu cầu AI:

Trong thư mục context/, tạo file QuizContext.tsx.

Định nghĩa một Context để quản lý trạng thái của cuộc thi, bao gồm:

currentVongId: string | null (ID của vòng thi hiện tại đang được chọn).

currentQuestionIndex: number (chỉ số của câu hỏi hiện tại trong vòng).

quizData: any (dữ liệu quiz đã tải từ JSON).

setVong: (vongId: string) => void.

setQuestionIndex: (index: number) => void.

nextQuestion: () => void.

prevQuestion: () => void.

playbackState: 'playing' | 'paused' | 'stopped' (trạng thái đọc TTS).

setPlaybackState: (state: 'playing' | 'paused' | 'stopped') => void.

timerValue: number (giá trị hiện tại của đồng hồ đếm ngược).

setTimerValue: (value: number) => void.

isTimerRunning: boolean.

setIsTimerRunning: (isRunning: boolean) => void.

showAnswer: boolean.

setShowAnswer: (show: boolean) => void.

Tạo QuizProvider component để bọc ứng dụng và cung cấp Context. Trong QuizProvider, hãy tải dữ liệu từ data/quizData.json một lần duy nhất khi component mount.

Bước 2.2: Thiết kế trang giới thiệu (Home Page)

Yêu cầu AI:

Tạo file app/page.tsx (hoặc app/home/page.tsx và cấu hình routing phù hợp).

Trang này sẽ hiển thị:

Tiêu đề lớn của hội thi.

Thông tin tổng quan về quy chế thi từ quizData.quy_che_thi.

Một nút "Bắt đầu Hội thi" (Shadcn Button).

Khi nhấn nút "Bắt đầu Hội thi", người dùng sẽ được chuyển hướng (sử dụng next/navigation useRouter) đến trang tổng quan các vòng thi.

Bước 2.3: Thiết kế trang Tổng quan Vòng thi & Chọn Vòng

Yêu cầu AI:

Tạo file app/vong-thi/page.tsx.

Trang này sẽ hiển thị danh sách các vòng thi (lấy từ quizData.ngan_hang_cau_hoi).

Mỗi vòng thi sẽ được hiển thị dưới dạng một Card (Shadcn Card).

Trong Card, hiển thị tên vòng, số lượng câu hỏi.

Sử dụng một Button "Chọn vòng này" trong mỗi Card.

Khi nhấn nút, cập nhật currentVongId trong QuizContext và chuyển hướng đến trang chọn câu hỏi của vòng đó (ví dụ: /vong-thi/question-selection).

Sử dụng Tailwind CSS để layout các Card theo dạng grid, responsive (ví dụ: 2 cột trên màn hình lớn, 1 cột trên di động).

Bước 2.4: Thiết kế trang Chọn Câu hỏi trong Vòng

Yêu cầu AI:

Tạo file app/vong-thi/question-selection/page.tsx.

Trang này sẽ sử dụng useContext để lấy currentVongId và quizData.

Hiển thị danh sách các câu hỏi của currentVongId dưới dạng các nút bấm (Shadcn Button) hoặc Card nhỏ.

Mỗi nút/Card sẽ hiển thị ID của câu hỏi (ví dụ: "CSPL_TN_1", "KTM_HA_2").

Khi nhấn vào một nút/Card, cập nhật currentQuestionIndex trong QuizContext và chuyển hướng đến trang trình chiếu câu hỏi (ví dụ: /vong-thi/presentation).

Tùy biến hiển thị các nút/Card câu hỏi:

Vòng 1 (Trắc nghiệm): Hiển thị đơn giản các nút Câu 1, Câu 2, ...

Vòng 2 (Ngành nghề): Hiển thị ID câu hỏi và có thể có một icon nhỏ hoặc text để phân biệt ngành nghề nếu muốn (ví dụ: "BV_LT_1 (Bảo vệ)"). Cần chú ý logic phân loại câu hỏi theo ngành nghề từ JSON.

Sử dụng Tailwind CSS để tạo layout grid cho các nút/Card câu hỏi, đảm bảo dễ dàng thao tác.

PHA 3: TRÌNH CHIẾU CÂU HỎI & TÍCH HỢP TTS

Bước 3.1: Component hiển thị câu hỏi chung (QuestionDisplay.tsx)

Yêu cầu AI:

Tạo file components/quiz/QuestionDisplay.tsx.

Component này sẽ nhận currentQuestion object (được lấy từ quizData dựa trên currentVongId và currentQuestionIndex trong QuizContext).

Conditional Rendering: Dựa vào currentQuestion.type_question và currentQuestion.question_image để hiển thị nội dung phù hợp.

Câu hỏi có hình ảnh (use_image: "Yes"):

Sử dụng next/image cho hình ảnh để tối ưu.

Dựa vào position_image ("Left", "Right", "Center") để đặt vị trí ảnh. Nếu question_image: "Yes" (hình ảnh là nội dung chính), ảnh cần lớn hơn và nằm ở vị trí trung tâm, câu hỏi text có thể nhỏ hơn hoặc mô tả ảnh. Nếu question_image: "No", ảnh là minh họa, có thể nhỏ hơn và nằm bên cạnh text câu hỏi.

Đảm bảo hình ảnh responsive, không tràn màn hình.

Câu hỏi không có hình ảnh (use_image: "No"): Text câu hỏi sẽ chiếm không gian lớn hơn.

Hiển thị nội dung:

Hiển thị cau_hoi (câu hỏi).

Hiển thị phuong_an (các phương án trả lời): Mỗi phương án là một Shadcn Button hoặc Card nhỏ, có thể ẩn/hiện.

Hiển thị dap_an_dung (đáp án đúng): Ban đầu ẩn, chỉ hiện khi được kích hoạt.

Sử dụng Tailwind CSS để tạo style cho câu hỏi, phương án, đáp án (màu sắc, kích thước font lớn, căn giữa...). Đảm bảo đọc rõ trên màn hình lớn.

Bước 3.2: Logic tích hợp TTS (Text-to-Speech)

Yêu cầu AI:

Trong thư mục hooks/, tạo file useAudioPlayback.ts.

Tạo một custom hook useAudioPlayback nhận vào currentQuestion object từ QuizContext.

Hook này sẽ quản lý một Audio object.

Logic phát âm thanh theo trình tự:

Khi câu hỏi mới được tải, tự động bắt đầu phát speech_id_question.mp3.

Khi speech_id_question.mp3 kết thúc (sử dụng sự kiện onended), tự động phát speech_id_options_A.mp3.

Tiếp tục tuần tự phát speech_id_options_B.mp3, speech_id_options_C.mp3, v.v. cho đến hết các phương án.

Khi tất cả phương án đã đọc xong, hook sẽ dừng lại và đợi lệnh phát đáp án.

Khi showAnswer trong Context là true, phát speech_id_answer.mp3.

Cung cấp các hàm điều khiển ra bên ngoài hook: play(), pause(), stop(), replay(), và skipToAnswer().

Quản lý trạng thái playbackState trong QuizContext.

Quan trọng: Xử lý trường hợp không có file audio hoặc file bị lỗi.

Bước 3.3: Trang trình chiếu câu hỏi (app/vong-thi/presentation/page.tsx)

Yêu cầu AI:

Tạo file app/vong-thi/presentation/page.tsx.

Đây là trang chính để trình chiếu câu hỏi.

Sử dụng QuizContext để lấy currentVongId, currentQuestionIndex và các trạng thái điều khiển khác.

Hiển thị QuestionDisplay component.

Thêm các điều khiển ở Footer (hoặc một control panel riêng):

Nút "Câu trước", "Câu tiếp theo" (Shadcn Button).

Nút "Hiển thị Đáp án" (kích hoạt setShowAnswer(true)).

Nút "Bắt đầu/Tạm dừng Timer" (kích hoạt setIsTimerRunning).

Nút "Phát lại Audio" (kích hoạt replay() từ useAudioPlayback).

Nút "Skip Audio" (kích hoạt skipToAnswer() từ useAudioPlayback).

Đảm bảo các nút điều khiển trực quan và dễ sử dụng trên màn hình cảm ứng hoặc chuột.

PHA 4: CÁC YẾU TỐ TƯƠNG TÁC BỔ SUNG

Bước 4.1: Đồng hồ đếm ngược (Countdown Timer)

Yêu cầu AI:

Tạo file components/quiz/TimerComponent.tsx.

Component này sẽ hiển thị thời gian còn lại.

Sử dụng useContext để lấy timerValue và isTimerRunning từ QuizContext.

Logic:

Khi isTimerRunning là true, timerValue sẽ giảm dần mỗi giây.

Khi timerValue về 0, kích hoạt một callback (ví dụ: tự động hiển thị đáp án hoặc dừng timer).

Hiển thị thời gian dưới dạng MM:SS.

Tích hợp Timer này vào QuestionDisplay hoặc Footer để hiển thị trên màn hình trình chiếu.

Bước 4.2: Thanh tiến độ ngược (Reverse Progress Bar)

Yêu cầu AI:

Tạo file components/quiz/ProgressBarComponent.tsx.

Component này sẽ hiển thị thanh tiến độ dựa trên thời gian.

Sử dụng useContext để lấy timerValue và totalTime (tổng thời gian của câu hỏi, lấy từ quizData.quy_che_thi.cac_vong_thi tương ứng).

Sử dụng Shadcn Progress component.

Tính toán giá trị value cho Progress component dựa trên (timerValue / totalTime) * 100.

"Chạy ngược": Điều này có thể được thể hiện bằng cách thanh tiến độ thu nhỏ lại hoặc chuyển màu từ xanh/vàng sang đỏ khi thời gian cạn dần. Bạn có thể sử dụng Tailwind CSS để thay đổi màu sắc dựa trên value (ví dụ: bg-green-500 -> bg-yellow-500 -> bg-red-500).

Tích hợp Progress Bar này vào QuestionDisplay hoặc Footer bên cạnh Timer.

Bước 4.3: Nâng cấp Header và Footer

Yêu cầu AI:

Cập nhật Header.tsx để hiển thị thêm:

Vòng thi hiện tại (ví dụ: "Vòng 1: CSPL & Y tế").

ID câu hỏi hiện tại (ví dụ: "Câu hỏi: CSPL_TN_05").

Cập nhật Footer.tsx để chứa các nút điều khiển chính:

"Câu hỏi trước" / "Câu hỏi tiếp theo".

"Hiển thị đáp án".

"Bắt đầu/Tạm dừng Timer".

"Phát lại Audio" / "Skip Audio".

Vị trí của Timer và Progress Bar.

Đảm bảo các nút điều khiển có kích thước và vị trí dễ thao tác.

PHA 5: TÙY CHỈNH & HOÀN THIỆN

Bước 5.1: Thiết kế Responsive

Yêu cầu AI:

Sử dụng các utility classes của Tailwind CSS (sm:, md:, lg:, xl:) để đảm bảo layout hiển thị tốt trên các kích thước màn hình khác nhau.

Cụ thể, điều chỉnh kích thước font chữ, khoảng cách, và vị trí các element để phù hợp với màn hình nhỏ hơn.

Bước 5.2: Quản lý Icons

Yêu cầu AI:

Cài đặt một thư viện icon như @radix-ui/react-icons hoặc lucide-react.

Sử dụng các icon phù hợp:

Cho các vòng thi (ví dụ: sách cho lý thuyết, cờ cho PCCC, trái tim cho Y tế, búa cho khai thác mỏ, xe tải cho bốc xếp/vận chuyển).

Cho các nút điều khiển (play, pause, next, prev, lightbulb cho đáp án).

Cho mỗi câu hỏi trong trang question-selection có thể hiển thị icon nhỏ của ngành nghề tương ứng.

Bước 5.3: Hướng dẫn sử dụng & Ghi chú cho người dùng

Yêu cầu AI:

Thêm một file README.md trong thư mục gốc của dự án.

Nội dung README.md cần bao gồm:

Mô tả dự án.

Hướng dẫn cài đặt và chạy dự án.

Cấu trúc dữ liệu JSON (để dễ dàng cập nhật câu hỏi).

Thư mục chứa hình ảnh và âm thanh.

Hướng dẫn sử dụng ứng dụng:

Cách điều khiển qua giao diện.

Các phím tắt (nếu có - có thể thêm sau này).

Các điểm cần lưu ý (ví dụ: cần có file audio tương ứng với speech_id trong JSON).

Ghi chú quan trọng cho AI:

Modularization: Chia nhỏ code thành các component và hooks nhỏ, có trách nhiệm rõ ràng.

Shadcn UI: Luôn ưu tiên sử dụng các component từ Shadcn UI đã được cài đặt. Nếu cần một component phức tạp hơn, hãy xây dựng nó dựa trên các component cơ bản của Shadcn.

Tailwind CSS: Sử dụng Tailwind CSS để styling inline hoặc thông qua @apply trong globals.css nếu cần custom component.

Error Handling: Thêm các kiểm tra cơ bản cho trường hợp dữ liệu JSON bị thiếu hoặc không đúng định dạng (ví dụ: if (!question) return null;).

TypeScript: Sử dụng TypeScript để định nghĩa các kiểu dữ liệu (interface, type) cho quizData, Question, Vong, v.v. để đảm bảo an toàn kiểu dữ liệu.

Phản hồi: Sau mỗi bước, chờ phản hồi và xác nhận trước khi chuyển sang bước tiếp theo, hoặc tổng hợp toàn bộ code và giải thích cấu trúc.

Kế hoạch này cung cấp một lộ trình rõ ràng để AI có thể xây dựng ứng dụng của bạn từng bước một, đảm bảo các yêu cầu về chức năng và thiết kế đều được đáp ứng một cách chuyên nghiệp.