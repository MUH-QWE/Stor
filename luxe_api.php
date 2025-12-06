<?php
// ============================================
// LUXE STORE API - DUAL MODE SYSTEM
// SQL Server + LocalStorage with Switch
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load configuration
$config = require_once 'config/config.php';

class LuxeAPI {
    private $db = null;
    private $useDB;
    private $requestMethod;
    private $endpoint;
    private $action;
    private $data;
    
    public function __construct($config) {
        // Set database mode
        $this->useDB = (bool)($config['USE_DATABASE'] ?? 0);
        
        // Initialize database connection if needed
        if ($this->useDB) {
            $this->initDatabase($config);
        }
        
        $this->requestMethod = $_SERVER['REQUEST_METHOD'];
        $this->endpoint = $_GET['endpoint'] ?? '';
        $this->action = $_GET['action'] ?? '';
        
        // Get request data
        $this->data = $this->getInputData();
        
        // Log request for debugging
        if ($config['DEBUG_MODE'] ?? false) {
            error_log("API Request: {$this->requestMethod} {$this->endpoint}/{$this->action}");
        }
    }
    
    private function initDatabase($config) {
        try {
            $serverName = $config['DB_SERVER'] ?? 'localhost';
            $databaseName = $config['DB_NAME'] ?? 'luxe_store';
            $username = $config['DB_USER'] ?? 'sa';
            $password = $config['DB_PASS'] ?? '';
            
            // SQL Server connection with PDO
            $dsn = "sqlsrv:Server=$serverName;Database=$databaseName";
            $this->db = new PDO($dsn, $username, $password);
            
            // Set PDO attributes
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            // If database fails, fallback to local mode
            $this->useDB = false;
            error_log("Database connection failed: " . $e->getMessage());
            
            if (($config['DEBUG_MODE'] ?? false)) {
                $this->jsonResponse([
                    'warning' => 'Database connection failed, falling back to local mode',
                    'error' => $e->getMessage()
                ], 503);
            }
        }
    }
    
    public function processRequest() {
        try {
            // Handle mode check endpoint
            if ($this->endpoint === 'mode') {
                $this->getMode();
                return;
            }
            
            // Handle different endpoints
            switch($this->endpoint) {
                case 'products':
                    $this->handleProducts();
                    break;
                    
                case 'product':
                    $this->handleProduct();
                    break;
                    
                case 'categories':
                    $this->handleCategories();
                    break;
                    
                case 'cart':
                    $this->handleCart();
                    break;
                    
                case 'auth':
                    $this->handleAuth();
                    break;
                    
                case 'user':
                    $this->handleUser();
                    break;
                    
                case 'orders':
                    $this->handleOrders();
                    break;
                    
                case 'stats':
                    $this->handleStats();
                    break;
                    
                default:
                    $this->jsonResponse([
                        'error' => 'Endpoint not found',
                        'available_endpoints' => [
                            'products', 'product', 'categories', 
                            'cart', 'auth', 'user', 'orders', 'stats', 'mode'
                        ]
                    ], 404);
            }
            
        } catch (Exception $e) {
            $this->jsonResponse([
                'error' => 'Server error',
                'message' => $e->getMessage(),
                'trace' => (($config['DEBUG_MODE'] ?? false)) ? $e->getTrace() : null
            ], 500);
        }
    }
    
    // ==================== MODE CHECK ====================
    private function getMode() {
        $config = require 'config/config.php';
        $this->jsonResponse([
            'useDatabase' => (bool)($config['USE_DATABASE'] ?? 0),
            'mode' => ($config['USE_DATABASE'] ?? 0) ? 'database' : 'local',
            'debugMode' => (bool)($config['DEBUG_MODE'] ?? false),
            'timestamp' => date('Y-m-d H:i:s'),
            'status' => 'operational'
        ]);
    }
    
    // ==================== PRODUCTS ====================
    private function handleProducts() {
        if ($this->useDB && $this->db) {
            $this->handleProductsDB();
        } else {
            $this->handleProductsLocal();
        }
    }
    
    private function handleProductsDB() {
        switch($this->requestMethod) {
            case 'GET':
                $id = $_GET['id'] ?? null;
                $category = $_GET['category'] ?? null;
                $featured = $_GET['featured'] ?? null;
                $limit = min($_GET['limit'] ?? 50, 100);
                $offset = $_GET['offset'] ?? 0;
                
                if ($id) {
                    $this->getProductById($id);
                } else if ($featured) {
                    $this->getFeaturedProducts($limit);
                } else {
                    $this->getAllProductsDB($category, $limit, $offset);
                }
                break;
                
            case 'POST':
                $this->requireAdmin();
                $this->createProductDB();
                break;
                
            case 'PUT':
                $this->requireAdmin();
                $this->updateProductDB();
                break;
                
            case 'DELETE':
                $this->requireAdmin();
                $this->deleteProductDB();
                break;
                
            default:
                $this->jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }
    
    private function getAllProductsDB($category, $limit, $offset) {
        try {
            $whereClauses = ['p.is_active = 1'];
            $params = [];
            
            if ($category) {
                $whereClauses[] = 'p.category = ?';
                $params[] = $category;
            }
            
            $whereSQL = !empty($whereClauses) ? 'WHERE ' . implode(' AND ', $whereClauses) : '';
            
            $query = "SELECT p.*, c.name as category_name 
                     FROM products p 
                     LEFT JOIN categories c ON p.category = c.slug 
                     $whereSQL 
                     ORDER BY p.created_at DESC 
                     LIMIT ? OFFSET ?";
            
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $products = $stmt->fetchAll();
            
            // Format products
            foreach ($products as &$product) {
                $product = $this->formatProduct($product);
            }
            
            // Get total count for pagination
            $countQuery = "SELECT COUNT(*) as total FROM products p $whereSQL";
            $countStmt = $this->db->prepare($countQuery);
            $countStmt->execute(array_slice($params, 0, count($params)-2));
            $total = $countStmt->fetch()['total'];
            
            $this->jsonResponse([
                'products' => $products,
                'pagination' => [
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset,
                    'hasMore' => ($offset + count($products)) < $total
                ]
            ]);
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function getProductById($id) {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, c.name as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category = c.slug 
                WHERE p.id = ? AND p.is_active = 1
            ");
            $stmt->execute([$id]);
            $product = $stmt->fetch();
            
            if ($product) {
                $product = $this->formatProduct($product);
                $this->jsonResponse(['product' => $product]);
            } else {
                $this->jsonResponse(['error' => 'Product not found'], 404);
            }
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function getFeaturedProducts($limit) {
        try {
            $stmt = $this->db->prepare("
                SELECT p.*, c.name as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category = c.slug 
                WHERE p.is_featured = 1 AND p.is_active = 1 
                ORDER BY p.created_at DESC 
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            $products = $stmt->fetchAll();
            
            foreach ($products as &$product) {
                $product = $this->formatProduct($product);
            }
            
            $this->jsonResponse(['products' => $products]);
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function formatProduct($product) {
        // Decode JSON fields
        $product['images'] = json_decode($product['images'] ?? '[]', true) ?: [];
        $product['specifications'] = json_decode($product['specifications'] ?? '{}', true) ?: [];
        
        // Ensure required fields
        $product['id'] = (int)$product['id'];
        $product['price'] = (float)$product['price'];
        $product['original_price'] = isset($product['original_price']) ? (float)$product['original_price'] : null;
        $product['stock'] = (int)$product['stock'];
        $product['rating'] = (float)$product['rating'];
        $product['is_featured'] = (bool)$product['is_featured'];
        $product['is_active'] = (bool)$product['is_active'];
        
        // Add image URLs if needed
        if (empty($product['images'])) {
            $product['images'] = ['images/product-placeholder.jpg'];
        }
        
        return $product;
    }
    
    private function handleProductsLocal() {
        $products = $this->getSampleProducts();
        
        switch($this->requestMethod) {
            case 'GET':
                $id = $_GET['id'] ?? null;
                $category = $_GET['category'] ?? null;
                $featured = $_GET['featured'] ?? null;
                $limit = $_GET['limit'] ?? 12;
                
                // Filter products
                $filtered = $products;
                
                if ($category) {
                    $filtered = array_filter($filtered, fn($p) => $p['category'] === $category);
                }
                
                if ($featured) {
                    $filtered = array_filter($filtered, fn($p) => $p['featured'] === true);
                }
                
                if ($id) {
                    $product = array_filter($filtered, fn($p) => $p['id'] == $id);
                    $product = reset($product);
                    
                    if ($product) {
                        $this->jsonResponse(['product' => $product]);
                    } else {
                        $this->jsonResponse(['error' => 'Product not found'], 404);
                    }
                } else {
                    $filtered = array_slice($filtered, 0, $limit);
                    $this->jsonResponse([
                        'products' => array_values($filtered),
                        'pagination' => [
                            'total' => count($filtered),
                            'limit' => $limit,
                            'offset' => 0,
                            'hasMore' => false
                        ]
                    ]);
                }
                break;
                
            default:
                $this->jsonResponse([
                    'message' => 'Local mode: Product data is read-only',
                    'note' => 'Switch to database mode to modify products'
                ], 200);
        }
    }
    
    // ==================== SINGLE PRODUCT ====================
    private function handleProduct() {
        if ($this->useDB && $this->db) {
            $this->handleProductDB();
        } else {
            $this->handleProductLocal();
        }
    }
    
    private function handleProductDB() {
        $id = $_GET['id'] ?? $this->data['id'] ?? null;
        
        if (!$id) {
            $this->jsonResponse(['error' => 'Product ID required'], 400);
            return;
        }
        
        switch($this->requestMethod) {
            case 'GET':
                $this->getProductById($id);
                break;
                
            default:
                $this->jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }
    
    private function handleProductLocal() {
        $id = $_GET['id'] ?? $this->data['id'] ?? null;
        
        if (!$id) {
            $this->jsonResponse(['error' => 'Product ID required'], 400);
            return;
        }
        
        $products = $this->getSampleProducts();
        $product = array_filter($products, fn($p) => $p['id'] == $id);
        $product = reset($product);
        
        if ($product) {
            $this->jsonResponse(['product' => $product]);
        } else {
            $this->jsonResponse(['error' => 'Product not found'], 404);
        }
    }
    
    // ==================== CATEGORIES ====================
    private function handleCategories() {
        if ($this->useDB && $this->db) {
            $this->handleCategoriesDB();
        } else {
            $this->handleCategoriesLocal();
        }
    }
    
    private function handleCategoriesDB() {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, 
                (SELECT COUNT(*) FROM products p WHERE p.category = c.slug AND p.is_active = 1) as product_count
                FROM categories c 
                WHERE c.is_active = 1 
                ORDER BY c.name
            ");
            $stmt->execute();
            $categories = $stmt->fetchAll();
            
            $this->jsonResponse(['categories' => $categories]);
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function handleCategoriesLocal() {
        $categories = [
            ['id' => 1, 'name' => "Men's Fashion", 'slug' => 'men', 'product_count' => 25],
            ['id' => 2, 'name' => "Women's Fashion", 'slug' => 'women', 'product_count' => 30],
            ['id' => 3, 'name' => 'Accessories', 'slug' => 'accessories', 'product_count' => 15],
            ['id' => 4, 'name' => 'Shoes', 'slug' => 'shoes', 'product_count' => 20],
            ['id' => 5, 'name' => 'New Arrivals', 'slug' => 'new', 'product_count' => 12]
        ];
        
        $this->jsonResponse(['categories' => $categories]);
    }
    
    // ==================== CART ====================
    private function handleCart() {
        if ($this->useDB && $this->db) {
            $this->handleCartDB();
        } else {
            $this->handleCartLocal();
        }
    }
    
    private function handleCartDB() {
        $userId = $this->getUserIdFromToken();
        
        if (!$userId) {
            $this->jsonResponse(['error' => 'Authentication required'], 401);
            return;
        }
        
        switch($this->requestMethod) {
            case 'GET':
                $this->getUserCartDB($userId);
                break;
                
            case 'POST':
                $this->addToCartDB($userId);
                break;
                
            case 'PUT':
                $this->updateCartItemDB($userId);
                break;
                
            case 'DELETE':
                $this->removeFromCartDB($userId);
                break;
                
            default:
                $this->jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }
    
    private function getUserCartDB($userId) {
        try {
            $stmt = $this->db->prepare("
                SELECT c.*, p.name, p.price, p.images, p.stock 
                FROM cart c 
                JOIN products p ON c.product_id = p.id 
                WHERE c.user_id = ? AND p.is_active = 1
            ");
            $stmt->execute([$userId]);
            $cart = $stmt->fetchAll();
            
            // Format cart items
            foreach ($cart as &$item) {
                $item['id'] = (int)$item['id'];
                $item['product_id'] = (int)$item['product_id'];
                $item['quantity'] = (int)$item['quantity'];
                $item['price'] = (float)$item['price'];
                $item['total'] = $item['price'] * $item['quantity'];
                $item['images'] = json_decode($item['images'] ?? '[]', true);
                if (empty($item['images'])) {
                    $item['image'] = 'images/product-placeholder.jpg';
                } else {
                    $item['image'] = $item['images'][0];
                }
            }
            
            // Calculate totals
            $subtotal = array_sum(array_column($cart, 'total'));
            $shipping = $subtotal > 100 ? 0 : 5.99;
            $tax = $subtotal * 0.08;
            $total = $subtotal + $shipping + $tax;
            
            $this->jsonResponse([
                'cart' => $cart,
                'summary' => [
                    'subtotal' => $subtotal,
                    'shipping' => $shipping,
                    'tax' => $tax,
                    'total' => $total,
                    'item_count' => array_sum(array_column($cart, 'quantity'))
                ]
            ]);
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function addToCartDB($userId) {
        $productId = $this->data['product_id'] ?? null;
        $quantity = $this->data['quantity'] ?? 1;
        $size = $this->data['size'] ?? null;
        $color = $this->data['color'] ?? null;
        
        if (!$productId) {
            $this->jsonResponse(['error' => 'Product ID required'], 400);
            return;
        }
        
        try {
            // Check if product exists
            $stmt = $this->db->prepare("SELECT id, stock FROM products WHERE id = ? AND is_active = 1");
            $stmt->execute([$productId]);
            $product = $stmt->fetch();
            
            if (!$product) {
                $this->jsonResponse(['error' => 'Product not found'], 404);
                return;
            }
            
            // Check stock
            if ($product['stock'] < $quantity) {
                $this->jsonResponse([
                    'error' => 'Insufficient stock',
                    'available' => $product['stock']
                ], 400);
                return;
            }
            
            // Check if item already in cart
            $stmt = $this->db->prepare("
                SELECT id, quantity FROM cart 
                WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?
            ");
            $stmt->execute([$userId, $productId, $size, $color]);
            $existing = $stmt->fetch();
            
            if ($existing) {
                // Update quantity
                $newQuantity = $existing['quantity'] + $quantity;
                $stmt = $this->db->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
                $stmt->execute([$newQuantity, $existing['id']]);
                $message = 'Cart item updated';
            } else {
                // Add new item
                $stmt = $this->db->prepare("
                    INSERT INTO cart (user_id, product_id, quantity, size, color, added_at) 
                    VALUES (?, ?, ?, ?, ?, GETDATE())
                ");
                $stmt->execute([$userId, $productId, $quantity, $size, $color]);
                $message = 'Item added to cart';
            }
            
            $this->jsonResponse([
                'success' => true,
                'message' => $message,
                'cart_item' => [
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'size' => $size,
                    'color' => $color
                ]
            ]);
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function handleCartLocal() {
        $this->jsonResponse([
            'message' => 'Local mode: Cart is managed by browser localStorage',
            'instruction' => 'Use localStorage.setItem("cart", JSON.stringify(cartData))',
            'cart' => [],
            'summary' => [
                'subtotal' => 0,
                'shipping' => 0,
                'tax' => 0,
                'total' => 0,
                'item_count' => 0
            ]
        ]);
    }
    
    // ==================== AUTHENTICATION ====================
    private function handleAuth() {
        if ($this->useDB && $this->db) {
            $this->handleAuthDB();
        } else {
            $this->handleAuthLocal();
        }
    }
    
    private function handleAuthDB() {
        switch($this->action) {
            case 'login':
                $this->loginDB();
                break;
                
            case 'register':
                $this->registerDB();
                break;
                
            case 'logout':
                $this->logoutDB();
                break;
                
            case 'check':
                $this->checkAuth();
                break;
                
            default:
                $this->jsonResponse(['error' => 'Invalid auth action'], 400);
        }
    }
    
    private function loginDB() {
        $email = $this->data['email'] ?? '';
        $password = $this->data['password'] ?? '';
        $remember = $this->data['remember'] ?? false;
        
        if (!$email || !$password) {
            $this->jsonResponse(['error' => 'Email and password required'], 400);
            return;
        }
        
        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password'])) {
                // Generate token
                $token = bin2hex(random_bytes(32));
                $tokenExpiry = date('Y-m-d H:i:s', strtotime('+30 days'));
                
                // Update user token
                $stmt = $this->db->prepare("UPDATE users SET token = ?, token_expiry = ? WHERE id = ?");
                $stmt->execute([$token, $tokenExpiry, $user['id']]);
                
                // Remove sensitive data
                unset($user['password']);
                unset($user['token']);
                
                $this->jsonResponse([
                    'success' => true,
                    'message' => 'Login successful',
                    'user' => $user,
                    'token' => $token,
                    'token_expiry' => $tokenExpiry
                ]);
            } else {
                $this->jsonResponse(['error' => 'Invalid email or password'], 401);
            }
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function registerDB() {
        $name = $this->data['name'] ?? '';
        $email = $this->data['email'] ?? '';
        $password = $this->data['password'] ?? '';
        
        if (!$name || !$email || !$password) {
            $this->jsonResponse(['error' => 'Name, email and password required'], 400);
            return;
        }
        
        // Validate email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->jsonResponse(['error' => 'Invalid email format'], 400);
            return;
        }
        
        // Validate password strength
        if (strlen($password) < 6) {
            $this->jsonResponse(['error' => 'Password must be at least 6 characters'], 400);
            return;
        }
        
        try {
            // Check if email exists
            $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            
            if ($stmt->fetch()) {
                $this->jsonResponse(['error' => 'Email already registered'], 409);
                return;
            }
            
            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // Create user
            $stmt = $this->db->prepare("
                INSERT INTO users (name, email, password, role, created_at) 
                VALUES (?, ?, ?, 'customer', GETDATE())
            ");
            $stmt->execute([$name, $email, $hashedPassword]);
            
            $userId = $this->db->lastInsertId();
            
            // Get created user
            $stmt = $this->db->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            $this->jsonResponse([
                'success' => true,
                'message' => 'Registration successful',
                'user' => $user
            ]);
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function handleAuthLocal() {
        switch($this->action) {
            case 'login':
            case 'register':
            case 'check':
                $this->jsonResponse([
                    'success' => true,
                    'message' => 'Local mode: Using localStorage for authentication',
                    'user' => [
                        'id' => 1,
                        'name' => 'Demo User',
                        'email' => 'demo@luxe.com',
                        'role' => 'customer'
                    ],
                    'token' => 'local-mode-token',
                    'mode' => 'local'
                ]);
                break;
                
            case 'logout':
                $this->jsonResponse([
                    'success' => true,
                    'message' => 'Logged out (local mode)'
                ]);
                break;
                
            default:
                $this->jsonResponse(['error' => 'Invalid auth action'], 400);
        }
    }
    
    // ==================== USER ====================
    private function handleUser() {
        if ($this->useDB && $this->db) {
            $this->handleUserDB();
        } else {
            $this->handleUserLocal();
        }
    }
    
    private function handleUserDB() {
        $userId = $this->getUserIdFromToken();
        
        if (!$userId) {
            $this->jsonResponse(['error' => 'Authentication required'], 401);
            return;
        }
        
        switch($this->requestMethod) {
            case 'GET':
                $this->getUserProfile($userId);
                break;
                
            case 'PUT':
                $this->updateUserProfile($userId);
                break;
                
            default:
                $this->jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }
    
    private function getUserProfile($userId) {
        try {
            $stmt = $this->db->prepare("
                SELECT id, name, email, role, created_at, updated_at 
                FROM users 
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if ($user) {
                // Get user orders count
                $stmt = $this->db->prepare("SELECT COUNT(*) as order_count FROM orders WHERE user_id = ?");
                $stmt->execute([$userId]);
                $orderCount = $stmt->fetch()['order_count'];
                
                $user['order_count'] = $orderCount;
                $this->jsonResponse(['user' => $user]);
            } else {
                $this->jsonResponse(['error' => 'User not found'], 404);
            }
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function handleUserLocal() {
        $this->jsonResponse([
            'user' => [
                'id' => 1,
                'name' => 'Demo User',
                'email' => 'demo@luxe.com',
                'role' => 'customer',
                'created_at' => date('Y-m-d H:i:s'),
                'order_count' => 3
            ],
            'mode' => 'local'
        ]);
    }
    
    // ==================== ORDERS ====================
    private function handleOrders() {
        if ($this->useDB && $this->db) {
            $this->handleOrdersDB();
        } else {
            $this->handleOrdersLocal();
        }
    }
    
    private function handleOrdersDB() {
        $userId = $this->getUserIdFromToken();
        
        if (!$userId) {
            $this->jsonResponse(['error' => 'Authentication required'], 401);
            return;
        }
        
        switch($this->requestMethod) {
            case 'GET':
                $id = $_GET['id'] ?? null;
                if ($id) {
                    $this->getOrderById($userId, $id);
                } else {
                    $this->getUserOrders($userId);
                }
                break;
                
            case 'POST':
                $this->createOrder($userId);
                break;
                
            default:
                $this->jsonResponse(['error' => 'Method not allowed'], 405);
        }
    }
    
    private function getUserOrders($userId) {
        try {
            $stmt = $this->db->prepare("
                SELECT o.*, 
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
                FROM orders o 
                WHERE o.user_id = ? 
                ORDER BY o.created_at DESC
                LIMIT 20
            ");
            $stmt->execute([$userId]);
            $orders = $stmt->fetchAll();
            
            foreach ($orders as &$order) {
                $order['shipping_address'] = json_decode($order['shipping_address'] ?? '{}', true);
                $order['id'] = (int)$order['id'];
                $order['total_amount'] = (float)$order['total_amount'];
                $order['item_count'] = (int)$order['item_count'];
            }
            
            $this->jsonResponse(['orders' => $orders]);
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function handleOrdersLocal() {
        $this->jsonResponse([
            'message' => 'Local mode: Orders not available',
            'orders' => [],
            'mode' => 'local'
        ]);
    }
    
    // ==================== STATISTICS ====================
    private function handleStats() {
        if ($this->useDB && $this->db) {
            $this->handleStatsDB();
        } else {
            $this->handleStatsLocal();
        }
    }
    
    private function handleStatsDB() {
        $this->requireAdmin();
        
        try {
            // Get basic stats
            $stats = [];
            
            // Total products
            $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM products WHERE is_active = 1");
            $stmt->execute();
            $stats['total_products'] = $stmt->fetch()['count'];
            
            // Total orders
            $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM orders");
            $stmt->execute();
            $stats['total_orders'] = $stmt->fetch()['count'];
            
            // Total users
            $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM users");
            $stmt->execute();
            $stats['total_users'] = $stmt->fetch()['count'];
            
            // Total revenue
            $stmt = $this->db->prepare("SELECT SUM(total_amount) as total FROM orders WHERE status = 'completed'");
            $stmt->execute();
            $stats['total_revenue'] = $stmt->fetch()['total'] ?? 0;
            
            // Recent orders
            $stmt = $this->db->prepare("
                SELECT TOP 5 o.*, u.name as customer_name 
                FROM orders o 
                JOIN users u ON o.user_id = u.id 
                ORDER BY o.created_at DESC
            ");
            $stmt->execute();
            $stats['recent_orders'] = $stmt->fetchAll();
            
            // Low stock products
            $stmt = $this->db->prepare("
                SELECT name, stock 
                FROM products 
                WHERE stock <= 10 AND is_active = 1 
                ORDER BY stock ASC 
                LIMIT 5
            ");
            $stmt->execute();
            $stats['low_stock'] = $stmt->fetchAll();
            
            $this->jsonResponse(['stats' => $stats]);
            
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    private function handleStatsLocal() {
        $this->jsonResponse([
            'message' => 'Local mode: Statistics not available',
            'stats' => [
                'total_products' => 0,
                'total_orders' => 0,
                'total_users' => 0,
                'total_revenue' => 0,
                'recent_orders' => [],
                'low_stock' => []
            ],
            'mode' => 'local'
        ]);
    }
    
    // ==================== UTILITY METHODS ====================
    private function getInputData() {
        $data = [];
        
        if ($this->requestMethod === 'GET') {
            $data = $_GET;
        } else {
            $input = file_get_contents('php://input');
            
            if (!empty($input)) {
                $data = json_decode($input, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    parse_str($input, $data);
                }
            }
            
            if (empty($data)) {
                $data = $_POST;
            }
        }
        
        return $data;
    }
    
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        
        // Add API info
        $response = array_merge($data, [
            '_api' => [
                'version' => '1.0',
                'mode' => $this->useDB ? 'database' : 'local',
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ]);
        
        echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    private function getUserIdFromToken() {
        $headers = getallheaders();
        $token = $headers['Authorization'] ?? $_GET['token'] ?? $this->data['token'] ?? '';
        
        // Remove Bearer prefix if present
        $token = str_replace('Bearer ', '', $token);
        
        if (!$token || $token === 'local-mode-token') {
            return null;
        }
        
        try {
            $stmt = $this->db->prepare("SELECT id FROM users WHERE token = ? AND token_expiry > GETDATE()");
            $stmt->execute([$token]);
            $user = $stmt->fetch();
            
            return $user ? (int)$user['id'] : null;
        } catch (PDOException $e) {
            return null;
        }
    }
    
    private function requireAdmin() {
        $userId = $this->getUserIdFromToken();
        
        if (!$userId) {
            $this->jsonResponse(['error' => 'Authentication required'], 401);
            return false;
        }
        
        try {
            $stmt = $this->db->prepare("SELECT role FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if ($user && $user['role'] === 'admin') {
                return true;
            } else {
                $this->jsonResponse(['error' => 'Admin access required'], 403);
                return false;
            }
        } catch (PDOException $e) {
            $this->jsonResponse(['error' => 'Database error'], 500);
            return false;
        }
    }
    
    private function getSampleProducts() {
        return [
            [
                'id' => 1,
                'name' => 'Premium Cotton T-Shirt',
                'description' => 'Soft, breathable cotton t-shirt perfect for everyday wear',
                'price' => 29.99,
                'original_price' => 39.99,
                'category' => 'men',
                'images' => ['images/product1.jpg'],
                'stock' => 50,
                'rating' => 4.5,
                'featured' => true,
                'specifications' => [
                    ['name' => 'Material', 'value' => '100% Cotton'],
                    ['name' => 'Care', 'value' => 'Machine wash cold'],
                    ['name' => 'Fit', 'value' => 'Regular fit']
                ],
                'created_at' => '2024-01-15'
            ],
            [
                'id' => 2,
                'name' => 'Designer Silk Dress',
                'description' => 'Elegant silk dress for special occasions',
                'price' => 129.99,
                'original_price' => 159.99,
                'category' => 'women',
                'images' => ['images/product2.jpg'],
                'stock' => 25,
                'rating' => 4.8,
                'featured' => true,
                'specifications' => [
                    ['name' => 'Material', 'value' => '100% Silk'],
                    ['name' => 'Care', 'value' => 'Dry clean only'],
                    ['name' => 'Length', 'value' => 'Knee-length']
                ],
                'created_at' => '2024-01-20'
            ],
            [
                'id' => 3,
                'name' => 'Leather Wallet',
                'description' => 'Genuine leather wallet with multiple compartments',
                'price' => 49.99,
                'category' => 'accessories',
                'images' => ['images/product3.jpg'],
                'stock' => 100,
                'rating' => 4.3,
                'featured' => false,
                'specifications' => [
                    ['name' => 'Material', 'value' => 'Genuine Leather'],
                    ['name' => 'Compartments', 'value' => '8 card slots + 2 bill compartments']
                ],
                'created_at' => '2024-02-01'
            ],
            [
                'id' => 4,
                'name' => 'Running Shoes',
                'description' => 'Lightweight running shoes with cushion technology',
                'price' => 89.99,
                'original_price' => 119.99,
                'category' => 'shoes',
                'images' => ['images/product4.jpg'],
                'stock' => 40,
                'rating' => 4.6,
                'featured' => true,
                'specifications' => [
                    ['name' => 'Material', 'value' => 'Mesh upper, Rubber sole'],
                    ['name' => 'Weight', 'value' => '280g per shoe']
                ],
                'created_at' => '2024-02-05'
            ],
            [
                'id' => 5,
                'name' => 'Winter Jacket',
                'description' => 'Warm winter jacket with waterproof coating',
                'price' => 149.99,
                'category' => 'men',
                'images' => ['images/product5.jpg'],
                'stock' => 30,
                'rating' => 4.7,
                'featured' => false,
                'specifications' => [
                    ['name' => 'Material', 'value' => 'Polyester with waterproof coating'],
                    ['name' => 'Insulation', 'value' => 'Thermal lining']
                ],
                'created_at' => '2024-02-10'
            ],
            [
                'id' => 6,
                'name' => 'Summer Dress',
                'description' => 'Light and breezy summer dress',
                'price' => 59.99,
                'category' => 'women',
                'images' => ['images/product6.jpg'],
                'stock' => 45,
                'rating' => 4.4,
                'featured' => false,
                'specifications' => [
                    ['name' => 'Material', 'value' => 'Cotton-Linen blend'],
                    ['name' => 'Style', 'value' => 'A-line']
                ],
                'created_at' => '2024-02-12'
            ],
            [
                'id' => 7,
                'name' => 'Designer Sunglasses',
                'description' => 'UV protection sunglasses with polarized lenses',
                'price' => 79.99,
                'original_price' => 99.99,
                'category' => 'accessories',
                'images' => ['images/product7.jpg'],
                'stock' => 60,
                'rating' => 4.5,
                'featured' => true,
                'specifications' => [
                    ['name' => 'Lens Type', 'value' => 'Polarized'],
                    ['name' => 'UV Protection', 'value' => '100% UVA/UVB']
                ],
                'created_at' => '2024-02-15'
            ],
            [
                'id' => 8,
                'name' => 'Formal Shoes',
                'description' => 'Classic formal shoes for business occasions',
                'price' => 99.99,
                'category' => 'shoes',
                'images' => ['images/product8.jpg'],
                'stock' => 35,
                'rating' => 4.6,
                'featured' => false,
                'specifications' => [
                    ['name' => 'Material', 'value' => 'Genuine Leather'],
                    ['name' => 'Closure', 'value' => 'Lace-up']
                ],
                'created_at' => '2024-02-18'
            ]
        ];
    }
}

// ============================================
// INITIALIZE AND RUN API
// ============================================

// Get config
$configFile = __DIR__ . '/config/config.php';
if (!file_exists($configFile)) {
    // Create default config if not exists
    $defaultConfig = [
        'USE_DATABASE' => 0,
        'DEBUG_MODE' => true,
        'DB_SERVER' => 'localhost',
        'DB_NAME' => 'luxe_store',
        'DB_USER' => 'sa',
        'DB_PASS' => '',
        'SITE_URL' => 'http://localhost',
        'UPLOAD_DIR' => 'uploads/',
        'JWT_SECRET' => 'your-secret-key-change-this'
    ];
    
    // Try to create config directory
    if (!is_dir(__DIR__ . '/config')) {
        mkdir(__DIR__ . '/config', 0755, true);
    }
    
    file_put_contents($configFile, '<?php return ' . var_export($defaultConfig, true) . ';');
}

$config = require $configFile;

// Initialize and run API
$api = new LuxeAPI($config);
$api->processRequest();
?>