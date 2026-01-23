-- Quick verification queries to check if schema was created
-- Run these in Supabase SQL Editor after running the main schema

-- Check if tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('gift_card_items', 'orders', 'order_items', 'gift_cards')
ORDER BY table_name;

-- Check product count
SELECT COUNT(*) as total_products FROM gift_card_items;

-- Check sample products
SELECT name, brand, price, inventory_count, is_active 
FROM gift_card_items 
ORDER BY brand 
LIMIT 5;

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('decrement_inventory', 'update_updated_at_column');

-- Check if triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%';
