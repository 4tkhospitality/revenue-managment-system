// Inject keys for: dataPage (remaining), settingsPage (remaining), teamPage (new), rateShopper (remaining)
const fs = require('fs');
const path = require('path');
const langs = ['en', 'vi', 'id', 'ms', 'th'];
const dir = path.join(__dirname, '..', 'messages');

// Only MISSING keys for dataPage
const dataPageKeys = {
    en: { pageTitle: 'Data Inspector', badgeReservations: 'Reservations', badgeImportJobs: 'Import Jobs', badgeOtbDays: 'OTB Days', importJobsLabel: 'Import Jobs', otbDaysLabel: 'OTB Days', dataRangeLabel: 'Data Range', roomNights: 'Room-nights', dailyOtbTitle: 'Daily OTB (On The Books)' },
    vi: { pageTitle: 'Kiểm tra dữ liệu', badgeReservations: 'Đặt phòng', badgeImportJobs: 'Lần nhập', badgeOtbDays: 'Ngày OTB', importJobsLabel: 'Lần nhập', otbDaysLabel: 'Ngày OTB', dataRangeLabel: 'Khoảng dữ liệu', roomNights: 'Đêm phòng', dailyOtbTitle: 'OTB hàng ngày (On The Books)' },
    id: { pageTitle: 'Inspektur Data', badgeReservations: 'Reservasi', badgeImportJobs: 'Riwayat Impor', badgeOtbDays: 'Hari OTB', importJobsLabel: 'Riwayat Impor', otbDaysLabel: 'Hari OTB', dataRangeLabel: 'Rentang Data', roomNights: 'Malam kamar', dailyOtbTitle: 'OTB Harian (On The Books)' },
    ms: { pageTitle: 'Pemeriksa Data', badgeReservations: 'Tempahan', badgeImportJobs: 'Import', badgeOtbDays: 'Hari OTB', importJobsLabel: 'Import', otbDaysLabel: 'Hari OTB', dataRangeLabel: 'Julat Data', roomNights: 'Malam bilik', dailyOtbTitle: 'OTB Harian (On The Books)' },
    th: { pageTitle: 'ตรวจสอบข้อมูล', badgeReservations: 'การจอง', badgeImportJobs: 'การนำเข้า', badgeOtbDays: 'วัน OTB', importJobsLabel: 'การนำเข้า', otbDaysLabel: 'วัน OTB', dataRangeLabel: 'ช่วงข้อมูล', roomNights: 'คืนห้อง', dailyOtbTitle: 'OTB รายวัน (On The Books)' },
};

// Only MISSING keys for settingsPage
const settingsPageKeys = {
    en: { pricingLadder: 'Pricing Ladder', bandLabel: 'Band', organizationLabel: 'Organization', quotaImports: 'Imports (monthly)', quotaExports: 'Exports (daily)', quotaRateShops: 'Rate Shops (monthly)', maxUsersLabel: 'Max Users', trialBadge: 'Trial {days}d', perDay: 'per day' },
    vi: { pricingLadder: 'Bậc giá', bandLabel: 'Bậc', organizationLabel: 'Tổ chức', quotaImports: 'Nhập (tháng)', quotaExports: 'Xuất (ngày)', quotaRateShops: 'Rate Shop (tháng)', maxUsersLabel: 'Tối đa người dùng', trialBadge: 'Dùng thử {days} ngày', perDay: 'mỗi ngày' },
    id: { pricingLadder: 'Tangga Harga', bandLabel: 'Band', organizationLabel: 'Organisasi', quotaImports: 'Impor (bulanan)', quotaExports: 'Ekspor (harian)', quotaRateShops: 'Rate Shop (bulanan)', maxUsersLabel: 'Maks Pengguna', trialBadge: 'Uji coba {days} hari', perDay: 'per hari' },
    ms: { pricingLadder: 'Tangga Harga', bandLabel: 'Band', organizationLabel: 'Organisasi', quotaImports: 'Import (bulanan)', quotaExports: 'Eksport (harian)', quotaRateShops: 'Rate Shop (bulanan)', maxUsersLabel: 'Maks Pengguna', trialBadge: 'Percubaan {days} hari', perDay: 'sehari' },
    th: { pricingLadder: 'บันไดราคา', bandLabel: 'แบนด์', organizationLabel: 'องค์กร', quotaImports: 'นำเข้า (รายเดือน)', quotaExports: 'ส่งออก (รายวัน)', quotaRateShops: 'Rate Shop (รายเดือน)', maxUsersLabel: 'ผู้ใช้สูงสุด', trialBadge: 'ทดลองใช้ {days} วัน', perDay: 'ต่อวัน' },
};

// FULL teamPage namespace (new)
const teamPageKeys = {
    en: {
        title: 'Team Management', titleWithOrg: 'Members • {org}', subtitle: 'Invite members and manage access',
        inviteTitle: 'Invite Member', members: 'members', inviteCount: '+{n} invite',
        limitWarning: 'Limit reached members for plan', limitNote: 'User quota limited by plan (tier), not by rooms (band).', upgradeLink: 'Upgrade plan for more members →',
        inviteCodeLabel: 'Invite code (role: {role}):', shareLabel: 'Or share link:', copied: '✓ Copied', copy: 'Copy',
        expires: 'Expires: {date}', createAnother: 'Create another invite',
        viewer: '👁 Viewer', manager: '🔧 Manager',
        creating: 'Creating...', limitReached: 'Limit reached', createInvite: '+ Create new invite code',
        activeInvites: 'Active invite codes ({n})', usedCount: 'Used: {used}/{max}', expired: 'Expired', revokeTitle: 'Revoke invite code',
        membersTitle: 'Members ({n})', loading: 'Loading...', noMembers: 'No members yet',
        unnamed: 'Unnamed', you: '(you)', owner: 'Owner',
        confirm: 'Confirm', cancel: 'Cancel', removeMemberTitle: 'Remove Member',
        roleChanged: 'Role changed to {role}', memberRemoved: 'Member removed',
        limitReachedError: 'Limit reached members for the current plan.', cannotCreate: 'Cannot create invite code',
        cannotChangeRole: 'Cannot change role', cannotRemove: 'Cannot remove member', errorOccurred: 'An error occurred',
    },
    vi: {
        title: 'Quản lý nhóm', titleWithOrg: 'Thành viên • {org}', subtitle: 'Mời thành viên và quản lý quyền truy cập',
        inviteTitle: 'Mời thành viên', members: 'thành viên', inviteCount: '+{n} lời mời',
        limitWarning: 'Đã đạt giới hạn thành viên cho gói', limitNote: 'Số người dùng giới hạn theo gói (tier), không theo phòng (band).', upgradeLink: 'Nâng cấp gói để thêm thành viên →',
        inviteCodeLabel: 'Mã mời (vai trò: {role}):', shareLabel: 'Hoặc chia sẻ link:', copied: '✓ Đã sao chép', copy: 'Sao chép',
        expires: 'Hết hạn: {date}', createAnother: 'Tạo lời mời khác',
        viewer: '👁 Xem', manager: '🔧 Quản lý',
        creating: 'Đang tạo...', limitReached: 'Đã đạt giới hạn', createInvite: '+ Tạo mã mời mới',
        activeInvites: 'Mã mời đang hoạt động ({n})', usedCount: 'Đã dùng: {used}/{max}', expired: 'Hết hạn', revokeTitle: 'Thu hồi mã mời',
        membersTitle: 'Thành viên ({n})', loading: 'Đang tải...', noMembers: 'Chưa có thành viên',
        unnamed: 'Chưa đặt tên', you: '(bạn)', owner: 'Chủ sở hữu',
        confirm: 'Xác nhận', cancel: 'Hủy', removeMemberTitle: 'Xóa thành viên',
        roleChanged: 'Đã đổi vai trò thành {role}', memberRemoved: 'Đã xóa thành viên',
        limitReachedError: 'Đã đạt giới hạn thành viên cho gói hiện tại.', cannotCreate: 'Không thể tạo mã mời',
        cannotChangeRole: 'Không thể đổi vai trò', cannotRemove: 'Không thể xóa thành viên', errorOccurred: 'Đã xảy ra lỗi',
    },
    id: {
        title: 'Manajemen Tim', titleWithOrg: 'Anggota • {org}', subtitle: 'Undang anggota dan kelola akses',
        inviteTitle: 'Undang Anggota', members: 'anggota', inviteCount: '+{n} undangan',
        limitWarning: 'Batas anggota tercapai untuk paket', limitNote: 'Kuota pengguna dibatasi oleh paket (tier), bukan oleh kamar (band).', upgradeLink: 'Tingkatkan paket untuk lebih banyak anggota →',
        inviteCodeLabel: 'Kode undangan (peran: {role}):', shareLabel: 'Atau bagikan link:', copied: '✓ Disalin', copy: 'Salin',
        expires: 'Kadaluarsa: {date}', createAnother: 'Buat undangan lain',
        viewer: '👁 Penonton', manager: '🔧 Manajer',
        creating: 'Membuat...', limitReached: 'Batas tercapai', createInvite: '+ Buat kode undangan baru',
        activeInvites: 'Kode undangan aktif ({n})', usedCount: 'Digunakan: {used}/{max}', expired: 'Kadaluarsa', revokeTitle: 'Cabut kode undangan',
        membersTitle: 'Anggota ({n})', loading: 'Memuat...', noMembers: 'Belum ada anggota',
        unnamed: 'Tanpa nama', you: '(anda)', owner: 'Pemilik',
        confirm: 'Konfirmasi', cancel: 'Batal', removeMemberTitle: 'Hapus Anggota',
        roleChanged: 'Peran diubah ke {role}', memberRemoved: 'Anggota dihapus',
        limitReachedError: 'Batas anggota tercapai untuk paket saat ini.', cannotCreate: 'Tidak bisa membuat kode undangan',
        cannotChangeRole: 'Tidak bisa mengubah peran', cannotRemove: 'Tidak bisa menghapus anggota', errorOccurred: 'Terjadi kesalahan',
    },
    ms: {
        title: 'Pengurusan Pasukan', titleWithOrg: 'Ahli • {org}', subtitle: 'Jemput ahli dan urus akses',
        inviteTitle: 'Jemput Ahli', members: 'ahli', inviteCount: '+{n} jemputan',
        limitWarning: 'Had ahli dicapai untuk pelan', limitNote: 'Kuota pengguna dihadkan oleh pelan (tier), bukan oleh bilik (band).', upgradeLink: 'Naik taraf pelan untuk lebih banyak ahli →',
        inviteCodeLabel: 'Kod jemputan (peranan: {role}):', shareLabel: 'Atau kongsi pautan:', copied: '✓ Disalin', copy: 'Salin',
        expires: 'Tamat: {date}', createAnother: 'Buat jemputan lain',
        viewer: '👁 Penonton', manager: '🔧 Pengurus',
        creating: 'Mencipta...', limitReached: 'Had dicapai', createInvite: '+ Buat kod jemputan baru',
        activeInvites: 'Kod jemputan aktif ({n})', usedCount: 'Digunakan: {used}/{max}', expired: 'Tamat tempoh', revokeTitle: 'Batalkan kod jemputan',
        membersTitle: 'Ahli ({n})', loading: 'Memuatkan...', noMembers: 'Belum ada ahli',
        unnamed: 'Tanpa nama', you: '(anda)', owner: 'Pemilik',
        confirm: 'Sahkan', cancel: 'Batal', removeMemberTitle: 'Buang Ahli',
        roleChanged: 'Peranan ditukar ke {role}', memberRemoved: 'Ahli dibuang',
        limitReachedError: 'Had ahli dicapai untuk pelan semasa.', cannotCreate: 'Tidak boleh membuat kod jemputan',
        cannotChangeRole: 'Tidak boleh menukar peranan', cannotRemove: 'Tidak boleh membuang ahli', errorOccurred: 'Ralat berlaku',
    },
    th: {
        title: 'การจัดการทีม', titleWithOrg: 'สมาชิก • {org}', subtitle: 'เชิญสมาชิกและจัดการการเข้าถึง',
        inviteTitle: 'เชิญสมาชิก', members: 'สมาชิก', inviteCount: '+{n} คำเชิญ',
        limitWarning: 'ถึงขีดจำกัดสมาชิกสำหรับแผน', limitNote: 'โควต้าผู้ใช้จำกัดตามแผน (tier) ไม่ใช่ห้อง (band)', upgradeLink: 'อัปเกรดแผนเพื่อเพิ่มสมาชิก →',
        inviteCodeLabel: 'รหัสเชิญ (บทบาท: {role}):', shareLabel: 'หรือแชร์ลิงก์:', copied: '✓ คัดลอกแล้ว', copy: 'คัดลอก',
        expires: 'หมดอายุ: {date}', createAnother: 'สร้างคำเชิญอื่น',
        viewer: '👁 ผู้ชม', manager: '🔧 ผู้จัดการ',
        creating: 'กำลังสร้าง...', limitReached: 'ถึงขีดจำกัด', createInvite: '+ สร้างรหัสเชิญใหม่',
        activeInvites: 'รหัสเชิญที่ใช้งานอยู่ ({n})', usedCount: 'ใช้แล้ว: {used}/{max}', expired: 'หมดอายุ', revokeTitle: 'เพิกถอนรหัสเชิญ',
        membersTitle: 'สมาชิก ({n})', loading: 'กำลังโหลด...', noMembers: 'ยังไม่มีสมาชิก',
        unnamed: 'ไม่มีชื่อ', you: '(คุณ)', owner: 'เจ้าของ',
        confirm: 'ยืนยัน', cancel: 'ยกเลิก', removeMemberTitle: 'ลบสมาชิก',
        roleChanged: 'เปลี่ยนบทบาทเป็น {role}', memberRemoved: 'ลบสมาชิกแล้ว',
        limitReachedError: 'ถึงขีดจำกัดสมาชิกสำหรับแผนปัจจุบัน', cannotCreate: 'ไม่สามารถสร้างรหัสเชิญ',
        cannotChangeRole: 'ไม่สามารถเปลี่ยนบทบาท', cannotRemove: 'ไม่สามารถลบสมาชิก', errorOccurred: 'เกิดข้อผิดพลาด',
    },
};

// Only MISSING keys for rateShopper
const rateShopperKeys = {
    en: { navPriceComparison: 'Price Comparison', navManageCompetitors: 'Manage Competitors', navAddCompetitor: 'Add Competitor', thCompetitors: 'Competitors', thSource: 'Source (OTA)', thPrice: 'Price', thStatus: 'Status', thReliability: 'Reliability', thUpdate: 'Update', noPrice: 'No price', lowConfidence: 'Low', available: 'Available', soldOut: 'Sold out', official: 'Official', priceSources: '{n} price sources', retry: 'Retry', serpApiNote: 'Each scan uses 1 SerpApi credit / competitor', noData: 'No data', justNow: 'Just now', minsAgo: '{n}m ago', hrsAgo: '{n}h ago' },
    vi: { navPriceComparison: 'So sánh giá', navManageCompetitors: 'Quản lý đối thủ', navAddCompetitor: 'Thêm đối thủ', thCompetitors: 'Đối thủ', thSource: 'Nguồn (OTA)', thPrice: 'Giá', thStatus: 'Trạng thái', thReliability: 'Độ tin cậy', thUpdate: 'Cập nhật', noPrice: 'Không có giá', lowConfidence: 'Thấp', available: 'Còn phòng', soldOut: 'Hết phòng', official: 'Chính thức', priceSources: '{n} nguồn giá', retry: 'Thử lại', serpApiNote: 'Mỗi lần quét dùng 1 credit SerpApi / đối thủ', noData: 'Không có dữ liệu', justNow: 'Vừa xong', minsAgo: '{n} phút trước', hrsAgo: '{n} giờ trước' },
    id: { navPriceComparison: 'Perbandingan Harga', navManageCompetitors: 'Kelola Kompetitor', navAddCompetitor: 'Tambah Kompetitor', thCompetitors: 'Kompetitor', thSource: 'Sumber (OTA)', thPrice: 'Harga', thStatus: 'Status', thReliability: 'Keandalan', thUpdate: 'Pembaruan', noPrice: 'Tidak ada harga', lowConfidence: 'Rendah', available: 'Tersedia', soldOut: 'Habis', official: 'Resmi', priceSources: '{n} sumber harga', retry: 'Coba lagi', serpApiNote: 'Setiap pemindaian menggunakan 1 kredit SerpApi / kompetitor', noData: 'Tidak ada data', justNow: 'Baru saja', minsAgo: '{n}m lalu', hrsAgo: '{n}j lalu' },
    ms: { navPriceComparison: 'Perbandingan Harga', navManageCompetitors: 'Urus Pesaing', navAddCompetitor: 'Tambah Pesaing', thCompetitors: 'Pesaing', thSource: 'Sumber (OTA)', thPrice: 'Harga', thStatus: 'Status', thReliability: 'Kebolehpercayaan', thUpdate: 'Kemas kini', noPrice: 'Tiada harga', lowConfidence: 'Rendah', available: 'Tersedia', soldOut: 'Habis', official: 'Rasmi', priceSources: '{n} sumber harga', retry: 'Cuba lagi', serpApiNote: 'Setiap imbasan menggunakan 1 kredit SerpApi / pesaing', noData: 'Tiada data', justNow: 'Baru sahaja', minsAgo: '{n}m lalu', hrsAgo: '{n}j lalu' },
    th: { navPriceComparison: 'เปรียบเทียบราคา', navManageCompetitors: 'จัดการคู่แข่ง', navAddCompetitor: 'เพิ่มคู่แข่ง', thCompetitors: 'คู่แข่ง', thSource: 'แหล่งที่มา (OTA)', thPrice: 'ราคา', thStatus: 'สถานะ', thReliability: 'ความน่าเชื่อถือ', thUpdate: 'อัปเดต', noPrice: 'ไม่มีราคา', lowConfidence: 'ต่ำ', available: 'มีห้องว่าง', soldOut: 'หมด', official: 'ทางการ', priceSources: '{n} แหล่งราคา', retry: 'ลองอีกครั้ง', serpApiNote: 'แต่ละครั้งใช้ 1 เครดิต SerpApi / คู่แข่ง', noData: 'ไม่มีข้อมูล', justNow: 'เมื่อสักครู่', minsAgo: '{n} นาทีที่แล้ว', hrsAgo: '{n} ชม.ที่แล้ว' },
};

for (const lang of langs) {
    const fp = path.join(dir, `${lang}.json`);
    const json = JSON.parse(fs.readFileSync(fp, 'utf8'));

    // dataPage
    if (!json.dataPage) json.dataPage = {};
    for (const [k, v] of Object.entries(dataPageKeys[lang])) json.dataPage[k] = v;

    // settingsPage
    if (!json.settingsPage) json.settingsPage = {};
    for (const [k, v] of Object.entries(settingsPageKeys[lang])) json.settingsPage[k] = v;

    // teamPage (new)
    if (!json.teamPage) json.teamPage = {};
    for (const [k, v] of Object.entries(teamPageKeys[lang])) json.teamPage[k] = v;

    // rateShopper
    if (!json.rateShopper) json.rateShopper = {};
    for (const [k, v] of Object.entries(rateShopperKeys[lang])) json.rateShopper[k] = v;

    fs.writeFileSync(fp, JSON.stringify(json, null, 2) + '\n', 'utf8');
    const total = Object.keys(dataPageKeys[lang]).length + Object.keys(settingsPageKeys[lang]).length + Object.keys(teamPageKeys[lang]).length + Object.keys(rateShopperKeys[lang]).length;
    console.log(`${lang}: +${total} keys (data:${Object.keys(dataPageKeys[lang]).length} settings:${Object.keys(settingsPageKeys[lang]).length} team:${Object.keys(teamPageKeys[lang]).length} rate:${Object.keys(rateShopperKeys[lang]).length})`);
}
