<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { handlePromiseError } from '$lib/utils';
  import { downloadArchive } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiArrowLeft, mdiFileImagePlusOutline, mdiFolderDownloadOutline, mdiSelectAll } from '@mdi/js';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import DownloadAction from '../photos-page/actions/download-action.svelte';
  import AssetSelectControlBar from '../photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import GalleryViewer from '../shared-components/gallery-viewer/gallery-viewer.svelte';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import ImmichLogoSmallLink from '$lib/components/shared-components/immich-logo-small-link.svelte';
  import type { Viewport } from '$lib/stores/assets.store';
  import { t } from 'svelte-i18n';

  interface Props {
    sharedLink: SharedLinkResponseDto;
    isOwned: boolean;
  }

  let { sharedLink = $bindable(), isOwned }: Props = $props();

  const viewport: Viewport = $state({ width: 0, height: 0 });
  const assetInteractionStore = createAssetInteractionStore();
  const { selectedAssets } = assetInteractionStore;
  let innerWidth: number = $state(0);

  let assets = $derived(sharedLink.assets);
  let isMultiSelectionMode = $derived($selectedAssets.size > 0);

  const downloadAssets = async () => {
    await downloadArchive(`immich-shared.zip`, { assetIds: assets.map((asset) => asset.id) });
  };

  const handleSelectAll = () => {
    assetInteractionStore.selectAssets(assets);
  };
</script>

<svelte:window bind:innerWidth />

<section class="bg-immich-bg dark:bg-immich-dark-bg">
  {#if isMultiSelectionMode}
    <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => cancelMultiselect(assetInteractionStore)}>
      <CircleIconButton title={$t('select_all')} icon={mdiSelectAll} onclick={handleSelectAll} />
      {#if sharedLink?.allowDownload}
        <DownloadAction filename="immich-shared.zip" />
      {/if}
    </AssetSelectControlBar>
  {:else}
    <ControlAppBar onClose={() => goto(AppRoute.PHOTOS)} backIcon={mdiArrowLeft} showBackButton={false}>
      {#snippet leading()}
        <ImmichLogoSmallLink width={innerWidth} />
      {/snippet}

      {#snippet trailing()}
        {#if sharedLink?.allowDownload}
          <CircleIconButton title={$t('download')} onclick={downloadAssets} icon={mdiFolderDownloadOutline} />
        {/if}
      {/snippet}
    </ControlAppBar>
  {/if}
  <section class="my-[160px] mx-4" bind:clientHeight={viewport.height} bind:clientWidth={viewport.width}>
    <GalleryViewer {assets} {assetInteractionStore} {viewport} />
  </section>
</section>
