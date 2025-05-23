<?php
/** @noinspection PhpUnhandledExceptionInspection */
declare(strict_types=1);
// Because of my shared hosting provider, I need to:
//  - manually load ENV vars from a file
//  - and I am forced to keep this file outside the document root
// Hence the first path is outside the document root and uses the composer project name.
$project = json_decode(file_get_contents(__DIR__ . '/../composer.json'))->name ?? 'undefined/undefined';
$project = explode('/', $project)[1];
// otherwise use prod.env or dev.env
$prodPath = __DIR__ . '/../prod.env';
$devPath = __DIR__ . '/../dev.env';
$filename = realpath($prodPath) ?: realpath($devPath);

if (!$filename) {
    return; //env file is optional
    //throw new \Exception("No environment file! Tried: $prodPath && $devPath and found nothing.");
}

$handle = fopen($filename, "r");
if (!$handle) {
    throw new \Exception("Unable to read env file: $filename");
}
while (($line = fgets($handle)) !== false) {
    if (str_starts_with($line, '#')) continue;
    if (str_starts_with($line, '//')) continue;
    //trim the line endings
    $trimmed = trim($line);
    if (empty($trimmed)) continue;
    putenv($trimmed);
}
fclose($handle);

