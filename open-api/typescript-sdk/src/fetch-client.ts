/**
 * Immich
 * 1.119.1
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from "@oazapfts/runtime";
import * as QS from "@oazapfts/runtime/query";
export const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders> = {
    headers: {},
    baseUrl: "/api",
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
    server1: "/api"
};
export type UserResponseDto = {
    avatarColor: UserAvatarColor;
    email: string;
    id: string;
    name: string;
    profileChangedAt: string;
    profileImagePath: string;
};
export type AlbumUserResponseDto = {
    role: AlbumUserRole;
    user: UserResponseDto;
};
export type ExifResponseDto = {
    city?: string | null;
    country?: string | null;
    dateTimeOriginal?: string | null;
    description?: string | null;
    exifImageHeight?: number | null;
    exifImageWidth?: number | null;
    exposureTime?: string | null;
    fNumber?: number | null;
    fileSizeInByte?: number | null;
    focalLength?: number | null;
    iso?: number | null;
    latitude?: number | null;
    lensModel?: string | null;
    longitude?: number | null;
    make?: string | null;
    model?: string | null;
    modifyDate?: string | null;
    orientation?: string | null;
    projectionType?: string | null;
    rating?: number | null;
    state?: string | null;
    timeZone?: string | null;
};
export type AssetFaceWithoutPersonResponseDto = {
    boundingBoxX1: number;
    boundingBoxX2: number;
    boundingBoxY1: number;
    boundingBoxY2: number;
    id: string;
    imageHeight: number;
    imageWidth: number;
    sourceType?: SourceType;
};
export type PersonWithFacesResponseDto = {
    birthDate: string | null;
    faces: AssetFaceWithoutPersonResponseDto[];
    id: string;
    isHidden: boolean;
    name: string;
    thumbnailPath: string;
    /** This property was added in v1.107.0 */
    updatedAt?: string;
};
export type SmartInfoResponseDto = {
    objects?: string[] | null;
    tags?: string[] | null;
};
export type AssetStackResponseDto = {
    assetCount: number;
    id: string;
    primaryAssetId: string;
};
export type TagResponseDto = {
    color?: string;
    createdAt: string;
    id: string;
    name: string;
    parentId?: string;
    updatedAt: string;
    value: string;
};
export type AssetResponseDto = {
    /** base64 encoded sha1 hash */
    checksum: string;
    deviceAssetId: string;
    deviceId: string;
    duplicateId?: string | null;
    duration: string;
    exifInfo?: ExifResponseDto;
    fileCreatedAt: string;
    fileModifiedAt: string;
    hasMetadata: boolean;
    id: string;
    isArchived: boolean;
    isFavorite: boolean;
    isOffline: boolean;
    isTrashed: boolean;
    /** This property was deprecated in v1.106.0 */
    libraryId?: string | null;
    livePhotoVideoId?: string | null;
    localDateTime: string;
    originalFileName: string;
    originalMimeType?: string;
    originalPath: string;
    owner?: UserResponseDto;
    ownerId: string;
    people?: PersonWithFacesResponseDto[];
    /** This property was deprecated in v1.113.0 */
    resized?: boolean;
    smartInfo?: SmartInfoResponseDto;
    stack?: (AssetStackResponseDto) | null;
    tags?: TagResponseDto[];
    thumbhash: string | null;
    "type": AssetTypeEnum;
    unassignedFaces?: AssetFaceWithoutPersonResponseDto[];
    updatedAt: string;
};
export type AlbumResponseDto = {
    albumName: string;
    albumThumbnailAssetId: string | null;
    albumUsers: AlbumUserResponseDto[];
    assetCount: number;
    assets: AssetResponseDto[];
    createdAt: string;
    description: string;
    endDate?: string;
    hasSharedLink: boolean;
    id: string;
    isActivityEnabled: boolean;
    lastModifiedAssetTimestamp?: string;
    order?: AssetOrder;
    owner: UserResponseDto;
    ownerId: string;
    shared: boolean;
    startDate?: string;
    updatedAt: string;
};
export type AssetIdsDto = {
    assetIds: string[];
};
export type DownloadInfoDto = {
    albumId?: string;
    archiveSize?: number;
    assetIds?: string[];
    userId?: string;
};
export type DownloadArchiveInfo = {
    assetIds: string[];
    size: number;
};
export type DownloadResponseDto = {
    archives: DownloadArchiveInfo[];
    totalSize: number;
};
export type ServerConfigDto = {
    externalDomain: string;
    isInitialized: boolean;
    isOnboarded: boolean;
    loginPageMessage: string;
    mapDarkStyleUrl: string;
    mapLightStyleUrl: string;
    oauthButtonText: string;
    trashDays: number;
    userDeleteDelay: number;
};
export type SharedLinkResponseDto = {
    album?: AlbumResponseDto;
    allowDownload: boolean;
    allowUpload: boolean;
    assets: AssetResponseDto[];
    createdAt: string;
    description: string | null;
    expiresAt: string | null;
    id: string;
    key: string;
    password: string | null;
    showMetadata: boolean;
    token?: string | null;
    "type": SharedLinkType;
    userId: string;
};
export type StackResponseDto = {
    assets: AssetResponseDto[];
    id: string;
    primaryAssetId: string;
};
export type TimeBucketResponseDto = {
    count: number;
    timeBucket: string;
};
export function getAllAlbums({ assetId, shared }: {
    assetId?: string;
    shared?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumResponseDto[];
    }>(`/albums${QS.query(QS.explode({
        assetId,
        shared
    }))}`, {
        ...opts
    }));
}
export function getAlbumInfo({ id, key, withoutAssets }: {
    id: string;
    key?: string;
    withoutAssets?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AlbumResponseDto;
    }>(`/albums/${encodeURIComponent(id)}${QS.query(QS.explode({
        key,
        withoutAssets
    }))}`, {
        ...opts
    }));
}
export function getAssetInfo({ id, key }: {
    id: string;
    key?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto;
    }>(`/assets/${encodeURIComponent(id)}${QS.query(QS.explode({
        key
    }))}`, {
        ...opts
    }));
}
export function downloadAsset({ id, key }: {
    id: string;
    key?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/assets/${encodeURIComponent(id)}/original${QS.query(QS.explode({
        key
    }))}`, {
        ...opts
    }));
}
export function viewAsset({ id, key, size }: {
    id: string;
    key?: string;
    size?: AssetMediaSize;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/assets/${encodeURIComponent(id)}/thumbnail${QS.query(QS.explode({
        key,
        size
    }))}`, {
        ...opts
    }));
}
export function playAssetVideo({ id, key }: {
    id: string;
    key?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/assets/${encodeURIComponent(id)}/video/playback${QS.query(QS.explode({
        key
    }))}`, {
        ...opts
    }));
}
export function downloadArchive({ key, assetIdsDto }: {
    key?: string;
    assetIdsDto: AssetIdsDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchBlob<{
        status: 200;
        data: Blob;
    }>(`/download/archive${QS.query(QS.explode({
        key
    }))}`, oazapfts.json({
        ...opts,
        method: "POST",
        body: assetIdsDto
    })));
}
export function getDownloadInfo({ key, downloadInfoDto }: {
    key?: string;
    downloadInfoDto: DownloadInfoDto;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 201;
        data: DownloadResponseDto;
    }>(`/download/info${QS.query(QS.explode({
        key
    }))}`, oazapfts.json({
        ...opts,
        method: "POST",
        body: downloadInfoDto
    })));
}
export function getServerConfig(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ServerConfigDto;
    }>("/server/config", {
        ...opts
    }));
}
export function getMySharedLink({ key, password, token }: {
    key?: string;
    password?: string;
    token?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto;
    }>(`/shared-links/me${QS.query(QS.explode({
        key,
        password,
        token
    }))}`, {
        ...opts
    }));
}
export function getSharedLinkById({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SharedLinkResponseDto;
    }>(`/shared-links/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
export function searchStacks({ primaryAssetId }: {
    primaryAssetId?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: StackResponseDto[];
    }>(`/stacks${QS.query(QS.explode({
        primaryAssetId
    }))}`, {
        ...opts
    }));
}
export function getStack({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: StackResponseDto;
    }>(`/stacks/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
export function getTimeBucket({ albumId, isArchived, isFavorite, isTrashed, key, order, personId, size, tagId, timeBucket, userId, withPartners, withStacked }: {
    albumId?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
    isTrashed?: boolean;
    key?: string;
    order?: AssetOrder;
    personId?: string;
    size: TimeBucketSize;
    tagId?: string;
    timeBucket: string;
    userId?: string;
    withPartners?: boolean;
    withStacked?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: AssetResponseDto[];
    }>(`/timeline/bucket${QS.query(QS.explode({
        albumId,
        isArchived,
        isFavorite,
        isTrashed,
        key,
        order,
        personId,
        size,
        tagId,
        timeBucket,
        userId,
        withPartners,
        withStacked
    }))}`, {
        ...opts
    }));
}
export function getTimeBuckets({ albumId, isArchived, isFavorite, isTrashed, key, order, personId, size, tagId, userId, withPartners, withStacked }: {
    albumId?: string;
    isArchived?: boolean;
    isFavorite?: boolean;
    isTrashed?: boolean;
    key?: string;
    order?: AssetOrder;
    personId?: string;
    size: TimeBucketSize;
    tagId?: string;
    userId?: string;
    withPartners?: boolean;
    withStacked?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TimeBucketResponseDto[];
    }>(`/timeline/buckets${QS.query(QS.explode({
        albumId,
        isArchived,
        isFavorite,
        isTrashed,
        key,
        order,
        personId,
        size,
        tagId,
        userId,
        withPartners,
        withStacked
    }))}`, {
        ...opts
    }));
}
export enum AlbumUserRole {
    Editor = "editor",
    Viewer = "viewer"
}
export enum UserAvatarColor {
    Primary = "primary",
    Pink = "pink",
    Red = "red",
    Yellow = "yellow",
    Blue = "blue",
    Green = "green",
    Purple = "purple",
    Orange = "orange",
    Gray = "gray",
    Amber = "amber"
}
export enum SourceType {
    MachineLearning = "machine-learning",
    Exif = "exif"
}
export enum AssetTypeEnum {
    Image = "IMAGE",
    Video = "VIDEO",
    Audio = "AUDIO",
    Other = "OTHER"
}
export enum AssetOrder {
    Asc = "asc",
    Desc = "desc"
}
export enum AssetMediaSize {
    Preview = "preview",
    Thumbnail = "thumbnail"
}
export enum SharedLinkType {
    Album = "ALBUM",
    Individual = "INDIVIDUAL"
}
export enum TimeBucketSize {
    Day = "DAY",
    Month = "MONTH"
}
