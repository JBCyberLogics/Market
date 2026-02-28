<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');
require_login();
require_role(['buyer', 'admin']);

$input = array_merge($_POST, read_json_input());
$cartItems = isset($input['cartItems']) ? $input['cartItems'] : [];
$buyerId = $_SESSION['user_id'];
$status = isset($input['status']) ? trim($input['status']) : '';
if ($_SESSION['role'] === 'admin' && isset($input['buyer_id'])) {
    $buyerId = (int) $input['buyer_id'];
}

if ($_SESSION['role'] === 'admin' && !is_array($cartItems)) {
    $cartItems = [];
}

if (!is_array($cartItems) || count($cartItems) === 0) {
    if ($_SESSION['role'] === 'admin') {
        $productId = isset($input['product_id']) ? (int) $input['product_id'] : 0;
        $quantity = isset($input['quantity']) ? (int) $input['quantity'] : 0;
        if ($productId > 0 && $quantity > 0) {
            $cartItems = [[
                'product_id' => $productId,
                'quantity' => $quantity
            ]];
        }
    }
}

if (!is_array($cartItems) || count($cartItems) === 0) {
    json_response(['success' => false, 'message' => 'Cart items required'], 400);
}

$conn = db_connect();
$conn->begin_transaction();

try {
    $total = 0.0;
    $itemsData = [];

    foreach ($cartItems as $item) {
        $productId = isset($item['product_id']) ? (int) $item['product_id'] : 0;
        $quantity = isset($item['quantity']) ? (int) $item['quantity'] : 0;
        if ($productId <= 0 || $quantity <= 0) {
            throw new Exception('Invalid cart item');
        }

        $stmt = $conn->prepare('SELECT id, price_kes, quantity, status FROM products WHERE id = ? FOR UPDATE');
        $stmt->bind_param('i', $productId);
        $stmt->execute();
        $result = $stmt->get_result();
        $product = $result->fetch_assoc();
        if (!$product || $product['status'] !== 'available') {
            throw new Exception('Product unavailable');
        }
        if ((int) $product['quantity'] < $quantity) {
            throw new Exception('Insufficient quantity');
        }

        $line = ((float) $product['price_kes']) * $quantity;
        $total += $line;
        $itemsData[] = [
            'product_id' => $productId,
            'quantity' => $quantity,
            'price_kes' => (float) $product['price_kes']
        ];
    }

    $checkBuyer = $conn->prepare('SELECT id FROM users WHERE id = ? AND role = ? AND is_deleted = 0');
    $buyerRole = 'buyer';
    $checkBuyer->bind_param('is', $buyerId, $buyerRole);
    $checkBuyer->execute();
    $checkBuyer->store_result();
    if ($checkBuyer->num_rows === 0) {
        throw new Exception('Buyer not found');
    }
    $checkBuyer->close();

    $allowedStatus = ['pending', 'confirmed', 'completed', 'cancelled'];
    $useStatus = 'pending';
    if ($_SESSION['role'] === 'admin' && $status !== '' && in_array($status, $allowedStatus, true)) {
        $useStatus = $status;
    }

    if ($useStatus !== 'pending') {
        $stmt = $conn->prepare('INSERT INTO orders (buyer_id, status, total_price_kes) VALUES (?, ?, ?)');
        $stmt->bind_param('isd', $buyerId, $useStatus, $total);
    } else {
        $stmt = $conn->prepare('INSERT INTO orders (buyer_id, total_price_kes) VALUES (?, ?)');
        $stmt->bind_param('id', $buyerId, $total);
    }
    if (!$stmt->execute()) {
        throw new Exception('Order creation failed');
    }
    $orderId = $stmt->insert_id;

    foreach ($itemsData as $item) {
        $stmt = $conn->prepare('INSERT INTO order_items (order_id, product_id, quantity, price_kes) VALUES (?, ?, ?, ?)');
        $stmt->bind_param('iiid', $orderId, $item['product_id'], $item['quantity'], $item['price_kes']);
        if (!$stmt->execute()) {
            throw new Exception('Order item creation failed');
        }

        $stmt = $conn->prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
        $stmt->bind_param('ii', $item['quantity'], $item['product_id']);
        if (!$stmt->execute()) {
            throw new Exception('Failed to update inventory');
        }
    }

    $conn->commit();
    audit_log($conn, 'create', 'order', $orderId, 'Order created');
    json_response(['success' => true, 'order_id' => $orderId, 'message' => 'Order placed']);
} catch (Exception $e) {
    $conn->rollback();
    json_response(['success' => false, 'message' => $e->getMessage()], 400);
}
