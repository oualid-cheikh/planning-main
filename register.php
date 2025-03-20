<?php
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $required = ['name', 'family_name', 'username', 'password'];
    foreach ($required as $field) {
        if (empty($_POST[$field])) {
            echo json_encode(['status' => 'error', 'message' => 'Tous les champs sont requis']);
            exit;
        }
    }

    $name = trim($_POST['name']);
    $family_name = trim($_POST['family_name']);
    $username = trim($_POST['username']);
    $password = password_hash($_POST['password'], PASSWORD_BCRYPT);

    try {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            echo json_encode(['status' => 'error', 'message' => 'Nom d\'utilisateur déjà pris']);
            exit;
        }


        $stmt = $pdo->prepare('INSERT INTO users (name, family_name, username, password) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $family_name, $username, $password]);

        echo json_encode(['status' => 'success', 'message' => 'Inscription réussie']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Erreur de base de données']);
    }
}
?>