<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
  import { Theme } from '$lib/constants';
  import { colorTheme, handleToggleTheme, type ThemeSetting } from '$lib/stores/preferences.store';

  import { closeWebsocketConnection, openWebsocketConnection } from '$lib/stores/websocket';
  import { copyToClipboard, setKey } from '$lib/utils';
  import { onDestroy, onMount } from 'svelte';
  import '../app.css';
  import { isAssetViewerRoute, isSharedLinkRoute } from '$lib/utils/navigation';
  import DialogWrapper from '$lib/components/shared-components/dialog/dialog-wrapper.svelte';
  import { t } from 'svelte-i18n';
  import Error from '$lib/components/error.svelte';

  let showNavigationLoadingBar = false;
  $: changeTheme($colorTheme);

  $: if (false) {
    openWebsocketConnection();
  } else {
    closeWebsocketConnection();
  }

  const changeTheme = (theme: ThemeSetting) => {
    if (theme.system) {
      theme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
    }

    if (theme.value === Theme.LIGHT) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleChangeTheme = () => {
    if ($colorTheme.system) {
      handleToggleTheme();
    }
  };

  onMount(() => {
    const element = document.querySelector('#stencil');
    element?.remove();
    // if the browser theme changes, changes the Immich theme too
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleChangeTheme);
  });

  onDestroy(() => {
    document.removeEventListener('change', handleChangeTheme);
  });

  if (isSharedLinkRoute($page.route?.id)) {
    setKey($page.params.key);
  }

  beforeNavigate(({ from, to }) => {
    setKey(isSharedLinkRoute(to?.route.id) ? to?.params?.key : undefined);

    if (isAssetViewerRoute(from) && isAssetViewerRoute(to)) {
      return;
    }
    showNavigationLoadingBar = true;
  });

  afterNavigate(() => {
    showNavigationLoadingBar = false;
  });
</script>

<svelte:head>
  <title>{$page.data.meta?.title || 'Web'} - Immich</title>
  <link rel="manifest" href="/manifest.json" crossorigin="use-credentials" />
  <meta name="theme-color" content="currentColor" />
</svelte:head>

<noscript
  class="absolute z-[1000] flex h-screen w-screen place-content-center place-items-center bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
>
  <FullscreenContainer title={$t('welcome_to_immich')}>
    To use Immich, you must enable JavaScript or use a JavaScript compatible browser.
  </FullscreenContainer>
</noscript>

{#if $page.data.error}
  <Error error={$page.data.error}></Error>
{:else}
  <slot />
{/if}

{#if showNavigationLoadingBar}
  <NavigationLoadingBar />
{/if}

<DownloadPanel />
<DialogWrapper />
