<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import { AppRoute } from '$lib/constants';
  import { t } from 'svelte-i18n';
</script>

<section class="flex h-screen w-screen place-content-center place-items-center">
  <div class="flex max-w-[350px] flex-col place-items-center gap-8 text-center">
    <div class="flex place-content-center place-items-center">
      <ImmichLogo noText class="text-center" height="200" width="200" />
    </div>
  </div>
</section>
