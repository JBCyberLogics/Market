<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('GET');
require_login();

$conn = db_connect();
$stmt = $conn->prepare('SELECT id, name, email, role, status FROM users WHERE id = ? AND is_deleted = 0');
$stmt->bind_param('i', $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
if (!$user) {
    json_response(['success' => false, 'message' => 'User not found'], 404);
}

json_response(['success' => true, 'user' => $user]);
