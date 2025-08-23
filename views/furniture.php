<?php
declare(strict_types=1);

// Get all SVG files from the items directory
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
    <title>Furniture Gallery - Room Planner</title>
</head>
<body>
<div class="toolbar">
    <div class="toolbar-header">Navigation</div>
    <button class="toolbar-button" onclick="window.location.href='/'">🏠 Home</button>
    <div class="toolbar-header">Gallery</div>
    <div style="padding: 10px; font-size: 12px; text-align: center;">
        <?= count($furnitureItems) ?> Items Available
    </div>
</div>
<main>
    <div class="gallery-container">
        <h1>Furniture Gallery</h1>
        <p>Collection of furniture items available for room planning:</p>
        
        <div class="furniture-grid">
            <?php foreach ($furnitureItems as $item): ?>
                <div class="furniture-item">
                    <div class="furniture-icon">
                        <img src="<?= htmlspecialchars($item['path']) ?>" alt="<?= htmlspecialchars($item['displayName']) ?>">
                    </div>
                    <div class="furniture-name"><?= htmlspecialchars($item['displayName']) ?></div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</main>
</body>

<style>
    * {
        user-select: none;
    }

    body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    main {
        position: relative;
        top: 0;
        left: 10vw;
        width: 90vw;
        height: 100vh;
        overflow-y: auto;
        background-color: var(--background);
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
        z-index: 100;
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
        background-color: var(--background);
        color: var(--foreground);
        border: none;
        border-bottom: 1px solid var(--foreground);
    }

    .toolbar-button:hover {
        background-color: var(--foreground);
        color: var(--background);
    }

    .gallery-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    h1 {
        color: var(--foreground);
        margin-bottom: 0.5rem;
        font-size: 2.5rem;
    }

    p {
        color: var(--foreground);
        margin-bottom: 2rem;
        opacity: 0.8;
    }

    .furniture-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
    }

    .furniture-item {
        background-color: var(--background);
        border: 2px solid var(--foreground);
        border-radius: 8px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .furniture-item:hover {
        background-color: var(--foreground);
        color: var(--background);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .furniture-icon {
        margin-bottom: 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 80px;
    }

    .furniture-icon img {
        max-width: 70px;
        max-height: 70px;
        width: auto;
        height: auto;
        filter: none;
        transition: filter 0.3s ease;
    }

    .furniture-item:hover .furniture-icon img {
        filter: invert(1);
    }

    .furniture-name {
        font-weight: 600;
        font-size: 0.9rem;
        color: inherit;
        margin-top: 0.5rem;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .furniture-item:hover .furniture-icon img {
            filter: invert(0);
        }
    }
</style>