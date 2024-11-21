<script lang="ts">
  import { run } from 'svelte/legacy';

  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
  import AppleHeader from '$lib/components/shared-components/apple-header.svelte';
  import FullscreenContainer from '$lib/components/shared-components/fullscreen-container.svelte';
  import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
  import NotificationList from '$lib/components/shared-components/notification/notification-list.svelte';
  import { Theme } from '$lib/constants';
  import { colorTheme, handleToggleTheme, type ThemeSetting } from '$lib/stores/preferences.store';

  import { serverConfig } from '$lib/stores/server-config.store';

  import { user } from '$lib/stores/user.store';
  import { copyToClipboard, setKey } from '$lib/utils';
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import '../app.css';
  import { isAssetViewerRoute, isSharedLinkRoute } from '$lib/utils/navigation';
  import { t } from 'svelte-i18n';
  import Error from '$lib/components/error.svelte';
  import { shortcut } from '$lib/actions/shortcut';
  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  let showNavigationLoadingBar = $state(false);

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

  const getMyImmichLink = () => {
    return new URL($page.url.pathname + $page.url.search, 'https://my.immich.app');
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
  run(() => {
    changeTheme($colorTheme);
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
  {@render children?.()}
{/if}

{#if showNavigationLoadingBar}
  <NavigationLoadingBar />
{/if}

<DownloadPanel />
<NotificationList />
