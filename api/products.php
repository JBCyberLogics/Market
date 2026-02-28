<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('GET');

$conn = db_connect();
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$category = isset($_GET['category']) ? trim($_GET['category']) : '';
$minPrice = (isset($_GET['minPrice']) && $_GET['minPrice'] !== '') ? (float) $_GET['minPrice'] : null;
$maxPrice = (isset($_GET['maxPrice']) && $_GET['maxPrice'] !== '') ? (float) $_GET['maxPrice'] : null;
$status = isset($_GET['status']) ? trim($_GET['status']) : '';
$farmerId = isset($_GET['farmer_id']) ? (int) $_GET['farmer_id'] : 0;

$includeFarmer = isset($_GET['include_farmer']) && $_GET['include_farmer'] === '1';

if ($includeFarmer) {
    require_login();
    require_role(['admin', 'buyer', 'farmer']);
}

$sql = 'SELECT p.id, p.name, p.category, p.price_kes, p.quantity, p.quantity_label, p.description, p.image_url, p.status';
if ($includeFarmer) {
    $sql .= ', u.name AS farmer_name, u.id AS farmer_id';
}
$sql .= ' FROM products p';
if ($includeFarmer) {
    $sql .= ' JOIN users u ON u.id = p.farmer_id';
}
$sql .= ' WHERE p.is_deleted = 0';
$params = [];
$types = '';

if ($search !== '') {
    $sql .= ' AND p.name LIKE ?';
    $params[] = '%' . $search . '%';
    $types .= 's';
}

if ($category !== '') {
    $sql .= ' AND p.category = ?';
    $params[] = $category;
    $types .= 's';
}

if ($minPrice !== null) {
    $sql .= ' AND p.price_kes >= ?';
    $params[] = $minPrice;
    $types .= 'd';
}

if ($maxPrice !== null) {
    $sql .= ' AND p.price_kes <= ?';
    $params[] = $maxPrice;
    $types .= 'd';
}

if ($status !== '') {
    $sql .= ' AND p.status = ?';
    $params[] = $status;
    $types .= 's';
}

if ($includeFarmer && $farmerId > 0) {
    $sql .= ' AND p.farmer_id = ?';
    $params[] = $farmerId;
    $types .= 'i';
}

$stmt = $conn->prepare($sql);
if ($params) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();
$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = $row;
}

json_response($products);
