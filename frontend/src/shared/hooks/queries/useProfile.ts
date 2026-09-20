import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    profileService,
    type UpdateProfileData,
    type ChangePasswordData,
} from '@/services/profileService';
import { useDispatch, useSelector } from 'react-redux';
import { selectAuthUser, updateUser } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/libs/utils';
import { useCallback, useRef, useState } from 'react';
import { tusClient } from '@/shared/api/tusClient';

/* Query Keys */
export const profileKeys = {
    detail: ['profile'] as const,
    sessions: ['profile', 'sessions'] as const,
};

/* Queries */
export function useProfile() {
    return useQuery({
        queryKey: profileKeys.detail,
        queryFn: () => profileService.get(),
        staleTime: 1000 * 60 * 5,
    });
}

/* Mutations */
export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: (data: UpdateProfileData) => profileService.update(data),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: profileKeys.detail });
            if (res.data) {
                dispatch(updateUser(res.data));
            }
            toast.success(res.message || 'Profile updated successfully', {
                id: 'profile-update',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to update profile'), {
                id: 'profile-update-error',
            });
        },
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: (data: ChangePasswordData) =>
            profileService.changePassword(data),
        onSuccess: res => {
            toast.success(res.message || 'Password changed successfully', {
                id: 'profile-password',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to change password'), {
                id: 'profile-password-error',
            });
        },
    });
}

export function useUploadProfilePhoto() {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const authUser = useSelector(selectAuthUser);
    const [isPending, setIsPending] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const handleRef = useRef<ReturnType<typeof tusClient.createUpload> | null>(
        null
    );

    const mutate = useCallback(
        (file: File) => {
            if (!authUser?.id) return;

            setIsPending(true);
            setUploadProgress(0);

            const handle = tusClient.createUpload(file, {
                endpoint: '/api/v1/uploads/tus',
                metadata: {
                    entity_type: 'profile_photo',
                    entity_id: String(authUser.id),
                },
                onProgress(bytesUploaded, bytesTotal) {
                    if (bytesTotal > 0) {
                        setUploadProgress(
                            Math.round((bytesUploaded / bytesTotal) * 100)
                        );
                    }
                },
                onSuccess() {
                    setIsPending(false);
                    setUploadProgress(0);
                    queryClient.invalidateQueries({
                        queryKey: profileKeys.detail,
                    });
                    // Re-fetch profile to update avatar URL in the store
                    profileService.get().then(res => {
                        if (res.data) dispatch(updateUser(res.data));
                    });
                    toast.success('Profile photo updated.', {
                        id: 'profile-photo',
                    });
                },
                onError() {
                    setIsPending(false);
                    setUploadProgress(0);
                    toast.error('Failed to upload photo.', {
                        id: 'profile-photo-error',
                    });
                },
            });

            handleRef.current = handle;
            handle.start();
        },
        [authUser?.id, dispatch, queryClient]
    );

    return { mutate, isPending, uploadProgress };
}

export function useRemoveProfilePhoto() {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => profileService.removePhoto(),
        onSuccess: res => {
            queryClient.invalidateQueries({ queryKey: profileKeys.detail });
            if (res.data) {
                dispatch(updateUser(res.data));
            }
            toast.success(res.message || 'Profile photo removed.', {
                id: 'profile-photo-remove',
            });
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to remove photo.'), {
                id: 'profile-photo-remove-error',
            });
        },
    });
}

/* Sessions */
export function useSessions() {
    return useQuery({
        queryKey: profileKeys.sessions,
        queryFn: () => profileService.getSessions(),
        staleTime: 1000 * 60,
    });
}

export function useRevokeSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tokenId: string) => profileService.revokeSession(tokenId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: profileKeys.sessions });
            toast.success('Session revoked.');
        },
        onError: error => {
            toast.error(getErrorMessage(error, 'Failed to revoke session.'));
        },
    });
}
