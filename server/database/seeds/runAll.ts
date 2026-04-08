import { seedTeams } from "./seedTeams";
import { seedPlayers } from "./seedPlayers";
import { seedMatches } from "./seedMatches";
import { seedRawStats } from "./seedScores";
import { seedPoints } from "./seedPoints";
import { seedDailyPoints } from "./seedDailyPoints";
import { Logger } from "../../src/utils/logger";
import { processPeriodPriceUpdateForSeed } from "../../src/services/price.service";

async function runAll() {
  const masterTracker = new Logger("MASTER_SYNC");
  masterTracker.log('INFO', "Starting Full Database Synchronization Sequence.");

  const sequence = [
    { name: "TEAMS", fn: seedTeams },
    { name: "PLAYERS", fn: seedPlayers },
    { name: "MATCHES", fn: seedMatches },
    { name: "SCORES", fn: seedRawStats },
    { name: "POINTS", fn: seedPoints },
    { name: "DAILY_POINTS", fn: seedDailyPoints },
    {
      name: "PROCESS_PERIOD_PRICES",
      fn: async () => {
        const r = await processPeriodPriceUpdateForSeed(0);
        if (r.skipped) {
          masterTracker.log(
            "INFO",
            "PROCESS_PERIOD_PRICES skipped — daily prices already recorded for today.",
          );
        }
      },
    },
  ];

  const stepTimings: { name: string; seconds: number }[] = [];

  try {
    for (const step of sequence) {
      const stepStartTime = Date.now();
      masterTracker.log("INFO", `Beginning Step: ${step.name}`);

      await step.fn();

      const seconds = (Date.now() - stepStartTime) / 1000;
      stepTimings.push({ name: step.name, seconds });
      masterTracker.log(
        "INFO",
        `Finished Step: ${step.name} | Duration: ${seconds.toFixed(2)}s`,
      );
    }

    const totalSeconds = stepTimings.reduce((a, s) => a + s.seconds, 0);
    masterTracker.log("INFO", "--- Seed section timings ---");
    for (const { name, seconds } of stepTimings) {
      masterTracker.log("INFO", `  ${name}: ${seconds.toFixed(2)}s`);
    }
    masterTracker.log(
      "INFO",
      `  TOTAL: ${totalSeconds.toFixed(2)}s`,
    );
    masterTracker.log("INFO", "----------------------------");

    masterTracker.log("INFO", "Full Synchronization Sequence completed successfully.");
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