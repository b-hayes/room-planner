<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Email feedback to the devs
    $feedback = $_POST['feedback'];

    $mail = new PHPMailer(true);

    //Server settings
    $mail->SMTPDebug = SMTP::DEBUG_SERVER;                      //Enable verbose debug output
    $mail->isSMTP();                                            //Send using SMTP
    $mail->Host = getenv('SMTP_HOST');                     //Set the SMTP server to send through
    $mail->SMTPAuth = true;                                   //Enable SMTP authentication
    $mail->Username = getenv('SMTP_USER');                     //SMTP username
    $mail->Password = getenv('SMTP_PASSWORD');                               //SMTP password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;            //Enable implicit TLS encryption
    $mail->Port = 465;                                    //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`

    //Recipients
    $userName = $_POST['name'] ?? 'Anonymous';
    $userEmail = $_POST['email'] ?? null;
    if ($userEmail) {
        $mail->setFrom($userEmail, $userName);
    }
    $mail->addAddress(getenv('feedbackEmail'));

    //Content
    $mail->isHTML();
    $mail->Subject = 'Room Planer feedback.';
    $mail->Body = "<b>$userName</b> submitted some feedback: <p>$feedback</p>";
    $mail->AltBody = "$userName submitted some feedback: \n\n $feedback";

    $mail->send();

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


