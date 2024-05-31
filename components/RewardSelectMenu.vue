<template>
  <USelectMenu
    v-model="selected"
    :options="data.data"
    value-attribute="title"
    option-attribute="title"
  />
</template>

<script setup>
const token = ref("");
const user_info = ref({});
const route = useRoute();
const param = useUrlSearchParams(route.path);
token.value = param.access_token;
const selected = defineModel();
const { data: userdata } = await $fetch("https://api.twitch.tv/helix/users", {
  headers: {
    Authorization: `Bearer ${token.value}`,
    "Client-Id": "lrcjebba56rl7xikvtrki8yh9pb6ok",
  },
});
const user = userdata[0];
user_info.value.name = user.display_name;
user_info.value.profile_image_url = user.profile_image_url;
user_info.value.id = user.id;

const { data, pending, error, refresh } = await useFetch(
  "https://api.twitch.tv/helix/channel_points/custom_rewards",
  {
    headers: {
      Authorization: `Bearer ${token.value}`,
      "Client-Id": "lrcjebba56rl7xikvtrki8yh9pb6ok",
    },
    query: { broadcaster_id: user_info.value.id },
  }
);
</script>
