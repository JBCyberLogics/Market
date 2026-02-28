<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('GET');
require_login();
require_role('farmer');

$conn = db_connect();
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$status = isset($_GET['status']) ? trim($_GET['status']) : '';

$sql = 'SELECT id, name, category, price_kes, quantity, quantity_label, description, image_url, status, updated_at
        FROM products WHERE farmer_id = ? AND is_deleted = 0';
$params = [$_SESSION['user_id']];
$types = 'i';

if ($search !== '') {
    $sql .= ' AND name LIKE ?';
    $params[] = '%' . $search . '%';
    $types .= 's';
}

if ($status !== '') {
    $sql .= ' AND status = ?';
    $params[] = $status;
    $types .= 's';
}

$sql .= ' ORDER BY updated_at DESC';
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();
$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

json_response($rows);
