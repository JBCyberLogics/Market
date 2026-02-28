<?php
require_once __DIR__ . '/config.php';

$adminName = 'Admin Winnie';
$adminEmail = 'winnie@gmail.com';
$adminPassword = 'winnie$##1';
$adminRole = 'admin';
$adminStatus = 'verified';

$conn = db_connect();

$stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
$stmt->bind_param('s', $adminEmail);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    $stmt->close();
    $hash = password_hash($adminPassword, PASSWORD_DEFAULT);
    $update = $conn->prepare('UPDATE users SET name = ?, password_hash = ?, role = ?, status = ?, is_deleted = 0, deleted_at = NULL WHERE email = ?');
    $update->bind_param('sssss', $adminName, $hash, $adminRole, $adminStatus, $adminEmail);
    if ($update->execute()) {
        echo 'Admin updated successfully';
        exit;
    }
    echo 'Failed to update admin';
    exit;
}
$stmt->close();

$hash = password_hash($adminPassword, PASSWORD_DEFAULT);
$stmt = $conn->prepare('INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)');
$stmt->bind_param('sssss', $adminName, $adminEmail, $hash, $adminRole, $adminStatus);
if ($stmt->execute()) {
    echo 'Admin seeded successfully';
    exit;
}

echo 'Failed to seed admin';
