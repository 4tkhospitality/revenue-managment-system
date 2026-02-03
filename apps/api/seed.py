import sys
import os

# Ensure we can import modules from current directory
sys.path.append(os.getcwd())

from database import SessionLocal, engine
from models import Base, Hotel, User
import uuid

def seed():
    print("Seeding database...")
    # Optional: ensure tables exist if alembic didn't run
    # Base.metadata.create_all(bind=engine) 
    
    db = SessionLocal()
    
    try:
        # 1. Check Hotel
        hotel = db.query(Hotel).filter(Hotel.name == "Hotel California").first()
        if not hotel:
            hotel = Hotel(
                name="Hotel California",
                capacity=100,
                currency="USD",
                timezone="America/Los_Angeles"
            )
            db.add(hotel)
            db.commit()
            db.refresh(hotel)
            print(f"✅ Created Hotel: {hotel.name} (ID: {hotel.hotel_id})")
        else:
            print(f"ℹ️ Hotel exists: {hotel.name} (ID: {hotel.hotel_id})")

        # 2. Check User
        user = db.query(User).filter(User.email == "gm@hotelcalifornia.com").first()
        if not user:
            user = User(
                email="gm@hotelcalifornia.com",
                hotel_id=hotel.hotel_id,
                role="manager"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Created User: {user.email} (ID: {user.user_id})")
        else:
            print(f"ℹ️ User exists: {user.email} (ID: {user.user_id})")
            
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
