// https://nuxt.com/docs/api/configuration/nuxt-config
import { RuntimeConfig } from 'nuxt/schema';
import { Base } from './node_modules/.pnpm/nuxt@3.11.2_@opentelemetry+api@1.8.0_@parcel+watcher@2.4.1_@types+node@20.12.13_@unocss+reset_jvcbfuopkhscao7snohgzfldoe/node_modules/nuxt_tmp_28956/dist/head/runtime/components';
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  modules: ["@nuxt/ui", "@vueuse/nuxt"],
  ui: { icons: ['mdi'] },
  runtimeConfig: {
    public: {
      baseUrl: "https://twitch-auto-ban.pages.dev/"
    }
  }

})