<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role('buyer');

$input = array_merge($_POST, read_json_input());
$productId = isset($input['product_id']) ? (int) $input['product_id'] : 0;

if ($productId <= 0) {
    json_response(['success' => false, 'message' => 'Product ID required'], 400);
}

$conn = db_connect();
$stmt = $conn->prepare('DELETE FROM wishlist WHERE buyer_id = ? AND product_id = ?');
$stmt->bind_param('ii', $_SESSION['user_id'], $productId);
if ($stmt->execute()) {
    json_response(['success' => true, 'message' => 'Removed from wishlist']);
}

json_response(['success' => false, 'message' => 'Wishlist update failed'], 500);
