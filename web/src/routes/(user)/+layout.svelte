<script lang="ts">
  import { run } from 'svelte/legacy';

  import { page } from '$app/stores';

  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { Snippet } from 'svelte';
  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
  let { isViewing: showAssetViewer, setAsset, gridScrollTarget } = assetViewingStore;

  // $page.data.asset is loaded by route specific +page.ts loaders if that
  // route contains the assetId path.
  run(() => {
    if ($page.data.asset) {
      setAsset($page.data.asset);
    } else {
      $showAssetViewer = false;
    }
    const asset = $page.url.searchParams.get('at');
    $gridScrollTarget = { at: asset };
  });
</script>

<div class:display-none={$showAssetViewer}>
  {@render children?.()}
</div>

<style>
  .display-none {
    display: none;
  }
</style>
