<template>
  <UContainer>
    <UCard class="mt-10">
      <template #header>
        <div class="flex justify-between">
          <h1>Twitch Reward AutoBan</h1>
          <ColorScheme
            ><USelect
              v-model="$colorMode.preference"
              :options="['system', 'light', 'dark']"
          /></ColorScheme>
        </div>
      </template>
      <div class="flex items-center space-x-4" v-if="!token">
        <USkeleton class="h-12 w-12" :ui="{ rounded: 'rounded-full' }" />
        <div class="space-y-2">
          <USkeleton class="h-4 w-[250px]" />
          <USkeleton class="h-4 w-[200px]" />
        </div>
      </div>
      <div class="grid gap-y-4" v-else>
        <div class="flex items-center space-x-4">
          <UAvatar
            :src="user_info.profile_image_url"
            alt="Avatar"
            size="lg"
          ></UAvatar>
          <div class="space-y-2">
            <p>{{ user_info.name }}</p>
            <p>{{ user_info.id }}</p>
          </div>
        </div>

        <URange :min="0" :step="10" :max="6000" v-model="storage.Ban_time" />
        Ban_time: {{ storage.Ban_time }}
        <UCard class="">
          <div class="flex justify-between">
            <h1>Ban Reward</h1>
          </div>
          <RewardSelectMenu v-model="storage.Reward"></RewardSelectMenu>
        </UCard>
        <UCard class="">
          <div class="flex justify-between">
            <h1>Ban With Other Reward</h1>
          </div>
          <RewardSelectMenu v-model="storage.WithReward"></RewardSelectMenu>
        </UCard>
      </div>
      <UButton :to="url" icon="i-mdi-twitch" class="mt-4"
        >Authorization With Twitch</UButton
      >
    </UCard>
  </UContainer>
</template>
<script setup>
import { useStorage } from "@vueuse/core";

const route = useRoute();
const token = ref("");
const user_info = ref({});
const storage = useStorage("Custom", {
  Ban_time: 600,
  Reward: "",
  WithReward: "",
  Message: "",
});

const custom_message = computed(() => storage.value.Message);
if (route.path) {
  const param = useUrlSearchParams(route.path);
  if (param.access_token) {
    token.value = param.access_token;

    const { data } = await $fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${token.value}`,
        "Client-Id": "lrcjebba56rl7xikvtrki8yh9pb6ok",
      },
    });
    const user = data[0];
    user_info.value.name = user.display_name;
    user_info.value.profile_image_url = user.profile_image_url;
    user_info.value.id = user.id;
    var session_id = "";
    let ws = new WebSocket("wss://eventsub.wss.twitch.tv/ws");

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(message);
      if (message.metadata.message_type === "session_welcome") {
        // console.log(message.payload.session.id);
        session_id = message.payload.session.id;

        const sub_mess = {
          type: "channel.channel_points_custom_reward_redemption.add",
          version: "1",
          condition: {
            broadcaster_user_id: user_info.value.id,
          },
          transport: {
            method: "websocket",
            session_id: session_id,
          },
        };
        $fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.value}`,
            "Client-Id": "lrcjebba56rl7xikvtrki8yh9pb6ok",
          },
          body: sub_mess,
        });
      }

      if (message.metadata.message_type === "notification") {
        if (message.payload.event.reward.title === storage.value.Reward) {
          ban_user(message.payload.event.user_id);
          // send_message(custom_message.value);
        }
        if (message.payload.event.reward.title === storage.value.WithReward) {
          ban_user(message.payload.event.user_id);
          get_user(message.payload.event.user_input).then(({ data }) => {
            ban_user(data[0].id);
          });
          // send_message(custom_message.value);
        }
      }
    };
  }
}

const get_user = async (login) => {
  return await $fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${token.value}`,
      "Client-Id": "lrcjebba56rl7xikvtrki8yh9pb6ok",
    },
    query: {
      login,
    },
  });
};

const ban_user = async (user_id) => {
  await $fetch("https://api.twitch.tv/helix/moderation/bans", {
    headers: {
      Authorization: `Bearer ${token.value}`,
      "Client-Id": "lrcjebba56rl7xikvtrki8yh9pb6ok",
    },
    method: "POST",
    body: {
      data: { user_id, duration: storage.value.Ban_time },
    },
    query: {
      broadcaster_id: user_info.value.id,
      moderator_id: user_info.value.id,
    },
  });
};
const send_message = async (message) => {
  await $fetch("https://api.twitch.tv/helix/chat/messages", {
    headers: {
      Authorization: `Bearer ${token.value}`,
      "Client-Id": "lrcjebba56rl7xikvtrki8yh9pb6ok",
    },
    method: "POST",
    body: {
      broadcaster_id: user_info.value.id,
      sender_id: user_info.value.id,
      message: message,
    },
  });
};
const url = computed(() => {
  const a = new URL("https://id.twitch.tv/oauth2/authorize");
  var b = {};
  b.response_type = "token";
  b.client_id = "lrcjebba56rl7xikvtrki8yh9pb6ok";

  b.scope =
    "channel:read:redemptions moderator:manage:banned_users user:write:chat";
  const urlParam = new URLSearchParams(b);
  const {
    public: { baseUrl },
  } = useRuntimeConfig();
  return `${a.toString()}?${urlParam.toString()}&redirect_uri=${baseUrl}`;
});
</script>
