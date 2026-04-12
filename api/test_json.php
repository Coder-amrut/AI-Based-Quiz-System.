<?php
require_once 'db.php';

// 1. Create a Quiz with JSON questions
echo "Creating Quiz...\n";
$quizData = [
    'teacherId' => 1, // Assuming user 1 exists
    'title' => 'JSON Test Quiz',
    'topic' => 'Testing',
    'timer' => 10,
    'password' => '123',
    'questions' => [
        [
            'text' => 'What is JSON?',
            'options' => ['A' => 'Format', 'B' => 'Language', 'C' => 'Database', 'D' => 'OS'],
            'correct' => 'A'
        ],
        [
            'text' => 'Is this working?',
            'options' => ['A' => 'Yes', 'B' => 'No', 'C' => 'Maybe', 'D' => 'Unknown'],
            'correct' => 'A'
        ]
    ]
];

// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'create';
// Mock input stream for file_get_contents('php://input') - tricky in script, so let's just modify quizzes.php temporarily or use curl.
// Actually, let's just use the logic directly since we have db.php included.

try {
    $questionsJson = json_encode($quizData['questions']);
    $stmt = $conn->prepare("INSERT INTO quizzes (teacher_id, title, topic, timer, password, questions) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $quizData['teacherId'], 
        $quizData['title'], 
        $quizData['topic'], 
        $quizData['timer'], 
        $quizData['password'], 
        $questionsJson
    ]);
    $quizId = $conn->lastInsertId();
    echo "Quiz Created with ID: $quizId\n";

    // 2. Fetch the Quiz
    echo "Fetching Quiz...\n";
    $stmt = $conn->prepare("SELECT * FROM quizzes WHERE id = ?");
    $stmt->execute([$quizId]);
    $quiz = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "Raw Questions from DB: " . $quiz['questions'] . "\n";
    
    $decoded = json_decode($quiz['questions'], true);
    if (count($decoded) === 2 && $decoded[0]['text'] === 'What is JSON?') {
        echo "SUCCESS: Questions decoded correctly.\n";
    } else {
        echo "FAILURE: Questions did not match.\n";
    }

    // Cleanup
    $conn->prepare("DELETE FROM quizzes WHERE id = ?")->execute([$quizId]);
    echo "Cleanup done.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
