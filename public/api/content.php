<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');

const CONTENT_AUTH_LIFETIME = 60 * 60 * 24 * 7;

ini_set('session.gc_maxlifetime', (string) CONTENT_AUTH_LIFETIME);
ini_set('session.use_strict_mode', '1');
session_name('physics_setup_access');
session_set_cookie_params([
    'lifetime' => CONTENT_AUTH_LIFETIME,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

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
$logout = ($payload['logout'] ?? false) === true;

if (
    ! in_array($type, ['post', 'page'], true)
    || ! is_string($slug)
    || ! preg_match('/^[a-z0-9][a-z0-9-]{0,199}$/', $slug)
    || ($password !== null && (! is_string($password) || strlen($password) > 512 || preg_match('/[\r\n]/', $password)))
    || ! filter_var($cmsApiUrl, FILTER_VALIDATE_URL)
    || ! str_starts_with($cmsApiUrl, 'https://')
) {
    http_response_code(422);
    echo json_encode(['code' => 'INVALID_REQUEST'], JSON_UNESCAPED_UNICODE);
    exit;
}

$sessionKey = hash('sha256', $type.':'.$slug);
$savedAuth = $_SESSION['protected_content'][$sessionKey] ?? null;

if ($logout) {
    unset($_SESSION['protected_content'][$sessionKey]);
    http_response_code(204);
    exit;
}

if (
    (! is_array($savedAuth))
    || ! isset($savedAuth['password'], $savedAuth['expires_at'])
    || ! is_string($savedAuth['password'])
    || ! is_int($savedAuth['expires_at'])
    || $savedAuth['expires_at'] <= time()
) {
    unset($_SESSION['protected_content'][$sessionKey]);
    $savedAuth = null;
}

$submittedPassword = is_string($password) ? $password : '';
$passwordToVerify = $submittedPassword !== ''
    ? $submittedPassword
    : ($savedAuth['password'] ?? '');

if ($passwordToVerify === '') {
    http_response_code(401);
    echo json_encode(['code' => 'AUTH_REQUIRED'], JSON_UNESCAPED_UNICODE);
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
        'X-Content-Password: '.$passwordToVerify,
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

if ($status === 401) {
    unset($_SESSION['protected_content'][$sessionKey]);
}

if ($status >= 200 && $status < 300) {
    if ($submittedPassword !== '') {
        session_regenerate_id(true);
    }
    $expiresAt = is_array($savedAuth) && $submittedPassword === ''
        ? $savedAuth['expires_at']
        : time() + CONTENT_AUTH_LIFETIME;
    $_SESSION['protected_content'][$sessionKey] = [
        'password' => $passwordToVerify,
        'expires_at' => $expiresAt,
    ];

    $decodedBody = json_decode((string) $body, true);
    if (is_array($decodedBody)) {
        $decodedBody['meta'] = array_merge(
            is_array($decodedBody['meta'] ?? null) ? $decodedBody['meta'] : [],
            ['authExpiresAt' => $expiresAt],
        );
        $body = json_encode($decodedBody, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}

http_response_code($status);
echo $body;
