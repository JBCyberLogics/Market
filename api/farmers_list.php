<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('GET');
require_login();
require_role('admin');

$conn = db_connect();
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$status = isset($_GET['status']) ? trim($_GET['status']) : '';

$sql = 'SELECT u.id, u.name, u.email, u.status, u.created_at,
        (SELECT COUNT(*) FROM products p WHERE p.farmer_id = u.id AND p.is_deleted = 0) AS products_count
        FROM users u WHERE u.role = ? AND u.is_deleted = 0';
$params = ['farmer'];
$types = 's';

if ($search !== '') {
    $sql .= ' AND (u.name LIKE ? OR u.email LIKE ?)';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
    $types .= 'ss';
}

if ($status !== '') {
    $sql .= ' AND u.status = ?';
    $params[] = $status;
    $types .= 's';
}

$sql .= ' ORDER BY u.created_at DESC';
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();
$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'contact' => $row['email'],
        'status' => $row['status'],
        'products_count' => (int) $row['products_count'],
        'created_at' => $row['created_at']
    ];
}

json_response($rows);
