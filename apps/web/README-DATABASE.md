# Database Setup Guide

This project uses **Supabase** (PostgreSQL) or **Neon** for gift card inventory management with automatic inventory tracking.

## Quick Setup

### Option 1: Supabase (Recommended)

1. **Create a Supabase project**:
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and API keys

2. **Run the database schema**:
   - Go to your Supabase dashboard → SQL Editor
   - Copy and paste the contents of `apps/web/supabase/schema.sql`
   - Execute the SQL script
   - This creates all tables, functions, and inserts 20 initial gift card products

3. **Set environment variables**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### Option 2: Neon (PostgreSQL)

1. **Create a Neon project**:
   - Go to https://neon.tech
   - Create a new project
   - Get your connection string

2. **Run the database schema**:
   - Use the Neon SQL Editor or connect via psql
   - Copy and paste the contents of `apps/web/supabase/schema.sql`
   - Execute the SQL script

3. **Set environment variables**:
   ```bash
   # For Neon, you can use the connection string directly
   DATABASE_URL=postgresql://user:password@host/database
   # Or use Supabase client with Neon's Postgres endpoint
   NEXT_PUBLIC_SUPABASE_URL=your_neon_endpoint
   SUPABASE_SERVICE_ROLE_KEY=your_neon_password
   ```

## Database Schema

The schema includes:

- **`gift_card_items`**: Product catalog with inventory tracking
- **`orders`**: Purchase orders with transaction hashes
- **`order_items`**: Order line items
- **`gift_cards`**: Issued gift card codes

### Key Features

1. **Automatic Inventory Decrement**: 
   - The `decrement_inventory()` function ensures atomic inventory updates
   - Prevents overselling when multiple purchases happen simultaneously

2. **Transaction Safety**:
   - Orders are created in a transaction
   - If inventory decrement fails, the order is marked as failed
   - No partial orders are created

3. **Initial Data**:
   - 20 gift card products are automatically inserted
   - Each product has initial inventory counts

## Environment Variables

Add to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: For client-side access
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## How Inventory Works

1. **When a user purchases a gift card**:
   - `createOrder()` is called with item ID and quantity
   - The `decrement_inventory()` database function is called
   - Inventory is checked and decremented atomically
   - If insufficient inventory, an error is thrown
   - Order status is updated to `completed` or `failed`

2. **Inventory is tracked per item**:
   - Each gift card item has an `inventory_count` field
   - When inventory reaches 0, the item can still be queried but purchases will fail
   - You can manually update inventory via Supabase dashboard or SQL

## Testing

After setup, test the database:

```bash
# Start your dev server
npm run dev

# The agent will automatically use the database
# Try: "Search for available options"
# Or: "Find Steam gift cards"
```

## Manual Inventory Management

You can update inventory via SQL:

```sql
-- Increase inventory for a specific item
UPDATE gift_card_items 
SET inventory_count = inventory_count + 10 
WHERE brand = 'Steam';

-- Set inventory for a specific item
UPDATE gift_card_items 
SET inventory_count = 50 
WHERE id = 'item-uuid-here';

-- Check current inventory
SELECT name, brand, price, inventory_count 
FROM gift_card_items 
WHERE is_active = true 
ORDER BY brand;
```

## Troubleshooting

**Error: "Database not configured"**
- Make sure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check that your `.env.local` file is in `apps/web/` directory

**Error: "Gift card item not found"**
- Run the schema SQL to create tables and insert initial data
- Check that items exist in the `gift_card_items` table

**Error: "Insufficient inventory"**
- Check current inventory: `SELECT * FROM gift_card_items WHERE id = 'your-item-id'`
- Increase inventory if needed (see Manual Inventory Management above)
