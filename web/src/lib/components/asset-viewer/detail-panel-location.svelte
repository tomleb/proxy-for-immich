<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { type AssetResponseDto } from '@immich/sdk';
  import { mdiMapMarkerOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let isOwner: boolean;
  export let asset: AssetResponseDto;
</script>

{#if asset.exifInfo?.country}
  <button
    type="button"
    class="flex w-full text-left justify-between place-items-start gap-4 py-4"
    class:hover:dark:text-immich-dark-primary={isOwner}
    class:hover:text-immich-primary={isOwner}
  >
    <div class="flex gap-4">
      <div><Icon path={mdiMapMarkerOutline} size="24" /></div>

      <div>
        {#if asset.exifInfo?.city}
          <p>{asset.exifInfo.city}</p>
        {/if}
        {#if asset.exifInfo?.state}
          <div class="flex gap-2 text-sm">
            <p>{asset.exifInfo.state}</p>
          </div>
        {/if}
        {#if asset.exifInfo?.country}
          <div class="flex gap-2 text-sm">
            <p>{asset.exifInfo.country}</p>
          </div>
        {/if}
      </div>
    </div>
  </button>
{/if}
