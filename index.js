const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Get Your Voice Bot is online!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const CREATE_CHANNEL_ID = process.env.CREATE_CHANNEL_ID;

const temporaryChannels = new Set();

client.once("ready", () => {
  console.log(`✅ Bot online as ${client.user.tag}`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  try {
    // عندما يدخل شخص إلى Get Your Voice
    if (
      newState.channelId === CREATE_CHANNEL_ID &&
      oldState.channelId !== CREATE_CHANNEL_ID
    ) {
      const guild = newState.guild;
      const member = newState.member;

      const channel = await guild.channels.create({
        name: `${member.user.username}'s Room`,
        type: ChannelType.GuildVoice,
        parent: newState.channel.parentId || null
      });

      temporaryChannels.add(channel.id);

      // نقل العضو إلى الغرفة الجديدة
      await member.voice.setChannel(channel);

      console.log(`✅ Created room for ${member.user.tag}`);
    }

    // حذف الغرفة عندما تصبح فارغة
    if (
      oldState.channelId &&
      temporaryChannels.has(oldState.channelId) &&
      newState.channelId !== oldState.channelId
    ) {
      const channel = oldState.channel;

      if (channel && channel.members.size === 0) {
        await channel.delete().catch(() => {});
        temporaryChannels.delete(channel.id);

        console.log(`🗑️ Deleted empty room`);
      }
    }
  } catch (error) {
    console
