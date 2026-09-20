<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class WhatsAppTemplate extends Model
{
    /** @use HasFactory<\Database\Factories\WhatsAppTemplateFactory> */
    use HasFactory, LogsActivity;

    protected $table = 'whatsapp_templates';

    protected $fillable = [
        'key',
        'name',
        'description',
        'template_name',
        'default_template_name',
        'header',
        'default_header',
        'body',
        'default_body',
        'footer',
        'default_footer',
        'variables',
        'default_variables',
        'language_code',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['key', 'name', 'template_name', 'body'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('whatsapp_template')
            ->setDescriptionForEvent(fn (string $eventName) => "WhatsApp template {$this->name} was {$eventName}");
    }

    /**
     * Whether this template has been customised from its defaults.
     */
    public function isCustomised(): bool
    {
        return $this->body !== $this->default_body
            || $this->template_name !== $this->default_template_name
            || $this->header !== $this->default_header
            || $this->footer !== $this->default_footer;
    }

    protected function casts(): array
    {
        return [
            'variables' => 'array',
            'default_variables' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
