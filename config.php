<?php
// Database configuration
$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'farmproduce';

function db_connect() {
    global $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME;
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

function json_response($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function require_login() {
    if (!isset($_SESSION['user_id'])) {
        json_response(['success' => false, 'message' => 'Unauthorized'], 401);
    }
}

function require_role($roles) {
    $roles = is_array($roles) ? $roles : [$roles];
    if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], $roles, true)) {
        json_response(['success' => false, 'message' => 'Forbidden'], 403);
    }
}

function audit_log($conn, $action, $entityType, $entityId = null, $details = null) {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        return;
    }
    $adminId = (int) $_SESSION['user_id'];
    $stmt = $conn->prepare('INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)');
    $entityIdVal = $entityId !== null ? (int) $entityId : 0;
    $stmt->bind_param('issis', $adminId, $action, $entityType, $entityIdVal, $details);
    $stmt->execute();
}

function sanitize_text($value) {
    return trim(filter_var($value, FILTER_SANITIZE_STRING));
}

function is_valid_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
