<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role(['farmer', 'admin']);

$input = array_merge($_POST, read_json_input());
$orderId = isset($input['order_id']) ? (int) $input['order_id'] : 0;
$newStatus = isset($input['new_status']) ? trim($input['new_status']) : '';

if ($orderId <= 0 || $newStatus === '') {
    json_response(['success' => false, 'message' => 'Order ID and status required'], 400);
}

$allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
if (!in_array($newStatus, $allowed, true)) {
    json_response(['success' => false, 'message' => 'Invalid status'], 400);
}

$conn = db_connect();
if ($_SESSION['role'] !== 'admin') {
    $check = $conn->prepare('SELECT o.id FROM orders o JOIN order_items i ON o.id = i.order_id JOIN products p ON p.id = i.product_id WHERE o.id = ? AND p.farmer_id = ? AND o.is_deleted = 0 LIMIT 1');
    $check->bind_param('ii', $orderId, $_SESSION['user_id']);
    $check->execute();
    $check->store_result();
    if ($check->num_rows === 0) {
        json_response(['success' => false, 'message' => 'Order not found'], 404);
    }
    $check->close();
} else {
    $check = $conn->prepare('SELECT id FROM orders WHERE id = ? AND is_deleted = 0');
    $check->bind_param('i', $orderId);
    $check->execute();
    $check->store_result();
    if ($check->num_rows === 0) {
        json_response(['success' => false, 'message' => 'Order not found'], 404);
    }
    $check->close();
}

$stmt = $conn->prepare('UPDATE orders SET status = ? WHERE id = ?');
$stmt->bind_param('si', $newStatus, $orderId);
if ($stmt->execute()) {
    audit_log($conn, 'update', 'order', $orderId, 'Order status updated');
    json_response(['success' => true, 'message' => 'Order status updated']);
}

json_response(['success' => false, 'message' => 'Status update failed'], 500);
