<?php
declare(strict_types=1);

//data used inside the view.
//get git log with date and message


$latestUpdates = explode("\n", `git log -2 --pretty=format:"%cd %s" --date=format:"%Y-%m-%d"`);
$latestUpdates[0] = "Latest update: " . $latestUpdates[0];
$latestUpdates[1] = "Previous update: " . $latestUpdates[1];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Room Planner</title>
</head>
<body>
<div class="toolbar">
    <div class="toolbar-header">Toolbar</div>
    <button class="toolbar-button" onclick="save()">💾 Save</button>
    <div class="toolbar-separator"></div>
    <button class="toolbar-button" onclick="newRoom()">⬜ Room</button>
    <button class="toolbar-button" onclick="newShape()">🟦 Square</button>
</div>
<div class="grid">
    <div class="grid-background"></div>
</div>
<div class="status-bar">
    <?php
    foreach ($latestUpdates as $update) {
        echo "<div class='status'>$update</div>";
    }
    ?>
</div>
</body>
</html>
<style>
    .grid {
        position: fixed;
        height: 100%;
        width: 90vw;
        margin: 0;
        left: 10vw;
        top: 0;
        overflow: hidden;
        box-shadow: inset 5px 5px 10px 3px rgba(0, 0, 0, 0.5);
    }

    .grid-background {
        background-image: repeating-linear-gradient(var(--foreground) 0 1px, transparent 1px 100%),
        repeating-linear-gradient(90deg, var(--foreground) 0 1px, transparent 1px 100%);
        background-size: 100px 100px;
        width: 100%;
        height: 100%;
        opacity: 0.5;
    }

    .toolbar {
        user-select: none;
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 10vw;
        background-color: var(--background);
        border-right: 1px solid var(--foreground);
    }

    .toolbar-header {
        width: 100%;
        font-size: 20px;
        font-weight: bold;
        text-align: center;
        border-bottom: 1px double var(--foreground);
    }

    .toolbar-button {
        width: 100%;
        height: 50px;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
    }

    .toolbar-button:hover {
        background-color: var(--foreground);
        color: var(--background);
    }

    .toolbar-separator {
        width: 100%;
        height: 1px;
        background-color: var(--foreground);
    }

    .status-bar {
        position: fixed;
        overflow: scroll;
        bottom: 0;
        left: 0;
        height: 20px;
        width: 100%;
        background-color: var(--background);
        border-top: 1px solid var(--foreground);
    }
    /* Hide scrollbar for Chrome, Safari and Opera */
    .status-bar::-webkit-scrollbar {
        display: none;
    }
    /* Hide scrollbar for IE, Edge and Firefox */
    .status-bar {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }

</style>

<script type="module">
    import Shape from "/js/Shape.js"
    import Alert from "/js/Alert.js"
    import Room from "/js/Room.js"

    const grid = document.querySelector(".grid")

    let shapes = []

    window.newShape = function () {
        const shape = new Shape(grid)
        shape.select()
        shapes.push(shape)
    }

    window.newRoom = function () {
        const room = new Room(grid)
        room.select()
        shapes.push(room)
    }

    window.save = function () {
        let data = {
            shapes: shapes.map(shape => {
                return {
                    position: shape.position,
                    //store the class name so we can recreate the object
                    class: shape.constructor.name
                }
            })
        }

        let jsonString = JSON.stringify(data)
        console.log('saving:', jsonString)
        localStorage.setItem("data", jsonString)
        new Alert('Saved your stuff (locally).', 'success')
    }

    window.load = function () {
        let jsonString = localStorage.getItem("data")
        if (!jsonString) {
            return
        }

        let data = JSON.parse(jsonString)
        if (!data.shapes) {
            console.log('no shapes in data storage')
            return
        }

        if (!Array.isArray(data.shapes)) {
            throw new Error('data.shapes is not an array')
        }

        let loadedShapes = []
        data.shapes.forEach(shape => {
            console.log('loading shape:', shape)

            //check the class to use the correct constructor
            if (shape.class === 'Shape') {
                loadedShapes.push(
                    new Shape(
                        grid,
                        shape.position.width,
                        shape.position.height,
                        shape.position.x,
                        shape.position.y,
                    )
                )
                return
            }

            if (shape.class === 'Room') {
                loadedShapes.push(
                    new Room(
                        grid,
                        shape.position.width,
                        shape.position.height,
                        shape.position.x,
                        shape.position.y,
                    )
                )
                return
            }
        })
        shapes = loadedShapes
    }

    load()
</script>
