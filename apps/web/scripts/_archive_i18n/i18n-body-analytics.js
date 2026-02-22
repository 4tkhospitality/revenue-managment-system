const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'messages');

const keys = {
    // RM Intro (line 510-527)
    rmDesc: {
        en: 'Revenue Management (RM) = <strong>selling the right room, at the right price, at the right time</strong> to maximize revenue. The system helps you:',
        vi: 'Revenue Management (RM) = <strong>bán đúng phòng, đúng giá, đúng thời điểm</strong> để tối đa hóa doanh thu. Hệ thống giúp bạn:',
        id: 'Revenue Management (RM) = <strong>menjual kamar yang tepat, dengan harga yang tepat, pada waktu yang tepat</strong> untuk memaksimalkan pendapatan. Sistem membantu Anda:',
        ms: 'Revenue Management (RM) = <strong>menjual bilik yang betul, pada harga yang betul, pada masa yang betul</strong> untuk memaksimumkan hasil. Sistem membantu anda:',
        th: 'Revenue Management (RM) = <strong>ขายห้องที่ถูกต้อง ในราคาที่ถูกต้อง ในเวลาที่ถูกต้อง</strong> เพื่อเพิ่มรายได้สูงสุด ระบบช่วยคุณ:'
    },
    rmMonitor: {
        en: 'Monitor OTB', vi: 'Theo dõi OTB', id: 'Pantau OTB', ms: 'Pantau OTB', th: 'ติดตาม OTB'
    },
    rmMonitorDesc: {
        en: 'How many rooms are booked, how many are available',
        vi: 'Bao nhiêu phòng đã đặt, bao nhiêu còn trống',
        id: 'Berapa kamar yang sudah dipesan, berapa yang tersedia',
        ms: 'Berapa bilik yang ditempah, berapa yang masih ada',
        th: 'มีห้องจองกี่ห้อง เหลือว่างกี่ห้อง'
    },
    rmForecast: {
        en: 'Forecast Demand', vi: 'Dự báo nhu cầu', id: 'Prakiraan Permintaan', ms: 'Ramalan Permintaan', th: 'พยากรณ์อุปสงค์'
    },
    rmForecastDesc: {
        en: 'Predict booking pace for the next 30–90 days',
        vi: 'Dự đoán tốc độ đặt phòng trong 30–90 ngày tới',
        id: 'Prediksi kecepatan pemesanan untuk 30–90 hari ke depan',
        ms: 'Ramal kadar tempahan untuk 30–90 hari akan datang',
        th: 'คาดการณ์อัตราการจองสำหรับ 30–90 วันข้างหน้า'
    },
    rmPrice: {
        en: 'Price Recommendation', vi: 'Đề xuất giá', id: 'Rekomendasi Harga', ms: 'Cadangan Harga', th: 'แนะนำราคา'
    },
    rmPriceDesc: {
        en: 'Accept system price or Override with your own',
        vi: 'Chấp nhận giá hệ thống hoặc Ghi đè bằng giá của bạn',
        id: 'Terima harga sistem atau Override dengan harga Anda',
        ms: 'Terima harga sistem atau Ganti dengan harga anda',
        th: 'ยอมรับราคาระบบหรือแทนที่ด้วยราคาของคุณ'
    },
    // KPI Card (line 531-538)
    kpiDesc: {
        en: 'Dashboard shows 4 main KPI cards. Read them by common GM questions:',
        vi: 'Dashboard hiển thị 4 thẻ KPI chính. Đọc theo câu hỏi thường gặp của GM:',
        id: 'Dashboard menampilkan 4 kartu KPI utama. Baca menurut pertanyaan umum GM:',
        ms: 'Dashboard menunjukkan 4 kad KPI utama. Baca mengikut soalan lazim GM:',
        th: 'แดชบอร์ดแสดง 4 การ์ด KPI หลัก อ่านตามคำถามทั่วไปของ GM:'
    },
    kpiOtbDesc: {
        en: 'Rooms already booked. E.g.: OTB = 45 means you\'ve sold 45 rooms for that day.',
        vi: 'Phòng đã được đặt. VD: OTB = 45 nghĩa là bạn đã bán 45 phòng cho ngày đó.',
        id: 'Kamar yang sudah dipesan. Cth: OTB = 45 berarti Anda telah menjual 45 kamar untuk hari itu.',
        ms: 'Bilik yang sudah ditempah. Cth: OTB = 45 bermakna anda telah menjual 45 bilik untuk hari itu.',
        th: 'ห้องที่จองแล้ว เช่น OTB = 45 หมายถึงคุณขายได้ 45 ห้องสำหรับวันนั้น'
    },
    kpiRemDesc: {
        en: 'Rooms still available. E.g.: Remaining = 15 means 15 rooms left to sell.',
        vi: 'Phòng còn trống. VD: Remaining = 15 nghĩa là còn 15 phòng chưa bán.',
        id: 'Kamar masih tersedia. Cth: Remaining = 15 berarti masih ada 15 kamar untuk dijual.',
        ms: 'Bilik masih ada. Cth: Remaining = 15 bermakna masih ada 15 bilik untuk dijual.',
        th: 'ห้องที่ยังว่าง เช่น Remaining = 15 หมายถึงเหลือ 15 ห้องให้ขาย'
    },
    kpiPickupDesc: {
        en: 'New bookings in the last 7 days. Pickup = +8 is good (demand increasing).',
        vi: 'Đặt phòng mới trong 7 ngày qua. Pickup = +8 là tốt (nhu cầu đang tăng).',
        id: 'Pemesanan baru dalam 7 hari terakhir. Pickup = +8 bagus (permintaan meningkat).',
        ms: 'Tempahan baru dalam 7 hari terakhir. Pickup = +8 bagus (permintaan meningkat).',
        th: 'การจองใหม่ใน 7 วันที่ผ่านมา Pickup = +8 ดี (ความต้องการเพิ่มขึ้น)'
    },
    kpiAdrDesc: {
        en: 'Average room price. E.g.: ADR = 1.2M means averaging 1.2M per room per night.',
        vi: 'Giá phòng trung bình. VD: ADR = 1,2tr nghĩa là trung bình 1,2 triệu/phòng/đêm.',
        id: 'Harga kamar rata-rata. Cth: ADR = 1,2jt berarti rata-rata 1,2 juta per kamar per malam.',
        ms: 'Harga bilik purata. Cth: ADR = 1.2J bermakna purata 1.2 juta sebilik semalam.',
        th: 'ราคาห้องเฉลี่ย เช่น ADR = 1.2M หมายถึงเฉลี่ย 1.2 ล้านต่อห้องต่อคืน'
    },
    kpiOpenDash: {
        en: 'Open Dashboard to view KPIs', vi: 'Mở Dashboard xem KPI', id: 'Buka Dashboard lihat KPI', ms: 'Buka Dashboard lihat KPI', th: 'เปิด Dashboard ดู KPI'
    },
    // Charts (line 542-558)
    chartsDesc: {
        en: 'OTB chart helps you compare performance with <strong>Same Time Last Year (STLY)</strong>:',
        vi: 'Biểu đồ OTB giúp bạn so sánh hiệu suất với <strong>Cùng kỳ năm trước (STLY)</strong>:',
        id: 'Grafik OTB membantu Anda membandingkan kinerja dengan <strong>Periode yang Sama Tahun Lalu (STLY)</strong>:',
        ms: 'Carta OTB membantu anda membandingkan prestasi dengan <strong>Tempoh Sama Tahun Lalu (STLY)</strong>:',
        th: 'กราฟ OTB ช่วยเปรียบเทียบผลงานกับ <strong>ช่วงเวลาเดียวกันปีที่แล้ว (STLY)</strong>:'
    },
    chartsCurrent: {
        en: '<strong>Current Year OTB</strong> — Blue line: current bookings',
        vi: '<strong>OTB năm nay</strong> — Đường xanh: đặt phòng hiện tại',
        id: '<strong>OTB Tahun Ini</strong> — Garis biru: pemesanan saat ini',
        ms: '<strong>OTB Tahun Semasa</strong> — Garisan biru: tempahan semasa',
        th: '<strong>OTB ปีปัจจุบัน</strong> — เส้นสีน้ำเงิน: การจองปัจจุบัน'
    },
    chartsStly: {
        en: '<strong>STLY</strong> — Gray line: bookings same time last year',
        vi: '<strong>STLY</strong> — Đường xám: đặt phòng cùng kỳ năm trước',
        id: '<strong>STLY</strong> — Garis abu-abu: pemesanan periode sama tahun lalu',
        ms: '<strong>STLY</strong> — Garisan kelabu: tempahan tempoh sama tahun lalu',
        th: '<strong>STLY</strong> — เส้นสีเทา: การจองช่วงเดียวกันปีที่แล้ว'
    },
    chartsPace: {
        en: '<strong>Pace</strong> — <span class="text-emerald-600">+5 OTB</span> = selling 5 rooms ahead of last year',
        vi: '<strong>Pace</strong> — <span class="text-emerald-600">+5 OTB</span> = bán trước 5 phòng so với năm ngoái',
        id: '<strong>Pace</strong> — <span class="text-emerald-600">+5 OTB</span> = menjual 5 kamar lebih banyak dari tahun lalu',
        ms: '<strong>Pace</strong> — <span class="text-emerald-600">+5 OTB</span> = menjual 5 bilik lebih dari tahun lalu',
        th: '<strong>Pace</strong> — <span class="text-emerald-600">+5 OTB</span> = ขายล่วงหน้า 5 ห้องจากปีที่แล้ว'
    },
    chartsTip: {
        en: 'If Pace is negative (−), you\'re selling slower than last year → consider lowering prices or increasing promotions.',
        vi: 'Nếu Pace âm (−), bạn đang bán chậm hơn năm ngoái → cân nhắc giảm giá hoặc tăng khuyến mãi.',
        id: 'Jika Pace negatif (−), Anda menjual lebih lambat dari tahun lalu → pertimbangkan menurunkan harga atau menambah promosi.',
        ms: 'Jika Pace negatif (−), anda menjual lebih perlahan dari tahun lalu → pertimbangkan menurunkan harga atau menambah promosi.',
        th: 'หาก Pace เป็นลบ (−) คุณขายช้ากว่าปีที่แล้ว → พิจารณาลดราคาหรือเพิ่มโปรโมชั่น'
    },
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
    console.log(`${lang}: +${added} analytics keys`);
}
