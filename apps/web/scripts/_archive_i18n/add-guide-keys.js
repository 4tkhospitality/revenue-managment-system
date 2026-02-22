const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'messages');

const guidePlaybook = {
    en: {
        // OTAPlaybookGuide tabs
        tabScorecard: "Full Health Check", tabScorecardDesc: "Check key metrics on your hotel's OTA channels to assess if they are in good or bad shape",
        tabBooking: "Booking.com", tabBookingDesc: "Optimization checklist to improve your ranking on Booking.com",
        tabAgoda: "Agoda", tabAgodaDesc: "Optimization checklist to improve your ranking on Agoda",
        tabROI: "Join Campaign?", tabROIDesc: "Is joining promotions like Genius, Preferred, AGP profitable or not?",
        tabReview: "Review Score", tabReviewDesc: "How review scores are calculated and simulate their impact",
        tabBoost: "Boost Ranking", tabBoostDesc: "Guide on how to boost ranking and when to do it on OTAs",
        // Paywall
        paywallTitle: "Detailed content requires upgrade",
        paywallDesc: "Upgrade to the <strong>Superior</strong> plan to access detailed analysis, optimization checklists, and calculation tools for each category.",
        paywallButton: "Upgrade to Superior", paywallContact: "Or contact Zalo for consultation",
        // Phase B note
        phaseBTitle: "Automation (Phase B — Coming Soon)",
        phaseBDesc: "In the future, RMS will directly connect to Booking.com Property Scores API and Opportunities API to automatically assess and suggest actions. Currently Booking.com has paused new integrations — fallback: manual input or import reports from Extranet/YCS.",
        // OTAHealthScorecard
        scorecardTitle: "Ranking Health Status", scorecardSubtitle: "Key channel metrics to assess GOOD/BAD performance",
        updateMetrics: "Update Metrics", programYes: "Yes", programNo: "No"
    },
    vi: {
        tabScorecard: "Ki\u1ec3m tra s\u1ee9c kh\u1ecfe to\u00e0n di\u1ec7n", tabScorecardDesc: "Ki\u1ec3m tra c\u00e1c ch\u1ec9 s\u1ed1 tr\u00ean k\u00eanh OTA c\u1ee7a kh\u00e1ch s\u1ea1n \u0111\u1ec3 bi\u1ebft t\u00ecnh tr\u1ea1ng \u0111ang t\u1ed1t hay x\u1ea5u",
        tabBooking: "Booking.com", tabBookingDesc: "C\u00e1c \u0111\u1ea7u m\u1ee5c c\u00f4ng vi\u1ec7c Checklist nh\u1eb1m t\u1ed1i \u01b0u ranking tr\u00ean Booking.com",
        tabAgoda: "Agoda", tabAgodaDesc: "C\u00e1c \u0111\u1ea7u m\u1ee5c c\u00f4ng vi\u1ec7c Checklist nh\u1eb1m t\u1ed1i \u01b0u ranking tr\u00ean Agoda",
        tabROI: "N\u00ean tham gia Campaign?", tabROIDesc: "Tham gia Promotion hay Campaign nh\u01b0 Genius, Preferred, AGP, v.v th\u00ec hi\u1ec7u qu\u1ea3 l\u1eddi l\u1ed7 ra sao?",
        tabReview: "\u0110i\u1ec3m Review", tabReviewDesc: "C\u00e1ch t\u00ednh \u0111i\u1ec3m s\u1ed1 review v\u00e0 m\u00f4 ph\u1ecfng t\u00e1c \u0111\u1ed9ng c\u1ee7a Review t\u1edbi \u0111i\u1ec3m s\u1ed1",
        tabBoost: "C\u00e1ch t\u0103ng Ranking", tabBoostDesc: "H\u01b0\u1edbng d\u1eabn c\u00e1ch t\u0103ng th\u1ee9 h\u1ea1ng ranking v\u00e0 g\u1ee3i \u00fd khi n\u00e0o n\u00ean \u0111\u1ea9y ranking tr\u00ean OTA",
        paywallTitle: "N\u1ed9i dung chi ti\u1ebft c\u1ea7n n\u00e2ng c\u1ea5p",
        paywallDesc: "N\u00e2ng c\u1ea5p l\u00ean g\u00f3i <strong>Superior</strong> \u0111\u1ec3 xem ph\u00e2n t\u00edch chi ti\u1ebft, checklist t\u1ed1i \u01b0u, v\u00e0 c\u00f4ng c\u1ee5 t\u00ednh to\u00e1n cho t\u1eebng h\u1ea1ng m\u1ee5c.",
        paywallButton: "N\u00e2ng c\u1ea5p l\u00ean Superior", paywallContact: "Ho\u1eb7c li\u00ean h\u1ec7 Zalo \u0111\u1ec3 \u0111\u01b0\u1ee3c t\u01b0 v\u1ea5n",
        phaseBTitle: "T\u1ef1 \u0111\u1ed9ng h\u00f3a (Phase B \u2014 S\u1eafp ra m\u1eaft)",
        phaseBDesc: "Trong t\u01b0\u01a1ng lai, RMS s\u1ebd k\u1ebft n\u1ed1i tr\u1ef1c ti\u1ebfp v\u1edbi Booking.com Property Scores API v\u00e0 Opportunities API \u0111\u1ec3 t\u1ef1 \u0111\u1ed9ng \u0111\u00e1nh gi\u00e1 v\u00e0 \u0111\u1ec1 xu\u1ea5t h\u00e0nh \u0111\u1ed9ng. Hi\u1ec7n t\u1ea1i Booking.com \u0111ang t\u1ea1m d\u1eebng integrations m\u1edbi \u2014 fallback: nh\u1eadp th\u1ee7 c\u00f4ng ho\u1eb7c import b\u00e1o c\u00e1o t\u1eeb Extranet/YCS.",
        scorecardTitle: "T\u00ecnh tr\u1ea1ng th\u1ee9 h\u1ea1ng t\u1ed1t/x\u1ea5u", scorecardSubtitle: "C\u00e1c ch\u1ec9 s\u1ed1 quan tr\u1ecdng c\u1ee7a k\u00eanh l\u00e0 th\u00f4ng tin \u0111\u1ec3 \u0111\u00e1nh gi\u00e1 T\u1ed0T/X\u1ea4U",
        updateMetrics: "C\u1eadp nh\u1eadt ch\u1ec9 s\u1ed1", programYes: "C\u00f3", programNo: "Kh\u00f4ng"
    },
    th: {
        tabScorecard: "\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e38\u0e02\u0e20\u0e32\u0e1e\u0e41\u0e1a\u0e1a\u0e04\u0e23\u0e1a\u0e27\u0e07\u0e08\u0e23", tabScorecardDesc: "\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a\u0e15\u0e31\u0e27\u0e0a\u0e35\u0e49\u0e27\u0e31\u0e14\u0e2a\u0e33\u0e04\u0e31\u0e0d\u0e02\u0e2d\u0e07\u0e0a\u0e48\u0e2d\u0e07\u0e17\u0e32\u0e07 OTA \u0e02\u0e2d\u0e07\u0e42\u0e23\u0e07\u0e41\u0e23\u0e21\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e1b\u0e23\u0e30\u0e40\u0e21\u0e34\u0e19\u0e27\u0e48\u0e32\u0e14\u0e35\u0e2b\u0e23\u0e37\u0e2d\u0e44\u0e21\u0e48\u0e14\u0e35",
        tabBooking: "Booking.com", tabBookingDesc: "\u0e40\u0e0a\u0e47\u0e04\u0e25\u0e34\u0e2a\u0e15\u0e4c\u0e1b\u0e23\u0e31\u0e1a\u0e1b\u0e23\u0e38\u0e07\u0e2d\u0e31\u0e19\u0e14\u0e31\u0e1a\u0e1a\u0e19 Booking.com",
        tabAgoda: "Agoda", tabAgodaDesc: "\u0e40\u0e0a\u0e47\u0e04\u0e25\u0e34\u0e2a\u0e15\u0e4c\u0e1b\u0e23\u0e31\u0e1a\u0e1b\u0e23\u0e38\u0e07\u0e2d\u0e31\u0e19\u0e14\u0e31\u0e1a\u0e1a\u0e19 Agoda",
        tabROI: "\u0e04\u0e27\u0e23\u0e40\u0e02\u0e49\u0e32\u0e23\u0e48\u0e27\u0e21\u0e41\u0e04\u0e21\u0e40\u0e1b\u0e0d?", tabROIDesc: "\u0e01\u0e32\u0e23\u0e40\u0e02\u0e49\u0e32\u0e23\u0e48\u0e27\u0e21\u0e42\u0e1b\u0e23\u0e42\u0e21\u0e0a\u0e31\u0e48\u0e19\u0e40\u0e0a\u0e48\u0e19 Genius, Preferred, AGP \u0e04\u0e38\u0e49\u0e21\u0e2b\u0e23\u0e37\u0e2d\u0e44\u0e21\u0e48?",
        tabReview: "\u0e04\u0e30\u0e41\u0e19\u0e19\u0e23\u0e35\u0e27\u0e34\u0e27", tabReviewDesc: "\u0e27\u0e34\u0e18\u0e35\u0e04\u0e33\u0e19\u0e27\u0e13\u0e04\u0e30\u0e41\u0e19\u0e19\u0e23\u0e35\u0e27\u0e34\u0e27\u0e41\u0e25\u0e30\u0e08\u0e33\u0e25\u0e2d\u0e07\u0e1c\u0e25\u0e01\u0e23\u0e30\u0e17\u0e1a",
        tabBoost: "\u0e27\u0e34\u0e18\u0e35\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2d\u0e31\u0e19\u0e14\u0e31\u0e1a", tabBoostDesc: "\u0e04\u0e39\u0e48\u0e21\u0e37\u0e2d\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e2d\u0e31\u0e19\u0e14\u0e31\u0e1a\u0e41\u0e25\u0e30\u0e41\u0e19\u0e30\u0e19\u0e33\u0e40\u0e27\u0e25\u0e32\u0e17\u0e35\u0e48\u0e40\u0e2b\u0e21\u0e32\u0e30\u0e2a\u0e21\u0e1a\u0e19 OTA",
        paywallTitle: "\u0e40\u0e19\u0e37\u0e49\u0e2d\u0e2b\u0e32\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e15\u0e49\u0e2d\u0e07\u0e2d\u0e31\u0e1e\u0e40\u0e01\u0e23\u0e14",
        paywallDesc: "\u0e2d\u0e31\u0e1e\u0e40\u0e01\u0e23\u0e14\u0e40\u0e1b\u0e47\u0e19\u0e41\u0e1e\u0e47\u0e01\u0e40\u0e01\u0e08 <strong>Superior</strong> \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e14\u0e39\u0e01\u0e32\u0e23\u0e27\u0e34\u0e40\u0e04\u0e23\u0e32\u0e30\u0e2b\u0e4c\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14 \u0e40\u0e0a\u0e47\u0e04\u0e25\u0e34\u0e2a\u0e15\u0e4c \u0e41\u0e25\u0e30\u0e40\u0e04\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e04\u0e33\u0e19\u0e27\u0e13",
        paywallButton: "\u0e2d\u0e31\u0e1e\u0e40\u0e01\u0e23\u0e14\u0e40\u0e1b\u0e47\u0e19 Superior", paywallContact: "\u0e2b\u0e23\u0e37\u0e2d\u0e15\u0e34\u0e14\u0e15\u0e48\u0e2d Zalo \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e23\u0e31\u0e1a\u0e04\u0e33\u0e1b\u0e23\u0e36\u0e01\u0e29\u0e32",
        phaseBTitle: "\u0e23\u0e30\u0e1a\u0e1a\u0e2d\u0e31\u0e15\u0e42\u0e19\u0e21\u0e31\u0e15\u0e34 (Phase B \u2014 \u0e40\u0e23\u0e47\u0e27\u0e46 \u0e19\u0e35\u0e49)",
        phaseBDesc: "\u0e43\u0e19\u0e2d\u0e19\u0e32\u0e04\u0e15 RMS \u0e08\u0e30\u0e40\u0e0a\u0e37\u0e48\u0e2d\u0e21\u0e15\u0e48\u0e2d\u0e42\u0e14\u0e22\u0e15\u0e23\u0e07\u0e01\u0e31\u0e1a Booking.com Property Scores API \u0e41\u0e25\u0e30 Opportunities API \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e1b\u0e23\u0e30\u0e40\u0e21\u0e34\u0e19\u0e41\u0e25\u0e30\u0e41\u0e19\u0e30\u0e19\u0e33\u0e2d\u0e31\u0e15\u0e42\u0e19\u0e21\u0e31\u0e15\u0e34",
        scorecardTitle: "\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e2d\u0e31\u0e19\u0e14\u0e31\u0e1a\u0e14\u0e35/\u0e44\u0e21\u0e48\u0e14\u0e35", scorecardSubtitle: "\u0e15\u0e31\u0e27\u0e0a\u0e35\u0e49\u0e27\u0e31\u0e14\u0e2a\u0e33\u0e04\u0e31\u0e0d\u0e02\u0e2d\u0e07\u0e0a\u0e48\u0e2d\u0e07\u0e17\u0e32\u0e07\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e1b\u0e23\u0e30\u0e40\u0e21\u0e34\u0e19\u0e1c\u0e25\u0e14\u0e35/\u0e44\u0e21\u0e48\u0e14\u0e35",
        updateMetrics: "\u0e2d\u0e31\u0e1e\u0e40\u0e14\u0e15\u0e15\u0e31\u0e27\u0e0a\u0e35\u0e49\u0e27\u0e31\u0e14", programYes: "\u0e43\u0e0a\u0e48", programNo: "\u0e44\u0e21\u0e48"
    },
    id: {
        tabScorecard: "Pemeriksaan Kesehatan Menyeluruh", tabScorecardDesc: "Periksa metrik utama di channel OTA hotel Anda untuk menilai kondisinya",
        tabBooking: "Booking.com", tabBookingDesc: "Checklist optimasi untuk meningkatkan peringkat di Booking.com",
        tabAgoda: "Agoda", tabAgodaDesc: "Checklist optimasi untuk meningkatkan peringkat di Agoda",
        tabROI: "Ikut Campaign?", tabROIDesc: "Apakah ikut promosi seperti Genius, Preferred, AGP menguntungkan?",
        tabReview: "Skor Review", tabReviewDesc: "Cara menghitung skor review dan simulasi dampaknya",
        tabBoost: "Boost Ranking", tabBoostDesc: "Panduan cara meningkatkan peringkat dan kapan harus melakukannya di OTA",
        paywallTitle: "Konten detail memerlukan upgrade",
        paywallDesc: "Upgrade ke paket <strong>Superior</strong> untuk mengakses analisis detail, checklist optimasi, dan alat perhitungan.",
        paywallButton: "Upgrade ke Superior", paywallContact: "Atau hubungi Zalo untuk konsultasi",
        phaseBTitle: "Otomatisasi (Phase B — Segera Hadir)",
        phaseBDesc: "Di masa depan, RMS akan terhubung langsung ke Booking.com Property Scores API dan Opportunities API untuk penilaian dan rekomendasi otomatis.",
        scorecardTitle: "Status Peringkat Baik/Buruk", scorecardSubtitle: "Metrik kunci channel untuk menilai performa BAIK/BURUK",
        updateMetrics: "Perbarui Metrik", programYes: "Ya", programNo: "Tidak"
    },
    ms: {
        tabScorecard: "Pemeriksaan Kesihatan Menyeluruh", tabScorecardDesc: "Periksa metrik utama di saluran OTA hotel anda untuk menilai keadaannya",
        tabBooking: "Booking.com", tabBookingDesc: "Senarai semak pengoptimuman untuk meningkatkan kedudukan di Booking.com",
        tabAgoda: "Agoda", tabAgodaDesc: "Senarai semak pengoptimuman untuk meningkatkan kedudukan di Agoda",
        tabROI: "Sertai Kempen?", tabROIDesc: "Adakah menyertai promosi seperti Genius, Preferred, AGP menguntungkan?",
        tabReview: "Skor Ulasan", tabReviewDesc: "Cara mengira skor ulasan dan simulasi kesannya",
        tabBoost: "Tingkatkan Kedudukan", tabBoostDesc: "Panduan cara meningkatkan kedudukan dan bila masa yang sesuai di OTA",
        paywallTitle: "Kandungan terperinci memerlukan naik taraf",
        paywallDesc: "Naik taraf ke pakej <strong>Superior</strong> untuk mengakses analisis terperinci, senarai semak, dan alat pengiraan.",
        paywallButton: "Naik taraf ke Superior", paywallContact: "Atau hubungi Zalo untuk perundingan",
        phaseBTitle: "Automasi (Phase B — Akan Datang)",
        phaseBDesc: "Pada masa hadapan, RMS akan berhubung terus ke Booking.com Property Scores API dan Opportunities API untuk penilaian dan cadangan automatik.",
        scorecardTitle: "Status Kedudukan Baik/Buruk", scorecardSubtitle: "Metrik utama saluran untuk menilai prestasi BAIK/BURUK",
        updateMetrics: "Kemas kini Metrik", programYes: "Ya", programNo: "Tidak"
    }
};

for (const locale of ['en', 'vi', 'th', 'id', 'ms']) {
    const fp = path.join(dir, locale + '.json');
    const content = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    if (!content.guidePlaybook) content.guidePlaybook = {};
    Object.assign(content.guidePlaybook, guidePlaybook[locale]);
    fs.writeFileSync(fp, JSON.stringify(content, null, 4) + '\n');
}
console.log('Done: guidePlaybook namespace added to all 5 locales');
