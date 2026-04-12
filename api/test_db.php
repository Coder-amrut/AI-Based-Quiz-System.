<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain");

$host = 'localhost';
$db_name = 'quizmaster';
$username = 'root';
$password = '';

echo "Attempting to connect to database '$db_name' at '$host' with user '$username'...\n\n";

try {
    // 1. Try connecting to MySQL server only (no DB)
    $conn = new PDO("mysql:host=$host", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "[SUCCESS] Connected to MySQL server successfully.\n";

    // 2. Check if database exists
    $stmt = $conn->query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$db_name'");
    if ($stmt->fetchColumn()) {
        echo "[SUCCESS] Database '$db_name' exists.\n";
        
        // 3. Connect to the specific database
        $conn->exec("USE $db_name");
        echo "[SUCCESS] Selected database '$db_name'.\n";

        // 4. List tables
        $stmt = $conn->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($tables) > 0) {
            echo "[SUCCESS] Found " . count($tables) . " tables: " . implode(", ", $tables) . "\n";
        } else {
            echo "[WARNING] Database is empty (no tables found). Did you import database.sql?\n";
        }

    } else {
        echo "[ERROR] Database '$db_name' does NOT exist.\n";
        echo "Please import the database.sql file via phpMyAdmin.\n";
    }

} catch(PDOException $e) {
    echo "[ERROR] Connection Failed: " . $e->getMessage() . "\n";
    echo "\nTroubleshooting Tips:\n";
    echo "1. Is your MySQL server running (XAMPP/WAMP)?\n";
    echo "2. Are the username ('$username') and password correct?\n";
    echo "3. Is the host ('$host') correct?\n";
}
?>
