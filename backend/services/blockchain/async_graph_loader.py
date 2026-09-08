import os
from neo4j import AsyncGraphDatabase
from dotenv import load_dotenv
from backend.core.schemas import TransactionRecord

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "forensicsPassword123")

class AsyncNeo4jLoader:
    def __init__(self):
        self.driver = AsyncGraphDatabase.driver(
            NEO4J_URI,
            auth=(NEO4J_USER, NEO4J_PASSWORD)
        )

    async def close(self):
        await self.driver.close()

    async def init_schema(self):
        """Create uniqueness constraints/indexes for Wallet and Transaction nodes."""
        constraints = [
            "CREATE CONSTRAINT wallet_address_unique IF NOT EXISTS FOR (w:Wallet) REQUIRE w.address IS UNIQUE",
            "CREATE CONSTRAINT tx_hash_unique IF NOT EXISTS FOR (t:Transaction) REQUIRE t.tx_hash IS UNIQUE"
        ]
        try:
            async with self.driver.session() as session:
                for query in constraints:
                    try:
                        res = await session.run(query)
                        await res.consume()
                    except Exception as e:
                        print(f"[DB] Note on schema constraint creation: {e}")
        except Exception as exc:
            print(f"[!] DB Schema init note: Neo4j database service unavailable at {NEO4J_URI} ({exc})")

    async def save_transaction_record(self, record: TransactionRecord, publish_event: bool = True):
        """Idempotent insert of transaction and wallet entities."""
        query = """
        MERGE (sender:Wallet {address: $from_address})
        MERGE (receiver:Wallet {address: $to_address})
        MERGE (tx:Transaction {tx_hash: $tx_hash})
        ON CREATE SET
            tx.block_number = $block_number,
            tx.timestamp = $timestamp,
            tx.amount = $amount,
            tx.raw_amount = $raw_amount,
            tx.asset_symbol = $asset_symbol,
            tx.asset_type = $asset_type,
            tx.contract_address = $contract_address,
            tx.status = $status
        ON MATCH SET
            tx.amount = CASE WHEN $asset_type = 'ERC20' THEN $amount ELSE tx.amount END,
            tx.raw_amount = CASE WHEN $asset_type = 'ERC20' THEN $raw_amount ELSE tx.raw_amount END,
            tx.asset_symbol = CASE WHEN $asset_type = 'ERC20' THEN $asset_symbol ELSE tx.asset_symbol END,
            tx.asset_type = CASE WHEN $asset_type = 'ERC20' THEN $asset_type ELSE tx.asset_type END,
            tx.contract_address = CASE WHEN $asset_type = 'ERC20' THEN $contract_address ELSE tx.contract_address END
        MERGE (sender)-[:SENT]->(tx)
        MERGE (tx)-[:RECEIVED_BY]->(receiver)
        """
        
        params = {
            "from_address": record.from_address.lower(),
            "to_address": record.to_address.lower(),
            "tx_hash": record.tx_hash.lower(),
            "block_number": record.block_number,
            "timestamp": record.timestamp,
            "amount": float(record.amount),
            "raw_amount": record.raw_amount,
            "asset_symbol": record.asset_symbol or "ETH",
            "asset_type": record.asset_type.value,
            "contract_address": record.asset_contract.lower() if record.asset_contract else None,
            "status": record.status.value
        }

        try:
            async with self.driver.session() as session:
                result = await session.run(query, parameters=params)
                await result.consume()  # Guarantee transaction commit before returning
                print(f"[DB] Persisted TX {record.tx_hash} to Neo4j")
        except Exception as exc:
            print(f"[!] DB Save note: Neo4j database service unavailable at {NEO4J_URI} ({exc})")

        # Hook into Event Bus only if requested
        if publish_event:
            try:
                from backend.services.event_bus import event_bus, GRAPH_UPDATED
                await event_bus.publish(GRAPH_UPDATED, {
                    "tx_hash": record.tx_hash,
                    "from_address": record.from_address,
                    "to_address": record.to_address,
                    "amount": float(record.amount),
                    "asset_symbol": record.asset_symbol or "ETH"
                })
            except Exception as exc:
                print(f"[DB] Warning publishing GRAPH_UPDATED event: {exc}")