/**
 * useUploadFile — thin wrapper that uses useBlossomUpload and returns NIP-94 tags.
 * Kept for backwards compatibility with other components that may call it.
 */
import { useMutation } from "@tanstack/react-query";
import { useBlossomUpload } from "./useBlossomUpload";

export function useUploadFile() {
  const { mutateAsync: blossomUpload } = useBlossomUpload();

  return useMutation({
    mutationFn: async (file: File): Promise<string[][]> => {
      const result = await blossomUpload(file);
      return result.tags;
    },
  });
}
