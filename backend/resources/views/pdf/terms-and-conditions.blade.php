<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Terms and Conditions</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            color: #1a1a2e;
            background: #fff;
            line-height: 1.6;
            padding: 40px;
        }
        .header { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        .header h1 { font-size: 16px; margin-bottom: 4px; }
        .header .meta { font-size: 9px; color: #666; }
        .content { margin-top: 16px; }
        .content p { margin-bottom: 8px; }
        .fallback { color: #555; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $appName }} - Terms and Conditions</h1>
        <div class="meta">Generated: {{ $generatedAt }}</div>
    </div>
    <div class="content">
        @if(!empty($content))
            {!! $content !!}
        @else
            <p class="fallback">Please refer to our Terms and Conditions on our website.</p>
        @endif
    </div>
</body>
</html>
