<?php

namespace App\Policies;

use App\Models\User;

class SettingsPolicy
{
    /**
     * Super admins bypass all policy checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        return null;
    }

    /**
     * Determine if the user can view general settings.
     */
    public function viewGeneral(User $user): bool
    {
        return $user->hasPermissionTo('settings.view_general');
    }

    /**
     * Determine if the user can update general settings.
     */
    public function updateGeneral(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_general');
    }

    /**
     * Determine if the user can view rental settings.
     */
    public function viewRental(User $user): bool
    {
        return $user->hasPermissionTo('settings.view_general');
    }

    /**
     * Determine if the user can update rental settings.
     */
    public function updateRental(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_rental');
    }

    /**
     * Determine if the user can view pricing settings.
     */
    public function viewPricing(User $user): bool
    {
        return $user->hasPermissionTo('settings.view_general');
    }

    /**
     * Determine if the user can update pricing settings.
     */
    public function updatePricing(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_pricing');
    }

    /**
     * Determine if the user can view email settings.
     */
    public function viewEmail(User $user): bool
    {
        return $user->hasPermissionTo('settings.view_general');
    }

    /**
     * Determine if the user can update email settings.
     */
    public function updateEmail(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_email');
    }

    /**
     * Determine if the user can send a test email.
     */
    public function testEmail(User $user): bool
    {
        return $user->hasPermissionTo('settings.test_email');
    }

    /**
     * Determine if the user can view WhatsApp settings.
     */
    public function viewWhatsApp(User $user): bool
    {
        return $user->hasPermissionTo('settings.view_general');
    }

    /**
     * Determine if the user can update WhatsApp settings.
     */
    public function updateWhatsApp(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_whatsapp');
    }

    /**
     * Determine if the user can send a test WhatsApp message.
     */
    public function testWhatsApp(User $user): bool
    {
        return $user->hasPermissionTo('settings.test_whatsapp');
    }

    /**
     * Determine if the user can manage WhatsApp message templates.
     */
    public function updateWhatsAppTemplates(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_whatsapp_templates');
    }

    /**
     * Determine if the user can update SMS templates.
     */
    public function updateSmsTemplates(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_sms_templates');
    }

    /**
     * Determine if the user can update SMS settings.
     */
    public function updateSms(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_sms');
    }

    /**
     * Determine if the user can update payment settings.
     */
    public function updatePayment(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_payment');
    }

    /**
     * Determine if the user can send a test SMS.
     */
    public function testSms(User $user): bool
    {
        return $user->hasPermissionTo('settings.test_sms');
    }

    /**
     * Determine if the user can view SEO settings.
     */
    public function viewSeo(User $user): bool
    {
        return $user->hasPermissionTo('settings.view_seo');
    }

    /**
     * Determine if the user can update SEO settings.
     */
    public function updateSeo(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_seo');
    }

    /**
     * Determine if the user can view homepage content.
     */
    public function viewHomepage(User $user): bool
    {
        return $user->hasPermissionTo('website.edit_homepage');
    }

    /**
     * Determine if the user can update homepage content.
     */
    public function updateHomepage(User $user): bool
    {
        return $user->hasPermissionTo('website.edit_homepage');
    }

    /**
     * Determine if the user can view header content.
     */
    public function viewHeader(User $user): bool
    {
        return $user->hasPermissionTo('website.edit_homepage');
    }

    /**
     * Determine if the user can update header content.
     */
    public function updateHeader(User $user): bool
    {
        return $user->hasPermissionTo('website.edit_homepage');
    }

    /**
     * Determine if the user can view about page content.
     */
    public function viewAbout(User $user): bool
    {
        return $user->hasPermissionTo('website.edit_about');
    }

    /**
     * Determine if the user can update about page content.
     */
    public function updateAbout(User $user): bool
    {
        return $user->hasPermissionTo('website.edit_about');
    }

    /**
     * Determine if the user can view contact page content.
     */
    public function viewContact(User $user): bool
    {
        return $user->hasPermissionTo('website.edit_contact');
    }

    /**
     * Determine if the user can update contact page content.
     */
    public function updateContact(User $user): bool
    {
        return $user->hasPermissionTo('website.edit_contact');
    }

    /**
     * Determine if the user can view footer content.
     */
    public function viewFooter(User $user): bool
    {
        return $user->hasPermissionTo('website.edit_homepage');
    }

    /**
     * Determine if the user can update footer content.
     */
    public function updateFooter(User $user): bool
    {
        return $user->hasPermissionTo('website.edit_homepage');
    }

    /**
     * Determine if the user can update cancellation settings.
     */
    public function updateCancellation(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_rental');
    }

    /**
     * Determine if the user can update overdue settings.
     */
    public function updateOverdue(User $user): bool
    {
        return $user->hasPermissionTo('settings.edit_rental');
    }
}
