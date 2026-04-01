import { jobQueue, type Job } from "./job-queue"
import { logger } from "@/lib/utils/logger"

type JobHandler = (payload: Record<string, unknown>) => Promise<unknown>

const handlers: Record<string, JobHandler> = {
  "send-email": async (payload) => {
    const { to, template, data } = payload as {
      to: string
      template: string
      data: Record<string, unknown>
    }
    // Import dynamically to avoid circular deps
    const { sendEmail } = await import("@/lib/email/send")
    await sendEmail({ to, template, data })
    return { sent: true }
  },

  "generate-product-description": async (payload) => {
    const { productId } = payload as { productId: string }
    logger.info("Generating product description", { productId })
    // AI generation would go here when AI integration is set up
    return { productId, status: "completed" }
  },

  "process-bulk-import": async (payload) => {
    const { fileUrl, vendorId } = payload as { fileUrl: string; vendorId: string }
    logger.info("Processing bulk import", { fileUrl, vendorId })
    // Bulk import logic would go here
    return { vendorId, status: "completed" }
  },

  "generate-report": async (payload) => {
    const { reportType, userId } = payload as {
      reportType: string
      userId: string
    }
    logger.info("Generating report", { reportType, userId })
    // Report generation logic would go here
    return { reportType, status: "completed" }
  },

  "payment-reminder": async (payload) => {
    const { userId } = payload as { userId: string }
    logger.info("Sending payment reminder", { userId })
    // Payment reminder email would go here
    return { userId, reminded: true }
  },
}

export function registerHandler(jobType: string, handler: JobHandler): void {
  handlers[jobType] = handler
}

export async function processJob(job: Job): Promise<void> {
  const handler = handlers[job.job_type]
  if (!handler) {
    await jobQueue.fail(job.id, `Unknown job type: ${job.job_type}`)
    return
  }

  try {
    const result = await handler(job.payload)
    await jobQueue.complete(job.id, result)
    logger.info("Job completed", { jobId: job.id, type: job.job_type })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    await jobQueue.fail(job.id, message)
    logger.error("Job failed", { jobId: job.id, type: job.job_type, error: message })
  }
}
