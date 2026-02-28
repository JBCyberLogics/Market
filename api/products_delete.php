<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role(['farmer', 'admin']);

$input = array_merge($_POST, read_json_input());
$productId = isset($input['product_id']) ? (int) $input['product_id'] : 0;
if ($productId <= 0) {
    json_response(['success' => false, 'message' => 'Product ID required'], 400);
}

$conn = db_connect();
if ($_SESSION['role'] !== 'admin') {
    $check = $conn->prepare('SELECT id FROM products WHERE id = ? AND farmer_id = ?');
    $check->bind_param('ii', $productId, $_SESSION['user_id']);
    $check->execute();
    $check->store_result();
    if ($check->num_rows === 0) {
        json_response(['success' => false, 'message' => 'Product not found'], 404);
    }
    $check->close();
}

$stmt = $conn->prepare('UPDATE products SET is_deleted = 1 WHERE id = ?');
$stmt->bind_param('i', $productId);
if ($stmt->execute()) {
    audit_log($conn, 'delete', 'product', $productId, 'Product soft deleted');
    json_response(['success' => true, 'message' => 'Product deleted']);
}

json_response(['success' => false, 'message' => 'Product deletion failed'], 500);
