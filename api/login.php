<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');

$input = array_merge($_POST, read_json_input());
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';
$role = isset($input['role']) ? trim($input['role']) : '';

if ($email === '' || $password === '') {
    json_response(['success' => false, 'message' => 'Email and password are required'], 400);
}

if ($role === '') {
    json_response(['success' => false, 'message' => 'Role selection is required'], 400);
}

if (!in_array($role, ['farmer', 'buyer', 'admin'], true)) {
    json_response(['success' => false, 'message' => 'Invalid role selection'], 400);
}

$conn = db_connect();
$stmt = $conn->prepare('SELECT id, name, password_hash, role, status, is_deleted FROM users WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_response(['success' => false, 'message' => 'Invalid credentials'], 401);
}

if ((int) $user['is_deleted'] === 1) {
    json_response(['success' => false, 'message' => 'Account is not available'], 403);
}

if ($user['status'] === 'suspended') {
    json_response(['success' => false, 'message' => 'Account is suspended'], 403);
}

if ($user['role'] !== $role) {
    json_response(['success' => false, 'message' => 'Selected role does not match this account'], 403);
}

$_SESSION['user_id'] = (int) $user['id'];
$_SESSION['role'] = $user['role'];
$_SESSION['name'] = $user['name'];

json_response([
    'success' => true,
    'message' => 'Login successful',
    'role' => $user['role'],
    'name' => $user['name']
]);
