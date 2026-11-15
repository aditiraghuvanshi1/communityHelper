"""Complaint domain models — Pydantic v2. Keep the TS mirrors in frontend/src/lib/types.ts in sync."""

from datetime import datetime, timezone
import base64
import binascii
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator, model_validator

Category = Literal[
    "roads_potholes",
    "garbage_sanitation",
    "water_supply",
    "drainage_sewage",
    "streetlights",
    "electricity",
    "public_safety",
    "other",
]
Status = Literal[
    "reported",
    "under_review",
    "assigned",
    "in_progress",
    "resolved",
    "rejected",
]
CATEGORIES: list[str] = [
    "roads_potholes",
    "garbage_sanitation",
    "water_supply",
    "drainage_sewage",
    "streetlights",
    "electricity",
    "public_safety",
    "other",
]
STATUSES: list[str] = [
    "reported",
    "under_review",
    "assigned",
    "in_progress",
    "resolved",
    "rejected",
]

# Photos travel as compressed data URLs (client-side canvas resize), size-capped so a
# document never balloons; stored in Mongo per the product decision.
PhotoData = Annotated[
    str,
    StringConstraints(pattern=r"^data:image/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$"),
]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ComplaintCreate(BaseModel):
    title: str = Field(min_length=10, max_length=140)
    description: str = Field(min_length=20, max_length=4000)
    category: Category
    state: str = Field(min_length=2, max_length=60)
    district: str = Field(min_length=2, max_length=60)
    town: str = Field(min_length=2, max_length=60)
    locality: str = Field(min_length=2, max_length=60)
    address: str = Field(default="", max_length=240)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    photos: list[PhotoData] = Field(default_factory=list, max_length=3)

    @field_validator("photos")
    @classmethod
    def cap_photo_size(cls, photos: list[str]) -> list[str]:
        for photo in photos:
            if len(photo) > 1_600_000:  # ~1.2 MB binary per photo after base64
                raise ValueError("Each photo must be smaller than 1.2 MB after compression")
        return photos


class StatusEventOut(BaseModel):
    id: str
    status: Status
    remark: str
    actor_name: str
    created_at: datetime


class ComplaintOut(BaseModel):
    id: str
    title: str
    description: str
    category: Category
    status: Status
    state: str
    district: str
    town: str
    locality: str
    address: str = ""
    lat: float
    lng: float
    photos: list[str] = []
    reporter_id: str
    reporter_name: str
    upvote_count: int = 0
    viewer_has_voted: bool = False
    created_at: datetime
    updated_at: datetime
    resolution_photo: str | None = None
    resolution_remark: str | None = None
    resolved_at: datetime | None = None


class ComplaintDetail(ComplaintOut):
    history: list[StatusEventOut] = []


class ComplaintPage(BaseModel):
    items: list[ComplaintOut]
    total: int


class StatusUpdateIn(BaseModel):
    status: Status
    remark: str = Field(default="", max_length=600)
    resolution_photo: PhotoData | None = None
    resolution_remark: str | None = Field(default=None, max_length=600)

    @field_validator("resolution_photo")
    @classmethod
    def validate_resolution_photo(cls, photo: str | None) -> str | None:
        if photo is None:
            return None
        if len(photo) > 1_600_000:
            raise ValueError("Resolution photo must be smaller than 1.2 MB after compression")
        try:
            header, encoded = photo.split(",", 1)
            data = base64.b64decode(encoded, validate=True)
        except (ValueError, binascii.Error) as exc:
            raise ValueError("Invalid image data") from exc
        valid = (
            (header == "data:image/png;base64" and data.startswith(b"\x89PNG\r\n\x1a\n"))
            or (header in {"data:image/jpeg;base64", "data:image/jpg;base64"} and data.startswith(b"\xff\xd8\xff"))
            or (header == "data:image/webp;base64" and len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP")
        )
        if not valid:
            raise ValueError("Upload a valid PNG, JPEG or WebP image")
        return photo

    @model_validator(mode="after")
    def require_resolution_evidence(self):
        if self.status == "resolved" and not self.resolution_photo:
            raise ValueError("An after-resolution photo is required to resolve a complaint")
        if self.status != "resolved" and not self.remark.strip():
            raise ValueError("Add a remark of at least 3 characters")
        if self.status == "resolved" and self.remark.strip() and len(self.remark.strip()) < 3:
            raise ValueError("Remark must contain at least 3 characters")
        return self


class DailyCount(BaseModel):
    date: str
    count: int


class AdminStats(BaseModel):
    total: int
    pending: int
    in_progress: int
    resolved: int
    rejected: int
    by_status: dict[str, int]
    by_category: dict[str, int]
    daily: list[DailyCount]
