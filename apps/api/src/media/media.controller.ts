import { Controller, Get, Req, Res, NotFoundException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { existsSync } from 'fs';
import { join, resolve, sep } from 'path';
import { Public } from '../auth/decorators/public.decorator';

@Controller('media')
export class MediaController {
  @Public()
  @Get('*path')
  serveMedia(@Req() req: Request, @Res() res: Response) {
    const rawUrl: string = req.originalUrl || req.url || '';
    const cleanPath = rawUrl
      .split('?')[0]
      .replace(/^\/api\/media\/?/, '')
      .replace(/^\/media\/?/, '')
      .replace(/^\/+/, '');
    let mediaPath: string;
    try {
      mediaPath = decodeURIComponent(cleanPath);
    } catch {
      throw new NotFoundException('Invalid media path');
    }

    if (!mediaPath || mediaPath.split(/[\\/]+/).includes('..')) {
      throw new NotFoundException(
        `No media path specified (rawUrl: ${rawUrl})`,
      );
    }

    const roots = [
      '/app/apps/api/media',
      '/app/media',
      join(process.cwd(), 'media'),
      join(process.cwd(), '..', 'media'),
      join(__dirname, '..', '..', 'media'),
      join(__dirname, '..', '..', '..', 'media'),
    ];
    const possiblePaths = roots
      .map((root) => {
        const absoluteRoot = resolve(root);
        const candidate = resolve(absoluteRoot, mediaPath);
        const rootPrefix = absoluteRoot.endsWith(sep)
          ? absoluteRoot
          : `${absoluteRoot}${sep}`;
        return candidate.startsWith(rootPrefix) ? candidate : null;
      })
      .filter((path): path is string => path !== null);

    for (const filePath of possiblePaths) {
      if (existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }

    throw new NotFoundException(
      `Media file "${mediaPath}" not found. Checked: ${possiblePaths.join(' | ')}`,
    );
  }
}
