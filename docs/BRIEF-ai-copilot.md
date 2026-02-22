# 💡 BRIEF: AI Revenue Copilot (Gemini-Powered)

**Ngày tạo:** 2026-02-22
**Brainstorm cùng:** BA Team + AI Research

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT

GM/DOSM (General Manager / Director of Sales & Marketing) tại các khách sạn vừa-nhỏ ở Đông Nam Á:
- **Không có chuyên viên Revenue Management** riêng → phải tự đọc dashboard
- **Dashboard có data đầy đủ** (OTB, supply, forecast, pace, cancellations, pricing) nhưng **không biết đọc ý nghĩa**
- **Mất 15-30 phút** mỗi sáng để "hiểu chuyện gì đang xảy ra" → thường bỏ qua
- **Quyết định giá dựa cảm tính** thay vì data-driven, đặc biệt ở các ngày không rõ ràng (70-85% OCC)

## 2. GIẢI PHÁP ĐỀ XUẤT

**AI Copilot** tích hợp trực tiếp vào 3 tab dashboard hiện tại, hoạt động như một **Revenue Manager ảo** luôn sẵn sàng giải thích, phân tích và gợi ý — dựa 100% trên data thực của khách sạn.

> **Copilot, KHÔNG phải Autopilot**: AI chỉ gợi ý + giải thích, GM vẫn bấm duyệt.

## 3. ĐỐI TƯỢNG SỬ DỤNG

- **Primary:** GM / DOSM tại khách sạn 50-200 phòng (không có RM chuyên trách)
- **Secondary:** Revenue Manager tại chuỗi khách sạn (dùng như assistant để tiết kiệm thời gian)

---

## 4. NGHIÊN CỨU THỊ TRƯỜNG (Feb 2026)

### 🏆 Đối thủ chính:

| Sản phẩm | AI Feature | Điểm mạnh | Khoảng trống |
|----------|-----------|-----------|-------------|
| **IDeaS** (G3 RMS) | IDeaS Spotlight — AI demand intelligence | 30+ năm kinh nghiệm, deep ML, Fortune 500 hotels | ❌ Không có conversational AI, UI phức tạp, giá $$$$ |
| **Duetto** (RP-OS) | Advance — AI detect unusual demand, recommend pricing | Award-winning RMS, focus total profit | ❌ Không có "explain this" cho từng row, UI dành cho RM chuyên nghiệp |
| **Atomize** (Mews) | Pricing Insights — GenAI explain price recommendations | Real-time pricing 365 ngày, explain "tại sao" | ⚠️ Chỉ explain pricing, không cover analytics/overview |
| **Lighthouse** (ex-OTA Insight) | Revenue Agent + AI Smart Summaries | 400TB data/ngày, Connect AI cho AI search | ❌ Market intel tool, không phải copilot tương tác |

### 💡 Khoảng trống thị trường (CƠ HỘI LỚN):

| Tính năng | IDeaS | Duetto | Atomize | Lighthouse | **RMS (của mình)** |
|-----------|:-----:|:------:|:-------:|:----------:|:-------------------:|
| Morning Brief (auto-generated) | ❌ | ❌ | ❌ | ⚠️ Smart Summary (không tương tác) | ✅ **Planned** |
| Ask-the-Report Q&A chat | ❌ | ❌ | ❌ | ❌ | ✅ **Planned** |
| Explain-this-row (pricing) | ❌ | ❌ | ✅ (chỉ pricing) | ❌ | ✅ **Planned (3 tabs)** |
| Grounded output (trỏ về data) | ⚠️ Implicit | ⚠️ Implicit | ✅ | ❌ | ✅ **Planned** |
| Chat theo context tab | ❌ | ❌ | ❌ | ❌ | ✅ **Planned** |
| Giá phù hợp SEA | ❌ ($1000+/mo) | ❌ ($500+/mo) | ⚠️ (€299+/mo) | ❌ ($500+/mo) | ✅ (included in tier) |

> **Kết luận:** Chưa có ai trên thị trường cung cấp **conversational AI copilot grounded trên toàn bộ dashboard** (overview + analytics + pricing) trong 1 giao diện chat. Đây là Blue Ocean.

### 🎯 Điểm khác biệt của RMS:

1. **Full-dashboard coverage**: 1 copilot phục vụ cả 3 tab (không chỉ pricing)
2. **Grounded & Explainable**: Mọi output trỏ về row/ngày/kênh cụ thể trong UI
3. **Context-aware chat**: Chat trong tab nào → AI chỉ trả lời dựa data của tab đó
4. **SE Asia pricing**: Chi phí Gemini API thấp (~$0.01-0.05/query), bundle vào tier, không billing riêng
5. **Bilingual**: Trả lời bằng tiếng Việt/English/ID/MS/TH theo locale user

---

## 5. TÍNH NĂNG

### 🚀 MVP (Phase 1 — ưu tiên cao):

- [ ] **F1. Morning Brief** (Tab Tổng quan)
  - Auto-generate 5 bullet khi mở dashboard
  - "What changed / What to do / Why / Risk days / Revenue at risk"
  - Dựa trên: OTB, supply, pickup 7d, forecast, cancellations
  - Trigger: auto khi mở tab, hoặc nút "🤖 Tóm tắt hôm nay"

- [ ] **F2. Ask-the-Report Q&A** (Cả 3 tabs)
  - Chat input ở bottom hoặc side panel
  - Giới hạn scope: chỉ trả lời dựa trên dataset của tab đang mở
  - Ví dụ: "Tuần tới ngày nào rủi ro nhất?" → AI trả lời + highlight row
  - No-hallucination: nếu thiếu data → nói rõ "chưa đủ dữ liệu" + gợi ý action

- [ ] **F3. Explain-this-row** (Tab Giá đề xuất)
  - Click 1 ngày → AI giải thích 3 dòng reasoning
  - Logic: Anchor × OCC multiplier × DOW × lead-time factor
  - Cảnh báo nếu ADR/anchor lệch >30%
  - Nút "Explain" inline trên bảng giá

### 🎁 Phase 2 (Nice-to-have):

- [ ] **F4. Chart-to-Action** (Tab Phân tích)
  - AI "dịch" chart thành hành động cụ thể
  - VD: Lead-time TB 88.1 ngày → "Nên tăng Early Bird discount cho booking >60 ngày"
  - VD: Pickup tăng + cancellations cao → "Cảnh báo booking ảo"

- [ ] **F5. Batch Decision Helper** (Tab Giá đề xuất)
  - AI suggest "Approve all" hoặc "Hold 3 ngày cần xem lại"
  - Hiển thị confidence score cho từng gợi ý
  - GM vẫn bấm Accept/Override

- [ ] **F6. Weekly Digest** (Email/Telegram)
  - Gửi tóm tắt tuần: trend, top risks, top opportunities
  - Dựa trên data 7 ngày, so sánh STLY

### 💭 Backlog (Cân nhắc):

- [ ] **F7. Competitor Intelligence Integration** — Kết hợp Rate Shopper data
- [ ] **F8. What-if Simulator** — "Nếu tăng giá 10% ngày X thì dự kiến ảnh hưởng?"
- [ ] **F9. Voice Assistant** — Hỏi bằng giọng nói (mobile)

---

## 6. ĐÁNH GIÁ KỸ THUẬT

### ⏱️ Độ phức tạp:

| Feature | Độ khó | Thời gian | Ghi chú |
|---------|--------|-----------|---------|
| F1. Morning Brief | 🟢 Dễ | 2-3 ngày | Structured prompt + existing KPI data |
| F2. Q&A Chat | 🟡 Trung bình | 5-7 ngày | Context injection + guardrails + UI |
| F3. Explain-this-row | 🟢 Dễ | 2-3 ngày | Prompt template + existing pricing logic |
| F4. Chart-to-Action | 🟡 Trung bình | 3-5 ngày | Interpretation layer + action mapping |
| F5. Batch Decision | 🟡 Trung bình | 3-4 ngày | Confidence scoring + UI approve flow |
| F6. Weekly Digest | 🟢 Dễ | 2 ngày | Cron + email/Telegram template |

### 💰 Chi phí Gemini API:

| Model | Input | Output | Ước tính/hotel/ngày |
|-------|-------|--------|-------------------|
| Gemini 2.0 Flash | $0.10/1M tokens | $0.40/1M tokens | ~$0.02-0.10 |
| Gemini 2.5 Pro | $1.25/1M tokens | $10.00/1M tokens | ~$0.15-0.50 |

> **Recommend:** Dùng **Gemini 2.0 Flash** cho MVP (~$1-3/hotel/tháng). Upgrade Pro cho complex queries.

### ⚠️ Rủi ro và Guardrails:

| Rủi ro | Mitigation |
|--------|-----------|
| Hallucination (bịa số) | System prompt bắt buộc trích dẫn data, validate output |
| Latency (chậm) | Dùng Flash model, cache common queries, streaming response |
| Cost escalation | Rate limit per hotel, quota per tier |
| Privacy (data leak) | Dùng Gemini API (không training on data), không gửi PII |
| User trust | Luôn show "Based on data from [date]", link to source row |

---

## 7. ĐIỀU KIỆN "ĂN TIỀN" (từ BA Team)

✅ **Grounded output**: Mọi kết luận kèm dẫn chứng (OTB, supply, pace, forecast)
✅ **Explainable**: Dùng đúng logic đã có (Anchor × OCC × DOW × lead-time)
✅ **No-hallucination**: Thiếu data → nói rõ + gợi ý action
✅ **Copilot, not autopilot**: AI không tự đổi giá, chỉ recommend

---

## 8. KIẾN TRÚC KỸ THUẬT (High-level)

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │Tab 1    │ │Tab 2     │ │Tab 3         │ │
│  │Overview │ │Analytics │ │Pricing       │ │
│  │         │ │          │ │              │ │
│  │[Brief]  │ │[Q&A]    │ │[Explain Row] │ │
│  │[Q&A]   │ │[Chart→Act]│ │[Batch+Q&A]  │ │
│  └────┬────┘ └────┬─────┘ └──────┬───────┘ │
│       │           │              │          │
│       └───────────┼──────────────┘          │
│                   ▼                          │
│        ┌─────────────────┐                  │
│        │  AI Chat Panel  │  ← floating/side │
│        │  (shared UI)    │                  │
│        └────────┬────────┘                  │
└─────────────────┼───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           /api/ai/copilot (POST)            │
│                                              │
│  1. Receive: { tab, question, context }     │
│  2. Build prompt:                            │
│     - System: "You are an RM copilot..."    │
│     - Context: inject tab-specific data     │
│     - Guardrails: no hallucination rules    │
│  3. Call Gemini API (streaming)              │
│  4. Validate output (citations check)       │
│  5. Return: { answer, citations, actions }  │
└─────────────────────────────────────────────┘
```

---

## 9. BƯỚC TIẾP THEO

> **Verdict: RẤT THUYẾT PHỤC — Blue Ocean opportunity**

1️⃣ `/plan` → Lên spec chi tiết cho MVP Phase 1 (F1 + F2 + F3)
2️⃣ `/design` → Thiết kế API schema + prompt engineering
3️⃣ `/code` → Implement (ước tính 7-10 ngày cho Phase 1)
