export type UploadResult = {
  file: File;
  status: "success" | "error";
  url?: string;
  error?: string;
};

export async function uploadFiles(
  files: File[],
  upload: (file: File) => Promise<{ url: string }>
): Promise<UploadResult[]> {
  const settled = await Promise.allSettled(files.map((file) => upload(file)));
  return settled.map((result, index) => result.status === "fulfilled"
    ? { file: files[index]!, status: "success", url: result.value.url }
    : {
        file: files[index]!,
        status: "error",
        error: result.reason instanceof Error ? result.reason.message : "上传失败"
      });
}
