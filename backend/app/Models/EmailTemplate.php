<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class EmailTemplate extends Model
{
    /** @use HasFactory<\Database\Factories\EmailTemplateFactory> */
    use HasFactory, LogsActivity;

    protected $fillable = [
        'key',
        'name',
        'description',
        'subject',
        'default_subject',
        'html_content',
        'default_html',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['key', 'name', 'subject'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('email_template')
            ->setDescriptionForEvent(fn (string $eventName) => "Email template {$this->name} was {$eventName}");
    }

    /* Helpers */
    /**
     * Whether this template has been customised from its default.
     */
    public function isCustomised(): bool
    {
        return $this->html_content !== $this->default_html
            || $this->subject !== $this->default_subject;
    }

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
