<?php
require_once 'db.php';

try {
    // Check if 'questions' column exists in 'quizzes' table
    $stmt = $conn->query("SHOW COLUMNS FROM quizzes LIKE 'questions'");
    $columnExists = $stmt->fetch();

    if ($columnExists) {
        echo "Column 'questions' already exists in 'quizzes'.\n";
    } else {
        echo "Column 'questions' does NOT exist. Adding it...\n";
        $conn->exec("ALTER TABLE quizzes ADD COLUMN questions JSON NOT NULL AFTER status");
        echo "Column added.\n";
    }

    // Check if 'questions' table exists
    $stmt = $conn->query("SHOW TABLES LIKE 'questions'");
    $tableExists = $stmt->fetch();

    if ($tableExists) {
        echo "Table 'questions' exists. You might want to drop it after verifying data migration.\n";
        // Optional: Migrate data here if needed, but for now just ensuring the column exists so the app works.
    } else {
        echo "Table 'questions' does not exist.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
