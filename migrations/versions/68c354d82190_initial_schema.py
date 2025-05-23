"""initial schema

Revision ID: 68c354d82190
Revises: 
Create Date: 2025-04-18 14:32:50.789296

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '68c354d82190'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('daily_report', sa.Column('data', sa.JSON(), nullable=True))
    op.add_column('daily_report', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('daily_report', sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.drop_column('daily_report', 'checklist')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('daily_report', sa.Column('checklist', sqlite.JSON(), nullable=True))
    op.drop_column('daily_report', 'updated_at')
    op.drop_column('daily_report', 'created_at')
    op.drop_column('daily_report', 'data')
    # ### end Alembic commands ###
