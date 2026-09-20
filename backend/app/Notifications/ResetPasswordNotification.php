<?php

namespace App\Notifications;

use App\Services\Contracts\EmailTemplateServiceInterface;
use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword implements ShouldQueue
{
    use Queueable;

    /**
     * Build the mail representation of the notification using a custom template.
     */
    public function toMail($notifiable): MailMessage
    {
        $url = $this->resetUrl($notifiable);
        $expireMinutes = config('auth.passwords.' . config('auth.defaults.passwords') . '.expire', 60);

        $rendered = app(EmailTemplateServiceInterface::class)->render('password_reset', [
            'customer_name' => $notifiable->name ?? 'User',
            'reset_url' => $url,
            'expire_minutes' => (string) $expireMinutes,
        ]);

        if ($rendered) {
            return (new MailMessage)
                ->subject($rendered['subject'])
                ->view('emails.raw', ['htmlContent' => $rendered['html']]);
        }

        return (new MailMessage)
            ->subject('Reset Your Password - ' . config('app.name'))
            ->view('emails.reset-password', [
                'url' => $url,
                'user' => $notifiable,
                'expireMinutes' => $expireMinutes,
            ]);
    }
}
