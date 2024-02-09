<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Email feedback to the devs
    $feedback = $_POST['feedback'];

    $mail = new PHPMailer(true);

    //Server settings
//    $mail->SMTPDebug = SMTP::DEBUG_SERVER;            //Enable verbose debug output
    $mail->isSMTP();                                  //Send using SMTP
    $mail->Host = getenv('SMTP_HOST');          //Set the SMTP server to send through
    $mail->SMTPAuth = true;                           //Enable SMTP authentication
    $mail->Username = getenv('SMTP_USER');      //SMTP username
    $mail->Password = getenv('SMTP_PASSWORD');  //SMTP password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;  //Enable implicit TLS encryption
    $mail->Port = 465;                                //TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`

    //Recipients
    $userName = $_POST['name'] ?? 'Room Planner: Feedback';
    $userEmail = $_POST['email'] ?? null;
    if ($userEmail) {
        //$mail->setFrom($userEmail, $userName);
        //My smtp provider will not allow me to make the email from the users provided email address.
        // So im emailing myself, from myself.
        $mail->setFrom($mail->Username, $userName);
    }
    $mail->addAddress(getenv('feedbackEmail'));

    //Content
    $mail->isHTML();
    $mail->Subject = 'Room Planer feedback.';
    $mail->Body = "<b>$userName</b> submitted some feedback: <p>$feedback</p>";
    $mail->AltBody = "$userName submitted some feedback: \n\n $feedback";

    $mail->send();

    echo '<h1>🤩Thanks for the feedback!</h1>
    <a href="/">Back to Room Planner</a>';

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
<div>
    <div style="width: 100%;text-align: center;">
        <form action="/feedback" method="post">
            <h1>Feedback for Room Planner</h1>
            <p>What do you think of Room Planner? What features would you like to see added? Found any bugs?</p>
            <section>
                <label for="email">Email address (optional):</label>
                <input type="text" name="email" id="email" placeholder="Your email">
                <p class="subscript">If you'd like us to be able to respond or ask questions, provide a contact email.</p>
            </section>
            <section>
                <label for="feedback">Your feedback:</label>
                <br>
                <textarea name="feedback" id="feedback" required></textarea>
            </section>
            <button type="submit">Submit</button>
<!--            <p>If you just want to say thank you consider donating a coffee ☕️ to keep the code ninja working on this project.</p>-->
        </form>
    </div>
</div>

<div class="overlay hidden">
    <div class="spinner circle"></div>
</div>

</body>
</html>

<style>
    .subscript {
        font-size: 0.8em;
    }
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

    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .overlay p {
        margin-bottom: 20px;
    }

    .hidden {
        display: none;
    }
    .spinner {
        animation: spin 2s linear infinite;
    }
    .spinner.circle {
        border: 4px solid var(--background);
        border-top: 5px solid var(--link-hover);
        border-radius: 50%;
        width: 40px;
        height: 40px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>

<script>
    // Convert the form to an ajax form and replace the form with the response.
    const form = document.querySelector('form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Show the overlay
        document.querySelector('.overlay').classList.remove('hidden');

        const formData = new FormData(form);
        const response = await fetch('/feedback', {
            method: 'POST',
            body: formData
        });

        const html = await response.text();
        form.innerHTML = html;

        // Hide the overlay
        document.querySelector('.overlay').classList.add('hidden');
    });
</script>
