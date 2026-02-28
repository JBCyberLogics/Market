<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role('admin');

$input = array_merge($_POST, read_json_input());
$orderId = isset($input['order_id']) ? (int) $input['order_id'] : 0;
$newStatus = isset($input['status']) ? trim($input['status']) : '';
$total = isset($input['total_price_kes']) ? (float) $input['total_price_kes'] : null;

if ($orderId <= 0) {
    json_response(['success' => false, 'message' => 'Order ID required'], 400);
}

if ($newStatus !== '') {
    $allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!in_array($newStatus, $allowed, true)) {
        json_response(['success' => false, 'message' => 'Invalid status'], 400);
    }
}

$conn = db_connect();
$check = $conn->prepare('SELECT id FROM orders WHERE id = ? AND is_deleted = 0');
$check->bind_param('i', $orderId);
$check->execute();
$check->store_result();
if ($check->num_rows === 0) {
    json_response(['success' => false, 'message' => 'Order not found'], 404);
}
$check->close();

if ($newStatus !== '' && $total !== null) {
    $stmt = $conn->prepare('UPDATE orders SET status = ?, total_price_kes = ? WHERE id = ?');
    $stmt->bind_param('sdi', $newStatus, $total, $orderId);
} elseif ($newStatus !== '') {
    $stmt = $conn->prepare('UPDATE orders SET status = ? WHERE id = ?');
    $stmt->bind_param('si', $newStatus, $orderId);
} elseif ($total !== null) {
    $stmt = $conn->prepare('UPDATE orders SET total_price_kes = ? WHERE id = ?');
    $stmt->bind_param('di', $total, $orderId);
} else {
    json_response(['success' => false, 'message' => 'No changes provided'], 400);
}

if ($stmt->execute()) {
    audit_log($conn, 'update', 'order', $orderId, 'Order updated');
    json_response(['success' => true, 'message' => 'Order updated']);
}

json_response(['success' => false, 'message' => 'Order update failed'], 500);
