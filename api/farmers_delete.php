<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role('admin');

$input = array_merge($_POST, read_json_input());
$id = isset($input['id']) ? (int) $input['id'] : 0;
$impact = isset($input['impact_action']) ? trim($input['impact_action']) : '';
$transferId = isset($input['transfer_farmer_id']) ? (int) $input['transfer_farmer_id'] : 0;

if ($id <= 0) {
    json_response(['success' => false, 'message' => 'Farmer ID required'], 400);
}

$conn = db_connect();
$check = $conn->prepare('SELECT id FROM users WHERE id = ? AND role = ? AND is_deleted = 0');
$role = 'farmer';
$check->bind_param('is', $id, $role);
$check->execute();
$check->store_result();
if ($check->num_rows === 0) {
    json_response(['success' => false, 'message' => 'Farmer not found'], 404);
}
$check->close();

if ($impact === 'transferProducts') {
    if ($transferId <= 0) {
        json_response(['success' => false, 'message' => 'Transfer farmer ID required'], 400);
    }
    $check = $conn->prepare('SELECT id FROM users WHERE id = ? AND role = ? AND is_deleted = 0');
    $check->bind_param('is', $transferId, $role);
    $check->execute();
    $check->store_result();
    if ($check->num_rows === 0) {
        json_response(['success' => false, 'message' => 'Transfer farmer not found'], 404);
    }
    $check->close();
    $stmt = $conn->prepare('UPDATE products SET farmer_id = ? WHERE farmer_id = ? AND is_deleted = 0');
    $stmt->bind_param('ii', $transferId, $id);
    $stmt->execute();
} elseif ($impact === 'disableProducts') {
    $stmt = $conn->prepare('UPDATE products SET status = ? WHERE farmer_id = ? AND is_deleted = 0');
    $status = 'unavailable';
    $stmt->bind_param('si', $status, $id);
    $stmt->execute();
} elseif ($impact === 'deleteAll') {
    $stmt = $conn->prepare('UPDATE products SET is_deleted = 1 WHERE farmer_id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
}

$stmt = $conn->prepare('UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = ?');
$stmt->bind_param('i', $id);
if ($stmt->execute()) {
    audit_log($conn, 'delete', 'farmer', $id, 'Farmer soft deleted');
    json_response(['success' => true, 'message' => 'Farmer deleted']);
}

json_response(['success' => false, 'message' => 'Farmer deletion failed'], 500);
