<?php
// Configuration
$target_url = 'http://172.32.0.13:3000';
$allowed_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
$timeout = 30;

// Set response headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get path from query parameter
$path = isset($_GET['path']) ? $_GET['path'] : '';

if (empty($path)) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'Missing path parameter']);
    exit;
}

// Build full URL
$query_string = http_build_query(array_diff_key($_GET, ['path' => '']));
$full_url = $target_url . '/' . ltrim($path, '/');
if (!empty($query_string)) {
    $full_url .= '?' . $query_string;
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, $allowed_methods)) {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Prepare headers to forward
$headers = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        $name_lower = strtolower($name);
        if (!in_array($name_lower, ['host', 'connection'])) {
            $headers[] = $name . ': ' . $value;
        }
    }
}

// Get request body
$body = file_get_contents('php://input');

// Prepare cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $full_url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_ENCODING, '');
curl_setopt($ch, CURLOPT_BINARYTRANSFER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

if (!empty($headers)) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}

if (!empty($body) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Execute
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    header('Content-Type: application/json');
    http_response_code(502);
    echo json_encode(['error' => 'Backend service error', 'details' => $curl_error]);
    exit;
}

http_response_code($http_code);
header('Content-Type: application/json');
echo $response;
?>
