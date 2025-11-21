from fastapi import Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
import os
import uuid
from pathlib import Path

from app.core.database import get_db
from app.users import dependencies as deps
from app.users.models import User
from . import router

# Đường dẫn lưu ảnh
UPLOAD_DIR = Path("static/images/products")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed image types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload-image", tags=["Products"])
async def upload_product_image(
    file: UploadFile = File(...),
    _: User = Depends(deps.require_roles("admin", "manager", "root")),
    db: Session = Depends(get_db),
):
    """
    Upload ảnh sản phẩm. Chỉ admin/manager/root mới được upload.
    Returns: {"url": "/static/images/products/filename.jpg"}
    """
    
    # Validate file extension
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    contents = await file.read()
    
    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return URL (relative path for frontend)
    url = f"/static/images/products/{unique_filename}"
    
    return {
        "url": url,
        "filename": unique_filename,
        "size": len(contents),
        "content_type": file.content_type
    }
