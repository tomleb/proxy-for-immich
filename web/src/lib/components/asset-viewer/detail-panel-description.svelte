<script lang="ts">
  import { type AssetResponseDto } from '@immich/sdk';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let description = $derived(asset.exifInfo?.description || '');
</script>

{#if description}
  <section class="px-4 mt-6">
    <p class="break-words whitespace-pre-line w-full text-black dark:text-white text-base">{description}</p>
  </section>
{/if}
