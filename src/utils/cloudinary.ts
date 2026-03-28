const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const defaultPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export type CloudinaryUploadResult = {
    asset_id?: string;
    public_id: string;
    secure_url: string;
    url: string;
    bytes?: number;
    width?: number;
    height?: number;
    format?: string;
    [key: string]: any;
};

export async function uploadImageToCloudinary(
    uri: string,
    opts: { preset?: string; folder?: string } = {},
): Promise<CloudinaryUploadResult> {
    if (!cloudName || !(defaultPreset || opts.preset)) {
        throw new Error(
            "Missing Cloudinary env. Ensure EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET are set.",
        );
    }

    const uploadPreset = opts.preset || defaultPreset;
    const fileName = uri.split('/').pop() || 'photo.jpg';
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
        uri,
        name: fileName,
        type: mime,
    } as any);
    formData.append('upload_preset', uploadPreset as string);
    if (opts.folder) {
        formData.append('folder', opts.folder);
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as CloudinaryUploadResult;
    return data;
}