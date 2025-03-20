<?php
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['user_id']) || empty($input['name']) || empty($input['data'])) {
        echo json_encode(['status' => 'error', 'message' => 'Données manquantes']);
        exit;
    }

    // Vérifier si les horaires sont présents, sinon utiliser les horaires par défaut
    $hours = isset($input['hours']) ? json_encode($input['hours']) : json_encode(['10h', '13h', '16h', '19h']);

    try {
        // Vérifier si le planning existe déjà
        $stmt = $pdo->prepare("SELECT id FROM plannings WHERE user_id = :user_id AND name = :name");
        $stmt->execute([
            ':user_id' => $input['user_id'],
            ':name' => $input['name']
        ]);
        $existingPlanning = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existingPlanning) {
            // Mettre à jour le planning existant
            $stmt = $pdo->prepare("
                UPDATE plannings
                SET data = :data, hours = :hours
                WHERE id = :id
            ");
            $stmt->execute([
                ':data' => json_encode($input['data']),
                ':hours' => $hours,
                ':id' => $existingPlanning['id']
            ]);
            $planningId = $existingPlanning['id'];
        } else {
            // Insérer un nouveau planning
            $stmt = $pdo->prepare("
                INSERT INTO plannings (user_id, name, data, hours)
                VALUES (:user_id, :name, :data, :hours)
            ");
            $stmt->execute([
                ':user_id' => $input['user_id'],
                ':name' => $input['name'],
                ':data' => json_encode($input['data']),
                ':hours' => $hours
            ]);
            $planningId = $pdo->lastInsertId();
        }

        echo json_encode(['status' => 'success', 'planning_id' => $planningId]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Erreur de sauvegarde : ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée']);
}
?>