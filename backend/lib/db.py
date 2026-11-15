"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, GEOSPHERE, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "users": [
        IndexModel([("email", ASCENDING)], name="email_unique", unique=True),
    ],
    "complaints": [
        IndexModel([("id", ASCENDING)], name="id_unique", unique=True),
        IndexModel([("location", GEOSPHERE)], name="location_2dsphere"),
        IndexModel(
            [("state", ASCENDING), ("district", ASCENDING), ("town", ASCENDING), ("created_at", DESCENDING)],
            name="locality_recent",
        ),
        IndexModel([("status", ASCENDING), ("created_at", DESCENDING)], name="status_recent"),
        IndexModel([("category", ASCENDING), ("created_at", DESCENDING)], name="category_recent"),
        IndexModel([("reporter_id", ASCENDING), ("created_at", DESCENDING)], name="reporter_recent"),
        IndexModel([("upvote_count", DESCENDING), ("created_at", DESCENDING)], name="top_voted"),
    ],
    "votes": [
        IndexModel([("complaint_id", ASCENDING), ("user_id", ASCENDING)], name="complaint_user_unique", unique=True),
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_recent"),
    ],
    "status_history": [
        IndexModel([("complaint_id", ASCENDING), ("created_at", ASCENDING)], name="complaint_timeline"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
