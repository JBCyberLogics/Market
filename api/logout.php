<?php
require_once __DIR__ . '/_bootstrap.php';
require_method('POST');

session_unset();
session_destroy();

json_response(['success' => true]);
