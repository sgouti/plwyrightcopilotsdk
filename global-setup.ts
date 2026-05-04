import { startSession } from './helper/copilot/copilotSession';

export default async function globalSetup(): Promise<void> {
  await startSession();
}
