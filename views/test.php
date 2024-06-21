<?php
declare(strict_types=1);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Testing ground</title>
</head>
<body>
<h1>Testing ground</h1>
<TestComponent>
</TestComponent>

</body>

<script type="module">
    import Loader from "../public/js/Scafold/Loader.js"
    await Loader.replaceTagsWithComponents(document)
</script>
</html>
