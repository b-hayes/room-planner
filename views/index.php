<?php
declare(strict_types=1);
$latestUpdates = explode("\n", shell_exec('git log --pretty=format:"%cd %s" --date=format:"%a %e %b %Y"') ??"No\n logs\n found.");
$latestUpdates = array_unique($latestUpdates);// this lets me do several commits in a row without it showing up multiple times
$latestUpdates = array_filter($latestUpdates, function ($update) {
    // exclude work in progress commits or cleanup commits (I tend to do those a lot when I have to leave my machine in a hurry)
    return stripos($update, 'wip') === false && stripos($update, 'cleanup') === false;
});
$latestUpdates = array_slice($latestUpdates, 0, 10);// only show the last 10 unique commit messages

$catalog = json_decode(file_get_contents(__DIR__ . '/../src/catalog.json'), true, flags: JSON_THROW_ON_ERROR);
?>
<head>
    <meta charset="UTF-8">
    <title>Room Planner</title>
</head>
<body>
<div class="toolbar">
    <div class="toolbar-header">File</div>
    <button class="toolbar-button" onclick="save()">💾 Save</button>
    <button class="toolbar-button" onclick="share()">🔗 Share</button>
    <button class="toolbar-button" onclick="deleteData()">🗑️ Delete</button>
    <div class="toolbar-header">Shapes</div>
    <button class="toolbar-button" onclick="newRoom()">⬜ Room</button>
    <button class="toolbar-button" onclick="newShape()">🟦 Square</button>
    <?php foreach ($catalog['categories'] as $category => $label): ?>
        <div class="toolbar-header"><?= htmlspecialchars($label) ?></div>
        <?php foreach (array_filter($catalog['items'], fn(array $item) => $item['category'] === $category) as $item): ?>
            <button class="toolbar-button item-button"
                    onclick="newItem('<?= htmlspecialchars($item['image'], ENT_QUOTES) ?>')"
                    title="<?= htmlspecialchars($item['name']) ?>">
                <img src="<?= htmlspecialchars($item['image']) ?>" alt="<?= htmlspecialchars($item['name']) ?>">
                <span><?= htmlspecialchars($item['name']) ?></span>
            </button>
        <?php endforeach; ?>
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
        overflow-y: auto;
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

    .toolbar-button.item-button {
        padding: 5px;
        height: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
    }

    .toolbar-button.item-button img {
        max-width: 30px;
        max-height: 30px;
        filter: none;
    }

    .toolbar-button.item-button span {
        font-size: 10px;
        font-weight: normal;
        text-align: center;
    }

    .toolbar-button.item-button:hover img {
        filter: invert(1);
    }

    @media (prefers-color-scheme: dark) {
        .toolbar-button.item-button:hover img {
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
    import Point from "/js/Grid/Point.js"

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

    // sizes are [width, height] in cm, the top edge of an image is the back
    const catalog = <?= json_encode($catalog['items'], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?>

    const catalogItem = image => catalog.find(item => item.image === image)

    window.newItem = function (image) {
        const item = catalogItem(image)
        const [width, height] = item.size
        const shape = new Shape()
        shape.backgroundImage = image
        shape.category = item.category
        shape.height = item.height
        shape.parts = item.parts ?? []
        shape.hitAreas = item.hitAreas ?? []
        shape.resizeLock = item.resizeLock ?? ''
        shape.wallSnap = item.wallSnap ?? null
        const {x, y, rotation} = shape.position
        shape.position = new Position(x, y, width, height, rotation)

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
        history.replaceState(null, '', location.pathname)
        alert('Deleted your (local) storage. Page will now reload.')
        window.location.reload()
    }

    const shapeData = shape => ({
        id: shape.id,
        position: shape.position,
        backgroundImage: shape.backgroundImage,
        parent: shape.parentId,
        category: shape.category,
        height: shape.height,
        //store the class name so we can recreate the object
        class: shape.constructor.name
    })

    const shapeClasses = {Shape, Room}

    const createShape = data => {
        const {x, y, width, height, rotation} = data.position
        const position = new Position(x, y, width, height, rotation)
        const shape = new shapeClasses[data.class](data.id, position, 1, data.backgroundImage || '')
        shape.parentId = data.parent ?? ''
        const item = catalogItem(shape.backgroundImage)
        shape.category = data.category ?? item?.category ?? ''
        shape.height = data.height ?? item?.height ?? shape.height
        shape.parts = item?.parts ?? []
        shape.hitAreas = item?.hitAreas ?? []
        shape.resizeLock = item?.resizeLock ?? ''
        shape.wallSnap = item?.wallSnap ?? null
        grid.addShape(shape)
        return shape
    }

    const shapesJson = () => JSON.stringify(Object.values(grid.shapes()).map(shapeData))

    const layoutJson = () => JSON.stringify({
        scale: grid.scale,
        shapes: Object.values(grid.shapes()).map(shapeData)
    })

    // copy the selected shape with everything grouped on it; each paste lands a bit further along
    let copied = []
    let pasteCount = 0
    const copy = () => {
        const shape = grid.selectedShape
        if (!shape) {
            return
        }
        copied = [shape, ...grid.descendantsOf(shape)].map(shapeData)
        pasteCount = 0
    }

    const paste = () => {
        if (!copied.length) {
            return
        }
        pasteCount++
        const offset = 20 * pasteCount
        const newIds = Object.fromEntries(copied.map(data => [data.id, Text.randomId()]))
        const pasted = copied.map(data => createShape({
            ...data,
            id: newIds[data.id],
            parent: newIds[data.parent] ?? data.parent,
            position: {...data.position, x: data.position.x + offset, y: data.position.y + offset}
        }))
        shapes.push(...pasted)
        grid.restack()
        grid.selectedShape = pasted[0]
    }

    const transform = (bytes, stream) => new Response(new Blob([bytes]).stream().pipeThrough(stream))

    const layoutLink = (json = layoutJson()) => transform(json, new CompressionStream('deflate-raw'))
        .arrayBuffer()
        .then(buffer => {
            const encoded = new Uint8Array(buffer).toBase64({alphabet: 'base64url', omitPadding: true})
            return `${location.origin}/#layout=${encoded}`
        })

    // keeps the address bar in sync with the layout, so a refresh always shows the latest.
    // Each change is a new history entry, so the browser's back and forward act as undo and redo.
    let linkedJson = null
    let linkedShapes = null
    let loading = true
    let mouseIsDown = false
    document.addEventListener('mousedown', () => mouseIsDown = true)
    document.addEventListener('mouseup', () => mouseIsDown = false)

    const updateLink = () => {
        const json = layoutJson()
        if (loading || mouseIsDown || json === linkedJson) {
            return Promise.resolve()
        }
        // only shape changes are undo steps; zooming just updates the current link
        const shapes = shapesJson()
        const newStep = linkedShapes !== null && shapes !== linkedShapes
        const step = (history.state?.step ?? 0) + (newStep ? 1 : 0)
        linkedJson = json
        linkedShapes = shapes
        return layoutLink(json).then(url => newStep
            ? history.pushState({step}, '', url)
            : history.replaceState({step}, '', url))
    }

    // undo and redo keep the current zoom and scroll
    window.addEventListener('popstate', () => {
        loading = true
        const scroll = new Point(grid.element().scrollLeft, grid.element().scrollTop)
        grid.clear()
        load({keepView: true}).then(() => {
            grid.pan(new Point(0, 0), scroll)
            linkedJson = layoutJson()
            linkedShapes = shapesJson()
            loading = false
        })
    })

    document.addEventListener('keydown', event => {
        if (!(event.ctrlKey || event.metaKey)) {
            return
        }
        const key = event.key.toLowerCase()
        if (key === 's') {
            event.preventDefault()
            save()
            return
        }
        if (key === 'c') {
            copy()
            return
        }
        if (key === 'v') {
            paste()
            return
        }
        const redo = key === 'y' || (key === 'z' && event.shiftKey)
        if (redo) {
            event.preventDefault()
            history.forward()
            return
        }
        // don't undo past the first layout and off the page
        if (key === 'z' && history.state?.step > 0) {
            event.preventDefault()
            history.back()
        }
    })

    window.save = function () {
        localStorage.setItem("data", layoutJson())
        return updateLink().then(() => new Alert('Saved your stuff (locally).', 'success'))
    }

    window.share = function () {
        return layoutLink()
            .then(url => {
                if (!navigator.clipboard) {
                    prompt('Copy this share link:', url)
                    return
                }
                return navigator.clipboard.writeText(url)
                    .then(() => new Alert('Share link copied to clipboard.', 'success'))
            })
    }

    const sharedLayoutJson = encoded => {
        const bytes = Uint8Array.fromBase64(encoded, {alphabet: 'base64url'})
        return transform(bytes, new DecompressionStream('deflate-raw')).text()
    }

    window.load = async function ({keepView = false} = {}) {
        const sharedLayout = new URLSearchParams(location.hash.slice(1)).get('layout')
        const jsonString = sharedLayout ? await sharedLayoutJson(sharedLayout) : localStorage.getItem("data")
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
        if (data.scale && !keepView) {
            grid.zoom(data.scale - grid.scale)
        }

        window.shapes = data.shapes.map(createShape)
        grid.restack()
    }

    await Loader.replaceTagsWithComponents(document)
    window.grid = document.querySelector(".grid")
        .componentInstance
    await load()
    loading = false
    updateLink()
    setInterval(updateLink, 1000)

    //Show the memory usage in the performance div update every 1 second
    setInterval(function () {
        let memory = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
        document.querySelector('.performance').innerText = `Memory: ${memory}MB`
    }, 1000)
</script>
