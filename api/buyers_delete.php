<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role('admin');

$input = array_merge($_POST, read_json_input());
$id = isset($input['id']) ? (int) $input['id'] : 0;

if ($id <= 0) {
    json_response(['success' => false, 'message' => 'Buyer ID required'], 400);
}

$conn = db_connect();
$check = $conn->prepare('SELECT id FROM users WHERE id = ? AND role = ? AND is_deleted = 0');
$role = 'buyer';
$check->bind_param('is', $id, $role);
$check->execute();
$check->store_result();
if ($check->num_rows === 0) {
    json_response(['success' => false, 'message' => 'Buyer not found'], 404);
}
$check->close();

$stmt = $conn->prepare('UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = ?');
$stmt->bind_param('i', $id);
if ($stmt->execute()) {
    audit_log($conn, 'delete', 'buyer', $id, 'Buyer soft deleted');
    json_response(['success' => true, 'message' => 'Buyer deleted']);
}

json_response(['success' => false, 'message' => 'Buyer deletion failed'], 500);
