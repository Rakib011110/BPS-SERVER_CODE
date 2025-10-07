import { digitalDownloadService } from "../modules/DigitalDownload/digitalDownload.service";

class DownloadCleanupJob {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Start the cleanup job - runs every 24 hours
  startCleanupJob() {
    if (this.intervalId) {
      console.log("Download cleanup job is already running");
      return;
    }

    // Run cleanup immediately on start
    this.runCleanupNow().catch(console.error);

    // Schedule to run every 24 hours
    this.intervalId = setInterval(async () => {
      try {
        console.log("Starting scheduled download cleanup job...");
        const result = await digitalDownloadService.cleanupExpiredDownloads();
        console.log(
          `Download cleanup completed: ${result.deletedCount} records deleted`
        );
      } catch (error) {
        console.error("Download cleanup job failed:", error);
      }
    }, this.CLEANUP_INTERVAL);

    console.log("Download cleanup job scheduled to run every 24 hours");
  }

  // Stop the cleanup job
  stopCleanupJob() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Download cleanup job stopped");
    }
  }

  // Run cleanup immediately (for testing or manual trigger)
  async runCleanupNow() {
    try {
      console.log("Running download cleanup manually...");
      const result = await digitalDownloadService.cleanupExpiredDownloads();
      console.log(
        `Manual cleanup completed: ${result.deletedCount} records deleted`
      );
      return result;
    } catch (error) {
      console.error("Manual cleanup failed:", error);
      throw error;
    }
  }

  // Get job status
  isRunning() {
    return this.intervalId !== null;
  }
}

export const downloadCleanupJob = new DownloadCleanupJob();
