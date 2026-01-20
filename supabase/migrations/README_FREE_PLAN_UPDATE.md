# Free Plan Update - Database Migrations

## Overview
This document explains the database migrations created to restrict the Free plan and fix data consistency issues.

## Migrations to Apply (in order)

### 1. `20260120000001_update_free_plan_credits_to_10.sql`
**Purpose:** Update Free plan credits from 30 to 10

**Changes:**
- Sets default `credits_remaining` to 10
- Updates signup trigger for new users (Free: 10, Pro: 9999)
- Updates existing Free users to max 10 credits

**Status:** ✅ Applied

---

### 2. `20260120000002_validate_and_fix_existing_users.sql`
**Purpose:** Validate and fix ALL existing users in database

**What it fixes:**
- ✅ Free users with > 10 credits → Set to 10
- ✅ Inconsistent `plan` vs `subscription_tier` → Sync them
- ✅ Free users with active trial → Upgrade to Pro
- ✅ Pro users with < 9999 credits → Set to 9999 (unlimited)
- ✅ **Specific fix for agnysmarques@ymail.com**

**Creates audit log:** `migration_audit_log` table to track all changes

**How to apply:**
```sql
-- Run in Supabase SQL Editor
-- Copy and paste the entire migration file
```

---

### 3. `20260120000003_fix_signup_trigger_add_whatsapp.sql`
**Purpose:** Fix signup trigger to save WhatsApp field

**What it fixes:**
- WhatsApp field was being sent from frontend but not saved
- Updates `handle_new_user()` trigger to extract and save whatsapp from user metadata

**Status:** 🔴 **MUST APPLY** - New users won't have whatsapp saved without this

---

## Database Schema Issues

### Redundant Columns
The `profiles` table has **two columns storing the same data**:
- `plan` (text) - Original column
- `subscription_tier` (text) - Added later

**Current behavior:**
- Both columns are being used in different parts of the codebase
- Migration `20260120000002` ensures they stay in sync
- **Recommendation:** Consolidate to `subscription_tier` only in future refactor

### Column Usage in Code
- `plan`: Used in 7 files (14 occurrences)
- `subscription_tier`: Used in 5 files (12 occurrences)

---

## How Login Validation Works

### After Applying Migrations

**Every time a user logs in:**
1. ✅ User data is fetched from `profiles` table
2. ✅ Database ensures `plan` === `subscription_tier` (via migration 002)
3. ✅ Credits are correct:
   - Free users: max 10 credits
   - Pro users: 9999 credits (unlimited)
   - Trial users: 9999 credits (unlimited)

**No additional login checks needed** - data is already correct in database.

---

## Expected Results After Applying All Migrations

### For Free Users (no active trial)
- ✅ `plan` = 'free'
- ✅ `subscription_tier` = 'free'
- ✅ `credits_remaining` = 10 (max)
- ✅ `trial_status` = NULL or 'expired'
- ✅ Won't see history box on dashboard
- ✅ Limited to 500 characters per formatting

### For Pro Users
- ✅ `plan` = 'pro'
- ✅ `subscription_tier` = 'pro'
- ✅ `credits_remaining` = 9999 (unlimited)
- ✅ See full history on dashboard
- ✅ Up to 5000 characters per formatting

### For Trial Users (7-day trial active)
- ✅ `plan` = 'pro'
- ✅ `subscription_tier` = 'pro'
- ✅ `credits_remaining` = 9999 (unlimited)
- ✅ `trial_status` = 'active'
- ✅ `trial_end_date` = 7 days from signup
- ✅ After trial expires → automatically downgrade to Free (10 credits)

### For New Signups (after migration 003)
- ✅ WhatsApp field is saved correctly
- ✅ Start with 7-day Pro trial (9999 credits)
- ✅ After trial → downgrade to Free (10 credits)

---

## Troubleshooting

### User still shows 9999 credits but should be Free
**Solution:** Apply migration `20260120000002` which fixes this specifically

### WhatsApp not being saved for new users
**Solution:** Apply migration `20260120000003` to fix signup trigger

### History box still appears for Free users
**Solution:** Frontend fix already applied in Dashboard.tsx

### Free user sees more than 10 credits
**Solution:** Apply migration `20260120000002` to fix existing users

---

## Testing Checklist

After applying all migrations:

- [ ] Create new test user → should have 7-day trial (9999 credits)
- [ ] Check that WhatsApp is saved in database
- [ ] Manually set test user to 'free' → should have max 10 credits
- [ ] Free user shouldn't see "Formatações Recentes" box on dashboard
- [ ] Free user limited to 500 characters in formatter
- [ ] Check agnysmarques@ymail.com user → should have 10 credits if not on trial

---

## Migration Commands

### Apply Single Migration
```sql
-- Copy entire content of migration file
-- Paste in Supabase Dashboard → SQL Editor → Run
```

### Check Migration Status
```sql
-- See audit log of changes
SELECT * FROM migration_audit_log
ORDER BY created_at DESC;
```

### Verify User Data
```sql
-- Check specific user
SELECT
  email,
  plan,
  subscription_tier,
  credits_remaining,
  trial_status,
  whatsapp
FROM profiles
WHERE email = 'agnysmarques@ymail.com';

-- Check all Free users
SELECT
  email,
  plan,
  subscription_tier,
  credits_remaining
FROM profiles
WHERE plan = 'free' OR subscription_tier = 'free';
```

---

## Notes

- All migrations are **idempotent** - safe to run multiple times
- Migration 002 creates audit log for tracking changes
- Redundant columns (`plan` vs `subscription_tier`) should be consolidated in future
