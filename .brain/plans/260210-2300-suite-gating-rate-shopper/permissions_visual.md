# 🗺️ Phân Quyền Hệ Thống (Mới)

Dưới đây là sơ đồ phân quyền **dự kiến** sau khi Refactor theo yêu cầu của anh.
Mô hình kế thừa: Gói cao hơn bao gồm tất cả tính năng của gói thấp hơn.

```mermaid
graph TD
    %% Define Nodes
    STD[<b>STANDARD</b><br/><i>(Free / Tiêu chuẩn)</i><br/>----<br/>Calculator<br/>Promo Stacking]
    
    SUP[<b>SUPERIOR</b><br/><i>(Starter)</i><br/>----<br/>Daily Actions<br/>Export Excel<br/>Rate Calendar]
    
    DLX[<b>DELUXE</b><br/><i>(Growth)</i><br/>----<br/>Analytics cơ bản<br/>Guardrails<br/>Decision Log<br/>Pickup Pace]
    
    STE[<b>SUITE</b><br/><i>(Pro / Enterprise)</i><br/>----<br/>🔐 <b>Rate Shopper (So Sánh Giá)</b><br/>Advanced Analytics<br/>Multi-property<br/>API Import]

    %% Define Edges (Inheritance)
    STD --> SUP
    SUP --> DLX
    DLX --> STE

    %% Styling
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef suite fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef rateShopper color:#dc2626,font-weight:bold;

    class STE suite;
```

## 📋 Chi tiết Tính năng (Feature Matrix)

| Feature Key | Mô tả | STANDARD | SUPERIOR | DELUXE | SUITE |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `pricing_calc` | Tính giá NET → BAR | ✅ | ✅ | ✅ | ✅ |
| `promo_stacking` | Cộng dồn khuyến mãi | ✅ | ✅ | ✅ | ✅ |
| `daily_actions` | Đề xuất tác vụ ngày | ❌ | ✅ | ✅ | ✅ |
| `export_excel` | Xuất file Excel | ❌ | ✅ | ✅ | ✅ |
| `guardrails` | Kiểm soát giá trần/sàn | ❌ | ❌ | ✅ | ✅ |
| `decision_log` | Lịch sử thay đổi giá | ❌ | ❌ | ✅ | ✅ |
| `basic_analytics` | Báo cáo cơ bản | ❌ | ❌ | ✅ | ✅ |
| `rate_shopper_addon` | **So Sánh Giá đối thủ** | ❌ | ❌ | ❌ | ✅ |
| `multi_property` | Quản lý chuỗi | ❌ | ❌ | ❌ | ✅ |

> [!NOTE]
> **Thay đổi quan trọng**: Feature `rate_shopper_addon` được chuyển độc quyền cho gói **SUITE**.
