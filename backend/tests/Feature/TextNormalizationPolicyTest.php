<?php

it('contains no forbidden dash and comment marker patterns', function () {
    $repoRoot = realpath(dirname(__DIR__, 3));

    expect($repoRoot)->not->toBeFalse();

    $allowedExtensions = [
        'php',
        'blade.php',
        'ts',
        'tsx',
        'txt',
        'json',
        'yml',
        'yaml',
    ];

    $excludedDirectories = [
        DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR,
        DIRECTORY_SEPARATOR . 'node_modules' . DIRECTORY_SEPARATOR,
        DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR,
        DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'build' . DIRECTORY_SEPARATOR,
        DIRECTORY_SEPARATOR . '.git' . DIRECTORY_SEPARATOR,
        DIRECTORY_SEPARATOR . '.claude' . DIRECTORY_SEPARATOR,
        DIRECTORY_SEPARATOR . 'graphify-out' . DIRECTORY_SEPARATOR,
        DIRECTORY_SEPARATOR . 'worktrees' . DIRECTORY_SEPARATOR,
    ];

    /* Chat-history and memory files may quote forbidden patterns verbatim as examples */
    $excludedFiles = [
        'CONVERSATION.md',
        'MEMORY.md',
    ];

    $forbiddenPatterns = [
        '/\/\/\s*──/u',
        '/\x{2500}\x{2500}comment\x{2500}\x{2500}/u',
        '/\x{2014}/u',
    ];

    $violations = [];

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($repoRoot, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $file) {
        if (! $file->isFile()) {
            continue;
        }

        $path = $file->getPathname();

        $isExcluded = false;
        foreach ($excludedDirectories as $excludedDirectory) {
            if (str_contains($path, $excludedDirectory)) {
                $isExcluded = true;
                break;
            }
        }

        if ($isExcluded) {
            continue;
        }

        $relativePath = str_replace($repoRoot . DIRECTORY_SEPARATOR, '', $path);

        if (in_array(basename($path), $excludedFiles, true)) {
            continue;
        }

        $isAllowedExtension = false;
        foreach ($allowedExtensions as $extension) {
            if ($extension === 'blade.php') {
                if (str_ends_with($relativePath, '.blade.php')) {
                    $isAllowedExtension = true;
                    break;
                }

                continue;
            }

            if (str_ends_with($relativePath, '.' . $extension)) {
                $isAllowedExtension = true;
                break;
            }
        }

        if (! $isAllowedExtension) {
            continue;
        }

        $content = file_get_contents($path);
        if ($content === false) {
            continue;
        }

        foreach ($forbiddenPatterns as $pattern) {
            if (! preg_match($pattern, $content)) {
                continue;
            }

            $violations[] = $relativePath . ' matches ' . $pattern;
            break;
        }
    }

    expect($violations)->toBe([]);
});
