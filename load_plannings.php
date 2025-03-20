<?php
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'];

    try {
        $stmt = $pdo->prepare('SELECT * FROM plannings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $plannings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'plannings' => $plannings]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Erreur de chargement : ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
}
?>