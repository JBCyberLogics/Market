<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role(['farmer', 'admin']);

$input = array_merge($_POST, read_json_input());
$name = isset($input['name']) ? trim(strip_tags($input['name'])) : '';
$category = isset($input['category']) ? trim(strip_tags($input['category'])) : '';
$price = isset($input['price_kes']) ? (float) $input['price_kes'] : null;
$quantity = isset($input['quantity']) ? (int) $input['quantity'] : null;
$quantityLabel = isset($input['quantity_label']) ? trim(strip_tags($input['quantity_label'])) : '';
$description = isset($input['description']) ? trim(strip_tags($input['description'])) : '';
$imageUrl = isset($input['image_url']) ? trim($input['image_url']) : '';
$status = isset($input['status']) ? trim($input['status']) : 'available';

if ($name === '' || $category === '' || $price === null || $quantity === null) {
    json_response(['success' => false, 'message' => 'Missing required fields'], 400);
}

if ($price <= 0) {
    json_response(['success' => false, 'message' => 'Price must be positive'], 400);
}

if ($quantity < 0) {
    json_response(['success' => false, 'message' => 'Quantity must be 0 or greater'], 400);
}

if (!in_array($status, ['available', 'unavailable'], true)) {
    json_response(['success' => false, 'message' => 'Invalid status'], 400);
}

$uploadPath = $imageUrl;
if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
    $tmpName = $_FILES['image_file']['tmp_name'];
    $original = basename($_FILES['image_file']['name']);
    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($ext, $allowed, true)) {
        json_response(['success' => false, 'message' => 'Invalid image type'], 400);
    }
    $filename = uniqid('prod_', true) . '.' . $ext;
    $targetDir = __DIR__ . '/../uploads';
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }
    $target = $targetDir . '/' . $filename;
    if (!move_uploaded_file($tmpName, $target)) {
        json_response(['success' => false, 'message' => 'Image upload failed'], 500);
    }
    $uploadPath = '/winnie/uploads/' . $filename;
}

$conn = db_connect();
$farmerId = $_SESSION['user_id'];
if ($_SESSION['role'] === 'admin' && isset($input['farmer_id'])) {
    $farmerId = (int) $input['farmer_id'];
}
$checkFarmer = $conn->prepare('SELECT id FROM users WHERE id = ? AND role = ? AND is_deleted = 0');
$farmerRole = 'farmer';
$checkFarmer->bind_param('is', $farmerId, $farmerRole);
$checkFarmer->execute();
$checkFarmer->store_result();
if ($checkFarmer->num_rows === 0) {
    json_response(['success' => false, 'message' => 'Farmer not found'], 404);
}
$checkFarmer->close();

$stmt = $conn->prepare('INSERT INTO products (farmer_id, name, category, price_kes, quantity, quantity_label, description, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->bind_param('issdissss', $farmerId, $name, $category, $price, $quantity, $quantityLabel, $description, $uploadPath, $status);

if ($stmt->execute()) {
    audit_log($conn, 'create', 'product', $stmt->insert_id, 'Product created');
    json_response(['success' => true, 'message' => 'Product created']);
}

json_response(['success' => false, 'message' => 'Product creation failed'], 500);
