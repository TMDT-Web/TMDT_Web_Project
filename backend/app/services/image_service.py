"""
Image Upload Service
"""
import os
import uuid
from typing import Optional
from fastapi import UploadFile
import aiofiles

from app.core.config import settings
from app.core.exceptions import BadRequestException


class ImageService:
    """Image upload and management service"""
    
    @staticmethod
    def validate_file(file: UploadFile) -> None:
        """Validate uploaded file"""
        # Check file extension
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise BadRequestException(
                f"File type .{file_ext} not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size (this would be checked during upload)
        # Note: Actual size checking happens in the endpoint with streaming
    
    @staticmethod
    async def save_upload_file(
        file: UploadFile,
        subfolder: str = ""
    ) -> str:
        """
        Save uploaded file to static directory
        
        Args:
            file: FastAPI UploadFile
            subfolder: Optional subfolder (e.g., 'products', 'categories')
        
        Returns:
            Relative URL path to saved file
        """
        # Validate file
        ImageService.validate_file(file)
        
        # Generate unique filename
        file_ext = file.filename.split(".")[-1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        
        # Create full path
        if subfolder:
            upload_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
        else:
            upload_dir = settings.UPLOAD_DIR
        
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            
            # Check file size
            if len(content) > settings.MAX_FILE_SIZE:
                raise BadRequestException(
                    f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / 1048576:.1f}MB"
                )
            
            await out_file.write(content)
        
        # Return relative URL
        if subfolder:
            return f"/static/images/{subfolder}/{unique_filename}"
        else:
            return f"/static/images/{unique_filename}"
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """
        Delete file from static directory
        
        Args:
            file_path: Relative URL path (e.g., '/static/images/products/abc.jpg')
        
        Returns:
            True if deleted, False if file not found
        """
        # Convert URL path to filesystem path
        # Remove leading '/static/' from path
        if file_path.startswith("/static/"):
            file_path = file_path[8:]  # Remove '/static/'
        
        full_path = os.path.join("static", file_path)
        
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        
        return False
    
    @staticmethod
    async def download_from_url(
        image_url: str,
        subfolder: str = ""
    ) -> str:
        """
        Download image from external URL and save to static directory
        
        Args:
            image_url: External image URL
            subfolder: Optional subfolder (e.g., 'products', 'categories')
        
        Returns:
            Relative URL path to saved file
        """
        import httpx
        from urllib.parse import urlparse
        
        # Parse URL to get file extension
        parsed_url = urlparse(image_url)
        path_parts = parsed_url.path.split('.')
        
        if len(path_parts) > 1:
            file_ext = path_parts[-1].lower()
        else:
            file_ext = 'jpg'  # Default extension
        
        # Validate extension
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise BadRequestException(
                f"File type .{file_ext} not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        
        # Create full path
        if subfolder:
            upload_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
        else:
            upload_dir = settings.UPLOAD_DIR
        
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Download file
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(image_url)
            
            if response.status_code != 200:
                raise BadRequestException(f"Failed to download image from URL: HTTP {response.status_code}")
            
            content = response.content
            
            # Check file size
            if len(content) > settings.MAX_FILE_SIZE:
                raise BadRequestException(
                    f"Image size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / 1048576:.1f}MB"
                )
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as out_file:
                await out_file.write(content)
        
        # Return relative URL
        if subfolder:
            return f"/static/images/{subfolder}/{unique_filename}"
        else:
            return f"/static/images/{unique_filename}"
