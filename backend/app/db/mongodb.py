import asyncio
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("cold_outreach.db")

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None
    is_connected: bool = False
    _mock_storage: Dict[str, Dict[str, Any]] = {
        "users": {},
        "history": {},
        "batch_jobs": {},
        "knowledge_docs": {}
    }

db_manager = Database()

async def connect_to_mongo():
    try:
        db_manager.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=2000
        )
        # Verify connection
        await db_manager.client.admin.command('ping')
        db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]
        db_manager.is_connected = True
        logger.info(f"Connected to MongoDB at {settings.MONGODB_URI}, Database: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        db_manager.is_connected = False
        logger.warning(f"MongoDB not available ({e}). Using robust In-Memory / Local Storage Fallback.")

async def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")

# Helper persistence methods that work with both Real MongoDB and Fallback store
async def get_collection(name: str):
    if db_manager.is_connected and db_manager.db is not None:
        return db_manager.db[name]
    return None

async def save_item(collection: str, item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    col = await get_collection(collection)
    data["_id"] = item_id
    if col is not None:
        await col.update_one({"_id": item_id}, {"$set": data}, upsert=True)
    else:
        db_manager._mock_storage.setdefault(collection, {})[item_id] = data
    return data

async def get_item(collection: str, item_id: str) -> Optional[Dict[str, Any]]:
    col = await get_collection(collection)
    if col is not None:
        doc = await col.find_one({"_id": item_id})
        if doc:
            doc["id"] = str(doc.get("_id", item_id))
            return doc
        return None
    return db_manager._mock_storage.get(collection, {}).get(item_id)

async def find_items(collection: str, filter_query: Dict[str, Any] = None, limit: int = 50) -> List[Dict[str, Any]]:
    col = await get_collection(collection)
    if col is not None:
        cursor = col.find(filter_query or {}).sort("created_at", -1).limit(limit)
        items = []
        async for doc in cursor:
            doc["id"] = str(doc.get("_id"))
            items.append(doc)
        return items
    
    # In-memory search
    items = list(db_manager._mock_storage.get(collection, {}).values())
    if filter_query:
        for k, v in filter_query.items():
            items = [item for item in items if item.get(k) == v]
    return sorted(items, key=lambda x: str(x.get("created_at", "")), reverse=True)[:limit]

async def delete_item(collection: str, item_id: str) -> bool:
    col = await get_collection(collection)
    if col is not None:
        res = await col.delete_one({"_id": item_id})
        return res.deleted_count > 0
    if item_id in db_manager._mock_storage.get(collection, {}):
        del db_manager._mock_storage[collection][item_id]
        return True
    return False
