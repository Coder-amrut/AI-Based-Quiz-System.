<?php
require_once 'db.php';

echo "Testing Quiz Status...\n";

try {
    // 1. Fetch all quizzes
    $stmt = $conn->prepare("SELECT id, title, status FROM quizzes");
    $stmt->execute();
    $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($quizzes)) {
        echo "No quizzes found.\n";
    } else {
        foreach ($quizzes as $q) {
            echo "Quiz ID: " . $q['id'] . " | Title: " . $q['title'] . " | Status: " . $q['status'] . "\n";
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
