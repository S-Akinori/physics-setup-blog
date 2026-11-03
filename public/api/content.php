<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['code' => 'METHOD_NOT_ALLOWED'], JSON_UNESCAPED_UNICODE);
    exit;
}

$configPath = __DIR__.'/config.php';
if (! is_file($configPath)) {
    http_response_code(503);
    echo json_encode(['code' => 'PROXY_NOT_CONFIGURED'], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configPath;
$cmsApiUrl = rtrim((string) ($config['cms_api_url'] ?? ''), '/');
$payload = json_decode((string) file_get_contents('php://input'), true);
$type = $payload['type'] ?? null;
$slug = $payload['slug'] ?? null;
$password = $payload['password'] ?? null;

if (
    ! in_array($type, ['post', 'page'], true)
    || ! is_string($slug)
    || ! preg_match('/^[a-z0-9][a-z0-9-]{0,199}$/', $slug)
    || ! is_string($password)
    || $password === ''
    || strlen($password) > 512
    || preg_match('/[\r\n]/', $password)
    || ! filter_var($cmsApiUrl, FILTER_VALIDATE_URL)
    || ! str_starts_with($cmsApiUrl, 'https://')
) {
    http_response_code(422);
    echo json_encode(['code' => 'INVALID_REQUEST'], JSON_UNESCAPED_UNICODE);
    exit;
}

$endpoint = $type === 'page' ? 'pages' : 'posts';
$curl = curl_init($cmsApiUrl.'/api/v1/'.$endpoint.'/'.rawurlencode($slug));
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'X-Content-Password: '.$password,
    ],
]);

$body = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$error = curl_error($curl);
curl_close($curl);

if ($body === false || $status === 0) {
    error_log('CMS protected-content proxy failed: '.$error);
    http_response_code(502);
    echo json_encode(['code' => 'CMS_UNAVAILABLE'], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code($status);
echo $body;
