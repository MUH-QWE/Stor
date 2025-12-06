-- ============================================
-- LUXE STORE DATABASE SETUP
-- SQL Server Database Schema
-- ============================================

-- Create database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'luxe_store')
BEGIN
    CREATE DATABASE luxe_store;
    PRINT 'Database luxe_store created.';
END
GO

USE luxe_store;
GO

-- ==================== USERS TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'users') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) DEFAULT 'customer',
        token NVARCHAR(255),
        token_expiry DATETIME,
        phone NVARCHAR(20),
        address NVARCHAR(MAX),
        city NVARCHAR(50),
        country NVARCHAR(50),
        zip_code NVARCHAR(20),
        avatar NVARCHAR(255),
        is_active BIT DEFAULT 1,
        email_verified BIT DEFAULT 0,
        last_login DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table users created.';
END
GO

-- ==================== CATEGORIES TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'categories') AND type in (N'U'))
BEGIN
    CREATE TABLE categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image NVARCHAR(255),
        parent_id INT NULL,
        sort_order INT DEFAULT 0,
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );
    PRINT 'Table categories created.';
END
GO

-- ==================== PRODUCTS TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'products') AND type in (N'U'))
BEGIN
    CREATE TABLE products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        sku NVARCHAR(50) UNIQUE NOT NULL,
        name NVARCHAR(200) NOT NULL,
        slug NVARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        short_description NVARCHAR(500),
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        cost_price DECIMAL(10,2),
        category NVARCHAR(50),
        images NVARCHAR(MAX), -- JSON array of image paths
        specifications NVARCHAR(MAX), -- JSON object
        features NVARCHAR(MAX), -- JSON array
        stock INT DEFAULT 0,
        low_stock_threshold INT DEFAULT 10,
        weight DECIMAL(8,2),
        dimensions NVARCHAR(100),
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INT DEFAULT 0,
        is_featured BIT DEFAULT 0,
        is_new BIT DEFAULT 0,
        is_on_sale BIT DEFAULT 0,
        is_active BIT DEFAULT 1,
        meta_title NVARCHAR(200),
        meta_description NVARCHAR(500),
        meta_keywords NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table products created.';
END
GO

-- ==================== PRODUCT VARIANTS TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'product_variants') AND type in (N'U'))
BEGIN
    CREATE TABLE product_variants (
        id INT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL,
        sku NVARCHAR(50) UNIQUE NOT NULL,
        size NVARCHAR(20),
        color NVARCHAR(50),
        material NVARCHAR(50),
        price DECIMAL(10,2),
        stock INT DEFAULT 0,
        image NVARCHAR(255),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    PRINT 'Table product_variants created.';
END
GO

-- ==================== CART TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'cart') AND type in (N'U'))
BEGIN
    CREATE TABLE cart (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        variant_id INT NULL,
        quantity INT DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        size NVARCHAR(20),
        color NVARCHAR(50),
        added_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
    );
    PRINT 'Table cart created.';
END
GO

-- ==================== ORDERS TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'orders') AND type in (N'U'))
BEGIN
    CREATE TABLE orders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_number NVARCHAR(50) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        status NVARCHAR(20) DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        shipping_cost DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        coupon_code NVARCHAR(50),
        payment_method NVARCHAR(50),
        payment_status NVARCHAR(20) DEFAULT 'pending',
        shipping_method NVARCHAR(50),
        shipping_status NVARCHAR(20) DEFAULT 'pending',
        shipping_tracking NVARCHAR(100),
        customer_notes TEXT,
        admin_notes TEXT,
        shipping_address NVARCHAR(MAX), -- JSON object
        billing_address NVARCHAR(MAX), -- JSON object
        ip_address NVARCHAR(45),
        user_agent NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    PRINT 'Table orders created.';
END
GO

-- ==================== ORDER ITEMS TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'order_items') AND type in (N'U'))
BEGIN
    CREATE TABLE order_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        variant_id INT NULL,
        product_name NVARCHAR(200) NOT NULL,
        product_sku NVARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        size NVARCHAR(20),
        color NVARCHAR(50),
        created_at DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    );
    PRINT 'Table order_items created.';
END
GO

-- ==================== REVIEWS TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'reviews') AND type in (N'U'))
BEGIN
    CREATE TABLE reviews (
        id INT IDENTITY(1,1) PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        order_item_id INT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title NVARCHAR(200),
        comment TEXT,
        is_approved BIT DEFAULT 0,
        is_featured BIT DEFAULT 0,
        helpful_count INT DEFAULT 0,
        not_helpful_count INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL
    );
    PRINT 'Table reviews created.';
END
GO

-- ==================== WISHLIST TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'wishlist') AND type in (N'U'))
BEGIN
    CREATE TABLE wishlist (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE (user_id, product_id)
    );
    PRINT 'Table wishlist created.';
END
GO

-- ==================== COUPONS TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'coupons') AND type in (N'U'))
BEGIN
    CREATE TABLE coupons (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) UNIQUE NOT NULL,
        description NVARCHAR(500),
        discount_type NVARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
        discount_value DECIMAL(10,2) NOT NULL,
        minimum_cart DECIMAL(10,2),
        maximum_discount DECIMAL(10,2),
        usage_limit INT,
        usage_count INT DEFAULT 0,
        user_limit INT,
        start_date DATETIME,
        end_date DATETIME,
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table coupons created.';
END
GO

-- ==================== SETTINGS TABLE ====================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'settings') AND type in (N'U'))
BEGIN
    CREATE TABLE settings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        setting_key NVARCHAR(100) UNIQUE NOT NULL,
        setting_value NVARCHAR(MAX),
        setting_type NVARCHAR(50) DEFAULT 'text',
        category NVARCHAR(50),
        description NVARCHAR(500),
        is_public BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Table settings created.';
END
GO

-- ==================== INDEXES ====================
-- Products indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = 1;
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = 1;

-- Orders indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Cart indexes
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_cart_product ON cart(product_id);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = 1;

-- Reviews indexes
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = 1;

-- ==================== DEFAULT DATA ====================
-- Insert default categories
IF NOT EXISTS (SELECT * FROM categories WHERE slug = 'men')
BEGIN
    INSERT INTO categories (name, slug, description) VALUES
    ('Men''s Fashion', 'men', 'Clothing and accessories for men'),
    ('Women''s Fashion', 'women', 'Clothing and accessories for women'),
    ('Accessories', 'accessories', 'Fashion accessories'),
    ('Shoes', 'shoes', 'Footwear for all occasions'),
    ('New Arrivals', 'new', 'Latest products');
    PRINT 'Default categories inserted.';
END
GO

-- Insert default admin user (password: admin123)
IF NOT EXISTS (SELECT * FROM users WHERE email = 'admin@luxe.com')
BEGIN
    INSERT INTO users (name, email, password, role, is_active, email_verified) 
    VALUES ('Administrator', 'admin@luxe.com', '$2y$10$YourHashedPasswordHere', 'admin', 1, 1);
    PRINT 'Admin user created.';
END
GO

-- Insert default settings
IF NOT EXISTS (SELECT * FROM settings WHERE setting_key = 'store_name')
BEGIN
    INSERT INTO settings (setting_key, setting_value, category, description) VALUES
    ('store_name', 'LUXE Fashion Store', 'general', 'Name of the store'),
    ('store_email', 'info@luxe.com', 'general', 'Store contact email'),
    ('store_phone', '+1 234 567 890', 'general', 'Store contact phone'),
    ('store_address', 'Fashion Street, New York, USA', 'general', 'Store address'),
    ('currency', 'USD', 'general', 'Default currency'),
    ('tax_rate', '8', 'general', 'Tax rate in percentage'),
    ('shipping_cost', '5.99', 'shipping', 'Standard shipping cost'),
    ('free_shipping_threshold', '100', 'shipping', 'Minimum amount for free shipping'),
    ('default_theme', 'spring', 'appearance', 'Default theme for the store');
    PRINT 'Default settings inserted.';
END
GO

-- Insert sample products
IF NOT EXISTS (SELECT * FROM products WHERE sku = 'PROD-001')
BEGIN
    INSERT INTO products (sku, name, slug, description, price, original_price, category, images, stock, is_featured, is_new) 
    VALUES 
    ('PROD-001', 'Premium Cotton T-Shirt', 'premium-cotton-t-shirt', 'Soft, breathable cotton t-shirt', 29.99, 39.99, 'men', '["images/product1.jpg"]', 50, 1, 1),
    ('PROD-002', 'Designer Silk Dress', 'designer-silk-dress', 'Elegant silk dress for special occasions', 129.99, 159.99, 'women', '["images/product2.jpg"]', 25, 1, 1),
    ('PROD-003', 'Leather Wallet', 'leather-wallet', 'Genuine leather wallet', 49.99, NULL, 'accessories', '["images/product3.jpg"]', 100, 0, 0),
    ('PROD-004', 'Running Shoes', 'running-shoes', 'Lightweight running shoes', 89.99, 119.99, 'shoes', '["images/product4.jpg"]', 40, 1, 1);
    PRINT 'Sample products inserted.';
END
GO

-- ==================== STORED PROCEDURES ====================
-- Get product details with category
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetProductDetails')
    DROP PROCEDURE GetProductDetails;
GO

CREATE PROCEDURE GetProductDetails
    @ProductId INT
AS
BEGIN
    SELECT 
        p.*,
        c.name as category_name,
        (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as review_count,
        (SELECT AVG(CAST(rating as DECIMAL(3,2))) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as average_rating
    FROM products p
    LEFT JOIN categories c ON p.category = c.slug
    WHERE p.id = @ProductId AND p.is_active = 1;
END
GO

-- Get user cart with product details
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetUserCart')
    DROP PROCEDURE GetUserCart;
GO

CREATE PROCEDURE GetUserCart
    @UserId INT
AS
BEGIN
    SELECT 
        c.*,
        p.name as product_name,
        p.images as product_images,
        p.stock as product_stock,
        (c.price * c.quantity) as item_total
    FROM cart c
    INNER JOIN products p ON c.product_id = p.id
    WHERE c.user_id = @UserId AND p.is_active = 1
    ORDER BY c.added_at DESC;
END
GO

-- Get dashboard statistics
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetDashboardStats')
    DROP PROCEDURE GetDashboardStats;
GO

CREATE PROCEDURE GetDashboardStats
AS
BEGIN
    DECLARE @Today DATE = GETDATE();
    DECLARE @Yesterday DATE = DATEADD(DAY, -1, @Today);
    DECLARE @LastMonth DATE = DATEADD(MONTH, -1, @Today);
    
    -- Total revenue
    DECLARE @TotalRevenue DECIMAL(10,2);
    SELECT @TotalRevenue = SUM(total_amount) FROM orders WHERE status = 'completed';
    
    -- Today's revenue
    DECLARE @TodayRevenue DECIMAL(10,2);
    SELECT @TodayRevenue = SUM(total_amount) FROM orders 
    WHERE status = 'completed' AND CAST(created_at AS DATE) = @Today;
    
    -- Total orders
    DECLARE @TotalOrders INT;
    SELECT @TotalOrders = COUNT(*) FROM orders;
    
    -- Today's orders
    DECLARE @TodayOrders INT;
    SELECT @TodayOrders = COUNT(*) FROM orders WHERE CAST(created_at AS DATE) = @Today;
    
    -- Total customers
    DECLARE @TotalCustomers INT;
    SELECT @TotalCustomers = COUNT(*) FROM users WHERE role = 'customer';
    
    -- New customers today
    DECLARE @NewCustomersToday INT;
    SELECT @NewCustomersToday = COUNT(*) FROM users 
    WHERE role = 'customer' AND CAST(created_at AS DATE) = @Today;
    
    -- Low stock products
    DECLARE @LowStockProducts INT;
    SELECT @LowStockProducts = COUNT(*) FROM products 
    WHERE stock <= low_stock_threshold AND is_active = 1;
    
    -- Return all stats
    SELECT 
        @TotalRevenue as total_revenue,
        @TodayRevenue as today_revenue,
        @TotalOrders as total_orders,
        @TodayOrders as today_orders,
        @TotalCustomers as total_customers,
        @NewCustomersToday as new_customers_today,
        @LowStockProducts as low_stock_products;
END
GO

-- ==================== VIEWS ====================
-- Product catalog view
IF EXISTS (SELECT * FROM sys.views WHERE name = 'ProductCatalog')
    DROP VIEW ProductCatalog;
GO

CREATE VIEW ProductCatalog AS
SELECT 
    p.id,
    p.sku,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.original_price,
    p.category,
    p.images,
    p.stock,
    p.rating,
    p.review_count,
    p.is_featured,
    p.is_new,
    p.is_on_sale,
    p.created_at,
    c.name as category_name,
    CASE 
        WHEN p.original_price IS NOT NULL AND p.original_price > p.price 
        THEN CAST(((p.original_price - p.price) / p.original_price * 100) AS DECIMAL(5,2))
        ELSE NULL
    END as discount_percentage
FROM products p
LEFT JOIN categories c ON p.category = c.slug
WHERE p.is_active = 1;
GO

-- Order summary view
IF EXISTS (SELECT * FROM sys.views WHERE name = 'OrderSummary')
    DROP VIEW OrderSummary;
GO

CREATE VIEW OrderSummary AS
SELECT 
    o.id,
    o.order_number,
    o.user_id,
    u.name as customer_name,
    u.email as customer_email,
    o.status,
    o.total_amount,
    o.payment_method,
    o.payment_status,
    o.shipping_method,
    o.created_at,
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
FROM orders o
INNER JOIN users u ON o.user_id = u.id;
GO

PRINT '============================================';
PRINT 'DATABASE SETUP COMPLETED SUCCESSFULLY';
PRINT '============================================';
PRINT 'Database: luxe_store';
PRINT 'Tables created: 10';
PRINT 'Stored procedures: 3';
PRINT 'Views: 2';
PRINT 'Default data inserted';
PRINT '============================================';