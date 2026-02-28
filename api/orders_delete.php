<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role('admin');

$input = array_merge($_POST, read_json_input());
$orderId = isset($input['order_id']) ? (int) $input['order_id'] : 0;
if ($orderId <= 0) {
    json_response(['success' => false, 'message' => 'Order ID required'], 400);
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

$stmt = $conn->prepare('UPDATE orders SET is_deleted = 1 WHERE id = ?');
$stmt->bind_param('i', $orderId);
if ($stmt->execute()) {
    audit_log($conn, 'delete', 'order', $orderId, 'Order soft deleted');
    json_response(['success' => true, 'message' => 'Order deleted']);
}

json_response(['success' => false, 'message' => 'Order deletion failed'], 500);
