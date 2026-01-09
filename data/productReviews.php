<?php
/**
 * Product Reviews Data Access Layer - MySQL Integration
 * Provides product reviews data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    
    if (isset($_GET['productId'])) {
        return $db->getProductReviews($_GET['productId']);
    } else {
        return [];
    }
} catch (Exception $e) {
    error_log("Error fetching product reviews: " . $e->getMessage());
    return [];
}
?>