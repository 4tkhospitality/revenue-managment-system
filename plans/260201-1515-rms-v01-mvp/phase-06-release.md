# Phase 06: Release & Handover (V01 PILOT-READY)
Status: ⬜ Pending
Dependencies: Phase 05
Stack: Docker + Shell Scripts

## Objective
Chuẩn bị cho Pilot 14 ngày. Đảm bảo hệ thống ổn định, dễ cài đặt và backup.

## Requirements
### SCOPE LOCK (V01)
- [ ] **E2E Test**: Import → OTB → Forecast → Price → Decision → Export.
- [ ] **One-click Run**: `docker-compose` chuẩn.
- [ ] **Data Safety**: Script Backup/Restore đơn giản.
- [ ] **User Guide**: Hướng dẫn cho GM (Non-tech).

## Implementation Steps

### 1. Final Polish
- [ ] Error Boundary & Toasts cho các lỗi thường gặp (CSV lỗi, Missing Reason).
- [ ] Đảm bảo flow không bị crash giữa chừng.

### 2. Deployment Prep
**One-click Command:**
```bash
docker-compose up -d
npm run prisma:migrate
npm run seed
npm run dev
```

**Utility Scripts:**
- `scripts/setup_pilot.sh`: Reset DB, Migrate, Seed.
- `scripts/backup_db.sh`: `pg_dump`.
- `scripts/restore_db.sh`: `psql`.

### 3. Documentation
- `docs/USER_GUIDE.md`: Hướng dẫn import, xem giá, và export file (Kèm screenshots nếu có).

## Files to Create/Modify
- `docs/USER_GUIDE.md`
- `scripts/setup_pilot.sh`
- `scripts/backup_db.sh`
- `scripts/restore_db.sh`
- `docker-compose.yml` (Review final)

## Validation: Pilot Readiness Checklist
- [ ] DB reset & seed thành công
- [ ] Import CSV < 5s
- [ ] OTB đúng cho ngày hôm nay
- [ ] Forecast sinh ra data
- [ ] Pricing engine chạy & ra recommendations
- [ ] Accept / Override lưu decision
- [ ] Export file import được vào PMS
- [ ] Backup script test OK

---
**GO-LIVE DECISION**: Chỉ Go-Live khi Checklist trên đạt 100%.
