"""
CLI utility to register a new school/university/counsellor cohort.

Usage:
    python create_org.py --code "NUST-ISB" --name "NUST Islamabad" --type university
    python create_org.py  (interactive prompt)
"""
import argparse
import sys
from pathlib import Path

# Make sure backend is on sys.path
_BACKEND = Path(__file__).resolve().parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from db.database import SessionLocal, init_db
from db.models import Org
from security import hash_key, new_access_key
from sqlalchemy import select


def register_org(invite_code: str, name: str, org_type: str = "school") -> dict:
    code = invite_code.strip().upper()
    org_type = org_type.strip().lower()
    if org_type not in ("school", "university", "counsellor"):
        org_type = "school"

    init_db()

    with SessionLocal() as db:
        existing = db.scalar(select(Org).where(Org.invite_code == code))
        if existing:
            print(f"\n[!] Error: Invite code '{code}' already exists for '{existing.name}'.")
            sys.exit(1)

        access_key = new_access_key()
        org = Org(
            invite_code=code,
            name=name.strip(),
            org_type=org_type,
            key_hash=hash_key(access_key),
        )
        db.add(org)
        db.commit()

        # Append to demo_keys.local.txt for convenience
        demo_keys_file = _BACKEND.parent / "demo_keys.local.txt"
        try:
            with open(demo_keys_file, "a", encoding="utf-8") as f:
                f.write(f"{code}: {access_key}\n")
        except Exception:
            pass

        return {
            "invite_code": code,
            "name": name.strip(),
            "org_type": org_type,
            "access_key": access_key,
        }


def main():
    parser = argparse.ArgumentParser(description="Register a new cohort / organisation")
    parser.add_argument("--code", help="Invite code for students (e.g. NUST-ISB, LGS-JOHAR)")
    parser.add_argument("--name", help="Full name of institution (e.g. NUST Islamabad)")
    parser.add_argument(
        "--type",
        choices=["school", "university", "counsellor"],
        default="school",
        help="Type of organisation (default: school)",
    )

    args = parser.parse_args()

    invite_code = args.code
    name = args.name
    org_type = args.type

    if not invite_code or not name:
        print("=== Register New Cohort / Institution ===")
        invite_code = input("Enter Invite Code (e.g. NUST-ISB): ").strip()
        name = input("Enter Institution / Counsellor Name: ").strip()
        org_type_input = input("Organisation Type [school/university/counsellor] (default: school): ").strip().lower()
        if org_type_input in ("school", "university", "counsellor"):
            org_type = org_type_input

    if not invite_code or not name:
        print("Error: Both Invite Code and Name are required.")
        sys.exit(1)

    result = register_org(invite_code, name, org_type)

    print("\n" + "=" * 50)
    print("✓ Organisation registered successfully!")
    print("=" * 50)
    print(f"Institution Name : {result['name']}")
    print(f"Invite Code      : {result['invite_code']}  (Give this to your students)")
    print(f"Access Key       : {result['access_key']}  (Private counsellor login key)")
    print(f"Dashboard Login  : http://localhost:3000/dashboard")
    print("=" * 50)
    print("Note: The access key has also been saved to pakcareer/demo_keys.local.txt\n")


if __name__ == "__main__":
    main()
