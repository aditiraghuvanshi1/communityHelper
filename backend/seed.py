"""Add realistic, repeatable demo data to CivicConnect without replacing records.

Run from this directory with the backend environment configured: ``python seed.py``.
Demo rows carry ``demo_seed_id`` so they can be identified separately.
"""

import asyncio
import base64
import sys
import uuid
from datetime import datetime, timedelta, timezone

import requests
from pymongo.errors import DuplicateKeyError

from lib.db import client, db, ensure_indexes
from lib.security import hash_password

PHOTO_SOURCES = {
    "pothole": "https://images.unsplash.com/photo-1687672736892-133aac1ec1cb?w=1080&fm=jpg&q=70&fit=max",
    "garbage": "https://images.unsplash.com/photo-1785702217197-2a05999a37f8?w=1080&fm=jpg&q=70&fit=max",
    "street": "https://images.unsplash.com/photo-1636011203281-a76ae5a437dd?w=1080&fm=jpg&q=70&fit=max",
}
MAX_PHOTO_BYTES = 700_000
DEMO_SEED_ID = "civicconnect-hackathon-demo-v1"
DEMO_NAMESPACE = uuid.UUID("46e9ea36-b605-4d91-a355-54da215b7415")


def stable_id(value: str) -> str:
    """Make seed IDs stable so rerunning this script never duplicates demo rows."""
    return str(uuid.uuid5(DEMO_NAMESPACE, value))


def fetch_photo(key: str) -> str | None:
    """Download a demo photo as a size-capped data URL; give up quietly if offline."""
    try:
        resp = requests.get(PHOTO_SOURCES[key], timeout=10)
        if resp.status_code != 200 or len(resp.content) > MAX_PHOTO_BYTES:
            return None
        return "data:image/jpeg;base64," + base64.b64encode(resp.content).decode()
    except Exception:
        return None


ADMIN = {"name": "Meera Iyer", "email": "admin@civicconnect.app", "password": "Admin@1234", "role": "admin"}
CITIZEN = {"name": "Arjun Rao", "email": "citizen@civicconnect.app", "password": "Citizen@1234", "role": "citizen"}
EXTRA_CITIZENS = [
    {"name": "Kavya Shetty", "email": "kavya.shetty@example.com", "password": "Citizen@1234", "role": "citizen"},
    {"name": "Rohit Malhotra", "email": "rohit.m@example.com", "password": "Citizen@1234", "role": "citizen"},
    {"name": "Fatima Sheikh", "email": "fatima.s@example.com", "password": "Citizen@1234", "role": "citizen"},
]

STATE, DISTRICT, TOWN = "Karnataka", "Bengaluru Urban", "Bengaluru"

# (locality, lat, lng, address, category, title, description, final_status, hours_ago)
COMPLAINTS = [
    ("Indiranagar", 12.9749, 77.6380, "100 Feet Road, near the ASM signal", "roads_potholes",
     "Deep pothole cluster on 100 Feet Road signal crossing",
     "Three large potholes have opened up at the 100 Feet Road signal crossing right where vehicles turn towards "
     "Domlur. Two-wheelers swerve into the next lane to avoid them and two riders have fallen here this week alone. "
     "The stretch fills with water during rain, making the holes almost invisible until you hit them.",
     "in_progress", 50),
    ("Koramangala", 12.9345, 77.6214, "5th Block market lane, behind the bus stop", "garbage_sanitation",
     "Garbage not collected from 5th Block market lane for four days",
     "The market lane behind the 5th Block bus stop has not had a pickup in four days. Restaurant waste bags are "
     "torn open by strays by morning and the smell reaches the shops line. There are also black spots where "
     "leachate is pooling near the pedestrian crossing.",
     "reported", 30),
    ("HSR Layout", 12.9116, 77.6389, "Sector 2, 27th Main Road", "streetlights",
     "Three streetlights not working on 27th Main, Sector 2",
     "A stretch of 27th Main between the Sector 2 park gate and the coconut grove has been completely dark for "
     "over a week. Three poles in a row are dead. Evening walkers use phone torches and the blind curve near the "
     "park has seen two scooter scrapes already.",
     "assigned", 96),
    ("Jayanagar", 12.9299, 77.5826, "11th Main, 4th Block", "drainage_sewage",
     "Overflowing drain water spreading across 11th Main footpath",
     "The stormwater drain on 11th Main is choked and overflow has been spilling onto the footpath outside the "
     "4th Block complex since Sunday. Stagnant water now covers the paving slabs near the bus shelter, and "
     "mosquito breeding has started in the pooled sections.",
     "under_review", 20),
    ("Whitefield", 12.9698, 77.7500, "Palm Meadows approach road, Ramagondanahalli", "water_supply",
     "Very low water pressure across the Palm Meadows approach road",
     "Water pressure on the Palm Meadows approach road has dropped to a trickle since Monday. Ground floor flats "
     "in three buildings get supply only between 6 and 7 AM. Upper floors are carrying water in buckets. A BWSSB "
     "valve two lanes away was reportedly left half closed after last month's road work.",
     "reported", 12),
    ("Indiranagar", 12.9698, 77.6409, "12th Main, off CMH Road", "electricity",
     "Frayed electrical wires hanging low over 12th Main footpath",
     "Low-hanging service wires on 12th Main have frayed at the joint and spark visibly during wind. The wires dip "
     "to head height over the footpath near the transformer, and auto drivers park underneath to avoid rain. "
     "This is directly next to a school van pickup point, which makes it genuinely dangerous.",
     "assigned", 70),
    ("Koramangala", 12.9345, 77.6165, "Jyoti Nivas College Road, back gate", "streetlights",
     "Unlit college road stretch near Jyoti Nivas back gate",
     "The stretch near the Jyoti Nivas College back gate has no working streetlight for nearly 200 metres. "
     "Students returning from evening classes walk this stretch daily. It has been reported by the college office "
     "twice before through other channels and nothing has changed.",
     "resolved", 340),
    ("HSR Layout", 12.9121, 77.6446, "Sector 1 service road, near the lake fence", "public_safety",
     "Stray cattle herd blocking Sector 1 service road near the lake",
     "A herd of eight to ten stray cattle occupies the Sector 1 service road beside the lake fence every morning "
     "and evening. They stand in the middle of the road and charge two-wheelers when startled. There are no "
     "barricades or cattle-warning signage anywhere on this stretch.",
     "reported", 8),
    ("Malleshwaram", 13.0028, 77.5716, "8th Cross, outside the market entrance", "roads_potholes",
     "Cracked and sunken footpath slabs outside 8th Cross market entrance",
     "The footpath slabs outside the 8th Cross market entrance have sunk unevenly after the last cable-laying "
     "work. Elderly shoppers walking to the market trip on the raised edges, and after rain the sunken section "
     "becomes a puddle you cannot step around.",
     "resolved", 420),
    ("Jayanagar", 12.9250, 77.5848, "9th Block, near the BBMP playground", "public_safety",
     "Construction site running loudspeakers past 11 PM in 9th Block",
     "A private construction site next to the BBMP playground runs loudspeaker announcements and cement mixer "
     "operations past 11 PM every night this week. Residents on the 9th Block cross street cannot sleep, and "
     "several elderly residents with heart conditions live on this row.",
     "rejected", 150),
    ("BTM Layout", 12.9166, 77.6101, "2nd Stage, 16th Main near the water tank", "drainage_sewage",
     "Sewage backup flowing into ground-floor homes on 16th Main",
     "Sewage is backing up through the manhole on 16th Main and flowing into the ground-floor homes of three "
     "houses near the water tank. The overflow started two days ago and the line was jetted once but blocked "
     "again within hours. Families have moved out of one home entirely.",
     "in_progress", 60),
    ("Hebbal", 13.0358, 77.5970, "Service road below the Hebbal flyover loop", "other",
     "Fallen tree branch blocking the Hebbal flyover loop service road",
     "A large rain-tree branch came down across the service road below the Hebbal flyover loop during last "
     "night's rain. Buses are squeezing past on the wrong side and it is only a matter of time before a mirror "
     "strike or worse. The branch is also tangled with the low-tension wire on the pole.",
     "reported", 5),
]

HISTORY_PATHS = {
    "reported": [("reported", "Complaint received and awaiting municipal review.")],
    "under_review": [
        ("reported", "Complaint received and awaiting municipal review."),
        ("under_review", "Preliminary verification scheduled; complaint details confirmed with the reporter."),
    ],
    "assigned": [
        ("reported", "Complaint received and awaiting municipal review."),
        ("under_review", "Verified against field records; photographs matched the location."),
        ("assigned", "Routed to the zonal engineering section for inspection."),
    ],
    "in_progress": [
        ("reported", "Complaint received and awaiting municipal review."),
        ("under_review", "Verified against field records; complaint details confirmed with the reporter."),
        ("assigned", "Routed to the zonal engineering section for inspection."),
        ("in_progress", "Work order issued. Repair crew assigned to this stretch this week."),
    ],
    "resolved": [
        ("reported", "Complaint received and awaiting municipal review."),
        ("under_review", "Verified against field records; complaint details confirmed with the reporter."),
        ("assigned", "Routed to the concerned contractor for corrective action."),
        ("in_progress", "Contractor mobilised to the site with material and signage."),
        ("resolved", "Work completed and inspected by the zonal officer. Site cleared and verified."),
    ],
    "rejected": [
        ("reported", "Complaint received and awaiting municipal review."),
        ("rejected", "Verified as a civil matter outside municipal jurisdiction. Please escalate to the "
                     "police helpline (100) or the pollution control board for noise complaints."),
    ],
}

VOTES = [0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 12]  # complaint indexes the seeded citizens support


async def seed() -> None:
    now = datetime.now(timezone.utc)
    photos = {key: fetch_photo(key) for key in PHOTO_SOURCES}
    attached = sum(1 for p in photos.values() if p)
    print(f"Downloaded {attached}/{len(photos)} demo photos.")

    users: dict[str, dict] = {}
    inserted_users = 0
    for spec in [ADMIN, CITIZEN, *EXTRA_CITIZENS]:
        # Reuse an existing account if present; never reset its password or role.
        doc = await db.users.find_one({"email": spec["email"]})
        if doc is None:
            doc = {
                "id": stable_id(f"user:{spec['email']}"),
                "name": spec["name"],
                "email": spec["email"],
                "role": spec["role"],
                "password_hash": hash_password(spec["password"]),
                "created_at": now - timedelta(days=90),
                "demo_seed_id": DEMO_SEED_ID,
            }
            try:
                await db.users.insert_one(doc)
                inserted_users += 1
            except DuplicateKeyError:
                # A concurrently-created email may have won the unique-index race.
                doc = await db.users.find_one({"email": spec["email"]})
                if doc is None:
                    raise
        users[spec["email"]] = doc
    print(f"Added {inserted_users} demo users; existing accounts were left unchanged.")

    inserted_complaints = 0
    for index, (locality, lat, lng, address, category, title, description, status, hours_ago) in enumerate(COMPLAINTS):
        created = now - timedelta(hours=hours_ago)
        complaint_id = stable_id(f"complaint:{index}")
        photo = photos.get("pothole" if category == "roads_potholes" else
                           "garbage" if category == "garbage_sanitation" else
                           "street" if index % 3 == 0 else None)
        history = HISTORY_PATHS[status]
        elapsed = now - created
        step = elapsed / max(len(history), 1)
        events = [
            {
                "id": stable_id(f"history:{complaint_id}:{event_index}"),
                "complaint_id": complaint_id,
                "status": event_status,
                "remark": remark,
                "actor_name": ADMIN["name"],
                "created_at": created + step * (event_index + 1),
                "demo_seed_id": DEMO_SEED_ID,
            }
            for event_index, (event_status, remark) in enumerate(history)
        ]
        last_updated = events[-1]["created_at"]
        photo_list = [photo] if photo else []
        complaint = {
            "id": complaint_id,
            "title": title,
            "description": description,
            "category": category,
            "status": status,
            "state": STATE,
            "district": DISTRICT,
            "town": TOWN,
            "locality": locality,
            "address": address,
            "lat": lat,
            "lng": lng,
            "location": {"type": "Point", "coordinates": [lng, lat]},
            "photos": photo_list,
            "reporter_id": users[CITIZEN["email"]]["id"],
            "reporter_name": CITIZEN["name"],
            "upvote_count": 0,
            "created_at": created,
            "updated_at": last_updated,
            "demo_seed_id": DEMO_SEED_ID,
        }
        if status == "resolved":
            complaint.update({
                "resolution_photo": photo,
                "resolution_remark": "Completed repairs verified by the demo ward officer.",
                "resolved_at": last_updated,
            })
        result = await db.complaints.update_one(
            {"id": complaint_id}, {"$setOnInsert": complaint}, upsert=True
        )
        if result.upserted_id is not None:
            inserted_complaints += 1
        for event in events:
            await db.status_history.update_one(
                {"id": event["id"]}, {"$setOnInsert": event}, upsert=True
            )
        if index in VOTES:
            voters = [users[CITIZEN["email"]], *list(users.values())[2:]]
            for voter_index, voter in enumerate(voters[: (index % 4) + 1]):
                await db.votes.update_one(
                    {"complaint_id": complaint_id, "user_id": voter["id"]},
                    {"$setOnInsert": {
                        "id": stable_id(f"vote:{complaint_id}:{voter['id']}"),
                        "complaint_id": complaint_id,
                        "user_id": voter["id"],
                        "created_at": created + timedelta(minutes=30 + voter_index),
                        "demo_seed_id": DEMO_SEED_ID,
                    }},
                    upsert=True,
                )
        vote_count = await db.votes.count_documents({"complaint_id": complaint_id})
        await db.complaints.update_one(
            {"id": complaint_id, "demo_seed_id": DEMO_SEED_ID},
            {"$set": {"upvote_count": vote_count}},
        )

    print(
        f"Added {inserted_complaints} demo complaints (up to {len(COMPLAINTS)} total), "
        "with status history and votes. Existing complaint data was preserved."
    )


async def main() -> None:
    try:
        await client.admin.command("ping")
    except Exception as exc:
        print(
            f"MongoDB is unavailable ({type(exc).__name__}); no demo data was written. "
            "Check DNS/network access and backend/.env, then rerun this script."
        )
        return
    try:
        await ensure_indexes()
        await seed()
    except Exception as exc:
        print(
            f"Demo seeding stopped ({type(exc).__name__}). "
            "Any inserted rows are safe to keep; rerun after fixing the issue."
        )
    finally:
        client.close()

if __name__ == "__main__":
    if "--drop" in sys.argv:
        raise SystemExit("--drop is disabled; demo seeding never deletes collections.")
    asyncio.run(main())
