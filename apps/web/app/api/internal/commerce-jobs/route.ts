import { NextRequest } from "next/server";
import { failure, respond, secretMatches } from "@/features/commerce/http";
import { runJobs } from "@/features/commerce/jobs";

export async function POST(request: NextRequest) {
  if (
    !secretMatches(
      request.headers.get("authorization"),
      process.env.COMMERCE_JOB_SECRET &&
        process.env.COMMERCE_JOB_SECRET.length >= 32
        ? `Bearer ${process.env.COMMERCE_JOB_SECRET}`
        : undefined,
    )
  )
    return respond({ error: "FORBIDDEN" }, 401);
  try {
    return respond(await runJobs());
  } catch (error) {
    return failure(error);
  }
}
