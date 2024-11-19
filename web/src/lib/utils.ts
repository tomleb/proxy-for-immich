import { NotificationType, notificationController } from '$lib/components/shared-components/notification/notification';
import { defaultLang, langs, locales } from '$lib/constants';
import { lang } from '$lib/stores/preferences.store';
import { handleError } from '$lib/utils/handle-error';
import {
  AssetMediaSize,
  getAssetOriginalPath,
  getAssetPlaybackPath,
  getAssetThumbnailPath,
  getBaseUrl,
  getPeopleThumbnailPath,
  getUserProfileImagePath,
  type AssetResponseDto,
  type PersonResponseDto,
  type SharedLinkResponseDto,
  type UserResponseDto,
} from '@immich/sdk';
import { mdiCogRefreshOutline, mdiDatabaseRefreshOutline, mdiHeadSyncOutline, mdiImageRefreshOutline } from '@mdi/js';
import { sortBy } from 'lodash-es';
import { init, register, t } from 'svelte-i18n';
import { derived, get } from 'svelte/store';

interface DownloadRequestOptions<T = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: T;
  signal?: AbortSignal;
  onDownloadProgress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
}

export const initLanguage = async () => {
  const preferenceLang = get(lang);
  for (const { code, loader } of langs) {
    register(code, loader);
  }

  await init({ fallbackLocale: preferenceLang === 'dev' ? 'dev' : defaultLang.code, initialLocale: preferenceLang });
};

interface UploadRequestOptions {
  url: string;
  method?: 'POST' | 'PUT';
  data: FormData;
  onUploadProgress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
}

export class AbortError extends Error {
  name = 'AbortError';
}

class ApiError extends Error {
  name = 'ApiError';

  constructor(
    public message: string,
    public statusCode: number,
    public details: string,
  ) {
    super(message);
  }
}

export const uploadRequest = async <T>(options: UploadRequestOptions): Promise<{ data: T; status: number }> => {
  const { onUploadProgress: onProgress, data, url } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('error', (error) => reject(error));
    xhr.addEventListener('load', () => {
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
        resolve({ data: xhr.response as T, status: xhr.status });
      } else {
        reject(new ApiError(xhr.statusText, xhr.status, xhr.response));
      }
    });

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => onProgress(event));
    }

    xhr.open(options.method || 'POST', url);
    xhr.responseType = 'json';
    xhr.send(data);
  });
};

export const downloadRequest = <TBody = unknown>(options: DownloadRequestOptions<TBody> | string) => {
  if (typeof options === 'string') {
    options = { url: options };
  }

  const { signal, method, url, data: body, onDownloadProgress: onProgress } = options;

  return new Promise<{ data: Blob; status: number }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('error', (error) => reject(error));
    xhr.addEventListener('abort', () => reject(new AbortError()));
    xhr.addEventListener('load', () => {
      if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
        resolve({ data: xhr.response as Blob, status: xhr.status });
      } else {
        reject(new ApiError(xhr.statusText, xhr.status, xhr.responseText));
      }
    });

    if (onProgress) {
      xhr.addEventListener('progress', (event) => onProgress(event));
    }

    if (signal) {
      signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.open(method || 'GET', url);
    xhr.responseType = 'blob';

    if (body) {
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(body));
    } else {
      xhr.send();
    }
  });
};

let _key: string | undefined;
let _sharedLink: SharedLinkResponseDto | undefined;

export const setKey = (key?: string) => (_key = key);
export const getKey = (): string | undefined => _key;
export const setSharedLink = (sharedLink: SharedLinkResponseDto) => (_sharedLink = sharedLink);
export const getSharedLink = (): SharedLinkResponseDto | undefined => _sharedLink;

export const isSharedLink = () => {
  return !!_key;
};

const createUrl = (path: string, parameters?: Record<string, unknown>) => {
  const searchParameters = new URLSearchParams();
  for (const key in parameters) {
    const value = parameters[key];
    if (value !== undefined && value !== null) {
      searchParameters.set(key, value.toString());
    }
  }

  const url = new URL(path, 'https://example.com');
  url.search = searchParameters.toString();

  return getBaseUrl() + url.pathname + url.search + url.hash;
};

export const getAssetOriginalUrl = (options: string | { id: string; checksum?: string }) => {
  if (typeof options === 'string') {
    options = { id: options };
  }
  const { id, checksum } = options;
  return createUrl(getAssetOriginalPath(id), { key: getKey(), c: checksum });
};

export const getAssetThumbnailUrl = (options: string | { id: string; size?: AssetMediaSize; checksum?: string }) => {
  if (typeof options === 'string') {
    options = { id: options };
  }
  const { id, size, checksum } = options;
  return createUrl(getAssetThumbnailPath(id), { size, key: getKey(), c: checksum });
};

export const getAssetPlaybackUrl = (options: string | { id: string; checksum?: string }) => {
  if (typeof options === 'string') {
    options = { id: options };
  }
  const { id, checksum } = options;
  return createUrl(getAssetPlaybackPath(id), { key: getKey(), c: checksum });
};

export const getProfileImageUrl = (user: UserResponseDto) =>
  createUrl(getUserProfileImagePath(user.id), { updatedAt: user.profileChangedAt });

export const getPeopleThumbnailUrl = (person: PersonResponseDto, updatedAt?: string) =>
  createUrl(getPeopleThumbnailPath(person.id), { updatedAt: updatedAt ?? person.updatedAt });

export const copyToClipboard = async (secret: string) => {
  const $t = get(t);

  try {
    await navigator.clipboard.writeText(secret);
    notificationController.show({ message: $t('copied_to_clipboard'), type: NotificationType.Info });
  } catch (error) {
    handleError(error, $t('errors.unable_to_copy_to_clipboard'));
  }
};

export const makeSharedLinkUrl = (externalDomain: string, key: string) => {
  return new URL(`share/${key}`, externalDomain || window.location.origin).href;
};

export const findLocale = (code: string | undefined) => {
  const language = locales.find((lang) => lang.code === code);
  return {
    code: language?.code,
    name: language?.name,
  };
};

export const asyncTimeout = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const handlePromiseError = <T>(promise: Promise<T>): void => {
  promise.catch((error) => console.error(`[utils.ts]:handlePromiseError ${error}`, error));
};

export const memoryLaneTitle = derived(t, ($t) => {
  return (yearsAgo: number) => $t('years_ago', { values: { years: yearsAgo } });
});

export const withError = async <T>(fn: () => Promise<T>): Promise<[undefined, T] | [unknown, undefined]> => {
  try {
    const result = await fn();
    return [undefined, result];
  } catch (error) {
    return [error, undefined];
  }
};

export const suggestDuplicateByFileSize = (assets: AssetResponseDto[]): AssetResponseDto | undefined => {
  return sortBy(assets, (asset) => asset.exifInfo?.fileSizeInByte).pop();
};

// eslint-disable-next-line unicorn/prefer-code-point
export const decodeBase64 = (data: string) => Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
