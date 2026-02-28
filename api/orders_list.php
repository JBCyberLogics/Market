<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('GET');
require_login();
require_role(['buyer', 'farmer', 'admin']);

$conn = db_connect();
$role = $_SESSION['role'];
$userId = (int) $_SESSION['user_id'];

if ($role === 'buyer') {
    $sql = 'SELECT o.id AS order_id, o.buyer_id, o.status, o.total_price_kes, o.created_at, i.product_id, p.name, i.quantity, i.price_kes, u.name AS farmer_name
            FROM orders o
            JOIN order_items i ON o.id = i.order_id
            JOIN products p ON p.id = i.product_id
            JOIN users u ON u.id = p.farmer_id
            WHERE o.buyer_id = ? AND o.is_deleted = 0 AND p.is_deleted = 0
            ORDER BY o.created_at DESC';
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $userId);
} elseif ($role === 'farmer') {
    $sql = 'SELECT o.id AS order_id, o.buyer_id, o.status, o.total_price_kes, o.created_at, u.name AS buyer_name, i.product_id, p.name, i.quantity, i.price_kes
            FROM orders o
            JOIN users u ON u.id = o.buyer_id
            JOIN order_items i ON o.id = i.order_id
            JOIN products p ON p.id = i.product_id
            WHERE p.farmer_id = ? AND o.is_deleted = 0 AND p.is_deleted = 0
            ORDER BY o.created_at DESC';
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $userId);
} else {
    $sql = 'SELECT o.id AS order_id, o.buyer_id, o.status, o.total_price_kes, o.created_at, u.name AS buyer_name, i.product_id, p.name, i.quantity, i.price_kes
            FROM orders o
            JOIN users u ON u.id = o.buyer_id
            JOIN order_items i ON o.id = i.order_id
            JOIN products p ON p.id = i.product_id
            WHERE o.is_deleted = 0 AND p.is_deleted = 0
            ORDER BY o.created_at DESC';
    $stmt = $conn->prepare($sql);
}

$stmt->execute();
$result = $stmt->get_result();
$orders = [];

while ($row = $result->fetch_assoc()) {
    $orderId = $row['order_id'];
    if (!isset($orders[$orderId])) {
        $orders[$orderId] = [
            'order_id' => (int) $row['order_id'],
            'buyer_id' => (int) $row['buyer_id'],
            'status' => $row['status'],
            'total_price_kes' => (float) $row['total_price_kes'],
            'created_at' => $row['created_at'],
            'buyer_name' => isset($row['buyer_name']) ? $row['buyer_name'] : null,
            'farmer_name' => isset($row['farmer_name']) ? $row['farmer_name'] : null,
            'items' => []
        ];
    }
    $orders[$orderId]['items'][] = [
        'product_id' => (int) $row['product_id'],
        'name' => $row['name'],
        'quantity' => (int) $row['quantity'],
        'price_kes' => (float) $row['price_kes']
    ];
}

json_response(array_values($orders));
