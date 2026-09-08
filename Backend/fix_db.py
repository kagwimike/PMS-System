import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PMS.settings')
django.setup()

commands = [
    "ALTER TABLE accounts_user ADD COLUMN last_login DATETIME(6) NULL;",
    "ALTER TABLE accounts_user ADD COLUMN is_superuser TINYINT(1) NOT NULL DEFAULT 0;",
    "ALTER TABLE accounts_user ADD COLUMN first_name VARCHAR(150) NOT NULL DEFAULT '';",
    "ALTER TABLE accounts_user ADD COLUMN last_name VARCHAR(150) NOT NULL DEFAULT '';",
    "ALTER TABLE accounts_user ADD COLUMN is_staff TINYINT(1) NOT NULL DEFAULT 0;",
    "ALTER TABLE accounts_user ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;",
    "ALTER TABLE accounts_user ADD COLUMN date_joined DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;"
]

with connection.cursor() as cursor:
    for cmd in commands:
        try:
            cursor.execute(cmd)
            print(f"Executed: {cmd}")
        except Exception as e:
            print(f"Skipped/Error on {cmd}: {e}")

print("Database columns restored successfully.")
