# PHP Apache Template
A minimal web server starter pack with:
 - my favorite .htaccess config for php routing
 - basic directory structure and php entry points
 - a top level error handler with developer friendly error response 
 - basic error page 
 - basic dark mode css
 - minimal docker support

All requests for php files, directories, or sensitive files
are redirected to the public/index.php.

An additional .htaccess and index.php outside the public folder allow the server to run form either folder
with the same behaviour.

Requires php7 or higher and composer.

## Setup
Run `composer init` to create a composer.json.
Run the web server with docker `./docker/start-server.sh`.

## Licence
NONE.