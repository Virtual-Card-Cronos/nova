# Supabase Setup Guide

This guide will help you set up your Supabase database and deploy the gift card schema.

## Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Project Name**: `novaagent` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to initialize

## Step 2: Get Your Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API** (in the left sidebar)
2. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co` (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key**: For client-side access (optional)
   - **service_role key**: For server-side access (this is your `SUPABASE_SERVICE_ROLE_KEY`)

⚠️ **Important**: The `service_role` key has admin access. Never expose it in client-side code!

## Step 3: Run the Database Schema

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open the file: `apps/web/supabase/schema.sql`
4. Copy the **entire contents** of the file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
7. You should see: "Success. No rows returned"

### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run the schema
supabase db push --file apps/web/supabase/schema.sql
```

## Step 4: Verify the Schema

After running the SQL:

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - `gift_card_items` (with 20+ products)
   - `orders`
   - `order_items`
   - `gift_cards`

3. Click on `gift_card_items` table
4. You should see 20 gift card products with:
   - Names (Amazon, Steam, etc.)
   - Prices
   - Inventory counts
   - Image URLs

## Step 5: Set Environment Variables

Create or update `apps/web/.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: For client-side access (if needed)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 6: Test the Connection

1. Start your dev server:
   ```bash
   cd apps/web
   npm run dev
   ```

2. Check the server logs - you should see:
   - `[DB] ✅ Retrieved X items from database` (when agent searches)

3. Test in the UI:
   - Ask the agent: "Search for available options"
   - It should return gift cards from your database

## Troubleshooting

### "Database not configured" Error

- Make sure `.env.local` is in `apps/web/` directory (not root)
- Restart your dev server after adding environment variables
- Check that variable names match exactly (case-sensitive)

### "Table does not exist" Error

- Make sure you ran the entire `schema.sql` file
- Check the Supabase SQL Editor for any errors
- Verify tables exist in **Table Editor**

### "Permission denied" Error

- Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key) for server-side operations
- Check that the service role key is correct in your `.env.local`

### No Products Showing

- Check the `gift_card_items` table in Supabase
- Verify the INSERT statements ran successfully
- Check that `is_active = true` for products

## Quick Verification Query

Run this in Supabase SQL Editor to verify everything:

```sql
-- Check products
SELECT COUNT(*) as total_products FROM gift_card_items WHERE is_active = true;

-- Check a sample product
SELECT name, brand, price, inventory_count, image_url 
FROM gift_card_items 
WHERE brand = 'Amazon' 
LIMIT 1;

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('decrement_inventory', 'update_updated_at_column');
```

Expected results:
- `total_products`: Should be 20 or 21
- Sample product: Should show Amazon gift card with price and inventory
- Functions: Should show both functions

## Next Steps

Once your database is set up:

1. ✅ Test the agent: "Search for available options"
2. ✅ Test purchase flow: "Buy a $10 Steam card"
3. ✅ Check inventory decrements after purchase
4. ✅ Verify gift cards are issued in the `gift_cards` table

## Database Management

### View All Products
```sql
SELECT name, brand, price, inventory_count, is_active 
FROM gift_card_items 
ORDER BY brand;
```

### Update Inventory
```sql
UPDATE gift_card_items 
SET inventory_count = 100 
WHERE brand = 'Steam';
```

### Add New Product
```sql
INSERT INTO gift_card_items (name, description, brand, price, currency, image_url, inventory_count, is_active)
VALUES (
  'New Brand Gift Card',
  'Description here',
  'NewBrand',
  5000, -- $50.00 in cents
  'USD',
  'https://example.com/image.png',
  50,
  true
);
```

### Check Orders
```sql
SELECT o.id, o.user_address, o.total_amount, o.status, o.created_at
FROM orders o
ORDER BY o.created_at DESC
LIMIT 10;
```

## Security Notes

- ✅ Never commit `.env.local` to git (it's in `.gitignore`)
- ✅ Use `SUPABASE_SERVICE_ROLE_KEY` only in server-side code
- ✅ Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side if needed (with Row Level Security)
- ✅ Consider enabling Row Level Security (RLS) for production

## Need Help?

- Supabase Docs: https://supabase.com/docs
- SQL Editor Guide: https://supabase.com/docs/guides/database/overview
- Database Functions: https://supabase.com/docs/guides/database/functions
