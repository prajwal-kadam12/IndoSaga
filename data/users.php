<?php
/**
 * Users Data Access Layer - MySQL Integration
 * Provides users data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    
    // Handle different operations based on request
    if (isset($_GET['id'])) {
        return $db->getUserById($_GET['id']);
    } elseif (isset($_GET['email'])) {
        return $db->getUserByEmail($_GET['email']);
    } else {
        // Return empty array - users should be accessed individually for security
        return [];
    }
} catch (Exception $e) {
    error_log("Error fetching users: " . $e->getMessage());
    return null;
}
?>