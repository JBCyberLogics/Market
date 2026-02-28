<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('GET');

$conn = db_connect();
$sql = 'SELECT id, name FROM categories WHERE is_deleted = 0 ORDER BY name ASC';
$result = $conn->query($sql);
$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = [
        'id' => (int) $row['id'],
        'name' => $row['name']
    ];
}

json_response($rows);
