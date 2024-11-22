import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { purchaseStore } from '$lib/stores/purchase.store';
import { serverInfo } from '$lib/stores/server-info.store';
import { preferences as preferences$, resetSavedUser, user as user$ } from '$lib/stores/user.store';
import { redirect } from '@sveltejs/kit';
import { DateTime } from 'luxon';
import { get } from 'svelte/store';
import { AppRoute } from '../constants';

export interface AuthOptions {
  admin?: true;
  public?: true;
}

export const authenticate = async (options?: AuthOptions) => {
  const { public: publicRoute } = options || {};

  if (publicRoute) {
    return;
  }

  redirect(404, AppRoute.AUTH_LOGIN);
};

export const handleLogout = async (redirectUri: string) => {
  try {
    if (redirectUri.startsWith('/')) {
      await goto(redirectUri);
    } else {
      window.location.href = redirectUri;
    }
  } finally {
    resetSavedUser();
  }
};
