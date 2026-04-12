<?php
require_once 'db.php';

// Mock Data
$quizId = 1; // Assuming quiz 1 exists
$studentId = 1; // Assuming student 1 exists
$score = 80;
$correctAnswers = 4;
$totalQuestions = 5;

echo "Testing Result Submission...\n";

try {
    // 1. Check if Quiz and Student exist (Foreign Key Check)
    $stmt = $conn->prepare("SELECT id FROM quizzes WHERE id = ?");
    $stmt->execute([$quizId]);
    if (!$stmt->fetch()) {
        echo "Error: Quiz ID $quizId does not exist. Please create a quiz first.\n";
        // Attempt to create a dummy quiz if needed, but let's just fail for now to see if this is the issue.
    }

    $stmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$studentId]);
    if (!$stmt->fetch()) {
        echo "Error: Student ID $studentId does not exist.\n";
    }

    // 2. Insert Result
    $stmt = $conn->prepare("INSERT INTO results (quiz_id, student_id, score, correct_answers, total_questions) VALUES (?, ?, ?, ?, ?)");
    if ($stmt->execute([$quizId, $studentId, $score, $correctAnswers, $totalQuestions])) {
        echo "Success: Result inserted.\n";
        $id = $conn->lastInsertId();
        
        // Cleanup
        $conn->exec("DELETE FROM results WHERE id = $id");
        echo "Cleanup done.\n";
    } else {
        echo "Failure: Could not insert result.\n";
        print_r($stmt->errorInfo());
    }

} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
?>
