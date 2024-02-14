<?php
declare(strict_types=1);
$latestUpdates = explode("\n", `git log --pretty=format:"%cd %s" --date=format:"%a %e %b %Y"` ?? "No\n logs\n found.");
$latestUpdates = array_unique($latestUpdates);// this lets me do several commits in a row without it showing up multiple times
$latestUpdates = array_filter($latestUpdates, function ($update) {
    // exclude work in progress commits or cleanup commits (i tend to do those a lot when I have to leave my machine in a hurry)
    return stripos($update, 'wip') === false && stripos($update, 'cleanup') === false;
});
$latestUpdates = array_slice($latestUpdates, 0, 10);// only show the last 10 unique commit messages
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Room Planner</title>
</head>
<body>
<div class="toolbar">
    <div class="toolbar-header">File</div>
    <button class="toolbar-button" onclick="save()">💾 Save</button>
    <button class="toolbar-button" onclick="deleteData()">🗑️ Delete</button>
    <div class="toolbar-header">
        Objects
    </div>
    <button class="toolbar-button" onclick="newRoom()">⬜ Room</button>
    <button class="toolbar-button" onclick="newShape()">🟦 Square</button>
</div>
<main>
    <Grid params='{ "scale": 1 }'></Grid>
</main>

<div class="status-bar">
    <div style="padding-right: 1em">Latest Updates:</div>
    <div class="invisibleScrollBars incrementalScroll" style="flex-grow: 1">
        <?php
        foreach ($latestUpdates as $update) {
            echo "<div style='width: 100%'>$update</div>";
        }
        ?>
    </div>
    <div><a href="/feedback">🤔Feedback?</a></div>
</div>
</body>
</html>
<style>
    * {
        /* Pretty much never want people accidentally highlight text while using this app. */
        user-select: none;
    }

    main {
        position: relative;
        top: 0;
        left: 10vw;
        width: 90vw;
        height: calc(100% - 20px);
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
        font-size: 16px;
        padding: 3px;
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
        height: 3px;
    }

    .status-bar {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        height: 20px;
        width: 100%;
        background-color: var(--background);
        border-top: 1px solid var(--foreground);
    }
    /* Hide scrollbar for Chrome, Safari and Opera */
    .invisibleScrollBars::-webkit-scrollbar {
        display: none;
    }
    /* Hide scrollbar for IE, Edge and Firefox */
    .invisibleScrollBars {
        overflow: scroll;
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
    div:has(> .incrementalScroll) {
        scroll-snap-type: both mandatory;
    }
    .incrementalScroll * {
        scroll-snap-align: start;
        /* Make sure each element is tall enough not to scroll pat before it can snap to it */
        min-height: 100px;
    }
    .incrementalScroll *:last-child {
        /* Last element shouldn't have extra height or the scroll back up wont work as nice. */
        min-height: revert;
    }

</style>

<script type="module">
    //import Grid from "/js/Grid.js" //this import isn't needed because of the dynamic component loading.
    import Shape from "/js/Shape.js"
    import Alert from "/js/Toast.js"
    import Room from "/js/Room.js"
    import Loader from "../public/js/Scafold/Loader.js"

    let shapes = []

    window.randomId = function () {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    window.newShape = function () {
        const shape = new Shape(randomId(), grid)
        shape.select()
        shapes.push(shape)
    }

    window.deleteShape = function (id) {
        const shape = shapes.find(shape => shape.id === id)
        if (!shape) {
            console.error(`Cant find shape to delete: '${id}'`)
        } else {
            shape.element().remove()
            //update the shapes list.
            shapes = shapes.filter(shape => shape.id !== id)
        }
    }

    window.newRoom = function () {
        const room = new Room(randomId(), grid)
        room.select()
        shapes.push(room)
    }

    window.deleteData = function () {
        if (!confirm('Are you sure you want to delete everything and saved data?')) {
            return
        }
        localStorage.removeItem("data")
        alert('Deleted your (local) storage. Page will now reload.')
        window.location.reload()
    }

    window.save = function () {
        let data = {
            shapes: shapes.map(shape => {
                return {
                    id: shape.id,
                    position: shape.position,
                    //store the class name so we can recreate the object
                    class: shape.constructor.name
                }
            })
        }

        let jsonString = JSON.stringify(data)
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
            return
        }

        if (!Array.isArray(data.shapes)) {
            throw new Error('data.shapes is not an array')
        }

        let loadedShapes = []
        data.shapes.forEach(shape => {
            //check the class to use the correct constructor
            if (shape.class === 'Shape') {
                loadedShapes.push(
                    new Shape(
                        shape.id ?? randomId(), //previous versions didn't have ids so need to make them up
                        grid,
                        shape.position
                    )
                )
                return
            }

            if (shape.class === 'Room') {
                loadedShapes.push(
                    new Room(
                        shape.id ?? randomId(),
                        grid,
                        shape.position
                    )
                )
                return
            }
        })
        shapes = loadedShapes
    }

    await Loader.replaceTagsWithComponents(document)
    const grid = document.querySelector(".grid")
    load()

    //Prevent the default right click menu
    document.addEventListener('contextmenu', function (event) {
        //unless the control/command key is held down
        if (event.ctrlKey || event.metaKey) {
            return
        }
        event.preventDefault()
    }, true)

    //Listen for shapes-click events to open a special context menu
    grid.addEventListener('shape-click', function (event) {
        if (event.detail.button !== 2) {
            return
        }

        //show a context menu with a delete option
        let menuHtml = `
            <div class="shape-context-menu">
                <div class="context-menu-item" onclick="
                deleteShape('${event.detail.shape.id}')
                this.parentElement.parentElement.remove()
                ">🚮 Delete</div>
            </div>
        `
        let menu = document.createElement('div')
        menu.innerHTML = menuHtml
        menu.style.position = 'absolute'
        menu.style.left = event.detail.x + 'px'
        menu.style.top = event.detail.y + 'px'
        menu.style.zIndex = 999999
        menu.style.backgroundColor = 'var(--background)'
        menu.style.border = '1px solid var(--foreground)'
        menu.style.padding = '5px'
        menu.style.borderRadius = '5px'
        menu.style.boxShadow = '5px 5px 10px 3px rgba(0, 0, 0, 0.5)'
        menu.style.cursor = 'pointer'
        menu.addEventListener('click', function (event) {
            event.stopPropagation()
        })
        //remove the menu when the user clicks anywhere else
        document.addEventListener('click', function () {
            menu.remove()
        })
        //add the menu to the document
        document.body.appendChild(menu)
    }, true)
</script>
