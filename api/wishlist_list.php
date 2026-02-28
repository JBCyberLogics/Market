<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('GET');
require_login();
require_role('buyer');

$conn = db_connect();
$sql = 'SELECT w.id, w.product_id, w.created_at, p.name, p.category, p.price_kes, p.image_url, p.status
        FROM wishlist w
        JOIN products p ON p.id = w.product_id
        WHERE w.buyer_id = ? AND p.is_deleted = 0
        ORDER BY w.created_at DESC';
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();
$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

json_response($rows);
