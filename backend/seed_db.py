"""
FraudGuard AI — Database Seeder

Migrates data from fraud_dataset.csv into PostgreSQL.
Optimized to clean stale tables, locate files dynamically, and process safely.
"""

import os
import pandas as pd
from datetime import datetime, timezone
from app.core.database import engine, init_db, SessionLocal, Base
from app.core.logging import setup_logging, get_logger
from app.models.database import UserProfile, TransactionRecord

logger = get_logger("seed")


def seed_database():
    """Seed the database with historical transaction data."""
    setup_logging()
    logger.info("Starting database seed operation")

    # WIPE STALE TABLES: Forces Postgres to drop any broken versions from previous runs
    logger.info("Dropping old tables to ensure clean schema structural alignment...")
    Base.metadata.drop_all(bind=engine)

    # RECREATE TABLES: Builds them clean with the correct columns and types
    logger.info("Initializing fresh database tables...")
    init_db()

    # Locate and read CSV securely across multiple possible paths
    possible_paths = [
        "models/fraud_dataset.csv",
        "fraud_dataset.csv",
        "../models/fraud_dataset.csv",
        "../fraud_dataset.csv",
        "app/models/fraud_dataset.csv"
    ]
    
    df = None
    for path in possible_paths:
        if os.path.exists(path):
            logger.info(f"Found dataset target at path: {path}")
            df = pd.read_csv(path)
            break

    if df is None:
        current_dir = os.getcwd()
        raise FileNotFoundError(
            f"Could not find 'fraud_dataset.csv'. Current directory: {current_dir}"
        )

    total_rows = len(df)
    logger.info(f"Found {total_rows} rows to migrate")

    db = SessionLocal()
    try:
        # Seed user profiles
        unique_ids = df["Customer_ID"].unique()
        existing = {r[0] for r in db.query(UserProfile.customer_id).all()}

        new_profiles = []
        for cust_id in unique_ids:
            if cust_id not in existing:
                # Safely locate fallback if location column fields are missing
                first_txn = df[df["Customer_ID"] == cust_id].iloc[0]
                loc = str(first_txn["Location"]) if "Location" in df.columns else "Unknown"
                
                new_profiles.append(
                    UserProfile(
                        customer_id=str(cust_id),
                        full_name=f"Customer {str(cust_id)[-5:]}",
                        account_status="Active",
                        credit_limit=100_000.0,
                        home_location=loc,
                    )
                )

        if new_profiles:
            logger.info(f"Inserting {len(new_profiles)} user profiles...")
            db.bulk_save_objects(new_profiles)
            db.commit()
            logger.info("User profiles seeded successfully")
        else:
            logger.info("User profiles already populated — skipping")

        # Seed transactions
        existing_tx_count = db.query(TransactionRecord).count()
        if existing_tx_count == 0:
            logger.info("Formatting transaction records...")
            tx_df = pd.DataFrame(
                {
                    "transaction_id": df["Transaction_ID"],
                    "customer_id": df["Customer_ID"],
                    "amount": df["Amount"],
                    "merchant": df["Merchant"],
                    "time": pd.to_datetime(df["Time"]),
                    "location": df["Location"] if "Location" in df.columns else "Unknown",
                    "device": df["Device"] if "Device" in df.columns else "Unknown",
                    "previous_fraud": df["Previous_Fraud"] if "Previous_Fraud" in df.columns else 0,
                    "card_type": df["Card_Type"] if "Card_Type" in df.columns else "Standard",
                    "prediction_label": df["Label"] if "Label" in df.columns else None,
                }
            )

            current_now = pd.Timestamp.now(tz="UTC")
            tx_df["created_at"] = current_now
            tx_df["updated_at"] = current_now

            logger.info("Bulk inserting transactions... (This may take a moment for 100k rows)")
            tx_df.to_sql("transactions", con=engine, if_exists="append", index=False)
            logger.info(f"Successfully seeded {len(tx_df)} transactions")
        else:
            logger.info(f"Database already contains {existing_tx_count} transactions — skipping")

    except Exception as e:
        db.rollback()
        logger.error(f"Seed operation failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()