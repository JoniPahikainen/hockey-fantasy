import { seedTeams } from "./seedTeams";
import { seedPlayers } from "./seedPlayers";
import { seedMatches } from "./seedMatches";
import { seedRawStats } from "./seedScores";
import { seedPoints } from "./seedPoints";
import { Logger } from "../../src/utils/logger";

async function runAll() {
  const masterTracker = new Logger("MASTER_SYNC");
  masterTracker.log('INFO', "Starting Full Database Synchronization Sequence.");

  const sequence = [
    { name: "TEAMS", fn: seedTeams },
    { name: "PLAYERS", fn: seedPlayers },
    { name: "MATCHES", fn: seedMatches },
    { name: "SCORES", fn: seedRawStats },
    { name: "POINTS", fn: seedPoints }
  ];

  try {
    for (const step of sequence) {
      const stepStartTime = Date.now();
      masterTracker.log('INFO', `Beginning Step: ${step.name}`);
      
      await step.fn();
      
      const duration = ((Date.now() - stepStartTime) / 1000).toFixed(2);
      masterTracker.log('INFO', `Finished Step: ${step.name} | Duration: ${duration}s`);
    }

    masterTracker.log('INFO', "Full Synchronization Sequence completed successfully.");
    masterTracker.finish();
    process.exit(0);
  } catch (err) {
    masterTracker.log('ERROR', "Full Sync Sequence CRASHED", {
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  }
}

runAll();