<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Check if we are fetching for a specific student (Student Panel)
    $studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;
    
    // Check for search query (Teacher Panel)
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    
    // Check for sort (e.g., 'high_score', 'date')
    $sort = isset($_GET['sort']) ? $_GET['sort'] : 'date';

    $sql = "
        SELECT 
            r.*, 
            u.name as studentName, 
            q.title as quizTitle,
            (SELECT COUNT(*) FROM results r2 WHERE r2.student_id = r.student_id AND r2.quiz_id = r.quiz_id) as attempts
        FROM results r 
        JOIN users u ON r.student_id = u.id
        JOIN quizzes q ON r.quiz_id = q.id
        WHERE 1=1
    ";
    
    $params = [];

    if ($studentId) {
        $sql .= " AND r.student_id = ?";
        $params[] = $studentId;
    }

    if (!empty($search)) {
        $sql .= " AND (u.name LIKE ? OR q.title LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    // Sorting
    if ($sort === 'high_score') {
        $sql .= " ORDER BY r.score DESC";
    } else {
        // Default to date DESC
        $sql .= " ORDER BY r.submitted_at DESC";
    }

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Map snake_case to camelCase for frontend compatibility
        $formattedResults = [];
        foreach ($results as $r) {
            $formattedResults[] = [
                'id' => $r['id'],
                'quizId' => $r['quiz_id'],
                'studentId' => $r['student_id'],
                'studentName' => $r['studentName'], // Ensure no root name leaking here usually, assuming DB users are just students/teachers
                'quizTitle' => $r['quizTitle'],
                'score' => $r['score'],
                'correctAnswers' => $r['correct_answers'],
                'totalQuestions' => $r['total_questions'],
                'submittedAt' => $r['submitted_at'],
                'attempts' => $r['attempts']
            ];
        }
        echo json_encode($formattedResults);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }

} elseif ($method === 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (json_last_error() !== JSON_ERROR_NONE && !empty($input)) {
        echo json_encode(['error' => 'Invalid JSON input']);
        exit();
    }

    $quizId = $data->quizId;
    $studentId = $data->studentId;
    $score = $data->score;
    $correctAnswers = $data->correctAnswers;
    $totalQuestions = $data->totalQuestions;

    $stmt = $conn->prepare("INSERT INTO results (quiz_id, student_id, score, correct_answers, total_questions) VALUES (?, ?, ?, ?, ?)");
    if ($stmt->execute([$quizId, $studentId, $score, $correctAnswers, $totalQuestions])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Submission failed']);
    }
}
?>
