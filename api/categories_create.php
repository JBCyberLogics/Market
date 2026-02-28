<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role('admin');

$input = array_merge($_POST, read_json_input());
$name = isset($input['name']) ? trim($input['name']) : '';

if ($name === '') {
    json_response(['success' => false, 'message' => 'Category name required'], 400);
}

$conn = db_connect();
$check = $conn->prepare('SELECT id FROM categories WHERE name = ? AND is_deleted = 0');
$check->bind_param('s', $name);
$check->execute();
$check->store_result();
if ($check->num_rows > 0) {
    json_response(['success' => false, 'message' => 'Category already exists'], 400);
}
$check->close();

$stmt = $conn->prepare('INSERT INTO categories (name) VALUES (?)');
$stmt->bind_param('s', $name);
if ($stmt->execute()) {
    audit_log($conn, 'create', 'category', $stmt->insert_id, 'Category created');
    json_response(['success' => true, 'message' => 'Category created']);
}

json_response(['success' => false, 'message' => 'Category creation failed'], 500);
