<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('GET');
require_login();
require_role('admin');

$conn = db_connect();
$sql = 'SELECT c.id, c.name,
        (SELECT COUNT(*) FROM products p WHERE p.category = c.name AND p.is_deleted = 0) AS products_count
        FROM categories c WHERE c.is_deleted = 0 ORDER BY c.name ASC';
$result = $conn->query($sql);
$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'products_count' => (int) $row['products_count']
    ];
}

json_response($rows);
