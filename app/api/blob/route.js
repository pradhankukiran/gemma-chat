import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

export const runtime = "nodejs"

export async function POST(req) {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN is not set" }, { status: 500 })
  }

  const formData = await req.formData()
  const files = formData.getAll("files").filter(Boolean)

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 })
  }

  const uploads = await Promise.all(
    files.map(async (file) => {
      const originalName = typeof file.name === "string" ? file.name : "upload"
      const ext = originalName.includes(".") ? `.${originalName.split(".").pop()}` : ""
      const filename = `${randomUUID()}${ext}`
      const blob = await put(filename, file, {
        access: "public",
        token,
        contentType: file.type || "application/octet-stream",
      })
      return {
        url: blob.url,
        name: originalName,
        type: file.type || null,
        size: file.size || null,
      }
    })
  )

  return NextResponse.json({ files: uploads })
}
