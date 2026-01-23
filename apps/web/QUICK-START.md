# Quick Start - Supabase Setup

## ✅ Step 1: You've Already Done This!
- [x] Created Supabase project
- [x] Added credentials to `.env.local`

## 📋 Step 2: Run the Database Schema

### In Supabase Dashboard:

1. **Open SQL Editor**
   - Go to your Supabase project dashboard
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"**

2. **Copy the Schema**
   - Open the file: `apps/web/supabase/schema.sql`
   - Copy **ALL** the contents (Ctrl+A, Ctrl+C)

3. **Paste and Run**
   - Paste into the SQL Editor
   - Click **"Run"** button (or press `Ctrl+Enter`)
   - Wait for "Success. No rows returned" message

4. **Verify Tables Created**
   - Go to **"Table Editor"** in left sidebar
   - You should see 4 tables:
     - ✅ `gift_card_items`
     - ✅ `orders`
     - ✅ `order_items`
     - ✅ `gift_cards`

5. **Check Products**
   - Click on `gift_card_items` table
   - You should see 20 gift card products
   - Each should have: name, brand, price, inventory_count, image_url

## 🧪 Step 3: Test the Connection

1. **Restart your dev server** (if running):
   ```bash
   # Stop current server (Ctrl+C)
   cd apps/web
   npm run dev
   ```

2. **Test in the UI**:
   - Open http://localhost:3000
   - Connect your wallet
   - Ask the agent: **"Search for available options"**
   - Check server logs - you should see:
     ```
     [DB] ✅ Retrieved 20 items from database
     ```

3. **Check for Errors**:
   - If you see `[DB] ⚠️ Supabase credentials not configured`:
     - Make sure `.env.local` is in `apps/web/` directory
     - Restart the dev server
   - If you see `Table does not exist`:
     - Go back to Step 2 and run the SQL schema

## ✅ Verification Checklist

- [ ] SQL schema ran successfully in Supabase
- [ ] 4 tables visible in Table Editor
- [ ] 20 products in `gift_card_items` table
- [ ] `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Dev server restarted after adding env variables
- [ ] Agent can search for gift cards (no errors in logs)

## 🐛 Common Issues

**"Database not configured"**
- ✅ Check `.env.local` is in `apps/web/` (not root)
- ✅ Variable names are exact: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Restart dev server

**"Table does not exist"**
- ✅ Run the SQL schema in Supabase SQL Editor
- ✅ Check for errors in SQL Editor output

**"No products found"**
- ✅ Check `gift_card_items` table in Supabase
- ✅ Verify INSERT statements ran (should have 20 rows)

## 🎯 Next: Test a Purchase

Once everything works:

1. Ask agent: **"Buy a $10 Steam card"**
2. Complete the x402 payment
3. Check Supabase:
   - `orders` table should have a new order
   - `gift_cards` table should have issued gift card
   - `gift_card_items` inventory should decrease

---

**Need help?** Check `apps/web/SUPABASE-SETUP.md` for detailed guide.
