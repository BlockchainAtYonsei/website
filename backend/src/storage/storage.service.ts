import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/* S3-compatible object storage (R2/S3/MinIO) for re-hosted Notion images —
   Notion file URLs are expiring signed URLs and must never reach the DB
   (design §3.4). Unconfigured storage is a supported state: sync keeps
   running and records a warning instead of writing avatar URLs. */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private _s3?: S3Client;

  constructor(private readonly config: ConfigService) {}

  get configured(): boolean {
    return Boolean(
      this.config.get("S3_BUCKET") &&
        this.config.get("S3_ACCESS_KEY_ID") &&
        this.config.get("S3_SECRET_ACCESS_KEY") &&
        this.config.get("S3_PUBLIC_URL"),
    );
  }

  private get s3(): S3Client {
    this._s3 ??= new S3Client({
      region: this.config.get<string>("S3_REGION") ?? "auto",
      ...(this.config.get("S3_ENDPOINT")
        ? { endpoint: this.config.get<string>("S3_ENDPOINT") }
        : {}),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("S3_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>("S3_SECRET_ACCESS_KEY"),
      },
    });
    return this._s3;
  }

  /* Content-hashed keys make uploads idempotent and immutable — hence the
     aggressive cache header. Returns the public URL to store. */
  async putImage(key: string, body: Uint8Array, contentType: string): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.config.getOrThrow<string>("S3_BUCKET"),
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    const base = this.config.getOrThrow<string>("S3_PUBLIC_URL").replace(/\/$/, "");
    this.logger.log(`uploaded ${key} (${body.byteLength} bytes)`);
    return `${base}/${key}`;
  }
}
