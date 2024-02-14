<?php

declare(strict_types=1);

//convert all warnings and notices in to errors, if PHP is configured to report them.
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return;
    }
    throw new \ErrorException($message, 0, $severity, $file, $line);
});

//Switch to json if it was specified in the accept header.
$jsonRequest = stripos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false;

try {
    if (!$jsonRequest) {
        // add common head tags here. Browser will merge them with any head tags printed afterward.
        echo <<<HTML
            <head>
                <link rel="icon" type="image/png" href="/favicon.png">
                <link rel="stylesheet" href="/css/reset.css">
                <link rel="stylesheet" href="/css/global.css">
            </head>
            HTML;
    }

    require_once __DIR__ . '/../vendor/autoload.php';
    require_once __DIR__ . '/../src/load_env.php';

    //Basic routing...
    $url = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    if ($url === '/' || $url === '') {
        $view = __DIR__ . '/../views/index.php';
    } else if (file_exists(__DIR__ . "/../views$url.php")) {
        $view = __DIR__ . "/../views$url.php";
    } else {
        $view = __DIR__ . '/404.php';
    }

    require_once $view;

} catch (\Throwable $error) {
    //This is the last line of defence do not use any dependencies that could break.

    $errorInfo = [//for developers eyes only
        'Error' => $error->getMessage(),
        ' file' => $error->getFile(),
        ' line' => $error->getLine(),
        'trace' => $error->getTrace(),
        ' http' => $_SERVER['REQUEST_METHOD'] . ': ' . $_SERVER['REQUEST_URI']
    ];
    if ($error->getPrevious()) {
        $errorInfo['cause'] = $error->getPrevious()->getTraceAsString();
    }

    //log the error before responding
    $encodingOptions = JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE;
    error_log(json_encode($errorInfo, $encodingOptions));

    //construct error response.
    http_response_code(500);
    $errorResponse = ['error' => ['message' => 'Internal server error']];

    //extra info for developers.
    $developerMode = (stripos($_SERVER['HTTP_HOST'], 'localhost') !== false);
    $developerMode = true;
    if ($developerMode) {
        $errorResponse['error_details'] = $errorInfo;
        $encodingOptions = $encodingOptions | JSON_PRETTY_PRINT;
    }

    //respond with JSON if appropriate
    if ($jsonRequest) {
        echo json_encode($errorResponse, $encodingOptions);
        return;
    }

    //otherwise assume we want a nice html error page.
    include __DIR__ . '/500.php';
    if ($developerMode) {
        echo "<pre style='z-index: 99999999999999999; text-align: left; min-width: 100%'>";
        echo json_encode($errorResponse, $encodingOptions);
        echo "</pre>";
    }
}

?>
