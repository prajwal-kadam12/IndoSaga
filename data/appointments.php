<?php
/**
 * Appointments Data Access Layer - MySQL Integration
 * Provides appointments data from MySQL database
 */

require_once __DIR__ . '/../database/mysql_operations.php';

try {
    $db = getMySQLOps();
    
    if (isset($_GET['userId'])) {
        $userId = $_GET['userId'];
        $appointments = $db->db->fetchAll(
            "SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date DESC",
            [$userId]
        );
        return $appointments;
    } else {
        return [];
    }
} catch (Exception $e) {
    error_log("Error fetching appointments: " . $e->getMessage());
    return [];
}
?>