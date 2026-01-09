<?php
/**
 * MySQL Database Connection for IndoSaga
 * Uses environment variables for secure database connection
 */

class MySQLConnection {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        $this->connect();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new MySQLConnection();
        }
        return self::$instance;
    }
    
    private function connect() {
        // Get database credentials from environment variables (Replit Secrets)
        $host = getenv('DB_HOST') ?: $_ENV['DB_HOST'] ?? '';
        $port = getenv('DB_PORT') ?: $_ENV['DB_PORT'] ?? '3306';
        $dbname = getenv('DB_NAME') ?: $_ENV['DB_NAME'] ?? '';
        $username = getenv('DB_USER') ?: $_ENV['DB_USER'] ?? '';
        $password = getenv('DB_PASSWORD') ?: $_ENV['DB_PASSWORD'] ?? '';
        
        if (empty($host) || empty($dbname) || empty($username) || empty($password)) {
            throw new Exception('Database credentials not found in environment variables');
        }
        
        // Defensive parsing: handle cases where host contains port or scheme
        if (strpos($host, 'http://') === 0) {
            $host = substr($host, 7);
            error_log("Warning: Stripped http:// scheme from DB_HOST");
        }
        if (strpos($host, 'https://') === 0) {
            $host = substr($host, 8);
            error_log("Warning: Stripped https:// scheme from DB_HOST");
        }
        if (strpos($host, ':') !== false && $port == '3306') {
            $parts = explode(':', $host);
            $host = $parts[0];
            $port = isset($parts[1]) ? $parts[1] : '3306';
            error_log("Warning: Split host:port combination - Host: {$host}, Port: {$port}");
        }
        
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
            $this->connection = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]);
            
            error_log("✅ MySQL connected successfully to {$host}:{$port}/{$dbname}");
        } catch (PDOException $e) {
            error_log("❌ MySQL connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("❌ Query failed: " . $e->getMessage());
            throw new Exception("Query failed: " . $e->getMessage());
        }
    }
    
    public function fetch($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollback() {
        return $this->connection->rollback();
    }
}

// Global helper functions - defined after class
if (!function_exists('getDBConnection')) {
    function getDBConnection() {
        return MySQLConnection::getInstance()->getConnection();
    }
}

if (!function_exists('dbQuery')) {
    function dbQuery($sql, $params = []) {
        return MySQLConnection::getInstance()->query($sql, $params);
    }
}

if (!function_exists('dbFetch')) {
    function dbFetch($sql, $params = []) {
        return MySQLConnection::getInstance()->fetch($sql, $params);
    }
}

if (!function_exists('dbFetchAll')) {
    function dbFetchAll($sql, $params = []) {
        return MySQLConnection::getInstance()->fetchAll($sql, $params);
    }
}

?>