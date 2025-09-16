import { NextResponse } from "next/server";
import { openApiDocument } from "~/server/api/root";

// Respond with our OpenAPI schema
export const GET = () => {
  return NextResponse.json(openApiDocument);
};
