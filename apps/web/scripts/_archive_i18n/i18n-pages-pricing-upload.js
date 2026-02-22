// Add pricing page-level keys + upload page keys to all 5 languages
const fs = require('fs');
const path = require('path');
const langs = ['en', 'vi', 'id', 'ms', 'th'];
const dir = path.join(__dirname, '..', 'messages');

const pricingKeys = {
    en: { pageTitle: 'OTA Price Calculator', pageSubtitle: 'Manage display prices across OTA channels', 'tab_setup': 'Setup', 'tab_promotions': 'Promotions', 'tab_overview': 'Price Table', 'tab_dynamic-pricing': 'Dynamic Pricing', 'tab_ota-growth': 'Optimize OTA' },
    vi: { pageTitle: 'Tính giá OTA', pageSubtitle: 'Quản lý giá hiển thị trên các kênh OTA', 'tab_setup': 'Cài đặt', 'tab_promotions': 'Khuyến mãi', 'tab_overview': 'Bảng giá', 'tab_dynamic-pricing': 'Giá động', 'tab_ota-growth': 'Tối ưu OTA' },
    id: { pageTitle: 'Kalkulator Harga OTA', pageSubtitle: 'Kelola harga tampilan di seluruh saluran OTA', 'tab_setup': 'Pengaturan', 'tab_promotions': 'Promosi', 'tab_overview': 'Tabel Harga', 'tab_dynamic-pricing': 'Harga Dinamis', 'tab_ota-growth': 'Optimasi OTA' },
    ms: { pageTitle: 'Kalkulator Harga OTA', pageSubtitle: 'Urus harga paparan merentas saluran OTA', 'tab_setup': 'Tetapan', 'tab_promotions': 'Promosi', 'tab_overview': 'Jadual Harga', 'tab_dynamic-pricing': 'Harga Dinamik', 'tab_ota-growth': 'Optimumkan OTA' },
    th: { pageTitle: 'เครื่องคิดราคา OTA', pageSubtitle: 'จัดการราคาแสดงข้ามช่องทาง OTA', 'tab_setup': 'ตั้งค่า', 'tab_promotions': 'โปรโมชั่น', 'tab_overview': 'ตารางราคา', 'tab_dynamic-pricing': 'ราคาพลวัต', 'tab_ota-growth': 'ปรับปรุง OTA' },
};

const uploadKeys = {
    en: {
        title: 'Upload Reservations', subtitle: 'Import room booking reports from PMS — supports uploading <strong>multiple files at once</strong> (max 31 files)',
        paywallSubtitle: 'Import room booking reports from PMS',
        feat1: 'Upload multiple CSV/XML files at once', feat2: 'Import booking & cancellation reports', feat3: 'Supported Crystal Reports XML', feat4: 'Auto-process & validate data',
        uploadingFor: 'Uploading data for:', demoTitle: 'Demo Hotel - View mode', demoDesc: 'You are using Demo Hotel. File upload is disabled. Please contact admin to be assigned a real hotel.',
        tabBooked: 'Booking Reports', tabCancelled: 'Cancellation Reports',
        tabBookedDesc: 'Upload "Reservation Booked On Date" reports from PMS. Select multiple files (Ctrl+Click or drag & drop).', tabCancelledDesc: 'Upload "Reservation Cancelled" reports from PMS. Select multiple files.',
        demoDragTitle: 'Upload disabled for Demo Hotel', demoDragSub: 'Contact admin to be assigned a hotel',
        dragTitle: 'Drag & drop CSV, XML, or Excel files here', dragSub: 'Supports selecting <strong>multiple files</strong> at once (max 31 files/batch)', selectBtn: 'Select files (multi-select available)',
        downloadBooking: 'Download sample Excel file (Bookings)', downloadCancel: 'Download sample Excel file (Cancellations)', sampleBooked: 'Sample has 7 columns: Code, Booking Date, Check-in, Check-out, Room, Revenue, Status', sampleCancel: 'Sample has 8 columns: includes Cancel Date column (required)',
        processing: 'Processing... ({done}/{total})', completed: 'Completed {done}/{total} file', successful: '✓ {n} successful', errors: '✗ {n} errors', totalRecords: 'Total: {n} records',
        wait: 'Wait...', processingFile: 'Processing...', uploadMore: 'Upload more files', viewData: 'View data →',
        xmlTitle: 'XML Format (Crystal Reports)', xmlDesc: 'Export from PMS in Crystal Reports XML format.', csvTitle: 'CSV Format', csvDesc: 'CSV file with columns:',
        tip: '<strong>Tip:</strong> Use Ctrl+A (select all) or Ctrl+Click to select multiple files at once. System will automatically import each file in order.',
        unsupported: 'Only CSV, XML, or Excel (.xlsx) files supported', importFailed: 'Import failed', hotelNotFound: 'Hotel ID not found',
        reservations: '{n} reservations', cancellations: '{n} cancellations',
    },
    vi: {
        title: 'Tải lên đặt phòng', subtitle: 'Nhập báo cáo đặt phòng từ PMS — hỗ trợ tải <strong>nhiều file cùng lúc</strong> (tối đa 31 file)',
        paywallSubtitle: 'Nhập báo cáo đặt phòng từ PMS',
        feat1: 'Tải nhiều file CSV/XML cùng lúc', feat2: 'Nhập báo cáo đặt phòng & hủy phòng', feat3: 'Hỗ trợ Crystal Reports XML', feat4: 'Tự động xử lý & kiểm tra dữ liệu',
        uploadingFor: 'Đang tải dữ liệu cho:', demoTitle: 'Demo Hotel - Chế độ xem', demoDesc: 'Bạn đang sử dụng Demo Hotel. Tải file bị vô hiệu hóa. Vui lòng liên hệ admin để được gán khách sạn.',
        tabBooked: 'Báo cáo đặt phòng', tabCancelled: 'Báo cáo hủy phòng',
        tabBookedDesc: 'Tải báo cáo "Reservation Booked On Date" từ PMS. Chọn nhiều file (Ctrl+Click hoặc kéo thả).', tabCancelledDesc: 'Tải báo cáo "Reservation Cancelled" từ PMS. Chọn nhiều file.',
        demoDragTitle: 'Tải file bị vô hiệu hóa cho Demo Hotel', demoDragSub: 'Liên hệ admin để được gán khách sạn',
        dragTitle: 'Kéo & thả file CSV, XML, hoặc Excel vào đây', dragSub: 'Hỗ trợ chọn <strong>nhiều file</strong> cùng lúc (tối đa 31 file/lần)', selectBtn: 'Chọn file (có thể chọn nhiều)',
        downloadBooking: 'Tải file Excel mẫu (Đặt phòng)', downloadCancel: 'Tải file Excel mẫu (Hủy phòng)', sampleBooked: 'Mẫu có 7 cột: Mã, Ngày đặt, Ngày nhận, Ngày trả, Phòng, Doanh thu, Trạng thái', sampleCancel: 'Mẫu có 8 cột: bao gồm cột Ngày hủy (bắt buộc)',
        processing: 'Đang xử lý... ({done}/{total})', completed: 'Hoàn thành {done}/{total} file', successful: '✓ {n} thành công', errors: '✗ {n} lỗi', totalRecords: 'Tổng: {n} bản ghi',
        wait: 'Chờ...', processingFile: 'Đang xử lý...', uploadMore: 'Tải thêm file', viewData: 'Xem dữ liệu →',
        xmlTitle: 'Định dạng XML (Crystal Reports)', xmlDesc: 'Xuất từ PMS theo định dạng Crystal Reports XML.', csvTitle: 'Định dạng CSV', csvDesc: 'File CSV với các cột:',
        tip: '<strong>Mẹo:</strong> Dùng Ctrl+A (chọn tất cả) hoặc Ctrl+Click để chọn nhiều file cùng lúc. Hệ thống sẽ tự động nhập từng file theo thứ tự.',
        unsupported: 'Chỉ hỗ trợ file CSV, XML, hoặc Excel (.xlsx)', importFailed: 'Nhập thất bại', hotelNotFound: 'Không tìm thấy Hotel ID',
        reservations: '{n} đặt phòng', cancellations: '{n} hủy phòng',
    },
    id: {
        title: 'Unggah Reservasi', subtitle: 'Impor laporan pemesanan kamar dari PMS — mendukung unggah <strong>banyak file sekaligus</strong> (maks 31 file)',
        paywallSubtitle: 'Impor laporan pemesanan kamar dari PMS',
        feat1: 'Unggah banyak file CSV/XML sekaligus', feat2: 'Impor laporan pemesanan & pembatalan', feat3: 'Mendukung Crystal Reports XML', feat4: 'Proses otomatis & validasi data',
        uploadingFor: 'Mengunggah data untuk:', demoTitle: 'Demo Hotel - Mode tampil', demoDesc: 'Anda menggunakan Demo Hotel. Unggah file dinonaktifkan. Hubungi admin untuk mendapatkan hotel.',
        tabBooked: 'Laporan Pemesanan', tabCancelled: 'Laporan Pembatalan',
        tabBookedDesc: 'Unggah laporan "Reservation Booked On Date" dari PMS. Pilih banyak file (Ctrl+Click atau seret & lepas).', tabCancelledDesc: 'Unggah laporan "Reservation Cancelled" dari PMS. Pilih banyak file.',
        demoDragTitle: 'Unggah dinonaktifkan untuk Demo Hotel', demoDragSub: 'Hubungi admin untuk mendapatkan hotel',
        dragTitle: 'Seret & lepas file CSV, XML, atau Excel di sini', dragSub: 'Mendukung pemilihan <strong>banyak file</strong> sekaligus (maks 31 file/batch)', selectBtn: 'Pilih file (multi-pilih tersedia)',
        downloadBooking: 'Unduh file Excel contoh (Pemesanan)', downloadCancel: 'Unduh file Excel contoh (Pembatalan)', sampleBooked: 'Contoh 7 kolom: Kode, Tanggal Pesan, Check-in, Check-out, Kamar, Pendapatan, Status', sampleCancel: 'Contoh 8 kolom: termasuk kolom Tanggal Batal (wajib)',
        processing: 'Memproses... ({done}/{total})', completed: 'Selesai {done}/{total} file', successful: '✓ {n} berhasil', errors: '✗ {n} error', totalRecords: 'Total: {n} catatan',
        wait: 'Tunggu...', processingFile: 'Memproses...', uploadMore: 'Unggah file lagi', viewData: 'Lihat data →',
        xmlTitle: 'Format XML (Crystal Reports)', xmlDesc: 'Ekspor dari PMS dalam format Crystal Reports XML.', csvTitle: 'Format CSV', csvDesc: 'File CSV dengan kolom:',
        tip: '<strong>Tips:</strong> Gunakan Ctrl+A (pilih semua) atau Ctrl+Click untuk memilih banyak file sekaligus. Sistem akan otomatis mengimpor setiap file secara berurutan.',
        unsupported: 'Hanya file CSV, XML, atau Excel (.xlsx) yang didukung', importFailed: 'Impor gagal', hotelNotFound: 'Hotel ID tidak ditemukan',
        reservations: '{n} reservasi', cancellations: '{n} pembatalan',
    },
    ms: {
        title: 'Muat Naik Tempahan', subtitle: 'Import laporan tempahan bilik dari PMS — menyokong muat naik <strong>berbilang fail sekaligus</strong> (maks 31 fail)',
        paywallSubtitle: 'Import laporan tempahan bilik dari PMS',
        feat1: 'Muat naik berbilang fail CSV/XML sekaligus', feat2: 'Import laporan tempahan & pembatalan', feat3: 'Menyokong Crystal Reports XML', feat4: 'Proses auto & sahkan data',
        uploadingFor: 'Memuat naik data untuk:', demoTitle: 'Demo Hotel - Mod paparan', demoDesc: 'Anda menggunakan Demo Hotel. Muat naik fail dinyahdayakan. Sila hubungi admin.',
        tabBooked: 'Laporan Tempahan', tabCancelled: 'Laporan Pembatalan',
        tabBookedDesc: 'Muat naik laporan "Reservation Booked On Date" dari PMS. Pilih berbilang fail.', tabCancelledDesc: 'Muat naik laporan "Reservation Cancelled" dari PMS. Pilih berbilang fail.',
        demoDragTitle: 'Muat naik dinyahdayakan untuk Demo Hotel', demoDragSub: 'Hubungi admin untuk ditetapkan hotel',
        dragTitle: 'Seret & lepas fail CSV, XML, atau Excel di sini', dragSub: 'Menyokong pemilihan <strong>berbilang fail</strong> sekaligus (maks 31 fail/kelompok)', selectBtn: 'Pilih fail (multi-pilih tersedia)',
        downloadBooking: 'Muat turun fail Excel contoh (Tempahan)', downloadCancel: 'Muat turun fail Excel contoh (Pembatalan)', sampleBooked: 'Contoh 7 lajur: Kod, Tarikh Tempah, Daftar Masuk, Daftar Keluar, Bilik, Hasil, Status', sampleCancel: 'Contoh 8 lajur: termasuk lajur Tarikh Batal (wajib)',
        processing: 'Memproses... ({done}/{total})', completed: 'Selesai {done}/{total} fail', successful: '✓ {n} berjaya', errors: '✗ {n} ralat', totalRecords: 'Jumlah: {n} rekod',
        wait: 'Tunggu...', processingFile: 'Memproses...', uploadMore: 'Muat naik lagi', viewData: 'Lihat data →',
        xmlTitle: 'Format XML (Crystal Reports)', xmlDesc: 'Eksport dari PMS dalam format Crystal Reports XML.', csvTitle: 'Format CSV', csvDesc: 'Fail CSV dengan lajur:',
        tip: '<strong>Petua:</strong> Gunakan Ctrl+A (pilih semua) atau Ctrl+Click untuk memilih berbilang fail sekaligus.',
        unsupported: 'Hanya fail CSV, XML, atau Excel (.xlsx) disokong', importFailed: 'Import gagal', hotelNotFound: 'Hotel ID tidak dijumpai',
        reservations: '{n} tempahan', cancellations: '{n} pembatalan',
    },
    th: {
        title: 'อัปโหลดการจอง', subtitle: 'นำเข้ารายงานการจองห้องพักจาก PMS — รองรับอัปโหลด<strong>หลายไฟล์พร้อมกัน</strong> (สูงสุด 31 ไฟล์)',
        paywallSubtitle: 'นำเข้ารายงานการจองห้องพักจาก PMS',
        feat1: 'อัปโหลดหลายไฟล์ CSV/XML พร้อมกัน', feat2: 'นำเข้ารายงานการจอง & การยกเลิก', feat3: 'รองรับ Crystal Reports XML', feat4: 'ประมวลผลอัตโนมัติ & ตรวจสอบข้อมูล',
        uploadingFor: 'กำลังอัปโหลดข้อมูลสำหรับ:', demoTitle: 'Demo Hotel - โหมดดูอย่างเดียว', demoDesc: 'คุณกำลังใช้ Demo Hotel การอัปโหลดไฟล์ถูกปิดใช้งาน กรุณาติดต่อแอดมิน',
        tabBooked: 'รายงานการจอง', tabCancelled: 'รายงานการยกเลิก',
        tabBookedDesc: 'อัปโหลดรายงาน "Reservation Booked On Date" จาก PMS เลือกหลายไฟล์', tabCancelledDesc: 'อัปโหลดรายงาน "Reservation Cancelled" จาก PMS เลือกหลายไฟล์',
        demoDragTitle: 'การอัปโหลดถูกปิดใช้งานสำหรับ Demo Hotel', demoDragSub: 'ติดต่อแอดมินเพื่อรับโรงแรม',
        dragTitle: 'ลาก & วางไฟล์ CSV, XML หรือ Excel ที่นี่', dragSub: 'รองรับการเลือก<strong>หลายไฟล์</strong>พร้อมกัน (สูงสุด 31 ไฟล์/ชุด)', selectBtn: 'เลือกไฟล์ (เลือกหลายไฟล์ได้)',
        downloadBooking: 'ดาวน์โหลดไฟล์ Excel ตัวอย่าง (การจอง)', downloadCancel: 'ดาวน์โหลดไฟล์ Excel ตัวอย่าง (การยกเลิก)', sampleBooked: 'ตัวอย่าง 7 คอลัมน์: รหัส, วันจอง, เช็คอิน, เช็คเอาท์, ห้อง, รายได้, สถานะ', sampleCancel: 'ตัวอย่าง 8 คอลัมน์: รวมคอลัมน์วันยกเลิก (จำเป็น)',
        processing: 'กำลังประมวลผล... ({done}/{total})', completed: 'เสร็จสิ้น {done}/{total} ไฟล์', successful: '✓ {n} สำเร็จ', errors: '✗ {n} ข้อผิดพลาด', totalRecords: 'รวม: {n} รายการ',
        wait: 'รอ...', processingFile: 'กำลังประมวลผล...', uploadMore: 'อัปโหลดไฟล์เพิ่ม', viewData: 'ดูข้อมูล →',
        xmlTitle: 'รูปแบบ XML (Crystal Reports)', xmlDesc: 'ส่งออกจาก PMS ในรูปแบบ Crystal Reports XML', csvTitle: 'รูปแบบ CSV', csvDesc: 'ไฟล์ CSV ที่มีคอลัมน์:',
        tip: '<strong>เคล็ดลับ:</strong> ใช้ Ctrl+A (เลือกทั้งหมด) หรือ Ctrl+Click เพื่อเลือกหลายไฟล์พร้อมกัน',
        unsupported: 'รองรับเฉพาะไฟล์ CSV, XML หรือ Excel (.xlsx)', importFailed: 'นำเข้าล้มเหลว', hotelNotFound: 'ไม่พบ Hotel ID',
        reservations: '{n} การจอง', cancellations: '{n} การยกเลิก',
    },
};

for (const lang of langs) {
    const fp = path.join(dir, `${lang}.json`);
    const json = JSON.parse(fs.readFileSync(fp, 'utf8'));

    // Add pricing page-level keys
    const pk = pricingKeys[lang];
    for (const [k, v] of Object.entries(pk)) {
        json.pricing[k] = v;
    }

    // Add uploadPage namespace
    if (!json.uploadPage) json.uploadPage = {};
    const uk = uploadKeys[lang];
    for (const [k, v] of Object.entries(uk)) {
        json.uploadPage[k] = v;
    }

    fs.writeFileSync(fp, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`${lang}: +${Object.keys(pk).length} pricing, +${Object.keys(uk).length} upload keys`);
}
