<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();

$input = array_merge($_POST, read_json_input());
$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if ($name === '' || $email === '') {
    json_response(['success' => false, 'message' => 'Name and email are required'], 400);
}

if (!is_valid_email($email)) {
    json_response(['success' => false, 'message' => 'Invalid email'], 400);
}

if ($password !== '' && strlen($password) < 8) {
    json_response(['success' => false, 'message' => 'Password must be at least 8 characters'], 400);
}

$conn = db_connect();
$checkEmail = $conn->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
$checkEmail->bind_param('si', $email, $_SESSION['user_id']);
$checkEmail->execute();
$checkEmail->store_result();
if ($checkEmail->num_rows > 0) {
    json_response(['success' => false, 'message' => 'Email already exists'], 400);
}
$checkEmail->close();

if ($password !== '') {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?');
    $stmt->bind_param('sssi', $name, $email, $hash, $_SESSION['user_id']);
} else {
    $stmt = $conn->prepare('UPDATE users SET name = ?, email = ? WHERE id = ?');
    $stmt->bind_param('ssi', $name, $email, $_SESSION['user_id']);
}

if ($stmt->execute()) {
    json_response(['success' => true, 'message' => 'Profile updated']);
}

json_response(['success' => false, 'message' => 'Profile update failed'], 500);
