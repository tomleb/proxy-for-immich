<script lang="ts">
  import { goto } from '$app/navigation';
  import type { OnAction } from '$lib/components/asset-viewer/actions/action';
  import CloseAction from '$lib/components/asset-viewer/actions/close-action.svelte';
  import DownloadAction from '$lib/components/asset-viewer/actions/download-action.svelte';
  import ShowDetailAction from '$lib/components/asset-viewer/actions/show-detail-action.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AppRoute } from '$lib/constants';
  import { user } from '$lib/stores/user.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getSharedLink } from '$lib/utils';
  import {
    AssetJobName,
    AssetTypeEnum,
    type AlbumResponseDto,
    type AssetResponseDto,
    type StackResponseDto,
  } from '@immich/sdk';
  import {
    mdiAlertOutline,
    mdiCogRefreshOutline,
    mdiContentCopy,
    mdiDatabaseRefreshOutline,
    mdiDotsVertical,
    mdiHeadSyncOutline,
    mdiImageRefreshOutline,
    mdiImageSearch,
    mdiMagnifyMinusOutline,
    mdiMagnifyPlusOutline,
    mdiPresentationPlay,
    mdiUpload,
  } from '@mdi/js';
  import { canCopyImageToClipboard } from '$lib/utils/asset-utils';
  import { t } from 'svelte-i18n';
  import type { Snippet } from 'svelte';

  interface Props {
    asset: AssetResponseDto;
    album?: AlbumResponseDto | null;
    stack?: StackResponseDto | null;
    showDetailButton: boolean;
    showSlideshow?: boolean;
    onZoomImage: () => void;
    onCopyImage?: () => Promise<void>;
    onAction: OnAction;
    onRunJob: (name: AssetJobName) => void;
    onPlaySlideshow: () => void;
    onShowDetail: () => void;
    // export let showEditorHandler: () => void;
    onClose: () => void;
    motionPhoto?: Snippet;
  }

  let {
    asset,
    album = null,
    stack = null,
    showDetailButton,
    showSlideshow = false,
    onZoomImage,
    onCopyImage,
    onAction,
    onRunJob,
    onPlaySlideshow,
    onShowDetail,
    onClose,
    motionPhoto,
  }: Props = $props();

  const sharedLink = getSharedLink();
  let isOwner = $derived($user && asset.ownerId === $user?.id);
  let showDownloadButton = $derived(sharedLink ? sharedLink.allowDownload : !asset.isOffline);
  // $: showEditorButton =
  //   isOwner &&
  //   asset.type === AssetTypeEnum.Image &&
  //   !(
  //     asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR ||
  //     (asset.originalPath && asset.originalPath.toLowerCase().endsWith('.insp'))
  //   ) &&
  //   !(asset.originalPath && asset.originalPath.toLowerCase().endsWith('.gif')) &&
  //   !asset.livePhotoVideoId;
</script>

<div
  class="z-[1001] flex h-16 place-items-center justify-between bg-gradient-to-b from-black/40 px-3 transition-transform duration-200"
>
  <div class="text-white">
    <CloseAction {onClose} />
  </div>
  <div
    class="flex w-[calc(100%-3rem)] justify-end gap-2 overflow-hidden text-white"
    data-testid="asset-viewer-navbar-actions"
  >
    {#if asset.isOffline}
      <CircleIconButton color="alert" icon={mdiAlertOutline} onclick={onShowDetail} title={$t('asset_offline')} />
    {/if}
    {#if asset.livePhotoVideoId}
      {@render motionPhoto?.()}
    {/if}
    {#if asset.type === AssetTypeEnum.Image}
      <CircleIconButton
        color="opaque"
        hideMobile={true}
        icon={$photoZoomState && $photoZoomState.currentZoom > 1 ? mdiMagnifyMinusOutline : mdiMagnifyPlusOutline}
        title={$t('zoom_image')}
        onclick={onZoomImage}
      />
    {/if}
    {#if canCopyImageToClipboard() && asset.type === AssetTypeEnum.Image}
      <CircleIconButton color="opaque" icon={mdiContentCopy} title={$t('copy_image')} onclick={() => onCopyImage?.()} />
    {/if}

    {#if !isOwner && showDownloadButton}
      <DownloadAction {asset} />
    {/if}

    {#if showDetailButton}
      <ShowDetailAction {onShowDetail} />
    {/if}

    <ButtonContextMenu direction="left" align="top-right" color="opaque" title={$t('more')} icon={mdiDotsVertical}>
      {#if showSlideshow}
        <MenuOption icon={mdiPresentationPlay} text={$t('slideshow')} onClick={onPlaySlideshow} />
      {/if}
    </ButtonContextMenu>
  </div>
</div>
