"""
File Upload Endpoint
"""
from fastapi import APIRouter, UploadFile, File, Depends
from typing import List

from app.services.image_service import ImageService
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter()


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    subfolder: str = "products",
    admin: User = Depends(get_current_admin_user)
):
    """
    Upload single image (admin only)
    
    Allowed subfolders: products, categories, banners
    """
    url = await ImageService.save_upload_file(file, subfolder)
    return {
        "message": "File uploaded successfully",
        "url": url,
        "filename": file.filename
    }


@router.post("/images")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    subfolder: str = "products",
    admin: User = Depends(get_current_admin_user)
):
    """
    Upload multiple images (admin only)
    
    Max 10 files per request
    """
    if len(files) > 10:
        from app.core.exceptions import BadRequestException
        raise BadRequestException("Maximum 10 files allowed per request")
    
    urls = []
    for file in files:
        url = await ImageService.save_upload_file(file, subfolder)
        urls.append({
            "filename": file.filename,
            "url": url
        })
    
    return {
        "message": f"{len(urls)} files uploaded successfully",
        "files": urls
    }


@router.delete("/image")
def delete_image(
    file_path: str,
    admin: User = Depends(get_current_admin_user)
):
    """
    Delete image file (admin only)
    
    Provide the URL path returned from upload (e.g., /static/images/products/abc.jpg)
    """
    success = ImageService.delete_file(file_path)
    
    if success:
        return {"message": "File deleted successfully"}
    else:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("File not found")


@router.post("/image-from-url")
async def download_image_from_url(
    image_url: str,
    subfolder: str = "products",
    admin: User = Depends(get_current_admin_user)
):
    """
    Download image from external URL and save locally (admin only)
    
    This automatically downloads the image and stores it in backend/static/images/
    Useful when pasting image URLs instead of uploading files
    
    Args:
        image_url: Full URL to the image (e.g., https://example.com/image.jpg)
        subfolder: Target subfolder (products, categories, banners)
    
    Returns:
        Local URL path to the downloaded image
    """
    url = await ImageService.download_from_url(image_url, subfolder)
    return {
        "message": "Image downloaded and saved successfully",
        "url": url,
        "original_url": image_url
    }
