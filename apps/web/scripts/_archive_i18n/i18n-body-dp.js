const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'messages');

const keys = {
    // DP overview (692-706)
    dpDesc: { en: 'Dynamic Pricing auto-adjusts prices based on <strong>3 factors</strong>:', vi: 'Dynamic Pricing tự động điều chỉnh giá dựa trên <strong>3 yếu tố</strong>:', id: 'Dynamic Pricing menyesuaikan harga secara otomatis berdasarkan <strong>3 faktor</strong>:', ms: 'Dynamic Pricing menyesuaikan harga secara automatik berdasarkan <strong>3 faktor</strong>:', th: 'Dynamic Pricing ปรับราคาอัตโนมัติตาม <strong>3 ปัจจัย</strong>:' },
    dpSeason: { en: 'Season', vi: 'Mùa', id: 'Musim', ms: 'Musim', th: 'ฤดูกาล' },
    dpOccTier: { en: 'OCC% (Occupancy Tier)', vi: 'OCC% (Bậc lấp đầy)', id: 'OCC% (Tier Hunian)', ms: 'OCC% (Peringkat Penghunian)', th: 'OCC% (ระดับอัตราเข้าพัก)' },
    dpNetPrice: { en: 'NET Price', vi: 'Giá NET', id: 'Harga NET', ms: 'Harga NET', th: 'ราคา NET' },
    dpFormula: { en: 'Dynamic NET = Base NET (season) × Multiplier (OCC tier)', vi: 'NET động = NET cơ bản (mùa) × Hệ số (bậc OCC)', id: 'NET Dinamis = NET Dasar (musim) × Pengali (tier OCC)', ms: 'NET Dinamik = NET Asas (musim) × Pengganda (peringkat OCC)', th: 'NET ไดนามิก = NET พื้นฐาน (ฤดูกาล) × ตัวคูณ (ระดับ OCC)' },
    dpExample: { en: 'E.g.: Normal Season NET = 1,200,000 × 1.10 (OCC 50%) = <strong>1,320,000₫</strong>', vi: 'VD: NET Mùa thường = 1.200.000 × 1,10 (OCC 50%) = <strong>1.320.000₫</strong>', id: 'Cth: NET Musim Normal = 1.200.000 × 1,10 (OCC 50%) = <strong>1.320.000₫</strong>', ms: 'Cth: NET Musim Biasa = 1.200.000 × 1,10 (OCC 50%) = <strong>1.320.000₫</strong>', th: 'เช่น: NET ฤดูกาลปกติ = 1,200,000 × 1.10 (OCC 50%) = <strong>1,320,000₫</strong>' },
    dpOpenLink: { en: 'Open Dynamic Pricing tab', vi: 'Mở tab Dynamic Pricing', id: 'Buka tab Dynamic Pricing', ms: 'Buka tab Dynamic Pricing', th: 'เปิดแท็บ Dynamic Pricing' },
    // Seasons (708-733)
    seasonsDesc: { en: 'Season determines the <strong>base NET price</strong>. 3 season types:', vi: 'Mùa xác định <strong>giá NET cơ bản</strong>. 3 loại mùa:', id: 'Musim menentukan <strong>harga NET dasar</strong>. 3 jenis musim:', ms: 'Musim menentukan <strong>harga NET asas</strong>. 3 jenis musim:', th: 'ฤดูกาลกำหนด <strong>ราคา NET พื้นฐาน</strong> มี 3 ประเภท:' },
    seasonH1: { en: 'Season', vi: 'Mùa', id: 'Musim', ms: 'Musim', th: 'ฤดูกาล' },
    seasonH2: { en: 'Price Level', vi: 'Mức giá', id: 'Level Harga', ms: 'Tahap Harga', th: 'ระดับราคา' },
    seasonH3: { en: 'Example', vi: 'Ví dụ', id: 'Contoh', ms: 'Contoh', th: 'ตัวอย่าง' },
    seasonNormal: { en: 'Normal', vi: 'Thường', id: 'Normal', ms: 'Biasa', th: 'ปกติ' },
    seasonNormalLvl: { en: 'Base', vi: 'Cơ bản', id: 'Dasar', ms: 'Asas', th: 'พื้นฐาน' },
    seasonNormalEx: { en: 'Regular days, low season', vi: 'Ngày thường, mùa thấp điểm', id: 'Hari biasa, musim sepi', ms: 'Hari biasa, musim rendah', th: 'วันธรรมดา ช่วงโลว์ซีซั่น' },
    seasonHigh: { en: 'High', vi: 'Cao điểm', id: 'Tinggi', ms: 'Tinggi', th: 'สูง' },
    seasonHighLvl: { en: 'High', vi: 'Cao', id: 'Tinggi', ms: 'Tinggi', th: 'สูง' },
    seasonHighEx: { en: 'Weekends, summer, events', vi: 'Cuối tuần, mùa hè, sự kiện', id: 'Akhir pekan, musim panas, acara', ms: 'Hujung minggu, musim panas, acara', th: 'วันหยุดสุดสัปดาห์ ฤดูร้อน งานอีเวนต์' },
    seasonHoliday: { en: 'Holiday', vi: 'Lễ', id: 'Liburan', ms: 'Cuti', th: 'วันหยุด' },
    seasonHolidayLvl: { en: 'Highest', vi: 'Cao nhất', id: 'Tertinggi', ms: 'Tertinggi', th: 'สูงสุด' },
    seasonHolidayEx: { en: 'Tet, Christmas, national holidays', vi: 'Tết, Giáng sinh, ngày lễ quốc gia', id: 'Tahun Baru, Natal, hari libur nasional', ms: 'Tahun Baru, Krismas, cuti umum', th: 'ปีใหม่ คริสต์มาส วันหยุดราชการ' },
    seasonStep1: { en: 'Click Config on the toolbar', vi: 'Bấm Config trên thanh công cụ', id: 'Klik Config di toolbar', ms: 'Klik Config pada bar alat', th: 'คลิก Config บนแถบเครื่องมือ' },
    seasonStep1Desc: { en: 'The "Seasons" panel will appear on the left.', vi: 'Bảng "Seasons" sẽ xuất hiện bên trái.', id: 'Panel "Seasons" akan muncul di sebelah kiri.', ms: 'Panel "Seasons" akan muncul di sebelah kiri.', th: 'แผง "Seasons" จะปรากฏทางซ้าย' },
    seasonStep2: { en: 'Create Season', vi: 'Tạo Season', id: 'Buat Season', ms: 'Cipta Season', th: 'สร้าง Season' },
    seasonStep2Desc: { en: 'Click <strong>+ NORMAL</strong>, <strong>+ HIGH</strong>, or <strong>+ HOLIDAY</strong> to create a new season.', vi: 'Bấm <strong>+ NORMAL</strong>, <strong>+ HIGH</strong>, hoặc <strong>+ HOLIDAY</strong> để tạo season mới.', id: 'Klik <strong>+ NORMAL</strong>, <strong>+ HIGH</strong>, atau <strong>+ HOLIDAY</strong> untuk membuat season baru.', ms: 'Klik <strong>+ NORMAL</strong>, <strong>+ HIGH</strong>, atau <strong>+ HOLIDAY</strong> untuk mencipta season baru.', th: 'คลิก <strong>+ NORMAL</strong>, <strong>+ HIGH</strong>, หรือ <strong>+ HOLIDAY</strong> เพื่อสร้าง season ใหม่' },
    seasonStep3: { en: 'Add Date Range', vi: 'Thêm khoảng ngày', id: 'Tambah Rentang Tanggal', ms: 'Tambah Julat Tarikh', th: 'เพิ่มช่วงวัน' },
    seasonStep3Desc: { en: 'Open season → <strong>+ Add</strong> date range → select start and end dates.', vi: 'Mở season → <strong>+ Thêm</strong> khoảng ngày → chọn ngày bắt đầu và kết thúc.', id: 'Buka season → <strong>+ Tambah</strong> rentang tanggal → pilih tanggal mulai dan berakhir.', ms: 'Buka season → <strong>+ Tambah</strong> julat tarikh → pilih tarikh mula dan tamat.', th: 'เปิด season → <strong>+ เพิ่ม</strong> ช่วงวัน → เลือกวันเริ่มต้นและสิ้นสุด' },
    seasonStep4: { en: 'Set NET Rates', vi: 'Đặt giá NET', id: 'Atur Harga NET', ms: 'Tetapkan Harga NET', th: 'ตั้งราคา NET' },
    seasonStep4Desc: { en: 'In each season, enter the desired NET price for each room type.', vi: 'Trong mỗi season, nhập giá NET mong muốn cho từng loại phòng.', id: 'Di setiap season, masukkan harga NET yang diinginkan untuk setiap tipe kamar.', ms: 'Dalam setiap season, masukkan harga NET yang dikehendaki untuk setiap jenis bilik.', th: 'ในแต่ละ season ป้อนราคา NET ที่ต้องการสำหรับแต่ละประเภทห้อง' },
    seasonStep5: { en: 'Save', vi: 'Lưu', id: 'Simpan', ms: 'Simpan', th: 'บันทึก' },
    seasonStep5Desc: { en: 'Click <strong>Save</strong> to apply. The price table will update automatically.', vi: 'Bấm <strong>Lưu</strong> để áp dụng. Bảng giá sẽ tự động cập nhật.', id: 'Klik <strong>Simpan</strong> untuk menerapkan. Tabel harga akan diperbarui secara otomatis.', ms: 'Klik <strong>Simpan</strong> untuk menerapkan. Jadual harga akan dikemas kini secara automatik.', th: 'คลิก <strong>บันทึก</strong> เพื่อใช้งาน ตารางราคาจะอัปเดตอัตโนมัติ' },
    seasonPriority: { en: '<strong>Priority rule (auto-detect):</strong> If a day belongs to multiple seasons, the system picks the <strong>highest priority</strong>: Holiday (P3) > High (P2) > Normal (P1).', vi: '<strong>Quy tắc ưu tiên (tự động):</strong> Nếu một ngày thuộc nhiều season, hệ thống chọn <strong>ưu tiên cao nhất</strong>: Lễ (P3) > Cao điểm (P2) > Thường (P1).', id: '<strong>Aturan prioritas (auto-deteksi):</strong> Jika suatu hari termasuk dalam beberapa season, sistem memilih <strong>prioritas tertinggi</strong>: Liburan (P3) > Tinggi (P2) > Normal (P1).', ms: '<strong>Peraturan keutamaan (auto-kesan):</strong> Jika sehari termasuk dalam beberapa season, sistem memilih <strong>keutamaan tertinggi</strong>: Cuti (P3) > Tinggi (P2) > Biasa (P1).', th: '<strong>กฎลำดับความสำคัญ (ตรวจจับอัตโนมัติ):</strong> หากวันหนึ่งอยู่ในหลาย season ระบบจะเลือก <strong>ลำดับสูงสุด</strong>: วันหยุด (P3) > สูง (P2) > ปกติ (P1)' },
    // OCC Tiers (735-755)
    occDesc: { en: '<strong>OCC Tier</strong> is a price tier based on occupancy. Each tier has a <strong>multiplier</strong>.', vi: '<strong>OCC Tier</strong> là bậc giá dựa trên công suất phòng. Mỗi bậc có một <strong>hệ số nhân</strong>.', id: '<strong>OCC Tier</strong> adalah tier harga berdasarkan hunian. Setiap tier memiliki <strong>pengali</strong>.', ms: '<strong>OCC Tier</strong> ialah peringkat harga berdasarkan penghunian. Setiap peringkat mempunyai <strong>pengganda</strong>.', th: '<strong>OCC Tier</strong> คือระดับราคาตามอัตราเข้าพัก แต่ละระดับมี <strong>ตัวคูณ</strong>' },
    occH1: { en: 'Tier', vi: 'Bậc', id: 'Tier', ms: 'Peringkat', th: 'ระดับ' },
    occH4: { en: 'Meaning', vi: 'Ý nghĩa', id: 'Arti', ms: 'Maksud', th: 'ความหมาย' },
    occT0: { en: 'Many rooms available → base price', vi: 'Còn nhiều phòng → giá cơ bản', id: 'Banyak kamar tersedia → harga dasar', ms: 'Banyak bilik tersedia → harga asas', th: 'มีห้องว่างมาก → ราคาพื้นฐาน' },
    occT1: { en: 'Average → increase 10%', vi: 'Trung bình → tăng 10%', id: 'Rata-rata → naik 10%', ms: 'Purata → naik 10%', th: 'ปานกลาง → เพิ่ม 10%' },
    occT2: { en: 'Nearly full → increase 20%', vi: 'Gần đầy → tăng 20%', id: 'Hampir penuh → naik 20%', ms: 'Hampir penuh → naik 20%', th: 'เกือบเต็ม → เพิ่ม 20%' },
    occT3: { en: 'Almost sold out → increase 30%', vi: 'Gần hết phòng → tăng 30%', id: 'Hampir habis → naik 30%', ms: 'Hampir habis → naik 30%', th: 'เกือบหมด → เพิ่ม 30%' },
    occTip: { en: 'OCC% is calculated automatically from OTB data: <strong>OCC = Rooms Booked / Total Hotel Rooms</strong>. If no data yet, you can enter manually.', vi: 'OCC% được tính tự động từ dữ liệu OTB: <strong>OCC = Phòng đã đặt / Tổng phòng khách sạn</strong>. Nếu chưa có dữ liệu, bạn có thể nhập thủ công.', id: 'OCC% dihitung otomatis dari data OTB: <strong>OCC = Kamar Dipesan / Total Kamar Hotel</strong>. Jika belum ada data, Anda bisa input manual.', ms: 'OCC% dikira secara automatik dari data OTB: <strong>OCC = Bilik Ditempah / Jumlah Bilik Hotel</strong>. Jika belum ada data, anda boleh masukkan secara manual.', th: 'OCC% คำนวณอัตโนมัติจากข้อมูล OTB: <strong>OCC = ห้องที่จอง / ห้องทั้งหมดของโรงแรม</strong> หากยังไม่มีข้อมูล สามารถป้อนด้วยตนเอง' },
    // Analytics Terms glossary (757-775) - these are the 2nd glossary in Analytics section
    termsOtb: { en: 'On The Books — Total rooms/revenue booked', vi: 'On The Books — Tổng phòng/doanh thu đã đặt', id: 'On The Books — Total kamar/pendapatan yang dipesan', ms: 'On The Books — Jumlah bilik/hasil yang ditempah', th: 'On The Books — ห้อง/รายได้ทั้งหมดที่จองแล้ว' },
    termsAdr: { en: 'Average Daily Rate — Average room price per night', vi: 'Average Daily Rate — Giá phòng trung bình mỗi đêm', id: 'Average Daily Rate — Harga kamar rata-rata per malam', ms: 'Average Daily Rate — Harga bilik purata semalam', th: 'Average Daily Rate — ราคาห้องเฉลี่ยต่อคืน' },
    termsRevpar: { en: 'Revenue Per Available Room', vi: 'Doanh thu trên mỗi phòng khả dụng', id: 'Pendapatan Per Kamar yang Tersedia', ms: 'Hasil Setiap Bilik yang Tersedia', th: 'รายได้ต่อห้องที่มี' },
    termsOcc: { en: 'Occupancy — Room fill rate (% rooms sold)', vi: 'Tỷ lệ lấp đầy — % phòng đã bán', id: 'Hunian — Tingkat hunian (% kamar terjual)', ms: 'Penghunian — Kadar isian (% bilik terjual)', th: 'อัตราเข้าพัก — % ห้องที่ขายได้' },
    termsPickup: { en: 'New rooms booked since last capture', vi: 'Phòng mới đặt kể từ lần ghi nhận trước', id: 'Kamar baru dipesan sejak tangkapan terakhir', ms: 'Bilik baru ditempah sejak tangkapan terakhir', th: 'ห้องที่จองใหม่นับจากบันทึกครั้งก่อน' },
    termsStly: { en: 'Same Time Last Year — Year-over-year comparison', vi: 'Same Time Last Year — So sánh cùng kỳ năm trước', id: 'Same Time Last Year — Perbandingan tahun ke tahun', ms: 'Same Time Last Year — Perbandingan tahun ke tahun', th: 'Same Time Last Year — เปรียบเทียบปีต่อปี' },
    termsPace: { en: 'Difference between current OTB vs STLY (ahead or behind)', vi: 'Chênh lệch giữa OTB hiện tại vs STLY (vượt hoặc thua)', id: 'Selisih antara OTB saat ini vs STLY (di depan atau di belakang)', ms: 'Perbezaan antara OTB semasa vs STLY (di hadapan atau di belakang)', th: 'ความแตกต่างระหว่าง OTB ปัจจุบัน vs STLY (นำหน้าหรือตามหลัง)' },
    termsLeadTime: { en: 'Number of days between booking and stay date', vi: 'Số ngày giữa ngày đặt và ngày ở', id: 'Jumlah hari antara tanggal pemesanan dan tanggal menginap', ms: 'Bilangan hari antara tarikh tempahan dan tarikh penginapan', th: 'จำนวนวันระหว่างวันจองและวันเข้าพัก' },
};

const langs = ['en', 'vi', 'id', 'ms', 'th'];
for (const lang of langs) {
    const fp = path.join(dir, `${lang}.json`);
    const json = JSON.parse(fs.readFileSync(fp, 'utf8'));
    let added = 0;
    for (const [k, v] of Object.entries(keys)) {
        if (!json.guidePage[k]) { json.guidePage[k] = v[lang]; added++; }
    }
    fs.writeFileSync(fp, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`${lang}: +${added} dp/seasons/occ/terms keys`);
}
