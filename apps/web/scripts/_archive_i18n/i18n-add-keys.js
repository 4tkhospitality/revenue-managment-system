/**
 * Add missing i18n keys from Phase 02 batch replacements to all locale files.
 * Handles: rateShopper (competitors), analytics, billing, dashboard, admin, shared, paywall, upgradeBanner
 */
const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const locales = ['en', 'vi', 'th', 'id', 'ms'];

// ─── New keys to add, organized by namespace ────────────────────

const NEW_KEYS = {
    rateShopper: {
        // Competitors page keys (from batch 2)
        cannotLoadCompetitors: {
            en: "Cannot load competitor list",
            vi: "Không thể tải danh sách đối thủ",
            th: "ไม่สามารถโหลดรายชื่อคู่แข่งได้",
            id: "Tidak dapat memuat daftar pesaing",
            ms: "Tidak dapat memuatkan senarai pesaing"
        },
        noHotelsFound: {
            en: "No hotels found",
            vi: "Không tìm thấy khách sạn nào",
            th: "ไม่พบโรงแรม",
            id: "Hotel tidak ditemukan",
            ms: "Hotel tidak dijumpai"
        },
        searchError: {
            en: "Search error. Check SERPAPI_API_KEY in .env",
            vi: "Lỗi tìm kiếm. Kiểm tra SERPAPI_API_KEY trong .env",
            th: "ข้อผิดพลาดในการค้นหา ตรวจสอบ SERPAPI_API_KEY ใน .env",
            id: "Error pencarian. Periksa SERPAPI_API_KEY di .env",
            ms: "Ralat carian. Semak SERPAPI_API_KEY dalam .env"
        },
        addedCompetitor: {
            en: "Added \"{name}\"",
            vi: "Đã thêm \"{name}\"",
            th: "เพิ่ม \"{name}\" แล้ว",
            id: "Berhasil menambahkan \"{name}\"",
            ms: "Berjaya menambah \"{name}\""
        },
        cannotAddCompetitor: {
            en: "Cannot add competitor",
            vi: "Không thể thêm đối thủ",
            th: "ไม่สามารถเพิ่มคู่แข่งได้",
            id: "Tidak dapat menambahkan pesaing",
            ms: "Tidak dapat menambah pesaing"
        },
        confirmRemoveCompetitor: {
            en: "Remove \"{name}\" from competitors?",
            vi: "Xóa \"{name}\" khỏi danh sách đối thủ?",
            th: "ลบ \"{name}\" ออกจากคู่แข่ง?",
            id: "Hapus \"{name}\" dari daftar pesaing?",
            ms: "Buang \"{name}\" dari senarai pesaing?"
        },
        removedCompetitor: {
            en: "Removed \"{name}\"",
            vi: "Đã xóa \"{name}\"",
            th: "ลบ \"{name}\" แล้ว",
            id: "Berhasil menghapus \"{name}\"",
            ms: "Berjaya membuang \"{name}\""
        },
        cannotRemoveCompetitor: {
            en: "Cannot remove competitor",
            vi: "Không thể xóa đối thủ",
            th: "ไม่สามารถลบคู่แข่งได้",
            id: "Tidak dapat menghapus pesaing",
            ms: "Tidak dapat membuang pesaing"
        },
        manageCompetitorsTitle: {
            en: "Manage Competitors",
            vi: "Quản lý đối thủ",
            th: "จัดการคู่แข่ง",
            id: "Kelola Pesaing",
            ms: "Urus Pesaing"
        },
        manageCompetitorsSubtitle: {
            en: "Add competitor hotels to auto-compare rates daily",
            vi: "Thêm các khách sạn đối thủ để so sánh giá tự động hàng ngày",
            th: "เพิ่มโรงแรมคู่แข่งเพื่อเปรียบเทียบราคาอัตโนมัติทุกวัน",
            id: "Tambahkan hotel pesaing untuk perbandingan harga otomatis harian",
            ms: "Tambah hotel pesaing untuk perbandingan harga automatik harian"
        },
        searchCompetitors: {
            en: "Search competitor hotels",
            vi: "Tìm kiếm khách sạn đối thủ",
            th: "ค้นหาโรงแรมคู่แข่ง",
            id: "Cari hotel pesaing",
            ms: "Cari hotel pesaing"
        },
        searchBtn: {
            en: "Search",
            vi: "Tìm",
            th: "ค้นหา",
            id: "Cari",
            ms: "Cari"
        },
        foundResults: {
            en: "Found {count} results. Click \"Add\" to add to competitor list.",
            vi: "Tìm thấy {count} kết quả. Click \"Thêm\" để thêm vào danh sách đối thủ.",
            th: "พบ {count} ผลลัพธ์ คลิก \"เพิ่ม\" เพื่อเพิ่มในรายชื่อคู่แข่ง",
            id: "Ditemukan {count} hasil. Klik \"Tambah\" untuk menambahkan ke daftar pesaing.",
            ms: "Dijumpai {count} hasil. Klik \"Tambah\" untuk menambah ke senarai pesaing."
        },
        alreadyAdded: {
            en: "Added",
            vi: "Đã thêm",
            th: "เพิ่มแล้ว",
            id: "Sudah ditambahkan",
            ms: "Sudah ditambah"
        },
        trackedCompetitors: {
            en: "Tracked Competitors",
            vi: "Đối thủ đang theo dõi",
            th: "คู่แข่งที่ติดตาม",
            id: "Pesaing yang Dipantau",
            ms: "Pesaing yang Dipantau"
        },
        refresh: {
            en: "Refresh",
            vi: "Làm mới",
            th: "รีเฟรช",
            id: "Segarkan",
            ms: "Muat Semula"
        },
        noCompetitorsYetMsg: {
            en: "No competitors yet",
            vi: "Chưa có đối thủ nào",
            th: "ยังไม่มีคู่แข่ง",
            id: "Belum ada pesaing",
            ms: "Belum ada pesaing"
        },
        useSearchToAdd: {
            en: "Use the search box above to find and add competitor hotels.",
            vi: "Sử dụng ô tìm kiếm ở trên để tìm và thêm khách sạn đối thủ.",
            th: "ใช้ช่องค้นหาด้านบนเพื่อค้นหาและเพิ่มโรงแรมคู่แข่ง",
            id: "Gunakan kotak pencarian di atas untuk mencari dan menambahkan hotel pesaing.",
            ms: "Gunakan kotak carian di atas untuk mencari dan menambah hotel pesaing."
        },
        howItWorks: {
            en: "How it works:",
            vi: "Cách hoạt động:",
            th: "วิธีการทำงาน:",
            id: "Cara kerja:",
            ms: "Cara ia berfungsi:"
        },
        howStep1: {
            en: "Search for competitor hotels via Google Hotels → Add to your list",
            vi: "Tìm khách sạn đối thủ qua Google Hotels → Thêm vào danh sách",
            th: "ค้นหาโรงแรมคู่แข่งผ่าน Google Hotels → เพิ่มในรายการ",
            id: "Cari hotel pesaing melalui Google Hotels → Tambahkan ke daftar",
            ms: "Cari hotel pesaing melalui Google Hotels → Tambah ke senarai"
        },
        howStep2: {
            en: "System auto-collects prices for 5 timeframes: 7, 14, 30, 60, 90 days",
            vi: "Hệ thống tự động thu thập giá 5 mốc: 7, 14, 30, 60, 90 ngày",
            th: "ระบบรวบรวมราคาอัตโนมัติ 5 ช่วงเวลา: 7, 14, 30, 60, 90 วัน",
            id: "Sistem otomatis mengumpulkan harga 5 titik waktu: 7, 14, 30, 60, 90 hari",
            ms: "Sistem mengumpul harga secara automatik untuk 5 tempoh: 7, 14, 30, 60, 90 hari"
        },
        howStep3: {
            en: "View detailed comparison on the",
            vi: "Xem so sánh chi tiết tại trang",
            th: "ดูการเปรียบเทียบรายละเอียดที่หน้า",
            id: "Lihat perbandingan detail di halaman",
            ms: "Lihat perbandingan terperinci di halaman"
        },
        compareRatesLink: {
            en: "Rate Compare",
            vi: "So sánh giá",
            th: "เปรียบเทียบราคา",
            id: "Perbandingan Harga",
            ms: "Perbandingan Harga"
        },
        howStep4: {
            en: "Limit: max 20 scans/day, 200 scans/month",
            vi: "Giới hạn: tối đa 20 lần quét/ngày, 200 lần/tháng",
            th: "จำกัด: สูงสุด 20 ครั้ง/วัน, 200 ครั้ง/เดือน",
            id: "Batas: maksimal 20 pemindaian/hari, 200 pemindaian/bulan",
            ms: "Had: maksimum 20 imbasan/hari, 200 imbasan/bulan"
        },
    },
    analytics: {
        errorLoadingData: {
            en: "Could not load data",
            vi: "Không tải được dữ liệu",
            th: "ไม่สามารถโหลดข้อมูลได้",
            id: "Tidak dapat memuat data",
            ms: "Tidak dapat memuatkan data"
        },
    },
    dashboard: {
        increase: {
            en: "Increase",
            vi: "Tăng",
            th: "เพิ่ม",
            id: "Naikkan",
            ms: "Naikkan"
        },
        decrease: {
            en: "Decrease",
            vi: "Giảm",
            th: "ลด",
            id: "Turunkan",
            ms: "Turunkan"
        },
        hold: {
            en: "Hold",
            vi: "Giữ",
            th: "คงไว้",
            id: "Tahan",
            ms: "Kekalkan"
        },
        stopSelling: {
            en: "Stop Selling",
            vi: "Ngừng bán",
            th: "หยุดขาย",
            id: "Berhenti Jual",
            ms: "Berhenti Jual"
        },
    },
    paywall: {
        exportTitle: {
            en: "Upgrade to export more data",
            vi: "Nâng cấp để xuất thêm dữ liệu",
            th: "อัปเกรดเพื่อส่งออกข้อมูลเพิ่ม",
            id: "Upgrade untuk mengekspor lebih banyak data",
            ms: "Naik taraf untuk mengeksport lebih banyak data"
        },
        exportDesc: {
            en: "Free plan allows only 3 exports per week.",
            vi: "Gói miễn phí chỉ cho phép 3 lượt xuất dữ liệu mỗi tuần.",
            th: "แผนฟรีอนุญาตให้ส่งออกได้เพียง 3 ครั้งต่อสัปดาห์",
            id: "Paket gratis hanya memungkinkan 3 ekspor per minggu.",
            ms: "Pelan percuma hanya membenarkan 3 eksport setiap minggu."
        },
        exportCta: {
            en: "Upgrade for unlimited exports",
            vi: "Nâng cấp để xuất không giới hạn",
            th: "อัปเกรดเพื่อส่งออกไม่จำกัด",
            id: "Upgrade untuk ekspor tidak terbatas",
            ms: "Naik taraf untuk eksport tanpa had"
        },
        inviteTitle: {
            en: "Invite more team members",
            vi: "Mời thêm thành viên",
            th: "เชิญสมาชิกเพิ่มเติม",
            id: "Undang lebih banyak anggota tim",
            ms: "Jemput lebih ramai ahli pasukan"
        },
        inviteDesc: {
            en: "Free plan allows only 1 member.",
            vi: "Gói miễn phí chỉ cho phép 1 thành viên.",
            th: "แผนฟรีอนุญาตเพียง 1 สมาชิก",
            id: "Paket gratis hanya memungkinkan 1 anggota.",
            ms: "Pelan percuma hanya membenarkan 1 ahli."
        },
        inviteCta: {
            en: "Upgrade to expand your team",
            vi: "Nâng cấp để mở rộng team",
            th: "อัปเกรดเพื่อขยายทีม",
            id: "Upgrade untuk memperluas tim",
            ms: "Naik taraf untuk mengembangkan pasukan"
        },
        auditTitle: {
            en: "Detailed data audit reports",
            vi: "Báo cáo kiểm tra dữ liệu chi tiết",
            th: "รายงานตรวจสอบข้อมูลโดยละเอียด",
            id: "Laporan audit data terperinci",
            ms: "Laporan audit data terperinci"
        },
        auditDesc: {
            en: "Deep data quality analysis available on Pro plan.",
            vi: "Phân tích sâu về chất lượng dữ liệu chỉ có ở gói Pro.",
            th: "การวิเคราะห์คุณภาพข้อมูลเชิงลึกมีในแผน Pro",
            id: "Analisis kualitas data mendalam tersedia di paket Pro.",
            ms: "Analisis kualiti data mendalam tersedia dalam pelan Pro."
        },
        auditCta: {
            en: "Upgrade for full reports",
            vi: "Nâng cấp để xem báo cáo đầy đủ",
            th: "อัปเกรดเพื่อดูรายงานทั้งหมด",
            id: "Upgrade untuk laporan lengkap",
            ms: "Naik taraf untuk laporan penuh"
        },
        premiumTitle: {
            en: "Premium feature",
            vi: "Tính năng cao cấp",
            th: "ฟีเจอร์พรีเมียม",
            id: "Fitur premium",
            ms: "Ciri premium"
        },
        premiumDesc: {
            en: "This feature requires a plan upgrade.",
            vi: "Tính năng này yêu cầu nâng cấp gói.",
            th: "ฟีเจอร์นี้ต้องการอัปเกรดแผน",
            id: "Fitur ini memerlukan upgrade paket.",
            ms: "Ciri ini memerlukan naik taraf pelan."
        },
        premiumCta: {
            en: "View upgrade plans",
            vi: "Xem các gói nâng cấp",
            th: "ดูแผนอัปเกรด",
            id: "Lihat paket upgrade",
            ms: "Lihat pelan naik taraf"
        },
        currentPlan: {
            en: "Current plan:",
            vi: "Gói hiện tại:",
            th: "แผนปัจจุบัน:",
            id: "Paket saat ini:",
            ms: "Pelan semasa:"
        },
        proIncludes: {
            en: "Pro plan includes:",
            vi: "Gói Pro bao gồm:",
            th: "แผน Pro ประกอบด้วย:",
            id: "Paket Pro termasuk:",
            ms: "Pelan Pro termasuk:"
        },
        unlimitedExports: {
            en: "Unlimited data exports",
            vi: "Xuất dữ liệu không giới hạn",
            th: "ส่งออกข้อมูลไม่จำกัด",
            id: "Ekspor data tidak terbatas",
            ms: "Eksport data tanpa had"
        },
        teamMembers: {
            en: "Up to 10 team members",
            vi: "Mời tối đa 10 thành viên",
            th: "สมาชิกสูงสุด 10 คน",
            id: "Hingga 10 anggota tim",
            ms: "Sehingga 10 ahli pasukan"
        },
        detailedAudit: {
            en: "Detailed data audit reports",
            vi: "Báo cáo kiểm tra dữ liệu chi tiết",
            th: "รายงานตรวจสอบข้อมูลโดยละเอียด",
            id: "Laporan audit data terperinci",
            ms: "Laporan audit data terperinci"
        },
        rateShopperTracking: {
            en: "Rate Shopper competitor tracking",
            vi: "Rate Shopper theo dõi giá đối thủ",
            th: "Rate Shopper ติดตามราคาคู่แข่ง",
            id: "Rate Shopper pelacakan harga pesaing",
            ms: "Rate Shopper penjejakan harga pesaing"
        },
        redirecting: {
            en: "Redirecting...",
            vi: "Đang chuyển...",
            th: "กำลังเปลี่ยนเส้นทาง...",
            id: "Mengalihkan...",
            ms: "Mengalihkan..."
        },
        maybeLater: {
            en: "Maybe later",
            vi: "Để sau",
            th: "ไว้ทีหลัง",
            id: "Nanti saja",
            ms: "Nanti"
        },
        freePlan: {
            en: "Free",
            vi: "Miễn phí",
            th: "ฟรี",
            id: "Gratis",
            ms: "Percuma"
        },
    },
    upgrade: {
        featureAvailableOn: {
            en: "Feature available on {tier}",
            vi: "Tính năng dành cho {tier}",
            th: "ฟีเจอร์สำหรับ {tier}",
            id: "Fitur tersedia di {tier}",
            ms: "Ciri tersedia di {tier}"
        },
        upgradeToUnlock: {
            en: "Upgrade to unlock this feature and save time every day.",
            vi: "Nâng cấp để mở khóa tính năng này và tiết kiệm thời gian mỗi ngày.",
            th: "อัปเกรดเพื่อปลดล็อกฟีเจอร์นี้และประหยัดเวลาทุกวัน",
            id: "Upgrade untuk membuka fitur ini dan menghemat waktu setiap hari.",
            ms: "Naik taraf untuk membuka ciri ini dan menjimatkan masa setiap hari."
        },
        withPlan: {
            en: "With {tier} plan, you get:",
            vi: "Với gói {tier}, bạn sẽ có:",
            th: "ด้วยแผน {tier} คุณจะได้รับ:",
            id: "Dengan paket {tier}, Anda mendapatkan:",
            ms: "Dengan pelan {tier}, anda mendapat:"
        },
        dailySuggestions: {
            en: "Daily price suggestions (Daily Actions)",
            vi: "Gợi ý giá hàng ngày (Daily Actions)",
            th: "แนะนำราคารายวัน (Daily Actions)",
            id: "Saran harga harian (Daily Actions)",
            ms: "Cadangan harga harian (Daily Actions)"
        },
        excelExport: {
            en: "Excel export for OTA upload",
            vi: "Xuất Excel để upload OTA",
            th: "ส่งออก Excel สำหรับอัปโหลด OTA",
            id: "Ekspor Excel untuk upload OTA",
            ms: "Eksport Excel untuk muat naik OTA"
        },
        rateCalendar: {
            en: "30-day rate calendar",
            vi: "Lịch giá 30 ngày",
            th: "ปฏิทินราคา 30 วัน",
            id: "Kalender harga 30 hari",
            ms: "Kalendar harga 30 hari"
        },
        allAssistant: {
            en: "All Assistant features",
            vi: "Tất cả tính năng Assistant",
            th: "ฟีเจอร์ Assistant ทั้งหมด",
            id: "Semua fitur Assistant",
            ms: "Semua ciri Assistant"
        },
        guardrails: {
            en: "Price alerts (Guardrails)",
            vi: "Cảnh báo giá (Guardrails)",
            th: "การแจ้งเตือนราคา (Guardrails)",
            id: "Peringatan harga (Guardrails)",
            ms: "Amaran harga (Guardrails)"
        },
        analyticsReports: {
            en: "Analytics reports",
            vi: "Báo cáo phân tích",
            th: "รายงานวิเคราะห์",
            id: "Laporan analitik",
            ms: "Laporan analitik"
        },
        allRmsLite: {
            en: "All RMS Lite features",
            vi: "Tất cả tính năng RMS Lite",
            th: "ฟีเจอร์ RMS Lite ทั้งหมด",
            id: "Semua fitur RMS Lite",
            ms: "Semua ciri RMS Lite"
        },
        multiProperty: {
            en: "Multi-property management",
            vi: "Quản lý nhiều khách sạn",
            th: "จัดการหลายโรงแรม",
            id: "Manajemen multi-properti",
            ms: "Pengurusan pelbagai hartanah"
        },
        competitorTracking: {
            en: "Competitor rate tracking",
            vi: "Theo dõi giá đối thủ",
            th: "ติดตามราคาคู่แข่ง",
            id: "Pelacakan harga pesaing",
            ms: "Penjejakan harga pesaing"
        },
        viewPricing: {
            en: "View pricing",
            vi: "Xem bảng giá",
            th: "ดูราคา",
            id: "Lihat harga",
            ms: "Lihat harga"
        },
        contactZalo: {
            en: "Contact via Zalo",
            vi: "Liên hệ Zalo",
            th: "ติดต่อผ่าน Zalo",
            id: "Hubungi via Zalo",
            ms: "Hubungi melalui Zalo"
        },
        requiresPlan: {
            en: "Requires {tier} plan",
            vi: "Cần gói {tier}",
            th: "ต้องการแผน {tier}",
            id: "Memerlukan paket {tier}",
            ms: "Memerlukan pelan {tier}"
        },
        // FEATURE_DESCRIPTIONS
        pricingCalc: {
            en: "NET → BAR price calculation",
            vi: "Tính giá NET → BAR",
            th: "คำนวณราคา NET → BAR",
            id: "Perhitungan harga NET → BAR",
            ms: "Pengiraan harga NET → BAR"
        },
        promoStacking: {
            en: "Stack multiple promotions",
            vi: "Ghép nhiều khuyến mãi",
            th: "รวมโปรโมชั่นหลายรายการ",
            id: "Gabungkan beberapa promosi",
            ms: "Gabungkan beberapa promosi"
        },
        dailyActions: {
            en: "Daily price suggestions + 1-click Accept",
            vi: "Gợi ý giá hàng ngày + 1 click Accept",
            th: "แนะนำราคารายวัน + ยอมรับ 1 คลิก",
            id: "Saran harga harian + 1 klik Accept",
            ms: "Cadangan harga harian + 1 klik Accept"
        },
        pickupPace: {
            en: "View booking pace",
            vi: "Xem tốc độ bán phòng",
            th: "ดูอัตราการจอง",
            id: "Lihat kecepatan pemesanan",
            ms: "Lihat kadar tempahan"
        },
        guardrailsDesc: {
            en: "High/low price alerts",
            vi: "Cảnh báo giá quá cao/thấp",
            th: "การแจ้งเตือนราคาสูง/ต่ำ",
            id: "Peringatan harga tinggi/rendah",
            ms: "Amaran harga tinggi/rendah"
        },
        decisionLog: {
            en: "Price decision history",
            vi: "Lịch sử quyết định giá",
            th: "ประวัติการตัดสินใจราคา",
            id: "Riwayat keputusan harga",
            ms: "Sejarah keputusan harga"
        },
        basicAnalytics: {
            en: "Basic revenue reports",
            vi: "Báo cáo doanh thu cơ bản",
            th: "รายงานรายได้พื้นฐาน",
            id: "Laporan pendapatan dasar",
            ms: "Laporan hasil asas"
        },
        advancedAnalytics: {
            en: "Advanced analytics",
            vi: "Phân tích nâng cao",
            th: "วิเคราะห์ขั้นสูง",
            id: "Analitik lanjutan",
            ms: "Analitik lanjutan"
        },
        multiPropertyDesc: {
            en: "Multi-property management",
            vi: "Quản lý nhiều khách sạn",
            th: "จัดการหลายโรงแรม",
            id: "Manajemen multi-properti",
            ms: "Pengurusan pelbagai hartanah"
        },
        apiImport: {
            en: "Automated API data import",
            vi: "Nhập dữ liệu tự động qua API",
            th: "นำเข้าข้อมูลอัตโนมัติผ่าน API",
            id: "Impor data otomatis melalui API",
            ms: "Import data automatik melalui API"
        },
        rateShopperAddon: {
            en: "Competitor rate tracking",
            vi: "Theo dõi giá đối thủ",
            th: "ติดตามราคาคู่แข่ง",
            id: "Pelacakan harga pesaing",
            ms: "Penjejakan harga pesaing"
        },
    },
    gates: {
        featureLocked: {
            en: "Feature locked",
            vi: "Tính năng bị khóa",
            th: "ฟีเจอร์ถูกล็อก",
            id: "Fitur terkunci",
            ms: "Ciri dikunci"
        },
    },
    compliance: {
        planMismatch: {
            en: "but current plan is {band}. Some quotas may be limited.",
            vi: "nhưng gói hiện tại là {band}. Một số quota có thể bị giới hạn.",
            th: "แต่แผนปัจจุบันคือ {band} โควต้าบางส่วนอาจถูกจำกัด",
            id: "tetapi paket saat ini adalah {band}. Beberapa kuota mungkin terbatas.",
            ms: "tetapi pelan semasa ialah {band}. Sesetengah kuota mungkin terhad."
        },
    },
};

// ─── Process each locale file ────────────────────────────────

let totalAdded = 0;

for (const locale of locales) {
    const filePath = path.join(messagesDir, `${locale}.json`);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let added = 0;

    for (const [namespace, keys] of Object.entries(NEW_KEYS)) {
        // Ensure namespace exists
        if (!json[namespace]) {
            json[namespace] = {};
        }

        for (const [key, translations] of Object.entries(keys)) {
            if (!json[namespace][key]) {
                json[namespace][key] = translations[locale] || translations.en;
                added++;
            }
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`✅ ${locale}.json — ${added} new keys added`);
    totalAdded += added;
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`🎉 Total: ${totalAdded} new keys across ${locales.length} locales`);
console.log('═'.repeat(50));
