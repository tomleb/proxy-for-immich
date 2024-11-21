<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import AutogrowTextarea from '$lib/components/shared-components/autogrow-textarea.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    id: string;
    description: string;
    isOwned: boolean;
  }

  let { id, description = $bindable(), isOwned }: Props = $props();
</script>

{#if description}
  <p class="break-words whitespace-pre-line w-full text-black dark:text-white text-base">
    {description}
  </p>
{/if}
