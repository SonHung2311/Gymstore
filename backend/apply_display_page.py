"""
Script để apply column display_page trực tiếp vào DB, bypass alembic chain conflict.
Chạy từ backend/: python apply_display_page.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine
from sqlalchemy import text

SQL_ADD_COLUMN = """
ALTER TABLE banners
ADD COLUMN IF NOT EXISTS display_page VARCHAR(20) NOT NULL DEFAULT 'all';
"""

SQL_INSERT_VERSION = """
INSERT INTO alembic_version (version_num)
VALUES ('0012')
ON CONFLICT DO NOTHING;
"""

def main():
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'banners' AND column_name = 'display_page'
        """)).fetchone()

        if result:
            print("✅ Column 'display_page' already exists, skipping ALTER TABLE.")
        else:
            conn.execute(text(SQL_ADD_COLUMN))
            conn.commit()
            print("✅ Column 'display_page' added to banners table.")

        # Register migration
        try:
            conn.execute(text(SQL_INSERT_VERSION))
            conn.commit()
            print("✅ alembic_version '0012' registered.")
        except Exception as e:
            print(f"  [info] alembic_version insert skipped: {e}")

        # Verify
        rows = conn.execute(text("SELECT version_num FROM alembic_version ORDER BY version_num")).fetchall()
        print("\nCurrent alembic versions in DB:")
        for r in rows:
            print(f"  {r[0]}")

if __name__ == "__main__":
    main()
