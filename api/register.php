<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');

$input = array_merge($_POST, read_json_input());
$name = isset($input['name']) ? trim(strip_tags($input['name'])) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';
$role = isset($input['role']) ? trim($input['role']) : '';

if ($name === '' || $email === '' || $password === '' || $role === '') {
    json_response(['success' => false, 'message' => 'All fields are required'], 400);
}

if (!is_valid_email($email)) {
    json_response(['success' => false, 'message' => 'Invalid email format'], 400);
}

if (strlen($password) < 8) {
    json_response(['success' => false, 'message' => 'Password must be at least 8 characters'], 400);
}

if (!in_array($role, ['farmer', 'buyer'], true)) {
    json_response(['success' => false, 'message' => 'Invalid role'], 400);
}

$conn = db_connect();
$stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    json_response(['success' => false, 'message' => 'Email already registered'], 409);
}
$stmt->close();

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
$stmt->bind_param('ssss', $name, $email, $hash, $role);

if ($stmt->execute()) {
    json_response(['success' => true, 'message' => 'Registration successful']);
}

json_response(['success' => false, 'message' => 'Registration failed'], 500);
