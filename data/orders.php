<?php
/**
 * Orders Data Access Layer - MySQL Integration
 * Provides orders data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    
    if (isset($_GET['userId'])) {
        return $db->getOrdersByUserId($_GET['userId']);
    } elseif (isset($_GET['id'])) {
        return $db->getOrderById($_GET['id']);
    } else {
        return [];
    }
} catch (Exception $e) {
    error_log("Error fetching orders: " . $e->getMessage());
    return [];
}
?>