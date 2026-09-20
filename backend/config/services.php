<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * Meta WhatsApp Cloud API
     *
     * verify_token  - A string you define and set in the Meta developer console
     *                 when registering your webhook URL. Must match exactly.
     * app_secret    - Found in the Meta App dashboard under App Settings > Basic.
     *                 Used to verify the HMAC-SHA256 signature on incoming webhooks.
     * graph_api_version - The Graph API version to use for outgoing message requests.
     *
     * The access_token, phone_number_id, and business_account_id are stored in
     * the application settings (whatsapp group) and managed via the admin UI.
     */
    'whatsapp' => [
        'verify_token' => env('WHATSAPP_VERIFY_TOKEN', ''),
        'app_secret' => env('WHATSAPP_APP_SECRET', ''),
        'graph_api_version' => env('WHATSAPP_API_VERSION', 'v25.0'),
    ],

    /*
     * SMS Provider Base URLs
     *
     * These are the API base URLs for the SMS providers. The actual credentials
     * (API keys, sender IDs, etc.) are stored in the application settings
     * (sms group) and managed via the admin UI.
     *
     * Arkesel and Nalo are Ghanaian SMS providers.
     * Twilio is configured entirely via the admin settings (no env needed).
     */
    'sms' => [
        'arkesel_base_url' => env('ARKESEL_BASE_URL', 'https://sms.arkesel.com/api/v2'),
        'nalo_base_url' => env('NALO_BASE_URL', 'https://sms.nalosolutions.com/smsbackend/clientapi/Resl_Nalo'),
    ],

];
