USE farmproduce;

-- Add quantity_label to products (for text like "10 crates")
ALTER TABLE products ADD COLUMN quantity_label VARCHAR(60);
