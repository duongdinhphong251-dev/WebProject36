import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type { BannerUploadFile } from '../banners/banner-file.type';

@Injectable()
export class DealCoverStorageService {
  private readonly storage: Storage | null;
  private readonly bucketName: string | null;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME') ?? null;
    const keyFile = this.configService.get<string>('GCS_KEY_FILE');
    this.storage = this.bucketName
      ? keyFile
        ? new Storage({ keyFilename: keyFile })
        : new Storage()
      : null;
  }

  async save(file: BannerUploadFile): Promise<string> {
    if (!this.storage || !this.bucketName) {
      throw new InternalServerErrorException('GCS_BUCKET_NAME is not configured for deal cover uploads');
    }

    const extension = extname(file.originalname || '').toLowerCase() || '.bin';
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const objectPath = `deal-covers/${filename}`;

    await this.storage.bucket(this.bucketName).file(objectPath).save(file.buffer, {
      contentType: file.mimetype || 'application/octet-stream',
      resumable: false,
    });

    return `https://storage.googleapis.com/${this.bucketName}/${objectPath}`;
  }

  async removeByUrl(imageUrl: string | null | undefined): Promise<void> {
    if (!this.storage || !this.bucketName || !imageUrl) return;

    const objectPath = this.parseObjectPath(imageUrl);
    if (!objectPath) return;

    try {
      await this.storage.bucket(this.bucketName).file(objectPath).delete({ ignoreNotFound: true });
    } catch {
      // Object may already be gone; DB state remains the source of truth.
    }
  }

  private parseObjectPath(imageUrl: string): string | null {
    const directPrefix = `https://storage.googleapis.com/${this.bucketName}/`;
    if (imageUrl.startsWith(directPrefix)) {
      return imageUrl.slice(directPrefix.length) || null;
    }

    const vhPrefix = `https://${this.bucketName}.storage.googleapis.com/`;
    if (imageUrl.startsWith(vhPrefix)) {
      return imageUrl.slice(vhPrefix.length) || null;
    }

    const gsPrefix = `gs://${this.bucketName}/`;
    if (imageUrl.startsWith(gsPrefix)) {
      return imageUrl.slice(gsPrefix.length) || null;
    }

    return null;
  }
}
