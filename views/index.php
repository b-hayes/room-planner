<?php
declare(strict_types=1);
$latestUpdates = explode("\n", `git log --pretty=format:"%cd %s" --date=format:"%a %e %b %Y"` ?? "No\n logs\n found.");
$latestUpdates = array_unique($latestUpdates);// this lets me do several commits in a row without it showing up multiple times
$latestUpdates = array_filter($latestUpdates, function ($update) {
    // exclude work in progress commits or cleanup commits (I tend to do those a lot when I have to leave my machine in a hurry)
    return stripos($update, 'wip') === false && stripos($update, 'cleanup') === false;
});
$latestUpdates = array_slice($latestUpdates, 0, 10);// only show the last 10 unique commit messages

// Get all SVG files from the items directory for furniture
$itemsDir = __DIR__ . '/../public/img/items/';
$svgFiles = glob($itemsDir . '*.svg');
$furnitureItems = [];

foreach ($svgFiles as $file) {
    $filename = basename($file, '.svg');
    $displayName = ucwords(str_replace('-', ' ', $filename));
    $furnitureItems[] = [
        'filename' => $filename,
        'displayName' => $displayName,
        'path' => '/img/items/' . basename($file)
    ];
}

// Sort alphabetically by display name
usort($furnitureItems, function($a, $b) {
    return strcmp($a['displayName'], $b['displayName']);
});
?>
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
    <div class="toolbar-header">Furniture</div>
    <?php foreach ($furnitureItems as $item): ?>
        <button class="toolbar-button furniture-button"
                onclick="newFurniture('<?= htmlspecialchars($item['path'], ENT_QUOTES) ?>')"
                title="<?= htmlspecialchars($item['displayName']) ?>">
            <img src="<?= htmlspecialchars($item['path']) ?>" alt="<?= htmlspecialchars($item['displayName']) ?>">
            <span><?= htmlspecialchars($item['displayName']) ?></span>
        </button>
    <?php endforeach; ?>
</div>
<main>
    <grid:grid params='{ "scale": 2.5 }'></grid:grid>
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
    <div class="performance">Memory:</div>
    <div><a href="/feedback">🤔Feedback?</a></div>
</div>
</body>
<style>
    * {
        /* Pretty much never want people accidentally highlight text while using this app. */
        user-select: none;
    }

    main {
        position: relative;
        top: 0;
        left: 150px;
        width: calc(100vw - 150px);
        height: calc(100vh - 20px);
    }

    .toolbar {
        user-select: none;
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: 150px;
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

    .toolbar-button.furniture-button {
        padding: 5px;
        height: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
    }

    .toolbar-button.furniture-button img {
        max-width: 30px;
        max-height: 30px;
        filter: none;
    }

    .toolbar-button.furniture-button span {
        font-size: 10px;
        font-weight: normal;
        text-align: center;
    }

    .toolbar-button.furniture-button:hover img {
        filter: invert(1);
    }

    @media (prefers-color-scheme: dark) {
        .toolbar-button.furniture-button:hover img {
            filter: invert(0);
        }
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

    // Warning! if your IDE puts relative `../` paths in the import statements, they might get double imports and all kinds of broken stuff can happen.
    //  us absolute paths here only.
    import Shape from "/js/Grid/Shape.js"
    import Alert from "/js/Toast.js"
    import Room from "/js/Room.js"
    import Loader from "/js/ModuLatte/Loader.js"
    import Text from "/js/ModuLatte/Text.js"
    import Position from "/js/Grid/Position.js";

    window.t = Text
    window.shapes = []

    window.error = function (message) {
        throw new Error(message)
    }

    window.newShape = function () {
        const shape = new Shape()
        grid.addShape(shape)
        grid.selectedShape = shape
        shapes.push(shape)
    }

    window.newFurniture = function (imagePath) {
        const shape = new Shape()
        shape.backgroundImage = imagePath

        // Set default dimensions for specific furniture items (in cm, Australian standard sizes)
        if (imagePath === '/img/items/bed.svg') {
            shape.position.width = 138  // Double bed
            shape.position.height = 190
        } else if (imagePath === '/img/items/bedside-table.svg') {
            shape.position.width = 45
            shape.position.height = 35  // depth from wall
        } else if (imagePath === '/img/items/bookshelf.svg') {
            shape.position.width = 30 // depth
            shape.position.height = 80
        } else if (imagePath === '/img/items/corner-desk.svg') {
            shape.position.width = 150
            shape.position.height = 150
        } else if (imagePath === '/img/items/desk.svg') {
            shape.position.width = 140
            shape.position.height = 70
        } else if (imagePath === '/img/items/filing-cabinet.svg') {
            shape.position.width = 47
            shape.position.height = 62
        } else if (imagePath === '/img/items/lamp.svg') {
            shape.position.width = 25
            shape.position.height = 25
        } else if (imagePath === '/img/items/lounge-chair.svg') {
            shape.position.width = 80
            shape.position.height = 90
        } else if (imagePath === '/img/items/office-chair.svg') {
            shape.position.width = 60
            shape.position.height = 60
        } else if (imagePath === '/img/items/plant.svg') {
            shape.position.width = 30
            shape.position.height = 30
        } else if (imagePath === '/img/items/sofa.svg') {
            shape.position.width = 200  // 3-seater
            shape.position.height = 90
        } else if (imagePath === '/img/items/table.svg') {
            shape.position.width = 120
            shape.position.height = 80
        }

        grid.addShape(shape)
        grid.selectedShape = shape
        shapes.push(shape)
    }

    window.deleteShape = function (id) {
        const shape = window.shapes.find(shape => shape.id === id)
        if (!shape) {
            console.error(`Cant find shape to delete. Id:`, id)
        } else {
            grid.deleteShape(shape.id)
            //update the shape list.
            window.shapes = window.shapes.filter(shape => shape.id !== id)
        }
    }

    window.newRoom = function () {
        const room = new Room()
        grid.addShape(room)
        grid.selectedShape = room
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
            scale: grid.scale,
            shapes: Object.values(grid.shapes()).map(shape => {
                return {
                    id: shape.id,
                    position: shape.position,
                    backgroundImage: shape.backgroundImage,
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

        // Restore scale if saved
        if (data.scale) {
            grid.zoom(data.scale - grid.scale)
        }

        let loadedShapes = []
        data.shapes.forEach(shapeData => {
            let classMap = {
                Shape,
                Room
            }
            let {x, y, width, height, rotation} = shapeData.position
            let position = new Position(x, y, width, height, rotation);
            let shape = new classMap[shapeData.class](shapeData.id, position, 1, shapeData.backgroundImage || '')
            grid.addShape(shape)
            loadedShapes.push(shape)
        })
        window.shapes = loadedShapes
    }

    await Loader.replaceTagsWithComponents(document)
    window.grid = document.querySelector(".grid")
        .componentInstance
    load()

    //Show the memory usage in the performance div update every 1 second
    setInterval(function () {
        let memory = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
        document.querySelector('.performance').innerText = `Memory: ${memory}MB`
    }, 1000)
</script>
