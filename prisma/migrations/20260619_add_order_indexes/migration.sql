-- Add missing indexes for order performance optimization
CREATE INDEX IF NOT EXISTS idx_orders_status ON "Order"(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON "Order"("paymentStatus");
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON "Order"("customerId");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON "Order"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS idx_products_is_active ON "Product"("isActive");
CREATE INDEX IF NOT EXISTS idx_products_featured ON "Product"("isFeatured");
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON "ProductVariant"("productId");
