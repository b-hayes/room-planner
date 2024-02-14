<?php
declare(strict_types=1);
//because of my shared hosting provider I need to:
//  - manually load ENV vars from a file
//  - and I am forced to keep this file outside the document root
//  - file names are derived from project folder name as a generic approach.
$project = basename(realpath(__DIR__ . '/..'));
$prodPath = __DIR__ . "/../../$project.env";
$devPath = __DIR__ . '/dev.env'; //use this path when running on local server
$filename = realpath($prodPath) ?: realpath($devPath);

if (!$filename) {
    throw new \Exception("No environment file! Tried: $prodPath && $devPath and found nothing.");
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

