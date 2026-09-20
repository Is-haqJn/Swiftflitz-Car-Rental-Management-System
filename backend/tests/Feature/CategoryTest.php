<?php

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/* Authentication */
it('requires authentication to access categories', function () {
    $this->getJson('/api/v1/categories')->assertUnauthorized();
});

/* Index */
it('can list categories', function () {
    $user = User::factory()->create();
    Category::factory()->count(3)->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/categories')
        ->assertSuccessful()
        ->assertJsonStructure(['data', 'links', 'meta']);
});

/* Store */
it('can create a category', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/categories', [
            'name' => 'Sport Utility',
            'description' => 'Spacious off-road vehicles.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'Sport Utility');
});

it('validates required name when creating a category', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/categories', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('rejects duplicate category name', function () {
    $user = User::factory()->create();
    Category::factory()->create(['name' => 'Sedan']);

    $this->actingAs($user, 'sanctum')
        ->postJson('/api/v1/categories', ['name' => 'Sedan'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

/* Show */
it('can show a category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson("/api/v1/categories/{$category->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.id', $category->id);
});

it('returns 404 for a non-existent category', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/categories/non-existent-id')
        ->assertNotFound();
});

/* Update */
it('can update a category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->putJson("/api/v1/categories/{$category->id}", [
            'name' => 'Updated SUV',
            'description' => 'Updated description.',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'Updated SUV');
});

/* Delete */
it('can delete a category', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->deleteJson("/api/v1/categories/{$category->id}")
        ->assertSuccessful();

    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});
