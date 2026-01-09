<?php
/**
 * Products Data Access Layer - MySQL Integration
 * Provides products data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    $filters = $_GET ?? []; // Allow filtering via query parameters
    return $db->getProducts($filters);
} catch (Exception $e) {
    error_log("Error fetching products: " . $e->getMessage());
    // Fallback to empty array if database connection fails
    return [];
}
?>