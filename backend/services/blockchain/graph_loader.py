import os
from typing import Any

from dotenv import load_dotenv
from neo4j import GraphDatabase, Driver

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

if not NEO4J_PASSWORD:
    raise RuntimeError("NEO4J_PASSWORD is not set in environment variables.")


class Neo4jGraphLoader:
    def apply_heuristics_and_score_graph(self) -> None:
        """Executes Cypher heuristics across graph nodes, tagging peel chains,

        rapid pass-through transit hops, and updating node risk labels.
        """
        query = """
        MATCH (w:Wallet)
        OPTIONAL MATCH (in_tx:Wallet)-[r_in:TRANSFERRED]->(w)
        OPTIONAL MATCH (w)-[r_out:TRANSFERRED]->(out_tx:Wallet)
        
        WITH w,
             count(DISTINCT r_in) AS in_degree,
             count(DISTINCT r_out) AS out_degree,
             sum(r_in.amount) AS total_in,
             sum(r_out.amount) AS total_out,
             min(r_in.timestamp) AS earliest_in,
             max(r_out.timestamp) AS latest_out

        SET w.in_degree = in_degree,
            w.out_degree = out_degree,
            w.total_received = total_in,
            w.total_spent = total_out

        // Rapid pass-through flag (<= 180 seconds)
        SET w.rapid_passthrough = CASE
            WHEN earliest_in IS NOT NULL AND latest_out IS NOT NULL AND (latest_out - earliest_in) <= 180 AND (latest_out - earliest_in) >= 0
            THEN true
            ELSE false
        END

        // Peel chain flag (forwarding between 85% and 95%)
        SET w.peel_chain = CASE
            WHEN total_in > 0 AND (total_out / total_in) >= 0.85 AND (total_out / total_in) <= 0.95
            THEN true
            ELSE false
        END
        """
        with self.driver.session() as session:
            session.run(query).consume()

    def __init__(self, uri: str, user: str, password: str) -> None:
        self.driver: Driver = GraphDatabase.driver(uri, auth=(user, password))

    def verify_connection(self) -> None:
        self.driver.verify_connectivity()

    def close(self) -> None:
        self.driver.close()

    def create_constraints(self) -> None:
        queries = [
            """
            CREATE CONSTRAINT wallet_address_unique IF NOT EXISTS
            FOR (w:Wallet)
            REQUIRE w.address IS UNIQUE
            """,
            """
            CREATE CONSTRAINT transaction_hash_unique IF NOT EXISTS
            FOR (t:Transaction)
            REQUIRE t.hash IS UNIQUE
            """,
            """
            CREATE CONSTRAINT token_contract_unique IF NOT EXISTS
            FOR (t:Token)
            REQUIRE t.contract IS UNIQUE
            """,
            """
            CREATE CONSTRAINT bridge_address_unique IF NOT EXISTS
            FOR (b:Bridge)
            REQUIRE b.address IS UNIQUE
            """,
        ]

        with self.driver.session() as session:
            for query in queries:
                session.run(query).consume()

    def insert_token_transfers(self, transfers: list[dict[str, Any]]) -> None:
        if not transfers:
            print("No transfers provided to insert.")
            return

        print(f"Attempting to insert {len(transfers)} records into Neo4j...")

        query = """
        UNWIND $transfers AS tx

        MERGE (sender:Wallet {
            address: toLower(tx.from_address)
        })

        MERGE (receiver:Wallet {
            address: toLower(tx.to_address)
        })

        MERGE (transaction:Transaction {
            hash: tx.tx_hash
        })
        SET transaction.block_number = tx.block_number,
            transaction.timestamp = tx.timestamp,
            transaction.datetime_utc = tx.datetime_utc

        MERGE (sender)-[:SENT]->(transaction)
        MERGE (transaction)-[:RECEIVED_BY]->(receiver)

        MERGE (token:Token {
            contract: toLower(tx.asset_contract)
        })
        SET token.symbol = tx.asset_symbol,
            token.name = tx.asset_name

        MERGE (transaction)-[transfer:TRANSFERRED]->(token)
        SET transfer.amount = tx.asset_amount,
            transfer.asset_type = tx.asset_type
        """

        with self.driver.session() as session:
            session.run(query, transfers=transfers).consume()

        print(f"Successfully loaded {len(transfers)} structured token transfers into Neo4j.")

    def insert_bridge_transfers(self, bridge_events: list[dict[str, Any]]) -> None:
        """Batch insert bridge deposits as synthetic cross-chain edges:

        (Depositor:Wallet)-[:BRIDGED_TO]->(DepositReceiver:Wallet)
        (BridgeContract:Bridge:Contract)
        """
        if not bridge_events:
            print("No bridge events provided to insert.")
            return

        print(f"Attempting to insert {len(bridge_events)} bridge events into Neo4j...")

        query = """
        UNWIND $events AS ev
        MERGE (sender:Wallet {address: toLower(ev.depositor)})
        MERGE (receiver:Wallet {address: toLower(ev.deposit_receiver)})
        MERGE (bridge:Bridge {address: toLower(ev.bridge_contract)})
          ON CREATE SET bridge:Contract,
                        bridge.name = ev.bridge_name,
                        bridge.chain = ev.destination_chain
        MERGE (token:Token {contract: toLower(ev.root_token)})

        MERGE (sender)-[r:BRIDGED_TO {tx_hash: ev.tx_hash}]->(receiver)
        SET r.amount = ev.amount,
            r.destination_chain = ev.destination_chain,
            r.bridge_contract = toLower(ev.bridge_contract),
            r.bridge_name = ev.bridge_name,
            r.root_token = toLower(ev.root_token)
        """

        with self.driver.session() as session:
            session.run(query, events=bridge_events).consume()

        print(f"Successfully loaded {len(bridge_events)} synthetic bridge transfers into Neo4j.")


if __name__ == "__main__":
    from ingestor import EtherscanClient

    etherscan_key = os.getenv("ETHERSCAN_API_KEY")
    wallet = "0x28c6c06298d514db089934071355e5743bf21d60"

    client = EtherscanClient(api_key=etherscan_key)
    loader = Neo4jGraphLoader(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)

    try:
        loader.verify_connection()
        loader.create_constraints()

        print(f"Fetching and pushing structural token data for {wallet}...")
        transfers = client.get_erc20_transfers(wallet, max_pages=1)
        loader.insert_token_transfers(transfers)

    except Exception as exc:
        print(f"Loader Execution Error: {exc}")
    finally:
        loader.close()