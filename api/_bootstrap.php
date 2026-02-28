<?php
session_start();
require_once __DIR__ . '/../config.php';

function read_json_input() {
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_method($method) {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_response(['success' => false, 'message' => 'Invalid method'], 405);
    }
}
