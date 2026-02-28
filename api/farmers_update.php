<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role('admin');

$input = array_merge($_POST, read_json_input());
$id = isset($input['id']) ? (int) $input['id'] : 0;
$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';
$status = isset($input['status']) ? trim($input['status']) : '';

if ($id <= 0 || $name === '' || $email === '') {
    json_response(['success' => false, 'message' => 'Missing required fields'], 400);
}

if (!is_valid_email($email)) {
    json_response(['success' => false, 'message' => 'Invalid email'], 400);
}

if ($status !== '' && !in_array($status, ['active', 'suspended', 'verified'], true)) {
    json_response(['success' => false, 'message' => 'Invalid status'], 400);
}

if ($password !== '' && strlen($password) < 8) {
    json_response(['success' => false, 'message' => 'Password must be at least 8 characters'], 400);
}

$conn = db_connect();
$checkEmail = $conn->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
$checkEmail->bind_param('si', $email, $id);
$checkEmail->execute();
$checkEmail->store_result();
if ($checkEmail->num_rows > 0) {
    json_response(['success' => false, 'message' => 'Email already exists'], 400);
}
$checkEmail->close();

$check = $conn->prepare('SELECT id FROM users WHERE id = ? AND role = ? AND is_deleted = 0');
$role = 'farmer';
$check->bind_param('is', $id, $role);
$check->execute();
$check->store_result();
if ($check->num_rows === 0) {
    json_response(['success' => false, 'message' => 'Farmer not found'], 404);
}
$check->close();

if ($password !== '') {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    if ($status !== '') {
        $stmt = $conn->prepare('UPDATE users SET name = ?, email = ?, password_hash = ?, status = ? WHERE id = ?');
        $stmt->bind_param('ssssi', $name, $email, $hash, $status, $id);
    } else {
        $stmt = $conn->prepare('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?');
        $stmt->bind_param('sssi', $name, $email, $hash, $id);
    }
} else {
    if ($status !== '') {
        $stmt = $conn->prepare('UPDATE users SET name = ?, email = ?, status = ? WHERE id = ?');
        $stmt->bind_param('sssi', $name, $email, $status, $id);
    } else {
        $stmt = $conn->prepare('UPDATE users SET name = ?, email = ? WHERE id = ?');
        $stmt->bind_param('ssi', $name, $email, $id);
    }
}

if ($stmt->execute()) {
    audit_log($conn, 'update', 'farmer', $id, 'Farmer updated');
    json_response(['success' => true, 'message' => 'Farmer updated']);
}

json_response(['success' => false, 'message' => 'Farmer update failed'], 500);
