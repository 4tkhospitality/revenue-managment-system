const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'messages');

const roiCalc = {
    en: {
        title: "Promotion Effectiveness", subtitle: "Enter program costs (Genius, Preferred, AGP...) to see if the hotel profits or loses",
        monthlyRevenue: "Monthly Revenue (VND)", baseCommission: "Base Commission", programCost: "Program Cost/Discount",
        programCostTooltip: "E.g: Genius (10%), Preferred (15% + 3% = 18% -> enter the add-on or total discount)",
        expectedUplift: "Expected Growth (Uplift)",
        breakeven: "Breakeven:", breakevenDesc: "You need to increase revenue by at least {pct}% to cover program costs.",
        netCurrent: "Net Revenue (Current)", afterBaseComm: "After base commission",
        netProjected: "Net Revenue (Projected)", withUplift: "With uplift +{pct}%",
        netGain: "Net Gain", gainUp: "Increase", gainDown: "Decrease",
        totalRevenue: "Total Revenue", chartCurrent: "Current", chartProjected: "Projected",
        recStrongYes: "Strong recommendation: SHOULD JOIN", recConsider: "Recommendation: Consider",
        recNo: "Not recommended: LOSS",
        recProfitMsg: "The program generates an additional {amount} in net profit. Growth of {uplift}% exceeds breakeven {breakeven}%.",
        recLossMsg: "Growth of {uplift}% is insufficient to cover program costs. Minimum {breakeven}% needed to break even."
    },
    vi: {
        title: "Hi\u1ec7u qu\u1ea3 Khuy\u1ebfn m\u00e3i", subtitle: "Nh\u1eadp chi ph\u00ed ch\u01b0\u01a1ng tr\u00ecnh (Genius, Preferred, AGP...) \u0111\u1ec3 xem kh\u00e1ch s\u1ea1n l\u1eddi hay l\u1ed7",
        monthlyRevenue: "Doanh thu h\u00e0ng th\u00e1ng (VND)", baseCommission: "Base Commission", programCost: "Program Cost/Discount",
        programCostTooltip: "V\u00ed d\u1ee5: Genius (10%), Preferred (15% + 3% = 18% -> nh\u1eadp ph\u1ea7n t\u0103ng th\u00eam/discount)",
        expectedUplift: "D\u1ef1 ki\u1ebfn t\u0103ng tr\u01b0\u1edfng (Uplift)",
        breakeven: "\u0110i\u1ec3m h\u00f2a v\u1ed1n (Breakeven):", breakevenDesc: "B\u1ea1n c\u1ea7n t\u0103ng doanh thu \u00edt nh\u1ea5t {pct}% \u0111\u1ec3 b\u00f9 \u0111\u1eafp chi ph\u00ed ch\u01b0\u01a1ng tr\u00ecnh.",
        netCurrent: "Net Revenue (Hi\u1ec7n t\u1ea1i)", afterBaseComm: "Sau commission base",
        netProjected: "Net Revenue (D\u1ef1 ki\u1ebfn)", withUplift: "V\u1edbi uplift +{pct}%",
        netGain: "L\u1ee3i nhu\u1eadn r\u00f2ng (Net Gain)", gainUp: "T\u0103ng th\u00eam", gainDown: "Gi\u1ea3m \u0111i",
        totalRevenue: "T\u1ed5ng doanh thu", chartCurrent: "Hi\u1ec7n t\u1ea1i", chartProjected: "D\u1ef1 ki\u1ebfn",
        recStrongYes: "Khuy\u1ebfn ngh\u1ecb m\u1ea1nh: N\u00caN THAM GIA", recConsider: "Khuy\u1ebfn ngh\u1ecb: C\u00e2n nh\u1eafc",
        recNo: "Kh\u00f4ng khuy\u1ebfn ngh\u1ecb: L\u1ed6",
        recProfitMsg: "Ch\u01b0\u01a1ng tr\u00ecnh mang l\u1ea1i th\u00eam {amount} l\u1ee3i nhu\u1eadn r\u00f2ng. M\u1ee9c t\u0103ng tr\u01b0\u1edfng {uplift}% v\u01b0\u1ee3t qua \u0111i\u1ec3m h\u00f2a v\u1ed1n {breakeven}%.",
        recLossMsg: "M\u1ee9c t\u0103ng tr\u01b0\u1edfng {uplift}% ch\u01b0a \u0111\u1ee7 b\u00f9 \u0111\u1eafp chi ph\u00ed ch\u01b0\u01a1ng tr\u00ecnh. C\u1ea7n \u0111\u1ea1t t\u1ed1i thi\u1ec3u {breakeven}% \u0111\u1ec3 h\u00f2a v\u1ed1n."
    },
    th: {
        title: "\u0e1b\u0e23\u0e30\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e20\u0e32\u0e1e\u0e42\u0e1b\u0e23\u0e42\u0e21\u0e0a\u0e31\u0e48\u0e19", subtitle: "\u0e43\u0e2a\u0e48\u0e15\u0e49\u0e19\u0e17\u0e38\u0e19\u0e42\u0e1b\u0e23\u0e41\u0e01\u0e23\u0e21 (Genius, Preferred, AGP...) \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e14\u0e39\u0e27\u0e48\u0e32\u0e42\u0e23\u0e07\u0e41\u0e23\u0e21\u0e01\u0e33\u0e44\u0e23\u0e2b\u0e23\u0e37\u0e2d\u0e02\u0e32\u0e14\u0e17\u0e38\u0e19",
        monthlyRevenue: "\u0e23\u0e32\u0e22\u0e44\u0e14\u0e49\u0e15\u0e48\u0e2d\u0e40\u0e14\u0e37\u0e2d\u0e19", baseCommission: "Base Commission", programCost: "Program Cost/Discount",
        programCostTooltip: "\u0e40\u0e0a\u0e48\u0e19: Genius (10%), Preferred (15% + 3% = 18%)",
        expectedUplift: "\u0e01\u0e32\u0e23\u0e40\u0e15\u0e34\u0e1a\u0e42\u0e15\u0e17\u0e35\u0e48\u0e04\u0e32\u0e14\u0e2b\u0e27\u0e31\u0e07 (Uplift)",
        breakeven: "\u0e08\u0e38\u0e14\u0e04\u0e38\u0e49\u0e21\u0e17\u0e38\u0e19:", breakevenDesc: "\u0e04\u0e38\u0e13\u0e15\u0e49\u0e2d\u0e07\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e23\u0e32\u0e22\u0e44\u0e14\u0e49\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e19\u0e49\u0e2d\u0e22 {pct}% \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e0a\u0e14\u0e40\u0e0a\u0e22\u0e15\u0e49\u0e19\u0e17\u0e38\u0e19\u0e42\u0e1b\u0e23\u0e41\u0e01\u0e23\u0e21",
        netCurrent: "Net Revenue (\u0e1b\u0e31\u0e08\u0e08\u0e38\u0e1a\u0e31\u0e19)", afterBaseComm: "\u0e2b\u0e25\u0e31\u0e07\u0e2b\u0e31\u0e01\u0e04\u0e48\u0e32\u0e04\u0e2d\u0e21\u0e21\u0e34\u0e0a\u0e0a\u0e31\u0e48\u0e19",
        netProjected: "Net Revenue (\u0e04\u0e32\u0e14\u0e01\u0e32\u0e23\u0e13\u0e4c)", withUplift: "\u0e40\u0e1e\u0e34\u0e48\u0e21 +{pct}%",
        netGain: "\u0e01\u0e33\u0e44\u0e23\u0e2a\u0e38\u0e17\u0e18\u0e34 (Net Gain)", gainUp: "\u0e40\u0e1e\u0e34\u0e48\u0e21", gainDown: "\u0e25\u0e14",
        totalRevenue: "\u0e23\u0e32\u0e22\u0e44\u0e14\u0e49\u0e23\u0e27\u0e21", chartCurrent: "\u0e1b\u0e31\u0e08\u0e08\u0e38\u0e1a\u0e31\u0e19", chartProjected: "\u0e04\u0e32\u0e14\u0e01\u0e32\u0e23\u0e13\u0e4c",
        recStrongYes: "\u0e41\u0e19\u0e30\u0e19\u0e33\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e22\u0e34\u0e48\u0e07: \u0e04\u0e27\u0e23\u0e40\u0e02\u0e49\u0e32\u0e23\u0e48\u0e27\u0e21", recConsider: "\u0e41\u0e19\u0e30\u0e19\u0e33: \u0e1e\u0e34\u0e08\u0e32\u0e23\u0e13\u0e32",
        recNo: "\u0e44\u0e21\u0e48\u0e41\u0e19\u0e30\u0e19\u0e33: \u0e02\u0e32\u0e14\u0e17\u0e38\u0e19",
        recProfitMsg: "\u0e42\u0e1b\u0e23\u0e41\u0e01\u0e23\u0e21\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e01\u0e33\u0e44\u0e23\u0e2a\u0e38\u0e17\u0e18\u0e34\u0e40\u0e1e\u0e34\u0e48\u0e21 {amount} \u0e01\u0e32\u0e23\u0e40\u0e15\u0e34\u0e1a\u0e42\u0e15 {uplift}% \u0e40\u0e01\u0e34\u0e19\u0e08\u0e38\u0e14\u0e04\u0e38\u0e49\u0e21\u0e17\u0e38\u0e19 {breakeven}%",
        recLossMsg: "\u0e01\u0e32\u0e23\u0e40\u0e15\u0e34\u0e1a\u0e42\u0e15 {uplift}% \u0e44\u0e21\u0e48\u0e40\u0e1e\u0e35\u0e22\u0e07\u0e1e\u0e2d\u0e0a\u0e14\u0e40\u0e0a\u0e22\u0e15\u0e49\u0e19\u0e17\u0e38\u0e19 \u0e15\u0e49\u0e2d\u0e07\u0e44\u0e14\u0e49\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e19\u0e49\u0e2d\u0e22 {breakeven}% \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e04\u0e38\u0e49\u0e21\u0e17\u0e38\u0e19"
    },
    id: {
        title: "Efektivitas Promosi", subtitle: "Masukkan biaya program (Genius, Preferred, AGP...) untuk melihat apakah hotel untung atau rugi",
        monthlyRevenue: "Pendapatan Bulanan", baseCommission: "Base Commission", programCost: "Program Cost/Discount",
        programCostTooltip: "Contoh: Genius (10%), Preferred (15% + 3% = 18%)",
        expectedUplift: "Pertumbuhan yang Diharapkan (Uplift)",
        breakeven: "Titik Impas:", breakevenDesc: "Anda perlu meningkatkan pendapatan minimal {pct}% untuk menutupi biaya program.",
        netCurrent: "Net Revenue (Sekarang)", afterBaseComm: "Setelah komisi dasar",
        netProjected: "Net Revenue (Proyeksi)", withUplift: "Dengan uplift +{pct}%",
        netGain: "Laba Bersih (Net Gain)", gainUp: "Bertambah", gainDown: "Berkurang",
        totalRevenue: "Total Pendapatan", chartCurrent: "Sekarang", chartProjected: "Proyeksi",
        recStrongYes: "Rekomendasi kuat: SEBAIKNYA IKUT", recConsider: "Rekomendasi: Pertimbangkan",
        recNo: "Tidak direkomendasikan: RUGI",
        recProfitMsg: "Program menghasilkan laba bersih tambahan {amount}. Pertumbuhan {uplift}% melewati titik impas {breakeven}%.",
        recLossMsg: "Pertumbuhan {uplift}% belum cukup menutupi biaya program. Minimal {breakeven}% diperlukan untuk impas."
    },
    ms: {
        title: "Keberkesanan Promosi", subtitle: "Masukkan kos program (Genius, Preferred, AGP...) untuk melihat hotel untung atau rugi",
        monthlyRevenue: "Hasil Bulanan", baseCommission: "Base Commission", programCost: "Program Cost/Discount",
        programCostTooltip: "Contoh: Genius (10%), Preferred (15% + 3% = 18%)",
        expectedUplift: "Pertumbuhan Dijangka (Uplift)",
        breakeven: "Titik Pulang Modal:", breakevenDesc: "Anda perlu meningkatkan hasil sekurang-kurangnya {pct}% untuk menampung kos program.",
        netCurrent: "Net Revenue (Semasa)", afterBaseComm: "Selepas komisen asas",
        netProjected: "Net Revenue (Unjuran)", withUplift: "Dengan uplift +{pct}%",
        netGain: "Keuntungan Bersih (Net Gain)", gainUp: "Bertambah", gainDown: "Berkurang",
        totalRevenue: "Jumlah Hasil", chartCurrent: "Semasa", chartProjected: "Unjuran",
        recStrongYes: "Cadangan kukuh: PATUT SERTAI", recConsider: "Cadangan: Pertimbangkan",
        recNo: "Tidak dicadangkan: RUGI",
        recProfitMsg: "Program menjana keuntungan bersih tambahan {amount}. Pertumbuhan {uplift}% melebihi titik pulang modal {breakeven}%.",
        recLossMsg: "Pertumbuhan {uplift}% tidak mencukupi untuk menampung kos program. Minimum {breakeven}% diperlukan untuk pulang modal."
    }
};

const reviewCalc = {
    en: {
        title: "Review Score Calculator", simDesc: "**Impact Simulation**: See how new reviews affect the score (useful for proactively requesting good reviews).",
        targetDesc: "**Target Score**: Calculate how many good reviews are needed to reach the desired score (for improvement planning).",
        simulator: "Impact Simulation", targetMode: "Target Score",
        currentData: "Current Data", currentScoreLabel: "Current Score", reviewCount: "Number of Reviews",
        simNewReviews: "Simulate New Reviews", newReviewCount: "New Reviews", newReviewScore: "New Review Score",
        targetSection: "Target", targetScoreLabel: "Target Score", expectedPerReview: "Expected Score/Review",
        disclaimer: "Booking.com uses a **weighted** system (newer reviews count more). This formula uses simple average \u2014 results are **estimates**, not 100% accurate.",
        current: "Current", projected: "Projected",
        changeAfter: "Change after {count} new reviews ({score}/10)",
        oldTotalScore: "Old total score:", newlyAdded: "Newly added:", newScoreLabel: "New score:",
        infeasible: "Not feasible!", reviewsNeeded: "reviews needed (each review {score}/10)",
        feasibility: "Feasibility: {label}",
        feasImpossible: "Impossible", feasEasy: "Easy", feasPossible: "Feasible", feasHard: "Hard", feasVeryHard: "Very hard",
        targetExplanation: "To reach {target}/10 from {current}/10 (currently {count} reviews), you need {needed} new reviews with average score {score}/10."
    },
    vi: {
        title: "C\u00e1ch t\u00ednh \u0111i\u1ec3m \u0111\u00e1nh gi\u00e1", simDesc: "**M\u00f4 ph\u1ecfng t\u00e1c \u0111\u1ed9ng**: Xem th\u00eam review m\u1edbi s\u1ebd \u1ea3nh h\u01b0\u1edfng \u0111i\u1ec3m s\u1ed1 nh\u01b0 th\u1ebf n\u00e0o (c\u1ea7n bi\u1ebft \u0111\u1ec3 ch\u1ee7 \u0111\u1ed9ng xin review t\u1ed1t).",
        targetDesc: "**M\u1ee5c ti\u00eau \u0111i\u1ec3m s\u1ed1**: T\u00ednh c\u1ea7n bao nhi\u00eau review t\u1ed1t \u0111\u1ec3 \u0111\u1ea1t \u0111i\u1ec3m mong mu\u1ed1n (l\u00ean k\u1ebf ho\u1ea1ch c\u1ea3i thi\u1ec7n).",
        simulator: "M\u00f4 ph\u1ecfng t\u00e1c \u0111\u1ed9ng", targetMode: "M\u1ee5c ti\u00eau \u0111i\u1ec3m s\u1ed1",
        currentData: "D\u1eef li\u1ec7u hi\u1ec7n t\u1ea1i", currentScoreLabel: "\u0110i\u1ec3m hi\u1ec7n t\u1ea1i", reviewCount: "S\u1ed1 l\u01b0\u1ee3ng review",
        simNewReviews: "M\u00f4 ph\u1ecfng review m\u1edbi", newReviewCount: "S\u1ed1 review m\u1edbi", newReviewScore: "\u0110i\u1ec3m review m\u1edbi",
        targetSection: "M\u1ee5c ti\u00eau", targetScoreLabel: "\u0110i\u1ec3m m\u1ee5c ti\u00eau", expectedPerReview: "\u0110i\u1ec3m k\u1ef3 v\u1ecdng/review",
        disclaimer: "Booking.com d\u00f9ng h\u1ec7 th\u1ed1ng c\u00f3 **tr\u1ecdng s\u1ed1** (review m\u1edbi n\u1eb7ng h\u01a1n review c\u0169). C\u00f4ng th\u1ee9c n\u00e0y d\u00f9ng trung b\u00ecnh c\u1ed9ng \u2014 k\u1ebft qu\u1ea3 l\u00e0 **\u01b0\u1edbc t\u00ednh**, kh\u00f4ng ch\u00ednh x\u00e1c 100%.",
        current: "Hi\u1ec7n t\u1ea1i", projected: "D\u1ef1 ki\u1ebfn",
        changeAfter: "Thay \u0111\u1ed5i sau {count} review m\u1edbi ({score}/10)",
        oldTotalScore: "T\u1ed5ng \u0111i\u1ec3m c\u0169:", newlyAdded: "\u0110i\u1ec3m m\u1edbi th\u00eam:", newScoreLabel: "\u0110i\u1ec3m m\u1edbi:",
        infeasible: "Kh\u00f4ng kh\u1ea3 thi!", reviewsNeeded: "reviews c\u1ea7n thi\u1ebft (m\u1ed7i review {score}/10)",
        feasibility: "M\u1ee9c kh\u1ea3 thi: {label}",
        feasImpossible: "Kh\u00f4ng th\u1ec3", feasEasy: "D\u1ec5 \u0111\u1ea1t", feasPossible: "Kh\u1ea3 thi", feasHard: "Kh\u00f3", feasVeryHard: "R\u1ea5t kh\u00f3",
        targetExplanation: "\u0110\u1ec3 \u0111\u1ea1t {target}/10 t\u1eeb {current}/10 (hi\u1ec7n c\u00f3 {count} reviews), b\u1ea1n c\u1ea7n {needed} reviews m\u1edbi v\u1edbi \u0111i\u1ec3m trung b\u00ecnh {score}/10."
    },
    th: {
        title: "\u0e40\u0e04\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e04\u0e33\u0e19\u0e27\u0e13\u0e04\u0e30\u0e41\u0e19\u0e19\u0e23\u0e35\u0e27\u0e34\u0e27", simDesc: "**\u0e08\u0e33\u0e25\u0e2d\u0e07\u0e1c\u0e25\u0e01\u0e23\u0e30\u0e17\u0e1a**: \u0e14\u0e39\u0e27\u0e48\u0e32\u0e23\u0e35\u0e27\u0e34\u0e27\u0e43\u0e2b\u0e21\u0e48\u0e08\u0e30\u0e2a\u0e48\u0e07\u0e1c\u0e25\u0e15\u0e48\u0e2d\u0e04\u0e30\u0e41\u0e19\u0e19\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e44\u0e23",
        targetDesc: "**\u0e04\u0e30\u0e41\u0e19\u0e19\u0e40\u0e1b\u0e49\u0e32\u0e2b\u0e21\u0e32\u0e22**: \u0e04\u0e33\u0e19\u0e27\u0e13\u0e27\u0e48\u0e32\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e23\u0e35\u0e27\u0e34\u0e27\u0e14\u0e35\u0e01\u0e35\u0e48\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e44\u0e1b\u0e16\u0e36\u0e07\u0e04\u0e30\u0e41\u0e19\u0e19\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23",
        simulator: "\u0e08\u0e33\u0e25\u0e2d\u0e07\u0e1c\u0e25\u0e01\u0e23\u0e30\u0e17\u0e1a", targetMode: "\u0e04\u0e30\u0e41\u0e19\u0e19\u0e40\u0e1b\u0e49\u0e32\u0e2b\u0e21\u0e32\u0e22",
        currentData: "\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e1b\u0e31\u0e08\u0e08\u0e38\u0e1a\u0e31\u0e19", currentScoreLabel: "\u0e04\u0e30\u0e41\u0e19\u0e19\u0e1b\u0e31\u0e08\u0e08\u0e38\u0e1a\u0e31\u0e19", reviewCount: "\u0e08\u0e33\u0e19\u0e27\u0e19\u0e23\u0e35\u0e27\u0e34\u0e27",
        simNewReviews: "\u0e08\u0e33\u0e25\u0e2d\u0e07\u0e23\u0e35\u0e27\u0e34\u0e27\u0e43\u0e2b\u0e21\u0e48", newReviewCount: "\u0e23\u0e35\u0e27\u0e34\u0e27\u0e43\u0e2b\u0e21\u0e48", newReviewScore: "\u0e04\u0e30\u0e41\u0e19\u0e19\u0e23\u0e35\u0e27\u0e34\u0e27\u0e43\u0e2b\u0e21\u0e48",
        targetSection: "\u0e40\u0e1b\u0e49\u0e32\u0e2b\u0e21\u0e32\u0e22", targetScoreLabel: "\u0e04\u0e30\u0e41\u0e19\u0e19\u0e40\u0e1b\u0e49\u0e32\u0e2b\u0e21\u0e32\u0e22", expectedPerReview: "\u0e04\u0e30\u0e41\u0e19\u0e19\u0e04\u0e32\u0e14\u0e2b\u0e27\u0e31\u0e07/\u0e23\u0e35\u0e27\u0e34\u0e27",
        disclaimer: "Booking.com \u0e43\u0e0a\u0e49\u0e23\u0e30\u0e1a\u0e1a**\u0e16\u0e48\u0e27\u0e07\u0e19\u0e49\u0e33\u0e2b\u0e19\u0e31\u0e01** (\u0e23\u0e35\u0e27\u0e34\u0e27\u0e43\u0e2b\u0e21\u0e48\u0e21\u0e35\u0e19\u0e49\u0e33\u0e2b\u0e19\u0e31\u0e01\u0e21\u0e32\u0e01\u0e01\u0e27\u0e48\u0e32) \u0e2a\u0e39\u0e15\u0e23\u0e19\u0e35\u0e49\u0e43\u0e0a\u0e49\u0e04\u0e48\u0e32\u0e40\u0e09\u0e25\u0e35\u0e48\u0e22 \u2014 \u0e1c\u0e25\u0e40\u0e1b\u0e47\u0e19**\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13\u0e01\u0e32\u0e23** \u0e44\u0e21\u0e48\u0e41\u0e21\u0e48\u0e19\u0e22\u0e33 100%",
        current: "\u0e1b\u0e31\u0e08\u0e08\u0e38\u0e1a\u0e31\u0e19", projected: "\u0e04\u0e32\u0e14\u0e01\u0e32\u0e23\u0e13\u0e4c",
        changeAfter: "\u0e40\u0e1b\u0e25\u0e35\u0e48\u0e22\u0e19\u0e41\u0e1b\u0e25\u0e07\u0e2b\u0e25\u0e31\u0e07 {count} \u0e23\u0e35\u0e27\u0e34\u0e27\u0e43\u0e2b\u0e21\u0e48 ({score}/10)",
        oldTotalScore: "\u0e04\u0e30\u0e41\u0e19\u0e19\u0e23\u0e27\u0e21\u0e40\u0e14\u0e34\u0e21:", newlyAdded: "\u0e04\u0e30\u0e41\u0e19\u0e19\u0e40\u0e1e\u0e34\u0e48\u0e21:", newScoreLabel: "\u0e04\u0e30\u0e41\u0e19\u0e19\u0e43\u0e2b\u0e21\u0e48:",
        infeasible: "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e17\u0e33\u0e44\u0e14\u0e49!", reviewsNeeded: "\u0e23\u0e35\u0e27\u0e34\u0e27\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23 (\u0e41\u0e15\u0e48\u0e25\u0e30\u0e23\u0e35\u0e27\u0e34\u0e27 {score}/10)",
        feasibility: "\u0e04\u0e27\u0e32\u0e21\u0e40\u0e1b\u0e47\u0e19\u0e44\u0e1b\u0e44\u0e14\u0e49: {label}",
        feasImpossible: "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16", feasEasy: "\u0e07\u0e48\u0e32\u0e22", feasPossible: "\u0e40\u0e1b\u0e47\u0e19\u0e44\u0e1b\u0e44\u0e14\u0e49", feasHard: "\u0e22\u0e32\u0e01", feasVeryHard: "\u0e22\u0e32\u0e01\u0e21\u0e32\u0e01",
        targetExplanation: "\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e44\u0e1b\u0e16\u0e36\u0e07 {target}/10 \u0e08\u0e32\u0e01 {current}/10 (\u0e21\u0e35 {count} \u0e23\u0e35\u0e27\u0e34\u0e27) \u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23 {needed} \u0e23\u0e35\u0e27\u0e34\u0e27\u0e43\u0e2b\u0e21\u0e48\u0e17\u0e35\u0e48\u0e04\u0e30\u0e41\u0e19\u0e19\u0e40\u0e09\u0e25\u0e35\u0e48\u0e22 {score}/10"
    },
    id: {
        title: "Kalkulator Skor Review", simDesc: "**Simulasi Dampak**: Lihat bagaimana review baru mempengaruhi skor.",
        targetDesc: "**Skor Target**: Hitung berapa review bagus yang dibutuhkan untuk mencapai skor yang diinginkan.",
        simulator: "Simulasi Dampak", targetMode: "Skor Target",
        currentData: "Data Saat Ini", currentScoreLabel: "Skor saat ini", reviewCount: "Jumlah review",
        simNewReviews: "Simulasi review baru", newReviewCount: "Review baru", newReviewScore: "Skor review baru",
        targetSection: "Target", targetScoreLabel: "Skor target", expectedPerReview: "Skor harapan/review",
        disclaimer: "Booking.com menggunakan sistem **berbobot** (review baru lebih berat). Rumus ini menggunakan rata-rata sederhana \u2014 hasilnya **perkiraan**, tidak 100% akurat.",
        current: "Sekarang", projected: "Proyeksi",
        changeAfter: "Perubahan setelah {count} review baru ({score}/10)",
        oldTotalScore: "Total skor lama:", newlyAdded: "Skor ditambahkan:", newScoreLabel: "Skor baru:",
        infeasible: "Tidak mungkin!", reviewsNeeded: "review dibutuhkan (setiap review {score}/10)",
        feasibility: "Kelayakan: {label}",
        feasImpossible: "Tidak mungkin", feasEasy: "Mudah", feasPossible: "Memungkinkan", feasHard: "Sulit", feasVeryHard: "Sangat sulit",
        targetExplanation: "Untuk mencapai {target}/10 dari {current}/10 (saat ini {count} review), Anda perlu {needed} review baru dengan skor rata-rata {score}/10."
    },
    ms: {
        title: "Kalkulator Skor Ulasan", simDesc: "**Simulasi Kesan**: Lihat bagaimana ulasan baru mempengaruhi skor.",
        targetDesc: "**Skor Sasaran**: Kira berapa ulasan baik diperlukan untuk mencapai skor yang diingini.",
        simulator: "Simulasi Kesan", targetMode: "Skor Sasaran",
        currentData: "Data Semasa", currentScoreLabel: "Skor semasa", reviewCount: "Bilangan ulasan",
        simNewReviews: "Simulasi ulasan baru", newReviewCount: "Ulasan baru", newReviewScore: "Skor ulasan baru",
        targetSection: "Sasaran", targetScoreLabel: "Skor sasaran", expectedPerReview: "Skor jangkaan/ulasan",
        disclaimer: "Booking.com menggunakan sistem **berwajaran** (ulasan baru lebih berat). Formula ini menggunakan purata mudah \u2014 hasilnya **anggaran**, tidak 100% tepat.",
        current: "Semasa", projected: "Unjuran",
        changeAfter: "Perubahan selepas {count} ulasan baru ({score}/10)",
        oldTotalScore: "Jumlah skor lama:", newlyAdded: "Skor ditambah:", newScoreLabel: "Skor baru:",
        infeasible: "Tidak mungkin!", reviewsNeeded: "ulasan diperlukan (setiap ulasan {score}/10)",
        feasibility: "Kebolehlaksanaan: {label}",
        feasImpossible: "Tidak mungkin", feasEasy: "Mudah", feasPossible: "Boleh dilaksanakan", feasHard: "Sukar", feasVeryHard: "Sangat sukar",
        targetExplanation: "Untuk mencapai {target}/10 dari {current}/10 (kini {count} ulasan), anda perlu {needed} ulasan baru dengan skor purata {score}/10."
    }
};

// Merge into each locale
for (const locale of ['en', 'vi', 'th', 'id', 'ms']) {
    const fp = path.join(dir, locale + '.json');
    const content = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    if (!content.roiCalc) content.roiCalc = {};
    Object.assign(content.roiCalc, roiCalc[locale]);
    if (!content.reviewCalc) content.reviewCalc = {};
    Object.assign(content.reviewCalc, reviewCalc[locale]);
    fs.writeFileSync(fp, JSON.stringify(content, null, 4) + '\n');
}
console.log('Done: roiCalc + reviewCalc namespaces added to all 5 locales');
