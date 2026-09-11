from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.db.models import UserResponse
from app.api.auth import get_current_user
from app.db.mongodb import find_items, delete_item

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("/list")
async def get_history(
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Fetches past generated emails."""
    items = await find_items("history", limit=limit)
    return items

@router.delete("/{item_id}")
async def delete_history_item(
    item_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    success = await delete_item("history", item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "success", "message": f"Item {item_id} deleted"}

@router.get("/batches")
async def get_batch_history(
    limit: int = 20,
    current_user: UserResponse = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Fetches batch campaign history."""
    items = await find_items("batch_jobs", limit=limit)
    return items
