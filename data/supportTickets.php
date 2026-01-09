<?php
/**
 * Support Tickets Data Access Layer - MySQL Integration
 * Provides support tickets data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    
    if (isset($_GET['userId'])) {
        $userId = $_GET['userId'];
        $tickets = $db->db->fetchAll(
            "SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC",
            [$userId]
        );
        return $tickets;
    } else {
        return [];
    }
} catch (Exception $e) {
    error_log("Error fetching support tickets: " . $e->getMessage());
    return [];
}
?>