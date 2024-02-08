<?php
declare(strict_types=1);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Feedback for Room Planner</title>
</head>
<body>
<div class="centered">
    <main style="width: 100%;text-align: center;">
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
                <textarea name="feedback" id="feedback" cols="30" rows="10" required></textarea>
            </section>
            <button type="submit">Submit</button>
        </form>
    </main>
</div>

</body>
</html>
