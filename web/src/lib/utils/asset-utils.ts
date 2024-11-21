import { goto } from '$app/navigation';
import FormatBoldMessage from '$lib/components/i18n/format-bold-message.svelte';
import { NotificationType, notificationController } from '$lib/components/shared-components/notification/notification';
import { AppRoute } from '$lib/constants';
import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
import { assetViewingStore } from '$lib/stores/asset-viewing.store';
import { isSelectingAllAssets, type AssetStore } from '$lib/stores/assets.store';
import { downloadManager } from '$lib/stores/download';
import { preferences } from '$lib/stores/user.store';
import { downloadRequest, getKey, withError } from '$lib/utils';
import { getByteUnitString } from '$lib/utils/byte-units';
import { getFormatter } from '$lib/utils/i18n';
import {
  getAssetInfo,
  getBaseUrl,
  getDownloadInfo,
  getStack,
  type AlbumResponseDto,
  type AssetResponseDto,
  type AssetTypeEnum,
  type DownloadInfoDto,
  type UserPreferencesResponseDto,
  type UserResponseDto,
} from '@immich/sdk';
import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { handleError } from './handle-error';

export const downloadAlbum = async (album: AlbumResponseDto) => {
  await downloadArchive(`${album.albumName}.zip`, {
    albumId: album.id,
  });
};

export const downloadBlob = (data: Blob, filename: string) => {
  const url = URL.createObjectURL(data);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
};

export const downloadArchive = async (fileName: string, options: Omit<DownloadInfoDto, 'archiveSize'>) => {
  const $preferences = get<UserPreferencesResponseDto | undefined>(preferences);
  const dto = { ...options, archiveSize: $preferences?.download.archiveSize };

  const [error, downloadInfo] = await withError(() => getDownloadInfo({ downloadInfoDto: dto, key: getKey() }));
  if (error) {
    const $t = get(t);
    handleError(error, $t('errors.unable_to_download_files'));
    return;
  }

  if (!downloadInfo) {
    return;
  }

  for (let index = 0; index < downloadInfo.archives.length; index++) {
    const archive = downloadInfo.archives[index];
    const suffix = downloadInfo.archives.length > 1 ? `+${index + 1}` : '';
    const archiveName = fileName.replace('.zip', `${suffix}-${DateTime.now().toFormat('yyyyLLdd_HHmmss')}.zip`);
    const key = getKey();

    let downloadKey = `${archiveName} `;
    if (downloadInfo.archives.length > 1) {
      downloadKey = `${archiveName} (${index + 1}/${downloadInfo.archives.length})`;
    }

    const abort = new AbortController();
    downloadManager.add(downloadKey, archive.size, abort);

    try {
      // TODO use sdk once it supports progress events
      const { data } = await downloadRequest({
        method: 'POST',
        url: getBaseUrl() + '/download/archive' + (key ? `?key=${key}` : ''),
        data: { assetIds: archive.assetIds },
        signal: abort.signal,
        onDownloadProgress: (event) => downloadManager.update(downloadKey, event.loaded),
      });

      downloadBlob(data, archiveName);
    } catch (error) {
      const $t = get(t);
      handleError(error, $t('errors.unable_to_download_files'));
      downloadManager.clear(downloadKey);
      return;
    } finally {
      setTimeout(() => downloadManager.clear(downloadKey), 5000);
    }
  }
};

export const downloadFile = async (asset: AssetResponseDto) => {
  const $t = get(t);
  const assets = [
    {
      filename: asset.originalFileName,
      id: asset.id,
      size: asset.exifInfo?.fileSizeInByte || 0,
    },
  ];

  const isAndroidMotionVideo = (asset: AssetResponseDto) => {
    return asset.originalPath.includes('encoded-video');
  };

  if (asset.livePhotoVideoId) {
    const motionAsset = await getAssetInfo({ id: asset.livePhotoVideoId, key: getKey() });
    if (!isAndroidMotionVideo(motionAsset) || get(preferences).download.includeEmbeddedVideos) {
      assets.push({
        filename: motionAsset.originalFileName,
        id: asset.livePhotoVideoId,
        size: motionAsset.exifInfo?.fileSizeInByte || 0,
      });
    }
  }

  for (const { filename, id, size } of assets) {
    const downloadKey = filename;

    try {
      const abort = new AbortController();
      downloadManager.add(downloadKey, size, abort);
      const key = getKey();

      notificationController.show({
        type: NotificationType.Info,
        message: $t('downloading_asset_filename', { values: { filename: asset.originalFileName } }),
      });

      // TODO use sdk once it supports progress events
      const { data } = await downloadRequest({
        method: 'GET',
        url: getBaseUrl() + `/assets/${id}/original` + (key ? `?key=${key}` : ''),
        signal: abort.signal,
        onDownloadProgress: (event) => downloadManager.update(downloadKey, event.loaded, event.total),
      });

      downloadBlob(data, filename);
    } catch (error) {
      handleError(error, $t('errors.error_downloading', { values: { filename } }));
      downloadManager.clear(downloadKey);
    } finally {
      setTimeout(() => downloadManager.clear(downloadKey), 5000);
    }
  }
};

/**
 * Returns the lowercase filename extension without a dot (.) and
 * an empty string when not found.
 */
export function getFilenameExtension(filename: string): string {
  const lastIndex = Math.max(0, filename.lastIndexOf('.'));
  const startIndex = (lastIndex || Number.POSITIVE_INFINITY) + 1;
  return filename.slice(startIndex).toLowerCase();
}

/**
 * Returns the filename of an asset including file extension
 */
export function getAssetFilename(asset: AssetResponseDto): string {
  const fileExtension = getFilenameExtension(asset.originalPath);
  return `${asset.originalFileName}.${fileExtension}`;
}

function isRotated90CW(orientation: number) {
  return orientation === 5 || orientation === 6 || orientation === 90;
}

function isRotated270CW(orientation: number) {
  return orientation === 7 || orientation === 8 || orientation === -90;
}

export function isFlipped(orientation?: string | null) {
  const value = Number(orientation);
  return value && (isRotated270CW(value) || isRotated90CW(value));
}

export function getFileSize(asset: AssetResponseDto): string {
  const size = asset.exifInfo?.fileSizeInByte || 0;
  return size > 0 ? getByteUnitString(size, undefined, 4) : 'Invalid Data';
}

export function getAssetResolution(asset: AssetResponseDto): string {
  const { width, height } = getAssetRatio(asset);

  if (width === 235 && height === 235) {
    return 'Invalid Data';
  }

  return `${width} x ${height}`;
}

/**
 * Returns aspect ratio for the asset
 */
export function getAssetRatio(asset: AssetResponseDto) {
  let height = asset.exifInfo?.exifImageHeight || 235;
  let width = asset.exifInfo?.exifImageWidth || 235;
  if (isFlipped(asset.exifInfo?.orientation)) {
    [width, height] = [height, width];
  }
  return { width, height };
}

// list of supported image extensions from https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types excluding svg
const supportedImageMimeTypes = new Set([
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent); // https://stackoverflow.com/a/23522755
if (isSafari) {
  supportedImageMimeTypes.add('image/heic').add('image/heif');
}

/**
 * Returns true if the asset is an image supported by web browsers, false otherwise
 */
export function isWebCompatibleImage(asset: AssetResponseDto): boolean {
  if (!asset.originalMimeType) {
    return false;
  }

  return supportedImageMimeTypes.has(asset.originalMimeType);
}

export const getAssetType = (type: AssetTypeEnum) => {
  switch (type) {
    case 'IMAGE': {
      return 'Photo';
    }
    case 'VIDEO': {
      return 'Video';
    }
    default: {
      return 'Asset';
    }
  }
};

export const getSelectedAssets = (assets: Set<AssetResponseDto>, user: UserResponseDto | null): string[] => {
  const ids = [...assets].filter((a) => user && a.ownerId === user.id).map((a) => a.id);

  const numberOfIssues = [...assets].filter((a) => user && a.ownerId !== user.id).length;
  if (numberOfIssues > 0) {
    const $t = get(t);
    notificationController.show({
      message: $t('errors.cant_change_metadata_assets_count', { values: { count: numberOfIssues } }),
      type: NotificationType.Warning,
    });
  }
  return ids;
};

export const selectAllAssets = async (assetStore: AssetStore, assetInteractionStore: AssetInteractionStore) => {
  if (get(isSelectingAllAssets)) {
    // Selection is already ongoing
    return;
  }
  isSelectingAllAssets.set(true);

  try {
    for (const bucket of assetStore.buckets) {
      await assetStore.loadBucket(bucket.bucketDate);

      if (!get(isSelectingAllAssets)) {
        break; // Cancelled
      }
      assetInteractionStore.selectAssets(bucket.assets);

      // We use setTimeout to allow the UI to update. Otherwise, this may
      // cause a long delay between the start of 'select all' and the
      // effective update of the UI, depending on the number of assets
      // to select
      await delay(0);
    }
  } catch (error) {
    const $t = get(t);
    handleError(error, $t('errors.error_selecting_all_assets'));
    isSelectingAllAssets.set(false);
  }
};

export const cancelMultiselect = (assetInteractionStore: AssetInteractionStore) => {
  isSelectingAllAssets.set(false);
  assetInteractionStore.clearMultiselect();
};

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const canCopyImageToClipboard = (): boolean => {
  return !!(navigator.clipboard && window.ClipboardItem);
};

const imgToBlob = async (imageElement: HTMLImageElement) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;

  if (context) {
    context.drawImage(imageElement, 0, 0);

    return await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          throw new Error('Canvas conversion to Blob failed');
        }
      });
    });
  }

  throw new Error('Canvas context is null');
};

const urlToBlob = async (imageSource: string) => {
  const response = await fetch(imageSource);
  return await response.blob();
};

export const copyImageToClipboard = async (source: HTMLImageElement | string) => {
  const blob = source instanceof HTMLImageElement ? await imgToBlob(source) : await urlToBlob(source);
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
};
