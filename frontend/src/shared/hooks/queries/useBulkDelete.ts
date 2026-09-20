import { useState, useCallback, useRef } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface UseBulkDeleteOptions {
    deleteFn: (id: string) => Promise<unknown>;
    invalidateKeys: QueryKey[];
    entityName: string; // singular, e.g. 'vehicle'
    onSuccess?: () => void;
}

export function useBulkDelete({
    deleteFn,
    invalidateKeys,
    entityName,
    onSuccess,
}: UseBulkDeleteOptions) {
    const queryClient = useQueryClient();
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Use refs so the callback stays stable even if keys/callbacks change
    const deleteFnRef = useRef(deleteFn);
    deleteFnRef.current = deleteFn;
    const invalidateKeysRef = useRef(invalidateKeys);
    invalidateKeysRef.current = invalidateKeys;
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;

    const bulkDelete = useCallback(
        async (ids: (string | number)[]) => {
            if (ids.length === 0) return;
            setIsBulkDeleting(true);
            try {
                await Promise.all(
                    ids.map(id => deleteFnRef.current(String(id)))
                );
                for (const key of invalidateKeysRef.current) {
                    queryClient.invalidateQueries({
                        queryKey: key as readonly unknown[],
                    });
                }
                const label = `${entityName}${ids.length === 1 ? '' : 's'}`;
                toast.success(`${ids.length} ${label} deleted`);
                onSuccessRef.current?.();
            } catch {
                toast.error(
                    `Failed to delete some ${entityName}s. Please try again.`
                );
            } finally {
                setIsBulkDeleting(false);
            }
        },
        [entityName, queryClient]
    );

    return { bulkDelete, isBulkDeleting };
}
