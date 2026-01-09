<?php
/**
 * Wishlist Items Data Access Layer - MySQL Integration
 * Provides wishlist items data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    
    if (isset($_GET['userId'])) {
        return $db->getWishlistItems($_GET['userId']);
    } else {
        return [];
    }
} catch (Exception $e) {
    error_log("Error fetching wishlist items: " . $e->getMessage());
    return [];
}
?>