"""Create place_cache table.

Revision ID: 003_create_place_cache
Revises: 002_create_users
Create Date: 2026-02-05
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = "003_create_place_cache"
down_revision: str | None = "002_create_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "place_cache",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("place_id", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.String(512), nullable=False),
        sa.Column("geom", Geometry(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("types", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("raw_response", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("place_id"),
    )
    op.create_index("idx_place_cache_place_id", "place_cache", ["place_id"])
    op.create_index("idx_place_cache_expires", "place_cache", ["expires_at"])
    op.create_index(
        "idx_place_cache_geom",
        "place_cache",
        ["geom"],
        postgresql_using="gist",
    )


def downgrade() -> None:
    op.drop_index("idx_place_cache_geom", table_name="place_cache")
    op.drop_index("idx_place_cache_expires", table_name="place_cache")
    op.drop_index("idx_place_cache_place_id", table_name="place_cache")
    op.drop_table("place_cache")
