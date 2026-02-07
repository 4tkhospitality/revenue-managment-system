# Ops Runbook details

## Deployment
- **Platform**: Vercel (Front/API), Supabase (DB).
- **Migration**:
    - Dev: `npx prisma migrate dev`
    - Prod: `npx prisma migrate deploy` (Part of CI/CD or Manual Pre-deploy).
- **Seeding**:
    - Command: `npm run prisma:seed`
    - Content: Demo Hotel, Super Admin, Default Channels.

## Cron Jobs (Scheduled Tasks)
- **Rate Shopper**: 
    - Endpoint: `/api/cron/rate-shopper`
    - Schedule: Daily/Hourly via Vercel Cron.
- **Forecast/OTB Rebuild**:
    - Triggered on Import completion.
    - Nightly "Cleanup" job (Planned).

## Monitoring
- **Logs**: Vercel Runtime Logs (`console.log`, `console.error`).
- **Errors**: Sentry (Suggested/Planned).
- **Performance**: Vercel Analytics.

## Backup & Restore
- **Supabase**:
    - **PITR** (Point-in-Time Recovery): Enabled by default on Pro plan (7 days).
    - **Daily Backups**: Automatic.
    - **Manual**: `supabase db dump` via CLI.
- **Disaster Recovery**:
    - Restore DB from Supabase UI.
    - Re-deploy App from Vercel Git integration.
