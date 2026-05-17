import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


def upload_file(file_bytes: bytes, folder: str = "uploads") -> str:
    result = cloudinary.uploader.upload(file_bytes, folder=folder)
    return result["secure_url"]


def delete_file(url: str):
    if not url or "cloudinary.com" not in url:
        return
    try:
        # URL 형식: .../upload/v12345/folder/filename.ext
        path = url.split("/upload/", 1)[1]
        if path.startswith("v") and "/" in path:
            path = path.split("/", 1)[1]
        public_id = os.path.splitext(path)[0]
        cloudinary.uploader.destroy(public_id)
    except Exception:
        pass
