<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role('admin');

$input = array_merge($_POST, read_json_input());
$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';
$status = isset($input['status']) ? trim($input['status']) : 'active';

if ($name === '' || $email === '' || $password === '') {
    json_response(['success' => false, 'message' => 'Missing required fields'], 400);
}

if (!is_valid_email($email)) {
    json_response(['success' => false, 'message' => 'Invalid email'], 400);
}

if (strlen($password) < 8) {
    json_response(['success' => false, 'message' => 'Password must be at least 8 characters'], 400);
}

if (!in_array($status, ['active', 'suspended', 'verified'], true)) {
    json_response(['success' => false, 'message' => 'Invalid status'], 400);
}

$conn = db_connect();
$check = $conn->prepare('SELECT id FROM users WHERE email = ?');
$check->bind_param('s', $email);
$check->execute();
$check->store_result();
if ($check->num_rows > 0) {
    json_response(['success' => false, 'message' => 'Email already exists'], 400);
}
$check->close();

$hash = password_hash($password, PASSWORD_DEFAULT);
$role = 'farmer';
$stmt = $conn->prepare('INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)');
$stmt->bind_param('sssss', $name, $email, $hash, $role, $status);

if ($stmt->execute()) {
    audit_log($conn, 'create', 'farmer', $stmt->insert_id, 'Farmer created');
    json_response(['success' => true, 'message' => 'Farmer created']);
}

json_response(['success' => false, 'message' => 'Farmer creation failed'], 500);
