<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role('buyer');

$input = array_merge($_POST, read_json_input());
$orderId = isset($input['order_id']) ? (int) $input['order_id'] : 0;
if ($orderId <= 0) {
    json_response(['success' => false, 'message' => 'Order ID required'], 400);
}

$conn = db_connect();
$check = $conn->prepare('SELECT id, status FROM orders WHERE id = ? AND buyer_id = ? AND is_deleted = 0');
$check->bind_param('ii', $orderId, $_SESSION['user_id']);
$check->execute();
$result = $check->get_result()->fetch_assoc();
if (!$result) {
    json_response(['success' => false, 'message' => 'Order not found'], 404);
}

if (!in_array($result['status'], ['pending', 'confirmed'], true)) {
    json_response(['success' => false, 'message' => 'Order cannot be cancelled'], 400);
}

$stmt = $conn->prepare('UPDATE orders SET status = ? WHERE id = ?');
$status = 'cancelled';
$stmt->bind_param('si', $status, $orderId);
if ($stmt->execute()) {
    json_response(['success' => true, 'message' => 'Order cancelled']);
}

json_response(['success' => false, 'message' => 'Order cancel failed'], 500);
