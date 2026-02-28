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
$check = $conn->prepare('SELECT id FROM products WHERE id = ? AND is_deleted = 0');
$check->bind_param('i', $productId);
$check->execute();
$check->store_result();
if ($check->num_rows === 0) {
    json_response(['success' => false, 'message' => 'Product not found'], 404);
}
$check->close();

$stmt = $conn->prepare('SELECT id FROM wishlist WHERE buyer_id = ? AND product_id = ?');
$stmt->bind_param('ii', $_SESSION['user_id'], $productId);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    json_response(['success' => true, 'message' => 'Already in wishlist']);
}
$stmt->close();

$stmt = $conn->prepare('INSERT INTO wishlist (buyer_id, product_id) VALUES (?, ?)');
$stmt->bind_param('ii', $_SESSION['user_id'], $productId);
if ($stmt->execute()) {
    json_response(['success' => true, 'message' => 'Added to wishlist']);
}

json_response(['success' => false, 'message' => 'Wishlist update failed'], 500);
