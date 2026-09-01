import { db } from './db';
import { shipments } from './db/schema';

async function main() {
  await db.update(shipments).set({ status: 'pending' });
  console.log("Updated to pending");
  process.exit(0);
}

main().catch(console.error);
