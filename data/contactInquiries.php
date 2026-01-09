<?php
/**
 * Contact Inquiries Data Access Layer - MySQL Integration
 * Provides contact inquiries data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    
    $inquiries = $db->db->fetchAll(
        "SELECT * FROM contact_inquiries ORDER BY created_at DESC"
    );
    return $inquiries;
} catch (Exception $e) {
    error_log("Error fetching contact inquiries: " . $e->getMessage());
    return [];
}
?>