# Supabase Setup Checklist

## ✅ What You've Done
- [x] Created Supabase project
- [x] Added credentials to environment variables

## 📝 Next Steps

### 1. Verify `.env.local` Location

Your `.env.local` file **MUST** be in `apps/web/` directory (not root).

**Check:**
- ✅ File location: `apps/web/.env.local`
- ✅ Contains:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
  ```

**If it's in root**, move it:
```bash
# Windows PowerShell
Move-Item .env.local apps/web/.env.local
```

### 2. Run the SQL Schema in Supabase

**In Supabase Dashboard:**

1. Go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `apps/web/supabase/schema.sql` in your editor
4. **Copy the ENTIRE file** (all 143 lines)
5. **Paste into Supabase SQL Editor**
6. Click **"Run"** (or `Ctrl+Enter`)
7. Should see: ✅ "Success. No rows returned"

**Verify:**
- Go to **Table Editor**
- Should see 4 tables: `gift_card_items`, `orders`, `order_items`, `gift_cards`
- Click `gift_card_items` → Should see 20 products

### 3. Test the Connection

**Restart your dev server:**
```bash
cd apps/web
npm run dev
```

**Test in browser:**
1. Open http://localhost:3000
2. Connect wallet
3. Ask agent: **"Search for available options"**
4. Check terminal logs - should see:
   ```
   [DB] ✅ Retrieved 20 items from database
   ```

### 4. Troubleshooting

**If you see: `[DB] ⚠️ Supabase credentials not configured`**
- ✅ Check `.env.local` is in `apps/web/` (not root)
- ✅ Restart dev server (env vars load on startup)
- ✅ Check variable names are exact (case-sensitive)

**If you see: `Table does not exist`**
- ✅ Run the SQL schema in Supabase SQL Editor
- ✅ Check for errors in SQL Editor

**If agent returns empty results:**
- ✅ Check `gift_card_items` table has products
- ✅ Verify `is_active = true` for products

## 🎯 Success Indicators

You'll know it's working when:
- ✅ Server logs show `[DB] ✅ Retrieved X items from database`
- ✅ Agent responds with actual gift card names and prices
- ✅ No errors in server console

---

**Quick Reference:**
- SQL Schema: `apps/web/supabase/schema.sql`
- Detailed Guide: `apps/web/SUPABASE-SETUP.md`
- Env File: `apps/web/.env.local`
