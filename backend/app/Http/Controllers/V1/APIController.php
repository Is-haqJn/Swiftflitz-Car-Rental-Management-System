<?php

namespace App\Http\Controllers\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;

// ? sample API controller - can be used as reference

class APIController extends Controller
{
    use ApiResponse;

    public function __invoke()
    {
        return $this->successResponse([
            'version' => '1.0.0',
            'documentation' => url('/api/docs'),
            'developer' => [
                'name' => 'Ordaq Tech Solutions',
                'website' => 'https://ordaq.com',
                'github' => 'https://github.com/Ordaq-Tech',
                'contact' => 'info@ordaq.com',
            ],
            'contact' => 'info@ordaq.com',
            'support' => 'https://ordaq.com/support',
            'server' => [
                'php' => phpversion(),
                'laravel' => app()->version(),
                'environment' => app()->environment(),
                'debug' => config('app.debug'),
                'database' => config('database.default'),
                'cache' => config('cache.default'),
            ],
        ], 'Swiftflitz API v1 is up and running!');
    }
}
