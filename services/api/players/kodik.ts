import { BaseVideoExtractor, Video } from './base';
import { Buffer } from 'buffer';

const KODIK_URL_REGEX = /^https:\/\/kodik\.info/;

interface KodikAPIPayload {
  d: string;
  d_sign: string;
  pd: string;
  pd_sign: string;
  ref: string;
  ref_sign: string;
  type: string;
  hash: string;
  id: string;
  bad_user: boolean;
  info: Record<string, unknown>;
  cdn_is_working: boolean;
}

interface KodikPageResult {
  apiPayload: KodikAPIPayload;
  playerJsPath: string;
}

export class Kodik extends BaseVideoExtractor {
  protected static URL_RULE = KODIK_URL_REGEX;

  private static CACHED_API_PATH: string | null = null;

  private static API_CONSTS_PAYLOAD = {
    bad_user: false,
    info: {},
    cdn_is_working: true,
  };

  private async fetchGet(url: string): Promise<Response> {
    return fetch(url, { method: 'GET' });
  }

  private async fetchPost(
    url: string,
    data: KodikAPIPayload,
    headers: Record<string, string>,
  ): Promise<Response> {
    const body = new URLSearchParams(
      Object.entries(data).map(([k, v]) => [k, String(v)]),
    ).toString();

    return fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }

  private decryptUrl(encoded: string): string {
    let result = '';

    for (const char of encoded) {
      if (char >= 'A' && char <= 'Z') {
        result += String.fromCharCode(
          ((char.charCodeAt(0) - 65 + 18) % 26) + 65,
        );
      } else if (char >= 'a' && char <= 'z') {
        result += String.fromCharCode(
          ((char.charCodeAt(0) - 97 + 18) % 26) + 97,
        );
      } else {
        result += char;
      }
    }

    return result;
  }

  private decode(urlEncoded: string): string {
    if (urlEncoded.endsWith('.m3u8')) {
      return urlEncoded.startsWith('https')
        ? urlEncoded
        : `https:${urlEncoded}`;
    }

    const base64 = this.decryptUrl(urlEncoded);
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');

    return decoded.startsWith('https') ? decoded : `https:${decoded}`;
  }

  private getNetloc(url: string): string {
    const match = url.match(/^https?:\/\/([^/]+)/i);
    if (!match) {
      throw new Error('Invalid URL');
    }
    return match[1];
  }
  private createUrlApi(netloc: string, path: string): string {
    return `https://${netloc}${path}`;
  }

  private createApiHeaders(
    url: string,
    netloc: string,
  ): Record<string, string> {
    return {
      Origin: `https://${netloc}`,
      Referer: url,
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0',
    };
  }

  private isNotFoundedVideo(text: string): boolean {
    return text.includes('Видео не найдено');
  }

  private isUnhandledErrorResponse(response: Response, text: string): boolean {
    return (
      response.status === 500 &&
      text.includes('An unhandled lowlevel error occurred')
    );
  }

  private updateApiPath(text: string): void {
    const match = /\$\.ajax\([^>]+,url:\s*atob\([\"\']([^"\']+)[\"\']\)/.exec(
      text,
    );

    if (match?.[1]) {
      Kodik.CACHED_API_PATH = Buffer.from(match[1], 'base64').toString('utf-8');
    }
  }

  private extractApiPayload(text: string): KodikPageResult {
    const urlParamsRaw =
      /var\s*urlParams\s*=\s*'([^']*)'/.exec(text)?.[1] || '';
    let urlParams: Partial<KodikAPIPayload> = {};

    if (urlParamsRaw) {
      try {
        urlParams = JSON.parse(urlParamsRaw);
      } catch (e) {
        console.warn('Kodik RN parse warn: invalid urlParams json', e);
      }
    }

    const type =
      /var\s*type\s*=\s*['"](.*?)['"]/.exec(text)?.[1] ||
      /vInfo\.type\s*=\s*['"](.*?)['"]/.exec(text)?.[1] ||
      '';
    const hash = /vInfo\.hash\s*=\s*['"](.*?)['"]/.exec(text)?.[1] || '';
    const id =
      /vInfo\.id\s*=\s*['"](.*?)['"]/.exec(text)?.[1] ||
      /var\s*videoId\s*=\s*['"](.*?)['"]/.exec(text)?.[1] ||
      '';

    const playerJsPath =
      /<script.*?src="(\/assets\/js\/app\..*?)"/.exec(text)?.[1] || '';

    return {
      apiPayload: {
        d: urlParams.d || '',
        d_sign: urlParams.d_sign || '',
        pd: urlParams.pd || '',
        pd_sign: urlParams.pd_sign || '',
        ref: urlParams.ref || '',
        ref_sign: urlParams.ref_sign || '',
        type,
        hash,
        id,
        ...Kodik.API_CONSTS_PAYLOAD,
      },
      playerJsPath,
    };
  }

  private hasRequiredPayloadFields(payload: KodikAPIPayload): boolean {
    return Boolean(
      payload.d &&
        payload.d_sign &&
        payload.pd &&
        payload.pd_sign &&
        payload.ref_sign &&
        payload.type &&
        payload.hash &&
        payload.id,
    );
  }

  private extract(links: Record<string, any>): Video[] {
    const videos: Video[] = [];

    if (links['360'])
      videos.push(new Video('m3u8', 360, this.decode(links['360'][0].src)));
    if (links['480'])
      videos.push(new Video('m3u8', 480, this.decode(links['480'][0].src)));
    if (links['720'])
      videos.push(new Video('m3u8', 720, this.decode(links['720'][0].src)));

    return videos;
  }

  public async parse(url: string): Promise<Video[]> {
    if (!KODIK_URL_REGEX.test(url)) {
      throw new TypeError('Некорректный Kodik URL');
    }

    try {
      const pageRes = await this.fetchGet(url);
      const pageText = await pageRes.text();

      if (this.isUnhandledErrorResponse(pageRes, pageText)) {
        console.warn('Kodik RN parse warn: unhandled error response');
        return [];
      }
      if (this.isNotFoundedVideo(pageText)) {
        console.warn('Kodik RN parse warn: video not found');
        return [];
      }

      const { apiPayload, playerJsPath } = this.extractApiPayload(pageText);

      if (!this.hasRequiredPayloadFields(apiPayload)) {
        console.warn('Kodik RN parse warn: missing api payload fields');
        return [];
      }

      const netloc = this.getNetloc(url);

      if (!Kodik.CACHED_API_PATH) {
        if (!playerJsPath) {
          console.warn('Kodik RN parse warn: missing player js path');
          return [];
        }
        const jsRes = await this.fetchGet(`https://${netloc}${playerJsPath}`);
        const jsText = await jsRes.text();
        this.updateApiPath(jsText);
      }

      if (!Kodik.CACHED_API_PATH) {
        console.warn('Kodik RN parse warn: missing api path');
        return [];
      }

      const apiUrl = this.createUrlApi(netloc, Kodik.CACHED_API_PATH || '');

      const apiRes = await this.fetchPost(
        apiUrl,
        apiPayload,
        this.createApiHeaders(url, netloc),
      );

      const apiText = await apiRes.text();
      const apiJson = JSON.parse(apiText);

      if (!apiJson?.links) {
        console.warn('Kodik RN parse warn: missing links in api response');
        return [];
      }

      return this.extract(apiJson.links);
    } catch (e) {
      console.error('Kodik RN parse error:', e);
      return [];
    }
  }
}
