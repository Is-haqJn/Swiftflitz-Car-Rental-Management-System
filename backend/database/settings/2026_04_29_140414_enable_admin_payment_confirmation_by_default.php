<?php

use Illuminate\Support\Facades\DB;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        /* Enable admin payment confirmation notifications by default.
           Payment received is a critical event - admins should always be notified. */
        $updates = [
            ['group' => 'whatsapp', 'name' => 'notify_admins'],
            ['group' => 'whatsapp', 'name' => 'send_admin_payment_confirmation'],
            ['group' => 'sms', 'name' => 'notify_admins'],
            ['group' => 'sms', 'name' => 'send_admin_payment_confirmation'],
            ['group' => 'notifications', 'name' => 'whatsapp_admin_payment_confirmation'],
            ['group' => 'notifications', 'name' => 'sms_admin_payment_confirmation'],
        ];

        foreach ($updates as $key) {
            DB::table('settings')
                ->where('group', $key['group'])
                ->where('name', $key['name'])
                ->update(['payload' => 'true']);
        }
    }

    public function down(): void
    {
        $updates = [
            ['group' => 'whatsapp', 'name' => 'send_admin_payment_confirmation'],
            ['group' => 'sms', 'name' => 'send_admin_payment_confirmation'],
            ['group' => 'notifications', 'name' => 'whatsapp_admin_payment_confirmation'],
            ['group' => 'notifications', 'name' => 'sms_admin_payment_confirmation'],
        ];

        foreach ($updates as $key) {
            DB::table('settings')
                ->where('group', $key['group'])
                ->where('name', $key['name'])
                ->update(['payload' => 'false']);
        }
    }
};
