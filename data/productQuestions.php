<?php
/**
 * Product Questions Data Access Layer - MySQL Integration
 * Provides product questions data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    
    if (isset($_GET['productId'])) {
        return $db->getProductQuestions($_GET['productId']);
    } else {
        return [];
    }
} catch (Exception $e) {
    error_log("Error fetching product questions: " . $e->getMessage());
    return [];
}
?>