<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;


class Category extends Model
{
    use HasFactory, HasUuids;


    protected $fillable = [
        'category_name',
        'slug',
        'description',
        'icon',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted() {
        static::creating(function ($category) {
            if(empty($category->slug)) {
                $category->slug = Str::slug($category->category_name, '-');
            }
        });
    }

    //
}
