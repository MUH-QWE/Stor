<?php
// ============================================
// LUXE STORE CONFIGURATION
// ============================================

return [
    // ==================== MODE SETTINGS ====================
    // Set to 1 for Database Mode (SQL Server), 0 for LocalStorage Mode
    'USE_DATABASE' => 0,
    
    // ==================== DATABASE SETTINGS ====================
    // SQL Server Configuration (Only used when USE_DATABASE = 1)
    'DB_SERVER'    => 'localhost',      // SQL Server hostname
    'DB_NAME'      => 'luxe_store',     // Database name
    'DB_USER'      => 'sa',             // Database username
    'DB_PASS'      => '',               // Database password
    
    // ==================== APPLICATION SETTINGS ====================
    'DEBUG_MODE'   => true,             // Enable debug logs
    'SITE_URL'     => 'http://localhost/luxe',
    'UPLOAD_DIR'   => 'uploads/',       // Directory for file uploads
    
    // ==================== SECURITY SETTINGS ====================
    'JWT_SECRET'   => 'luxe-store-secret-key-change-in-production',
    'TOKEN_EXPIRE' => 2592000,          // 30 days in seconds
    
    // ==================== CART SETTINGS ====================
    'FREE_SHIPPING_THRESHOLD' => 100,   // Free shipping over this amount
    'SHIPPING_COST'           => 5.99,  // Standard shipping cost
    'TAX_RATE'                => 0.08,  // 8% tax rate
    
    // ==================== PRODUCT SETTINGS ====================
    'PRODUCTS_PER_PAGE'       => 12,
    'FEATURED_PRODUCTS_LIMIT' => 8,
    'NEW_PRODUCTS_DAYS'       => 30,    // Products newer than X days are "New"
    
    // ==================== EMAIL SETTINGS ====================
    'SMTP_HOST'     => 'smtp.gmail.com',
    'SMTP_PORT'     => 587,
    'SMTP_USER'     => '',
    'SMTP_PASS'     => '',
    'FROM_EMAIL'    => 'noreply@luxe.com',
    'FROM_NAME'     => 'LUXE Store',
    
    // ==================== PAYMENT SETTINGS ====================
    'STRIPE_PUBLIC_KEY' => '',
    'STRIPE_SECRET_KEY' => '',
    
    // ==================== CACHE SETTINGS ====================
    'CACHE_ENABLED' => true,
    'CACHE_TIME'    => 3600,            // Cache time in seconds
    
    // ==================== API SETTINGS ====================
    'API_RATE_LIMIT' => 100,            // Requests per minute per IP
    'API_VERSION'    => '1.0',
    
    // ==================== THEME SETTINGS ====================
    'DEFAULT_THEME'  => 'spring',
    'AVAILABLE_THEMES' => ['spring', 'summer', 'autumn', 'winter'],
];
?>