# Run the seed script
# python scripts/seed.py

# Or run directly
# python -m app.database.seed

import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.database.seed import main

if __name__ == "__main__":
    asyncio.run(main())