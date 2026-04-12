<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $conn->prepare("
        SELECT q.*, u.name as teacherName 
        FROM quizzes q 
        JOIN users u ON q.teacher_id = u.id
    ");
    $stmt->execute();
    $quizzes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch questions for each quiz (inefficient but simple for now)
    foreach ($quizzes as &$quiz) {
        $stmt = $conn->prepare("SELECT * FROM questions WHERE quiz_id = ?");
        $stmt->execute([$quiz['id']]);
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format questions to match frontend structure
        $formattedQuestions = [];
        foreach ($questions as $q) {
            $formattedQuestions[] = [
                'text' => $q['text'],
                'options' => [
                    'A' => $q['option_a'],
                    'B' => $q['option_b'],
                    'C' => $q['option_c'],
                    'D' => $q['option_d']
                ],
                'correct' => $q['correct_option']
            ];
        }
        $quiz['questions'] = $formattedQuestions;
        // Map teacherName to teacherName (already done in SQL)
        // Map teacher_id to teacherId
        $quiz['teacherId'] = $quiz['teacher_id'];
    }

    echo json_encode($quizzes);
} elseif ($method === 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (json_last_error() !== JSON_ERROR_NONE && !empty($input)) {
        echo json_encode(['error' => 'Invalid JSON input']);
        exit();
    }

    if (isset($_GET['action']) && $_GET['action'] === 'create') {
        $teacherId = $data->teacherId;
        $title = $data->title;
        $topic = $data->topic;
        $timer = $data->timer;
        $password = $data->password;
        $questions = $data->questions;

        $conn->beginTransaction();

        try {
            $stmt = $conn->prepare("INSERT INTO quizzes (teacher_id, title, topic, timer, password) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$teacherId, $title, $topic, $timer, $password]);
            $quizId = $conn->lastInsertId();

            $stmt = $conn->prepare("INSERT INTO questions (quiz_id, text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)");
            
            foreach ($questions as $q) {
                $stmt->execute([
                    $quizId,
                    $q->text,
                    $q->options->A,
                    $q->options->B,
                    $q->options->C,
                    $q->options->D,
                    $q->correct
                ]);
            }

            $conn->commit();
            echo json_encode(['success' => true, 'id' => $quizId]);
        } catch (Exception $e) {
            $conn->rollBack();
            echo json_encode(['error' => $e->getMessage()]);
        }
    } elseif (isset($_GET['action']) && $_GET['action'] === 'update') {
        // Update logic here (simplified: delete and recreate questions or just update quiz details)
        // For now, let's just update quiz details
        $id = $data->id;
        $title = $data->title;
        $topic = $data->topic;
        $timer = $data->timer;
        $password = $data->password;
        
        // TODO: Handle question updates (complex)
        // For this MVP, we might just update the quiz metadata
        $stmt = $conn->prepare("UPDATE quizzes SET title=?, topic=?, timer=?, password=? WHERE id=?");
        if ($stmt->execute([$title, $topic, $timer, $password, $id])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Update failed']);
        }
    } elseif (isset($_GET['action']) && $_GET['action'] === 'stop') {
        $id = $data->id;
        $status = $data->status; // 'active' or 'stopped'
        $stmt = $conn->prepare("UPDATE quizzes SET status=? WHERE id=?");
        if ($stmt->execute([$status, $id])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Update failed']);
        }
    } elseif (isset($_GET['action']) && $_GET['action'] === 'delete') {
        $id = $data->id;
        $stmt = $conn->prepare("DELETE FROM quizzes WHERE id=?");
        if ($stmt->execute([$id])) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Delete failed']);
        }
    }
}
?>
