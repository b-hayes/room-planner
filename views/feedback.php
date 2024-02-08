<?php
declare(strict_types=1);

// Email dev with the feedback
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? 'Anonymous';
    $feedback = $_POST['feedback'];
    $to = getenv('feedbackEmail');
    $subject = 'Feedback for Room Planner';
    $message = "Feedback from: $email\n\n$feedback";
    $sent = mail($to, $subject, $message);

    //display a message if the mail was successful
    if (!$sent) {
        throw new \Exception('Failed to send feedback.');
    }

    echo '<h1>Thank you for your feedback!</h1>';
    //log the feedback
    error_log($message);

    return;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Feedback for Room Planner</title>
</head>
<body>
<div class="centered">
    <div class="middle" style="width: 100%;text-align: center;">
        <h1>Feedback for Room Planner</h1>
        <p>What do you think of Room Planner? What features would you like to see added?</p>
        <p>Let us know in the box below:</p>
        <form action="/feedback" method="post">
            <section>
                <label for="email">Email address (optional):</label>
                <input type="text" name="email" id="email" placeholder="Your email">
            </section>
            <section>
                <label for="feedback">Your feedback:</label>
                <br>
                <textarea name="feedback" id="feedback" required></textarea>
            </section>
            <button type="submit">Submit</button>
        </form>
    </div>
</div>

</body>
</html>

<style>
    textarea, input, button, label {
        margin: 10px;
        font-size: 1.5em;
        max-width: 100%;
        max-height: 100%;
    }
    textarea {
        width: 600px;
        height: 200px;
    }
    input {
        width: 300px;
    }
    label {
        width: 200px;
    }
    button {
        width: 200px;
        height: 50px;
    }
</style>


