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
        OPTIONAL MATCH (root)-[:SENT]->(:Transaction)-[:RECEIVED_BY]->(w1:Wallet)
        OPTIONAL MATCH (w1)-[:SENT]->(:Transaction)-[:RECEIVED_BY]->(w2:Wallet)
        OPTIONAL MATCH (w2)-[:SENT]->(:Transaction)-[:RECEIVED_BY]->(w3:Wallet)
        WITH DISTINCT root, collect(DISTINCT w1) + collect(DISTINCT w2) + collect(DISTINCT w3) + [root] AS target_wallets
        UNWIND target_wallets AS sender_wallet
        MATCH (sender_wallet)-[:SENT]->(tx:Transaction)-[:RECEIVED_BY]->(receiver_wallet:Wallet)
        RETURN DISTINCT
            sender_wallet.address AS source,
            receiver_wallet.address AS target,
            tx.tx_hash AS tx_hash,
            tx.amount AS amount,
            tx.asset_symbol AS asset_symbol,
            tx.asset_type AS asset_type,
            tx.timestamp AS timestamp,
            tx.block_number AS block_number
        """
        
        try:
            async with self.driver.session() as session:
                result = await session.run(query, root_addr=root_address.lower())
                records = await result.data()  # Returns list of dicts directly
                return records
        except Exception as exc:
            print(f"[!] Neo4j database service unavailable at {NEO4J_URI}: {exc}")
            raise RuntimeError(f"Neo4j database service is unavailable (Docker/Neo4j not running at {NEO4J_URI}).") from exc