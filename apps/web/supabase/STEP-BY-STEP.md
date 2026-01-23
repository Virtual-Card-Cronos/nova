# Step-by-Step: Running the SQL Schema in Supabase

## 🎯 Goal: Create 4 tables with 20 gift card products

## Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. In the left sidebar, click **"SQL Editor"**
4. Click the **"New query"** button (top right)

## Step 2: Copy the Schema

1. Open the file: `apps/web/supabase/schema.sql` in your code editor
2. Select **ALL** the text (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)

## Step 3: Paste and Run

1. In Supabase SQL Editor, paste the entire schema (Ctrl+V)
2. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
3. Wait a few seconds

## Step 4: Check for Success

You should see one of these messages:

✅ **Success**: "Success. No rows returned" (this is correct!)
❌ **Error**: If you see an error message, note what it says

## Step 5: Verify Tables Were Created

1. In Supabase dashboard, click **"Table Editor"** (left sidebar)
2. You should now see 4 tables:
   - `gift_card_items`
   - `orders`
   - `order_items`
   - `gift_cards`

3. Click on `gift_card_items` table
4. You should see 20 rows (gift card products)

## 🐛 Troubleshooting

### If you see an error:

**Error: "relation already exists"**
- Tables already exist - this is fine! The schema uses `CREATE TABLE IF NOT EXISTS`
- Check Table Editor to see if tables are there

**Error: "permission denied"**
- Make sure you're using the SQL Editor (not trying to run via API)
- You should have full access in the dashboard

**Error: "syntax error"**
- Make sure you copied the ENTIRE file
- Check for any missing semicolons
- Try running sections one at a time (see below)

### If tables still don't appear:

1. **Refresh the Table Editor** (click refresh button)
2. **Check SQL Editor history** - see if the query actually ran
3. **Try running in sections** (see "Running in Sections" below)

## 🔧 Running in Sections (if full schema fails)

If the full schema doesn't work, try running it in parts:

### Part 1: Create Tables
Run just the CREATE TABLE statements (lines 4-55)

### Part 2: Create Indexes
Run the CREATE INDEX statements (lines 57-64)

### Part 3: Create Functions
Run the CREATE FUNCTION statements (lines 66-117)

### Part 4: Insert Products
Run the INSERT statement (lines 119-142)

## ✅ Quick Verification Query

After running the schema, test with this query in SQL Editor:

```sql
SELECT COUNT(*) as product_count FROM gift_card_items;
```

Should return: `product_count: 20` (or 21)

## 📸 What You Should See

After successful run:
- **Table Editor** shows 4 tables
- **gift_card_items** table has 20 rows
- Each product has: name, brand, price, inventory_count, image_url

---

**Still having issues?** Share the error message you see in SQL Editor!
