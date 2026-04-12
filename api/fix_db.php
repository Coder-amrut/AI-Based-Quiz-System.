<?php
require_once 'db.php';

header('Content-Type: application/json');

$response = ['success' => false, 'messages' => []];

function logMsg($msg) {
    global $response;
    $response['messages'][] = $msg;
}

try {
    // 1. Check/Add 'questions' column
    $stmt = $conn->query("SHOW COLUMNS FROM quizzes LIKE 'questions'");
    if (!$stmt->fetch()) {
        $conn->exec("ALTER TABLE quizzes ADD COLUMN questions JSON NOT NULL AFTER status");
        logMsg("Added 'questions' JSON column to 'quizzes' table.");
    } else {
        logMsg("'questions' column already exists.");
    }

    // 2. Check/Add 'results' table (just in case)
    $conn->exec("CREATE TABLE IF NOT EXISTS results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        student_id INT NOT NULL,
        score INT NOT NULL,
        correct_answers INT NOT NULL,
        total_questions INT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    logMsg("Verified 'results' table.");

    // 3. Clean up bad data (quizzes with no questions)
    // Optional: Set default empty array if null
    $conn->exec("UPDATE quizzes SET questions = '[]' WHERE questions IS NULL OR questions = ''");
    logMsg("Cleaned up empty question data.");

    $response['success'] = true;

} catch (Exception $e) {
    $response['error'] = $e->getMessage();
}

echo json_encode($response);
?>
