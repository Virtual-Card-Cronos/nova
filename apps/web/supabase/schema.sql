-- NovaAgent Gift Card Database Schema
-- Compatible with Supabase (PostgreSQL) and Neon

-- Gift Card Items Table
CREATE TABLE IF NOT EXISTS gift_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL, -- Price in cents (e.g., 5000 = $50.00)
  currency VARCHAR(10) DEFAULT 'USD',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  inventory_count INTEGER DEFAULT 0, -- Available quantity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(255) NOT NULL, -- Wallet address
  recipient_email VARCHAR(255),
  transaction_hash VARCHAR(255), -- Blockchain transaction hash
  total_amount INTEGER NOT NULL, -- Total in cents
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gift_card_item_id UUID NOT NULL REFERENCES gift_card_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase INTEGER NOT NULL, -- Price at time of purchase (in cents)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift Cards Table (Issued gift cards)
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gift_card_item_id UUID NOT NULL REFERENCES gift_card_items(id) ON DELETE RESTRICT,
  code VARCHAR(255) UNIQUE NOT NULL, -- Gift card redemption code
  balance INTEGER NOT NULL, -- Balance in cents
  currency VARCHAR(10) DEFAULT 'USD',
  state VARCHAR(50) DEFAULT 'active', -- active, redeemed, void, expired
  recipient_email VARCHAR(255),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  redeemed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_card_items_brand ON gift_card_items(brand);
CREATE INDEX IF NOT EXISTS idx_gift_card_items_active ON gift_card_items(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_address ON orders(user_address);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_order_id ON gift_cards(order_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_gift_card_items_updated_at
  BEFORE UPDATE ON gift_card_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to decrement inventory (with check)
CREATE OR REPLACE FUNCTION decrement_inventory(
  item_id UUID,
  quantity_to_decrement INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_inventory INTEGER;
BEGIN
  -- Get current inventory
  SELECT inventory_count INTO current_inventory
  FROM gift_card_items
  WHERE id = item_id AND is_active = true;
  
  -- Check if enough inventory
  IF current_inventory IS NULL THEN
    RAISE EXCEPTION 'Gift card item not found or inactive';
  END IF;
  
  IF current_inventory < quantity_to_decrement THEN
    RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', current_inventory, quantity_to_decrement;
  END IF;
  
  -- Decrement inventory
  UPDATE gift_card_items
  SET inventory_count = inventory_count - quantity_to_decrement,
      updated_at = NOW()
  WHERE id = item_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Insert initial gift card items (20 products with real brand images from marketplace)
INSERT INTO gift_card_items (name, description, brand, price, currency, image_url, inventory_count, is_active) VALUES
  ('Amazon.com Gift Card', 'Redeemable for millions of items across the Amazon marketplace', 'Amazon', 5000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDV8W_36nqcrDsGZQ7MBodE7Y7UnYaC8etScL6YXKtUi-XRsa6INzoyJVXfq_GxcoRx6-VKtykkdhe7R4Rx_nifpCfE-AHsXN39LmFIZAa_CzQw1hi-KaCix9n4ExE3HsNP4M0ZJ04O1_tW04K5NxGJHN-RdOGuefqemkcmdDSMvM43wAnjraFG72hW3cDo1p1l1RwQEfiXOSKUcMbJ1tQXKuNisodZ7ODxE1NYEwYXxj8gfsq29pGiLcLtaNjQOmHkS2MyKEIf280O', 100, true),
  ('Steam Gift Card', 'Digital gift card for Steam. Buy games, software, and more', 'Steam', 2500, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYmbrJECUvWTVTglp_eOpVDNxk-whwoYjrY-UZRQKI4A-axzlR1qbBuX70kOmeD-nzIoTFRdni03NujakbwMMn14mKwC8RkJWvco-BohbcJgeTnRN31veQMAJyYBuEdNcCimbteL3D-TA4OIZdIPY8cNncGBn-UmmAsYNTlajIAI9BOz4-kPWBtA4tsPQwXA3Dl78q-M5Xw8oul3oMtrvFa_-hMkbTTYl28kcmD8gGqCcK3XG-8B4pb4_aspe7BmuuL2SL4LI7GZa9', 50, true),
  ('Steam Gift Card', 'Digital gift card for Steam. Buy games, software, and more', 'Steam', 1000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYmbrJECUvWTVTglp_eOpVDNxk-whwoYjrY-UZRQKI4A-axzlR1qbBuX70kOmeD-nzIoTFRdni03NujakbwMMn14mKwC8RkJWvco-BohbcJgeTnRN31veQMAJyYBuEdNcCimbteL3D-TA4OIZdIPY8cNncGBn-UmmAsYNTlajIAI9BOz4-kPWBtA4tsPQwXA3Dl78q-M5Xw8oul3oMtrvFa_-hMkbTTYl28kcmD8gGqCcK3XG-8B4pb4_aspe7BmuuL2SL4LI7GZa9', 50, true),
  ('Roblox Gift Card', 'Get Robux to purchase items, accessories, and avatar upgrades', 'Roblox', 1000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD96v2OrWtN-gJ7juK9hUJRuMpcXvXvtNFLf1FZ06I4SHpt0ehGUcFoVZQUJNuRHSvel8AkH6BJ2EYcP5X8hnZAlhU3q368GaIDBYWyYjwQZe-wrE-GOwrXy9eUA16r7QXUtD9m6uujLLyQ2KCLussIjcDiVs7MetOSVI7-7rbuGd2YU5hx3MzGPw5RdNU__PvkX6Fv4T7pFwM1nAueUnhl39deVp_yt68Ed2AjV5w_ehznMhF1epguPtVjLNVsD8Wv9mBb923Ny70p', 75, true),
  ('Starbucks Gift Card', 'Enjoy your favorite coffee, tea, and treats at Starbucks locations', 'Starbucks', 2500, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuASRs9jLqxPWUd3CK8Wm7R40HRFxtzMYEs6Pu6B_RmRsSDkFWvba3myiVT71I-Y0uFG5XbM1fP5p1u9XxIAFg7UsJtcMN5lO0UnZftYxZPq3PxTji6a84WaJUZT6-0dF1E3LGL-SPA9as8h8Jdfk2W_pnztPe2lhGITWLIbnEaGChIavEdeabavUhEg1ysdiKeJUz2sx4tGw2jI7Ykj0jzU6hy7LBn8eD7jHz3rQzeUhofGZPhGb8XyjnOdH1pxN7rfyDy2wK2XDpPT', 200, true),
  ('Netflix Gift Card', 'Redeem for Netflix subscription. Watch unlimited movies and TV shows', 'Netflix', 3000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQHgA17CQfJWKt5yZvxKC-EYBXyjP2yGXQyILrrqsKuJfSFHi6DJn9u3PgMgKppFsp2WLi0eRR7XtjF-ld1E-UxHL1Z-J33SSyMT7d0yCDHrSO3obqZ6BiX7bEPRiW57GAPzmaBEGzXhZx7pCHP4pYylIk0OKcpsxD8ae0pZ1G5JrkclH2E2Lwd2H8qNAE1YcV6e3SBbILY4eZTxmo4rPqjRbid08AMgc0rhrvloV2jDX6fbZGpINtRebpJ6whYqlWQtX8yNuXKqil', 30, true),
  ('Spotify Gift Card', 'Premium music streaming. Ad-free listening, offline downloads', 'Spotify', 999, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyk3fdeYKgisosVsYkqX76_lDzhaQGCi9npIiLWXzsuEUKB4BxQjdvxxlwYljwOvP6J7HOjy1Elb09r0Ie6c06BnURo1Bzu0qW_k3lFC3mofbRRLZvtJn8tHy3Cm1Ux--IkWxNox_X_m5otFgbiyVwnR6tff_U3uJgEnH1-1Ei2Cwcu5Ptj6KiGewsPwIsKHsDxq0qa-7-D4H1XsJcvpYiVCqgskS6fMYI20T-I7O8Xz5n6RvZ1E_f0t99RZ6i5sU-0JPGfAxyPVfI', 100, true),
  ('Uber Gift Card', 'Ride with Uber or order food with Uber Eats', 'Uber', 2500, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDab2mu2vw7MnWDXyAik94FfPHAsDnk6nWL4_cesd_QvZjifcHF5ghG6cqHq3Ym3-LxjfaO75ex5sT_hn76mjdliBPdJoHHuPmgXyX4y84s3WSS21TkTfqm2erm0DrhI_h9bmvNj-uVW7zGcI8vefJpkV8KKHVLzGCRHlndYiVP8VPq0RIjgycs95P0xZMBLGACO0zY4nhdL1onL0pf_dMjMKqMYu0oOaZPrUIL9BE3ap3cD9dc5zsVh-lPYMe1NVYcWzArilP3bAM6', 150, true),
  ('Apple Gift Card', 'Redeem for apps, games, music, movies, iCloud storage, and more', 'Apple', 5000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4WSR4anMQ5XJuPWjXOvDqHdZDFaZXA4-jAUM61mxbBKhF2qEQa3GnEKGMcZcEtdi5Rz7lMl-dclMLCRZv9RqO8TtMtZ4x_NYpuKNMd3bpOg6ticfg522Hxa8aStZXaOTJljViRJDMnVqidh8Qi3zx1KUX8sFv3XDFuZBx4WdpKJw7Qxg0xcwFVhecPXuenaBzTfJ9g6MLotfTivxUHXRhEw69qHe0f0YjV07kK_EXvGvZVO9GOKa3ZIv7wtm1-6kltraKsgZidc7F', 40, true),
  ('Google Play Gift Card', 'Buy apps, games, movies, books, and more on Google Play Store', 'Google Play', 2500, 'USD', 'https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg', 60, true),
  ('Xbox Gift Card', 'Purchase games, add-ons, subscriptions, and more for Xbox consoles', 'Xbox', 2500, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkhZrDbH_-_s7DRSFFWEEDYBkeQd-bIkqlQJa2pRy8m4sH2__knn9gbDBc8viC8zrlbX5y1d0NI7ZC4nBMMFbFayQ3fJuzRET254APMwtGlvwGIAfJvJow4in1KRSLATwVRnbRDF78itYgcGosFyQxSh_AaCc4xDMKTfPdCgzQ7Yx_HdMT56OnjG1_CMoPYugmxi6FhrDJ6Csyl5PS7VeABnpQb_fjcTg2xaODM44Br3zg7ZICNjiNLIZkM6vAXRp8Kom5bBETbVoP', 45, true),
  ('PlayStation Store Gift Card', 'Buy games, DLC, movies, and subscriptions for PlayStation', 'PlayStation', 5000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqucOk4knfr5ZUFXa38FoX_l9ROBzk8_9NIrpzyNuZ98SN25UegpkqqnkCbsKZU-p6EB5dRpTqHoq7sX3d1UQ-lhNkMh-xxSL74uC3B2IKlqqNSdPUerhp7UF9_eb3f_G7NzTqia1a5IrR3SottprcJabqXmpGcGifdm8Xf3vyP8LnxKyziIVnBdo5d4Gxka8Ni1UEwGfr9K4qoUbR83QfJiiimBLGYdBQFnCHcZyoXMfSQQiiKzCqp7hT-Fjr6Wp9EqKzLst0rIJq', 35, true),
  ('Nintendo eShop Gift Card', 'Purchase games, DLC, and subscriptions for Nintendo Switch', 'Nintendo', 2000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuANpzprqWmXyf8WtEWrDoeeDk8Y9dy5yrAO4-erihT97oyieI6A-HlAKmBaRgW-hyJqcs8uiRMT5jyZJ0Wed4Rf9fyZ5JEFmtC2ePprtohkDdfE5ciouQjEN4pHzg52ZBySW0somvAHNOYvAW4XosbXeErlnCklz_XZMq4cpjUm_pBTucf6mD8C-VlPDnLmWVS6g0paPJp9IQtWnqqfBA2ejjkhnYNCM5GvwOxoRMAe7EJJ4b6RrIj_7Ux74wEVBikUDbdfSV8RVoPi', 55, true),
  ('Target Gift Card', 'Shop for everything from electronics to home goods at Target', 'Target', 5000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpxDtfP2cM7sIRIM09qMfCtJ-keeLsCxOTM1ZfpII4KLTXs8M2LT_Ep1G1rPAopR57cEfDv2um6xXeVs-aY2gwdWu3wCmAgePB-X3f3oYaxUV9BJYahqFDMFfpjAQjFC7k0i-gKAyNzNMouStaWpEAoyOcm48svxqXFjDOmRFnKyrx6_8gLogP5uex9zMuMqsReju_DfQZhYq2AIeplNK7wWcS0YDto2oCdZuUXU0vQcVNVA3bXyNXnWqJPN_ABIA6um9glrvR2UFJ', 80, true),
  ('Walmart Gift Card', 'Shop for groceries, electronics, clothing, and more at Walmart', 'Walmart', 5000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSXPd-9l6zFZUllCcMmfHwG2FjUMKh5FqrWTAASMDlAVzmSfOxPk-Xx9gzq32dhD1V99KIZ76XfRD0hPrQyzzJjVNegfsOkB0etqAbCQvgQW7rxcoxM8U5sIFLF1EItzHvNA4RjvtL4y6xAj4LnlGfSEFeB3kN3HC3kbOs0t9o1AVUBlgfiBgEYmJqJsJpTAzZ9UPitrzVNOPTUmiDxHsPGyLjEPuExKBVp125BhyHTOrI3ITJ-VMGGx71bAh5NXUrnx6ENyCHl1L6', 90, true),
  ('Best Buy Gift Card', 'Purchase electronics, appliances, computers, and tech accessories', 'Best Buy', 10000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlWEdJnM4bf88crOruhRJp1l2P_3pWUgvE3L1eNE8BwdxA4KfSvDGpItoBRyMGhUhuzL7Oqm8Mk1FyRkXZStkC9e1wkBecj1ZIPibRjO98fwwBP7hCfINrDE6yDEXgao9vsf_4lfH5Di-I7j3HK49j4Qoupt1CqyRNT8P1cvlL_OWX-K2_rUrYCTPDoV6U8ytSkjrHo3727YtYnThanKFdBykkgtDpH__lukPG0aiPZyG8cE8pzXSMM9DI5exFGQsy3TLfA29SKmSt', 25, true),
  ('eBay Gift Card', 'Shop millions of items on eBay. From collectibles to everyday essentials', 'eBay', 2500, 'USD', 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg', 70, true),
  ('Airbnb Gift Card', 'Book unique stays and experiences around the world with Airbnb', 'Airbnb', 10000, 'USD', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiGTINylAbBhEJZNJ9OsaY0Qzwlmq1ZLNFn0q5K1k3d737F3vxmtIDdA_c_3NDy5sskXScLUgb_MPsmPyOX_shNZqmzxjvsKOxcs6X_HPdOnw6vrFmHqPq7RtWQYxe7C1MvWbH0qPwGsFB0v56lQ_YoXIpEuTzxi0_yQgckOnpbR9GwM4xAVREi7bwNbqzGl5czcQ0LASggPpV1rMgnEKtyJSbPEQOgDe3M9aH2n-QS1xUPhqrIP8l99BtBHPqtVOwgVve22ZWJkPo', 20, true),
  ('DoorDash Gift Card', 'Order food delivery from your favorite restaurants with DoorDash', 'DoorDash', 2500, 'USD', 'https://upload.wikimedia.org/wikipedia/commons/a/ad/DoorDash_Logo.svg', 120, true),
  ('Grubhub Gift Card', 'Order food delivery from local restaurants with Grubhub', 'Grubhub', 2000, 'USD', 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Grubhub_logo.svg', 110, true),
  ('Instacart Gift Card', 'Get groceries and household essentials delivered from your favorite stores', 'Instacart', 5000, 'USD', 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Instacart_logo_and_wordmark.svg', 65, true)
ON CONFLICT DO NOTHING;
