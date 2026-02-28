<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role('admin');

$input = array_merge($_POST, read_json_input());
$id = isset($input['id']) ? (int) $input['id'] : 0;

if ($id <= 0) {
    json_response(['success' => false, 'message' => 'Category ID required'], 400);
}

$conn = db_connect();
$check = $conn->prepare('SELECT id FROM categories WHERE id = ? AND is_deleted = 0');
$check->bind_param('i', $id);
$check->execute();
$check->store_result();
if ($check->num_rows === 0) {
    json_response(['success' => false, 'message' => 'Category not found'], 404);
}
$check->close();

$stmt = $conn->prepare('UPDATE categories SET is_deleted = 1 WHERE id = ?');
$stmt->bind_param('i', $id);
if ($stmt->execute()) {
    audit_log($conn, 'delete', 'category', $id, 'Category soft deleted');
    json_response(['success' => true, 'message' => 'Category deleted']);
}

json_response(['success' => false, 'message' => 'Category deletion failed'], 500);
