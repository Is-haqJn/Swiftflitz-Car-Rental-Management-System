<?php

namespace App\Http\Controllers;

use App\Services\Contracts\ProfileServiceInterface;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ManagementProfileController extends Controller
{
    public function __construct(private readonly ProfileServiceInterface $profileService) {}

    public function show(Request $request): View
    {
        return view('management.profile', [
            'user' => $request->user(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $this->profileService->updateProfile($user, $data);

        return redirect()
            ->route('management.profile')
            ->with('status', 'Profile updated.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $this->profileService->changePassword($request->user(), $request->input('password'));

        return redirect()
            ->route('management.profile')
            ->with('status', 'Password updated.');
    }

    public function uploadAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $this->profileService->uploadPhoto($request->user(), $request->file('avatar'));

        return redirect()
            ->route('management.profile')
            ->with('status', 'Profile photo updated.');
    }

    public function deleteAvatar(Request $request): RedirectResponse
    {
        $this->profileService->removePhoto($request->user());

        return redirect()
            ->route('management.profile')
            ->with('status', 'Profile photo removed.');
    }
}
