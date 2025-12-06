<?php
// ============================================
// DATABASE CONNECTION CLASS
// ============================================

class Database {
    private static $instance = null;
    private $connection;
    private $config;
    
    // Private constructor to prevent direct creation
    private function __construct() {
        $this->config = require 'config.php';
        $this->connect();
    }
    
    // Get singleton instance
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    // Get PDO connection
    public static function getConnection() {
        return self::getInstance()->connection;
    }
    
    // Connect to SQL Server
    private function connect() {
        try {
            $serverName = $this->config['DB_SERVER'];
            $databaseName = $this->config['DB_NAME'];
            $username = $this->config['DB_USER'];
            $password = $this->config['DB_PASS'];
            
            // SQL Server connection string
            $dsn = "sqlsrv:Server=$serverName;Database=$databaseName";
            
            $this->connection = new PDO($dsn, $username, $password);
            
            // Set PDO attributes
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->connection->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
            $this->connection->setAttribute(PDO::SQLSRV_ATTR_ENCODING, PDO::SQLSRV_ENCODING_UTF8);
            
            // Test connection
            $this->connection->query("SELECT 1");
            
            if ($this->config['DEBUG_MODE']) {
                error_log("Database connected successfully to: $databaseName");
            }
            
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            
            if ($this->config['DEBUG_MODE']) {
                die(json_encode([
                    'error' => 'Database connection failed',
                    'message' => $e->getMessage(),
                    'config' => [
                        'server' => $serverName,
                        'database' => $databaseName,
                        'user' => $username
                    ]
                ], JSON_PRETTY_PRINT));
            } else {
                die('Database connection error. Please try again later.');
            }
        }
    }
    
    // Execute query with parameters
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query error: " . $e->getMessage() . " | SQL: $sql");
            throw $e;
        }
    }
    
    // Get single row
    public function getRow($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    // Get all rows
    public function getRows($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    // Insert and return last insert ID
    public function insert($table, $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
        $this->query($sql, array_values($data));
        
        return $this->connection->lastInsertId();
    }
    
    // Update records
    public function update($table, $data, $where, $whereParams = []) {
        $setParts = [];
        $params = [];
        
        foreach ($data as $column => $value) {
            $setParts[] = "$column = ?";
            $params[] = $value;
        }
        
        $setClause = implode(', ', $setParts);
        $params = array_merge($params, $whereParams);
        
        $sql = "UPDATE $table SET $setClause WHERE $where";
        return $this->query($sql, $params)->rowCount();
    }
    
    // Delete records
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM $table WHERE $where";
        return $this->query($sql, $params)->rowCount();
    }
    
    // Check if table exists
    public function tableExists($tableName) {
        try {
            $sql = "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = ?";
            $result = $this->getRow($sql, [$tableName]);
            return !empty($result);
        } catch (PDOException $e) {
            return false;
        }
    }
    
    // Begin transaction
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    // Commit transaction
    public function commit() {
        return $this->connection->commit();
    }
    
    // Rollback transaction
    public function rollback() {
        return $this->connection->rollback();
    }
    
    // Close connection
    public function close() {
        $this->connection = null;
        self::$instance = null;
    }
    
    // Prevent cloning
    private function __clone() {}
    
    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Helper function for quick database access
function db() {
    return Database::getInstance();
}
?>