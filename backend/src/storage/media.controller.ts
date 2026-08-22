import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Response } from "express";
import { StorageService } from "./storage.service";

/* Public read side of the image store: GET /v1/media/<key> streams the object
   putImage wrote under <key>. S3_PUBLIC_URL points here when the bucket has no
   public-URL mode of its own (Railway Buckets); with R2/S3 behind a public
   domain this route simply goes unused.

   Keys are content-hashed (images.service.ts), so a URL never changes meaning
   and the response can be cached forever. */
const KEY = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/;

@Controller("media")
export class MediaController {
  constructor(private readonly storage: StorageService) {}

  /* Nest 11 / Express 5: a named wildcard captures the rest of the path, as a
     string or — when it spans segments — an array of them. */
  @Get("*key")
  async get(@Param("key") raw: string | string[], @Res() res: Response) {
    const key = Array.isArray(raw) ? raw.join("/") : raw;
    if (!KEY.test(key) || key.includes("..")) throw new NotFoundException();
    if (!this.storage.configured) throw new ServiceUnavailableException("storage not configured");

    const obj = await this.storage.getImage(key);
    if (!obj) throw new NotFoundException();

    res.setHeader("Content-Type", obj.contentType);
    if (obj.contentLength !== undefined) res.setHeader("Content-Length", obj.contentLength);
    if (obj.etag) res.setHeader("ETag", obj.etag);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    obj.body.pipe(res);
  }
}
