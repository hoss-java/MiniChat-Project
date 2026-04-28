<?php
$target_url = 'http://172.32.0.13:3000';

// Get path from query parameter
$path = isset($_GET['path']) ? '/' . $_GET['path'] : '/';
$request_method = $_SERVER['REQUEST_METHOD'];

// Build full target URL
$full_url = $target_url . $path;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $full_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_ENCODING, '');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $request_method);

$headers = [];
foreach (getallheaders() as $name => $value) {
    if (!in_array(strtolower($name), ['host', 'connection', 'content-length'])) {
        $headers[] = $name . ': ' . $value;
    }
}
$headers[] = 'Host: 172.32.0.13:3000';
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

if (in_array($request_method, ['POST', 'PUT', 'PATCH'])) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

curl_close($ch);

http_response_code($http_code);
if ($content_type) {
    header('Content-Type: ' . $content_type);
}

// Rewrite links in HTML
if (strpos($content_type, 'text/html') !== false) {
    $proxy_base = 'http://localhost:3280/sites/minichat/webclientv1/minichat.php?path=';
    $response = str_replace('src="/', 'src="' . $proxy_base, $response);
    $response = str_replace('href="/', 'href="' . $proxy_base, $response);
    $response = str_replace('src=\'/', 'src=\'' . $proxy_base, $response);
    $response = str_replace('href=\'/', 'href=\'' . $proxy_base, $response);
}

echo $response;
?>
