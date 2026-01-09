<?php
/**
 * Order Items Data Access Layer - MySQL Integration
 * Provides order items data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    
    if (isset($_GET['orderId'])) {
        $orderId = $_GET['orderId'];
        $items = $db->db->fetchAll(
            "SELECT oi.*, p.name as product_name, p.image_url as product_image 
             FROM order_items oi 
             JOIN products p ON oi.product_id = p.id 
             WHERE oi.order_id = ?",
            [$orderId]
        );
        return $items;
    } else {
        return [];
    }
} catch (Exception $e) {
    error_log("Error fetching order items: " . $e->getMessage());
    return [];
}
?>