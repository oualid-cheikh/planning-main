<?php
require 'db.php';

header('Content-Type: application/json');

try {
    // Vérifier si la colonne hours existe déjà
    $stmt = $pdo->prepare("SHOW COLUMNS FROM plannings LIKE 'hours'");
    $stmt->execute();
    $columnExists = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$columnExists) {
        // Ajouter la colonne hours sans valeur par défaut
        $pdo->exec("ALTER TABLE `plannings` ADD COLUMN `hours` text NOT NULL AFTER `data`");
        
        // Mettre à jour les plannings existants avec les horaires par défaut
        $pdo->exec("UPDATE `plannings` SET `hours` = '[\"10h\",\"13h\",\"16h\",\"19h\"]' WHERE `hours` IS NULL OR `hours` = ''");
        
        echo json_encode(['status' => 'success', 'message' => 'Base de données mise à jour avec succès']);
    } else {
        echo json_encode(['status' => 'success', 'message' => 'La colonne hours existe déjà']);
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Erreur lors de la mise à jour de la base de données : ' . $e->getMessage()]);
}
?>
