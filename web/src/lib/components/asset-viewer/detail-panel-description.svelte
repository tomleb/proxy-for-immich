<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { type AssetResponseDto } from '@immich/sdk';
  import AutogrowTextarea from '$lib/components/shared-components/autogrow-textarea.svelte';
  import { t } from 'svelte-i18n';

  export let asset: AssetResponseDto;
  export let isOwner: boolean;

  $: description = asset.exifInfo?.description || '';
</script>

{#if description}
  <section class="px-4 mt-6">
    <p class="break-words whitespace-pre-line w-full text-black dark:text-white text-base">{description}</p>
  </section>
{/if}
