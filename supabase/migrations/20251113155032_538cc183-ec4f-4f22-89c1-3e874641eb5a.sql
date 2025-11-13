-- Add delivery cost and method columns to transactions table
ALTER TABLE transactions 
ADD COLUMN delivery_cost numeric,
ADD COLUMN delivery_method text;

-- Add comments for clarity
COMMENT ON COLUMN transactions.delivery_cost IS 'Delivery cost charged to buyer (if applicable)';
COMMENT ON COLUMN transactions.delivery_method IS 'Delivery method: collection or delivery';