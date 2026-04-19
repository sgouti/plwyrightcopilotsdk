import { startSession } from './helper/copilot/copilotSession.js';

export default async function globalSetup(): Promise<void> {
  await startSession();
}
