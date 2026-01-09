<?php
/**
 * Subcategories Data Access Layer - MySQL Integration
 * Provides subcategories data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    $categoryId = $_GET['categoryId'] ?? null;
    return $db->getSubcategories($categoryId);
} catch (Exception $e) {
    error_log("Error fetching subcategories: " . $e->getMessage());
    // Fallback to empty array if database connection fails
    return [];
}
?>