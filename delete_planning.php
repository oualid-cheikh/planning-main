<?php
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['planning_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'ID du planning manquant']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM plannings WHERE id = ?');
        $stmt->execute([$input['planning_id']]);

        echo json_encode(['status' => 'success']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Erreur de suppression : ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
}
?>