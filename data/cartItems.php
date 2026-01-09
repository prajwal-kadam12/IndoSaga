<?php
/**
 * Cart Items Data Access Layer - MySQL Integration
 * Provides cart items data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    
    if (isset($_GET['userId'])) {
        return $db->getCartItems($_GET['userId']);
    } else {
        return [];
    }
} catch (Exception $e) {
    error_log("Error fetching cart items: " . $e->getMessage());
    return [];
}
?>