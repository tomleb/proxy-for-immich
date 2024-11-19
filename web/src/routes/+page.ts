import { AppRoute } from '$lib/constants';
import { getFormatter } from '$lib/utils/i18n';
import { init } from '$lib/utils/server';

import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const ssr = false;
export const csr = true;

export const load = (async ({ fetch }) => {
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('welcome') + ' 🎉',
      description: $t('immich_web_interface'),
    },
  };
}) satisfies PageLoad;
