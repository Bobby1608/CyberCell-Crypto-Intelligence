import os
from typing import List, Dict, Any
from neo4j import AsyncGraphDatabase
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "forensicsPassword123")

class SubgraphExtractor:
    def __init__(self):
        self.driver = AsyncGraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USER, NEO4J_PASSWORD)
        )

    async def close(self):
        await self.driver.close()

    async def get_downstream_subgraph(self, root_address: str, max_depth: int = 4) -> List[Dict[str, Any]]:
        max_hops = max(0, (max_depth - 1) * 2)
        query = """
        MATCH (root:Wallet {address: $root_addr})
        OPTIONAL MATCH (root)-[:SENT|RECEIVED_BY*0..6]->(w:Wallet)
        WITH DISTINCT root, collect(DISTINCT w) + [root] AS target_wallets
        UNWIND target_wallets AS w1
        UNWIND target_wallets AS w2
        MATCH (w1)-[:SENT]->(tx:Transaction)-[:RECEIVED_BY]->(w2)
        RETURN DISTINCT
            w1.address AS source,
            w2.address AS target,
            tx.tx_hash AS tx_hash,
            tx.amount AS amount,
            tx.asset_symbol AS asset_symbol,
            tx.asset_type AS asset_type,
            tx.timestamp AS timestamp,
            tx.block_number AS block_number
        """
        
        async with self.driver.session() as session:
            result = await session.run(query, root_addr=root_address.lower())
            records = await result.data()  # Returns list of dicts directly
            return records