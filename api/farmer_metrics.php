<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('GET');
require_login();
require_role('farmer');

$conn = db_connect();
$farmerId = (int) $_SESSION['user_id'];
$lowStockThreshold = 10;

$totalProducts = 0;
$lowStockCount = 0;
$activeOrders = 0;
$todayEarnings = 0.0;
$weeklyEarnings = 0.0;
$monthlyEarnings = 0.0;

$stmt = $conn->prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN quantity <= ? THEN 1 ELSE 0 END) AS low_stock FROM products WHERE farmer_id = ? AND is_deleted = 0');
$stmt->bind_param('ii', $lowStockThreshold, $farmerId);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
if ($result) {
    $totalProducts = (int) $result['total'];
    $lowStockCount = (int) $result['low_stock'];
}

$stmt = $conn->prepare('SELECT COUNT(DISTINCT o.id) AS active_orders
    FROM orders o
    JOIN order_items i ON o.id = i.order_id
    JOIN products p ON p.id = i.product_id
    WHERE p.farmer_id = ? AND o.is_deleted = 0 AND o.status IN ("pending", "confirmed")');
$stmt->bind_param('i', $farmerId);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
if ($result) {
    $activeOrders = (int) $result['active_orders'];
}

$stmt = $conn->prepare('SELECT o.created_at, i.quantity, i.price_kes
    FROM orders o
    JOIN order_items i ON o.id = i.order_id
    JOIN products p ON p.id = i.product_id
    WHERE p.farmer_id = ? AND o.is_deleted = 0 AND o.status != "cancelled"');
$stmt->bind_param('i', $farmerId);
$stmt->execute();
$result = $stmt->get_result();
$now = new DateTime('now');
$today = $now->format('Y-m-d');
while ($row = $result->fetch_assoc()) {
    $line = ((float) $row['price_kes']) * ((int) $row['quantity']);
    $created = new DateTime($row['created_at']);
    $createdDate = $created->format('Y-m-d');
    if ($createdDate === $today) {
        $todayEarnings += $line;
    }
    $diff = $now->diff($created)->days;
    if ($diff <= 7) {
        $weeklyEarnings += $line;
    }
    if ($diff <= 30) {
        $monthlyEarnings += $line;
    }
}

json_response([
    'totalProducts' => $totalProducts,
    'activeOrders' => $activeOrders,
    'todayEarnings' => $todayEarnings,
    'weeklyEarnings' => $weeklyEarnings,
    'monthlyEarnings' => $monthlyEarnings,
    'lowStockCount' => $lowStockCount,
    'lowStockThreshold' => $lowStockThreshold
]);
