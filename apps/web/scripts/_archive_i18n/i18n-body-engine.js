const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'messages');

const keys = {
    // Engine decision accordion (632-662)
    accEngineTitle: { en: 'How does the system decide to increase/decrease price?', vi: 'Hệ thống quyết định tăng/giảm giá như thế nào?', id: 'Bagaimana sistem memutuskan menaikkan/menurunkan harga?', ms: 'Bagaimana sistem membuat keputusan untuk menaikkan/menurunkan harga?', th: 'ระบบตัดสินใจเพิ่ม/ลดราคาอย่างไร?' },
    accEngineDesc: { en: 'Pricing Engine uses <strong>Anchor + Projected OCC</strong> (not ADR):', vi: 'Pricing Engine sử dụng <strong>Anchor + Projected OCC</strong> (không dùng ADR):', id: 'Pricing Engine menggunakan <strong>Anchor + Projected OCC</strong> (bukan ADR):', ms: 'Pricing Engine menggunakan <strong>Anchor + Projected OCC</strong> (bukan ADR):', th: 'Pricing Engine ใช้ <strong>Anchor + Projected OCC</strong> (ไม่ใช่ ADR):' },
    accEngineZone: { en: 'Zone Table', vi: 'Bảng Zone', id: 'Tabel Zone', ms: 'Jadual Zone', th: 'ตาราง Zone' },
    accEngineZoneH1: { en: 'Projected OCC', vi: 'OCC dự kiến', id: 'OCC Proyeksi', ms: 'OCC Unjuran', th: 'OCC ที่คาดการณ์' },
    accEngineZoneH4: { en: 'Action', vi: 'Hành động', id: 'Aksi', ms: 'Tindakan', th: 'การกระทำ' },
    zoneDistress: { en: 'Sharp Decrease', vi: 'Giảm mạnh', id: 'Turun Tajam', ms: 'Turun Mendadak', th: 'ลดราคาอย่างมาก' },
    zoneSoft: { en: 'Slight Decrease', vi: 'Giảm nhẹ', id: 'Turun Sedikit', ms: 'Turun Sedikit', th: 'ลดราคาเล็กน้อย' },
    zoneNormal: { en: 'Hold Price', vi: 'Giữ giá', id: 'Tahan Harga', ms: 'Kekal Harga', th: 'คงราคา' },
    zoneStrong: { en: 'Increase', vi: 'Tăng', id: 'Naik', ms: 'Naik', th: 'เพิ่มราคา' },
    zoneSurge: { en: 'Sharp Increase', vi: 'Tăng mạnh', id: 'Naik Tajam', ms: 'Naik Mendadak', th: 'เพิ่มราคาอย่างมาก' },
    // ADR banner accordion (665-672)
    accAdrBannerTitle: { en: 'What does the \'Large ADR Deviation\' yellow banner mean?', vi: 'Banner vàng \'Lệch ADR lớn\' nghĩa là gì?', id: 'Apa arti banner kuning \'Deviasi ADR Besar\'?', ms: 'Apa maksud sepanduk kuning \'Sisihan ADR Besar\'?', th: 'แบนเนอร์สีเหลือง \'ADR เบี่ยงเบนมาก\' หมายถึงอะไร?' },
    accAdrBannerDesc: { en: 'When many days have ADR deviating > 30% from Anchor, the system warns:', vi: 'Khi nhiều ngày có ADR lệch > 30% so với Anchor, hệ thống cảnh báo:', id: 'Ketika banyak hari memiliki ADR menyimpang > 30% dari Anchor, sistem memperingatkan:', ms: 'Apabila banyak hari mempunyai ADR menyimpang > 30% dari Anchor, sistem memberi amaran:', th: 'เมื่อหลายวันมี ADR เบี่ยงเบน > 30% จาก Anchor ระบบจะเตือน:' },
    accAdrBannerCause: { en: '<strong>Cause:</strong> May be due to too many OTA promotions, room type mix, or outdated Base Rate in Settings.', vi: '<strong>Nguyên nhân:</strong> Có thể do quá nhiều khuyến mãi OTA, mix loại phòng, hoặc Giá cơ bản trong Cài đặt đã lỗi thời.', id: '<strong>Penyebab:</strong> Mungkin karena terlalu banyak promosi OTA, campuran tipe kamar, atau Base Rate yang sudah usang di Pengaturan.', ms: '<strong>Punca:</strong> Mungkin kerana terlalu banyak promosi OTA, campuran jenis bilik, atau Harga Asas yang lapuk dalam Tetapan.', th: '<strong>สาเหตุ:</strong> อาจเกิดจากโปรโมชั่น OTA มากเกินไป ประเภทห้องผสม หรือราคาพื้นฐานในการตั้งค่าล้าสมัย' },
    accAdrBannerAction: { en: '<strong>Action:</strong> Check Settings → Base Rate, or review approved pricing decisions.', vi: '<strong>Hành động:</strong> Kiểm tra Cài đặt → Giá cơ bản, hoặc xem lại quyết định giá đã duyệt.', id: '<strong>Aksi:</strong> Periksa Pengaturan → Harga Dasar, atau tinjau keputusan harga yang sudah disetujui.', ms: '<strong>Tindakan:</strong> Semak Tetapan → Harga Asas, atau semak keputusan harga yang telah diluluskan.', th: '<strong>การกระทำ:</strong> ตรวจสอบการตั้งค่า → ราคาพื้นฐาน หรือตรวจสอบการตัดสินใจราคาที่อนุมัติแล้ว' },
    // Override accordion (675-686)
    accOverrideTitle: { en: 'When should GM Override the price?', vi: 'Khi nào GM nên Ghi đè giá?', id: 'Kapan GM harus Override harga?', ms: 'Bila GM perlu Ganti harga?', th: 'GM ควรแทนที่ราคาเมื่อไหร่?' },
    accOverrideDesc: { en: 'The system auto-recommends prices, but GM can Override when:', vi: 'Hệ thống tự động đề xuất giá, nhưng GM có thể Ghi đè khi:', id: 'Sistem secara otomatis merekomendasikan harga, tetapi GM dapat Override ketika:', ms: 'Sistem mencadangkan harga secara automatik, tetapi GM boleh Ganti apabila:', th: 'ระบบแนะนำราคาอัตโนมัติ แต่ GM สามารถแทนที่เมื่อ:' },
    accOverride1: { en: '<strong>Special events</strong> that the system doesn\'t know about (VIP group, event)', vi: '<strong>Sự kiện đặc biệt</strong> mà hệ thống chưa biết (nhóm VIP, sự kiện)', id: '<strong>Acara khusus</strong> yang tidak diketahui sistem (grup VIP, acara)', ms: '<strong>Acara khas</strong> yang sistem tidak tahu (kumpulan VIP, acara)', th: '<strong>เหตุการณ์พิเศษ</strong> ที่ระบบไม่รู้ (กลุ่ม VIP, งานอีเวนต์)' },
    accOverride2: { en: '<strong>ADR > Anchor + 30%</strong> → market is paying higher, consider raising Anchor', vi: '<strong>ADR > Anchor + 30%</strong> → thị trường đang trả cao hơn, cân nhắc nâng Anchor', id: '<strong>ADR > Anchor + 30%</strong> → pasar membayar lebih tinggi, pertimbangkan menaikkan Anchor', ms: '<strong>ADR > Anchor + 30%</strong> → pasaran membayar lebih tinggi, pertimbangkan menaikkan Anchor', th: '<strong>ADR > Anchor + 30%</strong> → ตลาดจ่ายสูงกว่า พิจารณาเพิ่ม Anchor' },
    accOverride3: { en: '<strong>ADR < Anchor − 30%</strong> → may be giving too many discounts', vi: '<strong>ADR < Anchor − 30%</strong> → có thể đang giảm giá quá nhiều', id: '<strong>ADR < Anchor − 30%</strong> → mungkin memberikan terlalu banyak diskon', ms: '<strong>ADR < Anchor − 30%</strong> → mungkin memberi terlalu banyak diskaun', th: '<strong>ADR < Anchor − 30%</strong> → อาจให้ส่วนลดมากเกินไป' },
    accOverride4: { en: '<strong>Competitor</strong> changed prices suddenly (no integrated rate shopper yet)', vi: '<strong>Đối thủ</strong> thay đổi giá đột ngột (chưa có tích hợp rate shopper)', id: '<strong>Kompetitor</strong> mengubah harga secara tiba-tiba (belum ada rate shopper terintegrasi)', ms: '<strong>Pesaing</strong> menukar harga secara tiba-tiba (belum ada rate shopper bersepadu)', th: '<strong>คู่แข่ง</strong> เปลี่ยนราคากะทันหัน (ยังไม่มี rate shopper ที่เชื่อมต่อ)' },
    accOverrideTip: { en: 'Operational rule: GM reviews Anchor-based recommendation; ADR is only for confirming whether the market accepts that level (sanity check).', vi: 'Quy tắc vận hành: GM duyệt đề xuất dựa trên Anchor; ADR chỉ để xác nhận thị trường có chấp nhận mức giá đó không (kiểm tra hợp lý).', id: 'Aturan operasional: GM meninjau rekomendasi berbasis Anchor; ADR hanya untuk mengonfirmasi apakah pasar menerima level tersebut (sanity check).', ms: 'Peraturan operasi: GM menyemak cadangan berdasarkan Anchor; ADR hanya untuk mengesahkan sama ada pasaran menerima tahap itu (semakan kewarasan).', th: 'กฎการปฏิบัติงาน: GM ตรวจสอบคำแนะนำตาม Anchor; ADR ใช้เพื่อยืนยันว่าตลาดยอมรับระดับนั้นเท่านั้น (sanity check)' },
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
    console.log(`${lang}: +${added} engine/override keys`);
}
