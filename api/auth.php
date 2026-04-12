<?php
require_once 'db.php';

$input = file_get_contents("php://input");
$data = json_decode($input);

if (json_last_error() !== JSON_ERROR_NONE && !empty($input)) {
    echo json_encode(['error' => 'Invalid JSON input']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_GET['action'])) {
        if ($_GET['action'] === 'register') {
            $name = $data->name;
            $email = $data->email;
            $password = $data->password; // In a real app, hash this!
            $role = $data->role;

            $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->rowCount() > 0) {
                echo json_encode(['error' => 'User already exists']);
                exit();
            }

            $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
            if ($stmt->execute([$name, $email, $password, $role])) {
                $id = $conn->lastInsertId();
                echo json_encode(['id' => $id, 'name' => $name, 'email' => $email, 'role' => $role]);
            } else {
                echo json_encode(['error' => 'Registration failed']);
            }
        } elseif ($_GET['action'] === 'login') {
            $email = $data->email;
            $password = $data->password;
            $role = $data->role;

            $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND password = ? AND role = ?");
            $stmt->execute([$email, $password, $role]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                unset($user['password']); // Don't send password back
                echo json_encode($user);
            } else {
                echo json_encode(['error' => 'Invalid credentials']);
            }
        }
    }
}
?>
