<?php
/**
 * Categories Data Access Layer - MySQL Integration
 * Provides categories data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    return $db->getCategories();
} catch (Exception $e) {
    error_log("Error fetching categories: " . $e->getMessage());
    // Fallback to empty array if database connection fails
    return [];
}
?>