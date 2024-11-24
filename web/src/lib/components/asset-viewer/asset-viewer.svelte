<script lang="ts">
  import { focusTrap } from '$lib/actions/focus-trap';
  import type { Action, OnAction } from '$lib/components/asset-viewer/actions/action';
  import MotionPhotoAction from '$lib/components/asset-viewer/actions/motion-photo-action.svelte';
  import NextAssetAction from '$lib/components/asset-viewer/actions/next-asset-action.svelte';
  import PreviousAssetAction from '$lib/components/asset-viewer/actions/previous-asset-action.svelte';
  import { AssetAction, ProjectionType } from '$lib/constants';
  import { updateNumberOfComments } from '$lib/stores/activity.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { AssetStore } from '$lib/stores/assets.store';
  import { isShowDetail } from '$lib/stores/preferences.store';
  import { SlideshowNavigation, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';
  import { user } from '$lib/stores/user.store';
  import { getSharedLink, handlePromiseError, isSharedLink } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { SlideshowHistory } from '$lib/utils/slideshow-history';
  import {
    AssetTypeEnum,
    getStack,
    type AlbumResponseDto,
    type AssetResponseDto,
    type StackResponseDto,
  } from '@immich/sdk';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import AssetViewerNavBar from './asset-viewer-nav-bar.svelte';
  import DetailPanel from './detail-panel.svelte';
  import PhotoViewer from './photo-viewer.svelte';
  import SlideshowBar from './slideshow-bar.svelte';
  import VideoViewer from './video-wrapper-viewer.svelte';
  import ImagePanoramaViewer from './image-panorama-viewer.svelte';

  interface Props {
    assetStore?: AssetStore | null;
    asset: AssetResponseDto;
    preloadAssets?: AssetResponseDto[];
    showNavigation?: boolean;
    withStacked?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto | null;
    onAction?: OnAction | undefined;
    onClose: (dto: { asset: AssetResponseDto }) => void;
    onNext: () => void;
    onPrevious: () => void;
    copyImage?: () => Promise<void>;
  }

  let {
    assetStore = null,
    asset = $bindable(),
    preloadAssets = $bindable([]),
    showNavigation = true,
    withStacked = false,
    isShared = false,
    album = null,
    onAction = undefined,
    onClose,
    onNext,
    onPrevious,
    copyImage = $bindable(),
  }: Props = $props();

  const { setAsset } = assetViewingStore;
  const {
    restartProgress: restartSlideshowProgress,
    stopProgress: stopSlideshowProgress,
    slideshowNavigation,
    slideshowState,
    slideshowTransition,
  } = slideshowStore;

  let appearsInAlbums: AlbumResponseDto[] = $state([]);
  let shouldPlayMotionPhoto = $state(false);
  let sharedLink = getSharedLink();
  let enableDetailPanel = asset.hasMetadata;
  let slideshowStateUnsubscribe: () => void;
  let shuffleSlideshowUnsubscribe: () => void;
  let previewStackedAsset: AssetResponseDto | undefined = $state();
  let isShowActivity = $state(false);
  let isShowEditor = $state(false);
  let numberOfComments = $state(0);
  let fullscreenElement = $state<Element>();
  let selectedEditType: string = $state('');
  let stack: StackResponseDto | null = $state(null);

  let zoomToggle = $state(() => void 0);

  const refreshStack = async () => {
    if (isSharedLink()) {
      return;
    }

    if (asset.stack) {
      stack = await getStack({ id: asset.stack.id });
    }

    if (!stack?.assets.some(({ id }) => id === asset.id)) {
      stack = null;
    }

    untrack(() => {
      if (stack && stack?.assets.length > 1) {
        preloadAssets.push(stack.assets[1]);
      }
    });
  };

  const onAssetUpdate = (assetUpdate: AssetResponseDto) => {
    if (assetUpdate.id === asset.id) {
      asset = assetUpdate;
    }
  };

  onMount(async () => {
    slideshowStateUnsubscribe = slideshowState.subscribe((value) => {
      if (value === SlideshowState.PlaySlideshow) {
        slideshowHistory.reset();
        slideshowHistory.queue(asset);
        handlePromiseError(handlePlaySlideshow());
      } else if (value === SlideshowState.StopSlideshow) {
        handlePromiseError(handleStopSlideshow());
      }
    });

    shuffleSlideshowUnsubscribe = slideshowNavigation.subscribe((value) => {
      if (value === SlideshowNavigation.Shuffle) {
        slideshowHistory.reset();
        slideshowHistory.queue(asset);
      }
    });

    if (!sharedLink) {
      await handleGetAllAlbums();
    }
  });

  onDestroy(() => {
    if (slideshowStateUnsubscribe) {
      slideshowStateUnsubscribe();
    }

    if (shuffleSlideshowUnsubscribe) {
      shuffleSlideshowUnsubscribe();
    }
  });

  const handleGetAllAlbums = async () => {
  };

  const handleOpenActivity = () => {
    if ($isShowDetail) {
      $isShowDetail = false;
    }
    isShowActivity = !isShowActivity;
  };

  const toggleDetailPanel = () => {
    isShowActivity = false;
    $isShowDetail = !$isShowDetail;
  };

  const closeViewer = () => {
    onClose({ asset });
  };

  const navigateAssetRandom = async () => {
    if (!assetStore) {
      return;
    }

    const asset = await assetStore.getRandomAsset();
    if (!asset) {
      return;
    }

    slideshowHistory.queue(asset);

    setAsset(asset);
    $restartSlideshowProgress = true;
  };

  const navigateAsset = async (order?: 'previous' | 'next', e?: Event) => {
    if (!order) {
      if ($slideshowState === SlideshowState.PlaySlideshow) {
        order = $slideshowNavigation === SlideshowNavigation.AscendingOrder ? 'previous' : 'next';
      } else {
        return;
      }
    }

    if ($slideshowState === SlideshowState.PlaySlideshow && $slideshowNavigation === SlideshowNavigation.Shuffle) {
      return (order === 'previous' ? slideshowHistory.previous() : slideshowHistory.next()) || navigateAssetRandom();
    }

    if ($slideshowState === SlideshowState.PlaySlideshow && assetStore) {
      const hasNext =
        order === 'previous' ? await assetStore.getPreviousAsset(asset) : await assetStore.getNextAsset(asset);
      if (hasNext) {
        $restartSlideshowProgress = true;
      } else {
        await handleStopSlideshow();
      }
    }

    e?.stopPropagation();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    order === 'previous' ? onPrevious() : onNext();
  };

  // const showEditorHandler = () => {
  //   if (isShowActivity) {
  //     isShowActivity = false;
  //   }
  //   isShowEditor = !isShowEditor;
  // };

  /**
   * Slide show mode
   */

  let assetViewerHtmlElement = $state<HTMLElement>();

  const slideshowHistory = new SlideshowHistory((asset) => {
    setAsset(asset);
    $restartSlideshowProgress = true;
  });

  const handleVideoStarted = () => {
    if ($slideshowState === SlideshowState.PlaySlideshow) {
      $stopSlideshowProgress = true;
    }
  };

  const handlePlaySlideshow = async () => {
    try {
      await assetViewerHtmlElement?.requestFullscreen?.();
    } catch (error) {
      handleError(error, $t('errors.unable_to_enter_fullscreen'));
      $slideshowState = SlideshowState.StopSlideshow;
    }
  };

  const handleStopSlideshow = async () => {
    try {
      if (document.fullscreenElement) {
        document.body.style.cursor = '';
        await document.exitFullscreen();
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_exit_fullscreen'));
    } finally {
      $stopSlideshowProgress = true;
      $slideshowState = SlideshowState.None;
    }
  };

  const handleStackedAssetMouseEvent = (isMouseOver: boolean, asset: AssetResponseDto) => {
    previewStackedAsset = isMouseOver ? asset : undefined;
  };

  const handleAction = async (action: Action) => {
    switch (action.type) {
      case AssetAction.ADD_TO_ALBUM: {
        await handleGetAllAlbums();
        break;
      }

      case AssetAction.KEEP_THIS_DELETE_OTHERS:
      case AssetAction.UNSTACK: {
        closeViewer();
      }
    }

    onAction?.(action);
  };

  const handleUpdateSelectedEditType = (type: string) => {
    selectedEditType = type;
  };
  let isFullScreen = $derived(fullscreenElement !== null);
  $effect(() => {
    if (asset) {
      handlePromiseError(refreshStack());
    }
  });
  $effect(() => {
    if (album && !album.isActivityEnabled && numberOfComments === 0) {
      isShowActivity = false;
    }
  });
  $effect(() => {
    if (asset.id && !sharedLink) {
      handlePromiseError(handleGetAllAlbums());
    }
  });
</script>

<svelte:document bind:fullscreenElement />

<section
  id="immich-asset-viewer"
  class="fixed left-0 top-0 z-[1001] grid size-full grid-cols-4 grid-rows-[64px_1fr] overflow-hidden bg-black"
  use:focusTrap
>
  <!-- Top navigation bar -->
  {#if $slideshowState === SlideshowState.None && !isShowEditor}
    <div class="z-[1002] col-span-4 col-start-1 row-span-1 row-start-1 transition-transform">
      <AssetViewerNavBar
        {asset}
        {album}
        {stack}
        showDetailButton={enableDetailPanel}
        showSlideshow={!!assetStore}
        onZoomImage={zoomToggle}
        onCopyImage={copyImage}
        onAction={handleAction}
        onPlaySlideshow={() => ($slideshowState = SlideshowState.PlaySlideshow)}
        onShowDetail={toggleDetailPanel}
        onClose={closeViewer}
      >
        {#snippet motionPhoto()}
          <MotionPhotoAction
            isPlaying={shouldPlayMotionPhoto}
            onClick={(shouldPlay) => (shouldPlayMotionPhoto = shouldPlay)}
          />
        {/snippet}
      </AssetViewerNavBar>
    </div>
  {/if}

  {#if $slideshowState === SlideshowState.None && showNavigation && !isShowEditor}
    <div class="z-[1001] my-auto column-span-1 col-start-1 row-span-full row-start-1 justify-self-start">
      <PreviousAssetAction onPreviousAsset={() => navigateAsset('previous')} />
    </div>
  {/if}

  <!-- Asset Viewer -->
  <div class="z-[1000] relative col-start-1 col-span-4 row-start-1 row-span-full" bind:this={assetViewerHtmlElement}>
    {#if $slideshowState != SlideshowState.None}
      <div class="z-[1000] absolute w-full flex">
        <SlideshowBar
          {isFullScreen}
          onSetToFullScreen={() => assetViewerHtmlElement?.requestFullscreen?.()}
          onPrevious={() => navigateAsset('previous')}
          onNext={() => navigateAsset('next')}
          onClose={() => ($slideshowState = SlideshowState.StopSlideshow)}
        />
      </div>
    {/if}

    {#if previewStackedAsset}
      {#key previewStackedAsset.id}
        {#if previewStackedAsset.type === AssetTypeEnum.Image}
          <PhotoViewer
            bind:zoomToggle
            bind:copyImage
            asset={previewStackedAsset}
            {preloadAssets}
            onPreviousAsset={() => navigateAsset('previous')}
            onNextAsset={() => navigateAsset('next')}
            onClose={closeViewer}
            haveFadeTransition={false}
            {sharedLink}
          />
        {:else}
          <VideoViewer
            assetId={previewStackedAsset.id}
            checksum={previewStackedAsset.checksum}
            projectionType={previewStackedAsset.exifInfo?.projectionType}
            loopVideo={true}
            onPreviousAsset={() => navigateAsset('previous')}
            onNextAsset={() => navigateAsset('next')}
            onClose={closeViewer}
            onVideoEnded={() => navigateAsset()}
            onVideoStarted={handleVideoStarted}
          />
        {/if}
      {/key}
    {:else}
      {#key asset.id}
        {#if asset.type === AssetTypeEnum.Image}
          {#if shouldPlayMotionPhoto && asset.livePhotoVideoId}
            <VideoViewer
              assetId={asset.livePhotoVideoId}
              checksum={asset.checksum}
              projectionType={asset.exifInfo?.projectionType}
              loopVideo={$slideshowState !== SlideshowState.PlaySlideshow}
              onPreviousAsset={() => navigateAsset('previous')}
              onNextAsset={() => navigateAsset('next')}
              onVideoEnded={() => (shouldPlayMotionPhoto = false)}
            />
          {:else if asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR || (asset.originalPath && asset.originalPath
                .toLowerCase()
                .endsWith('.insp'))}
            <ImagePanoramaViewer {asset} />
          {:else}
            <PhotoViewer
              bind:zoomToggle
              bind:copyImage
              {asset}
              {preloadAssets}
              onPreviousAsset={() => navigateAsset('previous')}
              onNextAsset={() => navigateAsset('next')}
              onClose={closeViewer}
              {sharedLink}
              haveFadeTransition={$slideshowState === SlideshowState.None || $slideshowTransition}
            />
          {/if}
        {:else}
          <VideoViewer
            assetId={asset.id}
            checksum={asset.checksum}
            projectionType={asset.exifInfo?.projectionType}
            loopVideo={$slideshowState !== SlideshowState.PlaySlideshow}
            onPreviousAsset={() => navigateAsset('previous')}
            onNextAsset={() => navigateAsset('next')}
            onClose={closeViewer}
            onVideoEnded={() => navigateAsset()}
            onVideoStarted={handleVideoStarted}
          />
        {/if}
      {/key}
    {/if}
  </div>

  {#if $slideshowState === SlideshowState.None && showNavigation && !isShowEditor}
    <div class="z-[1001] my-auto col-span-1 col-start-4 row-span-full row-start-1 justify-self-end">
      <NextAssetAction onNextAsset={() => navigateAsset('next')} />
    </div>
  {/if}

  {#if enableDetailPanel && $slideshowState === SlideshowState.None && $isShowDetail && !isShowEditor}
    <div
      transition:fly={{ duration: 150 }}
      id="detail-panel"
      class="z-[1002] row-start-1 row-span-4 w-[360px] overflow-y-auto bg-immich-bg transition-all dark:border-l dark:border-l-immich-dark-gray dark:bg-immich-dark-bg"
      translate="yes"
    >
      <DetailPanel {asset} currentAlbum={album} albums={appearsInAlbums} onClose={() => ($isShowDetail = false)} />
    </div>
  {/if}

  {#if stack && withStacked}
    {@const stackedAssets = stack.assets}
    <div
      id="stack-slideshow"
      class="z-[1002] flex place-item-center place-content-center absolute bottom-0 w-full col-span-4 col-start-1 overflow-x-auto horizontal-scrollbar"
    >
      <div class="relative w-full whitespace-nowrap transition-all">
        {#each stackedAssets as stackedAsset (stackedAsset.id)}
          <div
            class="{stackedAsset.id == asset.id
              ? '-translate-y-[1px]'
              : '-translate-y-0'} inline-block px-1 transition-transform"
          >
            <Thumbnail
              class="{stackedAsset.id == asset.id
                ? 'bg-transparent border-2 border-white'
                : 'bg-gray-700/40'} inline-block hover:bg-transparent"
              asset={stackedAsset}
              onClick={(stackedAsset) => {
                asset = stackedAsset;
              }}
              onMouseEvent={({ isMouseOver }) => handleStackedAssetMouseEvent(isMouseOver, stackedAsset)}
              disableMouseOver
              readonly
              thumbnailSize={stackedAsset.id == asset.id ? 65 : 60}
              showStackedIcon={false}
            />

            {#if stackedAsset.id == asset.id}
              <div class="w-full flex place-items-center place-content-center">
                <div class="w-2 h-2 bg-white rounded-full flex mt-[2px]"></div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  #immich-asset-viewer {
    contain: layout;
  }

  .horizontal-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 10px;
  }

  /* Track */
  .horizontal-scrollbar::-webkit-scrollbar-track {
    background: #000000;
    border-radius: 16px;
  }

  /* Handle */
  .horizontal-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(159, 159, 159, 0.408);
    border-radius: 16px;
  }

  /* Handle on hover */
  .horizontal-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #adcbfa;
    border-radius: 16px;
  }
</style>
