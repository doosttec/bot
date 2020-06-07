require("dotenv").config({ path: __dirname + "/.env" });

const Discord = require("discord.js");
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const megadb = require("megadb");
const reactions = new megadb.crearDB("reactions");
const giveawayDB = new megadb.crearDB("giveaways");
const guildDB = new megadb.crearDB("guildDB");
const spamDB = new megadb.crearDB("spamDB");
const ms = require("ms")

client.on("ready", () => {
    console.log(`${client.user.username} esta listo!`)

    setInterval(() => {
        giveawayDB.datos().then(async x => {
            for (let y in x) {
                let giveaway = await giveawayDB.obtener(y);
                if (giveaway.ended) continue;
                let channel = client.channels.cache.get(giveaway.channelID)
                if (!channel) return;
                let giveawayEndAt = parseInt(giveaway.createdAt + giveaway.time);
                let remaining = giveawayEndAt - Date.now();
                let message = await channel.messages.fetch(giveaway.messageID)
                if (giveawayEndAt <= Date.now()) {
                    let guild = channel.guild;
                    let reaction = message.reactions.cache.find((r) => r._emoji.name === '🎉');
                    reaction.users = await reaction.users.fetch();
                    if (reaction) {
                        let users = (reaction.users.filter((u) => !u.bot).filter((u) => u.id !== message.client.id).filter((u) => guild.members.cache.get(u.id)));

                        if (users.size > 0) {
                            let uWinners = users.random(giveaway.winners).filter((u) => u);
                            let winners = uWinners.map((w) => "<@" + w.id + ">").join(", ");
                            let embed = new Discord.MessageEmbed()
                                .addField("**GIVEAWAY** ", "El sorteo a terminado")
                                .addField("🏆 Winnner(s)", winners)
                                .setThumbnail("https://cdn.discordapp.com/emojis/597255448558829578.png?v=1")
                                .setColor('#7289da')
                            message.edit(embed)
                            channel.send(`Congratulations ${winners} you win ${giveaway.prize}`)
                            giveawayDB.establecer(`${giveaway.giveawayID}.ended`, true)
                        } else {
                            let embed = new Discord.MessageEmbed()
                                .addField("**GIVEAWAY** ", "El sorteo a terminado")
                                .addField("🏆 NO GANADORES", "El sorteo termino sin ningun ganador 😢")
                                .setThumbnail("https://cdn.discordapp.com/emojis/597255448558829578.png?v=1")
                                .setColor('#7289da')
                            message.edit(embed)
                            giveawayDB.establecer(`${giveaway.giveawayID}.ended`, true)
                        }
                    } else {
                        let embed = new Discord.MessageEmbed()
                            .addField("**GIVEAWAY** ", "El sorteo a terminado")
                            .addField("🏆 NO GANADORES", "El sorteo termino sin ningun ganador 😢")
                            .setThumbnail("https://cdn.discordapp.com/emojis/597255448558829578.png?v=1")
                            .setColor('#7B68EE')
                        message.edit(embed)
                        giveawayDB.establecer(`${giveaway.giveawayID}.ended`, true)
                    }
                    return;
                }
                let embed = new Discord.MessageEmbed()
                    .addField("**GIVEAWAY** ", "Reaccion en el :tada: para participar en el sorteo")
                    .addField("Premio", giveaway.prize)
                    .addField("Tiempo restante", ms(remaining, { long: true }))
                    .setThumbnail("https://cdn.discordapp.com/emojis/597255448558829578.png?v=1")
                    .setColor('#7B68EE')
                    .setFooter(`${giveaway.winners} Winner(s)`)
                message.edit(embed);
            }
        })
    }, 45000)
})


client.on("message", async(message) => {
    if (message.author.bot) return;
    if (message.channel.type == "DM") return;

    if (!message.member.permissions.has("ADMINISTRATOR") && message.channel.id != "709417049503301701") {
        if (!spamDB.tiene(`${message.author.id}`)) {
            spamDB.establecer(`${message.author.id}`, { messagesSent: 1, date: Date.now() + 5000, warns: 0 });
        } else {
            let spamUser = await spamDB.obtener(`${message.author.id}`);
            if ((Date.now() < spamUser.date) && spamUser.messagesSent + 1 >= 4) {
                if (spamUser.warns + 1 >= 3) {
                    let role = message.guild.roles.cache.find(r => r.name === `Spam Mute`);
                    if (!role) {
                        role = await message.guild.roles.create({
                            data: {
                                name: `Spam Mute`,
                                color: 0x010101,
                                position: message.guild.me.roles.cache.sort((a, b) => b.position - a.position).first().position - 1,
                                permissions: 0
                            }
                        });
                        message.guild.channels.cache
                            .filter((c) => c.manageable)
                            .forEach((channel) => channel.createOverwrite(role.id, {
                                SEND_MESSAGES: false,
                                READ_MESSAGES: false,
                                ADD_REACTIONS: false
                            }));
                    }
                    await message.member.roles.add(role.id);
                    setTimeout(async() => {
                        await message.member.roles.remove(role.id)
                    }, 300000)
                    message.channel.send(`${message.author} has sido silenciado durante **5 minutos** debido a que has enviado mensajes demasiado rapido`);
                    spamDB.establecer(`${message.author.id}.warns`, 0)
                    spamDB.establecer(`${message.author.id}.messagesSent`, 0)
                    spamDB.establecer(`${message.author.id}.date`, Date.now() + 5000)
                } else {
                    message.channel.send(`${message.author} estas enviando mensajes muy rapido!\n\`Advertencia\`: °${spamUser.warns + 1}`);
                    spamDB.establecer(`${message.author.id}.date`, Date.now() + 5000)
                    spamDB.establecer(`${message.author.id}.messagesSent`, 0)
                    spamDB.sumar(`${message.author.id}.warns`, 1)
                }
            }
            if (Date.now() > spamUser.date) {
                spamDB.establecer(`${message.author.id}.date`, Date.now() + 5000)
                spamDB.establecer(`${message.author.id}.messagesSent`, 1)
            } else {
                spamDB.sumar(`${message.author.id}.messagesSent`, 1)
            }
        }
    }
    if (!message.content.startsWith(process.env.prefix)) return;

    let args = message.content.slice(process.env.prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();

    try {
        let cmdFile = require(`./commands/${command}.js`);
        if (!cmdFile) return;
        cmdFile.run(client, message, args);
    } catch (e) {
        console.log(e.toString(), true);
    } finally {
        console.log(`${message.author.tag} ejecutó el comando ${command}`);
    }
})

client.on("messageReactionAdd", async(reaction, user) => {
    if (reaction.partial) await reaction.fetch();
    let guild = reaction.message.guild;
    let member = guild.members.cache.get(user.id);
    if (!reactions.tiene(`${guild.id}.reactions.${reaction.message.id}`)) return;
    if (client.user.id == user.id) return;
    let message = await reaction.message.channel.messages.fetch(reaction.message.id);
    let dbget = await reactions.obtener(`${guild.id}.reactions.${reaction.message.id}`);
    let index = dbget.emojis.findIndex(reactions => reactions.emoji == reaction.emoji.name);
    if (index == -1) return;
    if (member.roles.cache.get(dbget.emojis[index].role)) return;
    member.roles.add(dbget.emojis[index].role)
});

client.on("messageReactionAdd", async(reaction, user) => {
    if (reaction.partial) await reaction.fetch();

    let message = await reaction.message.channel.messages.fetch(reaction.message.id);
    console.log(reaction.emoji.name,user.id)
    if (message.author.id != "719010739532070922" || message.embeds.length < 1) return;
    if (reaction.emoji.name == "📩" && user.id != client.user.id) {
        await reaction.users.remove(user.id)
        let message = await reaction.message.channel.messages.fetch(reaction.message.id);
        // ID a user: 709549062244007996
        let guild = reaction.message.channel.guild;
        let category = guild.channels.cache.find((c) => c.name === "TICKETS RECLAMOS" && c.type === "category");
        if (!category)
            category = await guild.channels.create("TICKETS RECLAMOS", {
                type: "category",
                permissionOverwrites: [{
                    id: message.guild.id,
                    deny: "VIEW_CHANNEL"
                }]
            });

        let channelNumber = "1";
        if (category.children && category.children.size > 0) {
            let lastChannel = category.children.array()
                .filter((c) => (/.+-\d+/gi).test(c.name))
                .sort((a, b) => parseInt(b.name.split("-")[1]) - parseInt(a.name.split("-")[1]));
            if (lastChannel[0])
                channelNumber = String(parseInt(lastChannel[0].name.split("-")[1]) + 1);
        }

        let channel = await guild.channels
            .create(`ticket-${"0000".substring(0, 4 - channelNumber.length) + channelNumber}`, {
                type: "text",
                parent: category.id,
                permissionOverwrites: [{
                    id: message.guild.id,
                    deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
                }, {
                    id: user.id,
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES"]
                }, {
                    id: client.user.id,
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS"]
                }, {   
                    id: "719007317479129089",
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS"]
                }]
            });
             

        channel.send(`${user},`, new Discord.MessageEmbed()
            .setDescription("Felicidades ganaste en un momento te atendemos")
            .setColor(0xFFD700)
            .setTimestamp());
    }
    if (reaction.emoji.name == "📨" && user.id != client.user.id) {
        await reaction.users.remove(user.id)
        let message = await reaction.message.channel.messages.fetch(reaction.message.id);
        // ID a user: 709549062244007996
        let guild = reaction.message.channel.guild;
        let category = guild.channels.cache.find((c) => c.name === "TICKET VIP" && c.type === "category");
        if (!category)
            category = await guild.channels.create("TICKET VIP", {
                type: "category",
                permissionOverwrites: [{
                    id: message.guild.id,
                    deny: "VIEW_CHANNEL"
                }]
            });

        let channelNumber = "1";
        if (category.children && category.children.size > 0) {
            let lastChannel = category.children.array()
                .filter((c) => (/.+-\d+/gi).test(c.name))
                .sort((a, b) => parseInt(b.name.split("-")[1]) - parseInt(a.name.split("-")[1]));
            if (lastChannel[0])
                channelNumber = String(parseInt(lastChannel[0].name.split("-")[1]) + 1);
        }

        let channel = await guild.channels
            .create(`ticket-${"0000".substring(0, 4 - channelNumber.length) + channelNumber}`, {
                type: "text",
                parent: category.id,
                permissionOverwrites: [{
                    id: message.guild.id,
                    deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
                }, {
                    id: user.id,
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES"]
                }, {
                    id: client.user.id,
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS"]
                }, {
                    id: "719007317479129089",
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS"]
                }]
            });

        channel.send(`${user},`, new Discord.MessageEmbed()
            .setDescription("Felicidades por ganar en un sorteo solo para usuarios ViP.")
            .setColor(0xFFD700)
            .setTimestamp());
    }
});

//2
client.on("messageReactionAdd", async(reaction, user) => {
    if (reaction.partial) await reaction.fetch();
    let guild = reaction.message.guild;
    let member = guild.members.cache.get(user.id);
    if (!reactions.tiene(`${guild.id}.reactions.${reaction.message.id}`)) return;
    if (client.user.id == user.id) return;
    let message = await reaction.message.channel.messages.fetch(reaction.message.id);
    let dbget = await reactions.obtener(`${guild.id}.reactions.${reaction.message.id}`);
    let index = dbget.emojis.findIndex(reactions => reactions.emoji == reaction.emoji.name);
    if (index == -1) return;
    if (member.roles.cache.get(dbget.emojis[index].role)) return;
    member.roles.add(dbget.emojis[index].role)
});

client.on("messageReactionAdd", async(reaction, user) => {
  if (reaction.partial) await reaction.fetch();

  let message = await reaction.message.channel.messages.fetch(reaction.message.id);
  console.log(reaction.emoji.name,user.id)
  if (message.author.id != "719010739532070922" || message.embeds.length < 1) return;
  if (reaction.emoji.name == "📩" && user.id != client.user.id) {
      await reaction.users.remove(user.id)
      let message = await reaction.message.channel.messages.fetch(reaction.message.id);
      // ID a user: 709549062244007996
      let guild = reaction.message.channel.guild;
      let category = guild.channels.cache.find((c) => c.name === "Cotizacion server" && c.type === "category");
      if (!category)
          category = await guild.channels.create("Cotizacion server", {
              type: "category",
              permissionOverwrites: [{
                  id: message.guild.id,
                  deny: "VIEW_CHANNEL"
              }]
          });

      let channelNumber = "1";
      if (category.children && category.children.size > 0) {
          let lastChannel = category.children.array()
              .filter((c) => (/.+-\d+/gi).test(c.name))
              .sort((a, b) => parseInt(b.name.split("-")[1]) - parseInt(a.name.split("-")[1]));
          if (lastChannel[0])
              channelNumber = String(parseInt(lastChannel[0].name.split("-")[1]) + 1);
      }

      let channel = await guild.channels
          .create(`ticket-${"0000".substring(0, 4 - channelNumber.length) + channelNumber}`, {
              type: "text",
              parent: category.id,
              permissionOverwrites: [{
                  id: message.guild.id,
                  deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
              }, {
                  id: user.id,
                  allow: ["VIEW_CHANNEL", "SEND_MESSAGES"]
              }, {
                  id: client.user.id,
                  allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS"]
              }, {   
                  id: "719179096818581544",
                  allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS"]
              }]
          });
           

      channel.send(`${user},`, new Discord.MessageEmbed()
          .setDescription("puedes ir describiendo lo que necesitas en un momento te atendemos")
          .setColor(0x0EB923)
          .setTimestamp());
  }
  if (reaction.emoji.name == "📨" && user.id != client.user.id) {
      await reaction.users.remove(user.id)
      let message = await reaction.message.channel.messages.fetch(reaction.message.id);
      // ID a user: 709549062244007996
      let guild = reaction.message.channel.guild;
      let category = guild.channels.cache.find((c) => c.name === "cotizacion bots" && c.type === "category");
      if (!category)
          category = await guild.channels.create("cotizacion bots", {
              type: "category",
              permissionOverwrites: [{
                  id: message.guild.id,
                  deny: "VIEW_CHANNEL"
              }]
          });

      let channelNumber = "1";
      if (category.children && category.children.size > 0) {
          let lastChannel = category.children.array()
              .filter((c) => (/.+-\d+/gi).test(c.name))
              .sort((a, b) => parseInt(b.name.split("-")[1]) - parseInt(a.name.split("-")[1]));
          if (lastChannel[0])
              channelNumber = String(parseInt(lastChannel[0].name.split("-")[1]) + 1);
      }

      let channel = await guild.channels
          .create(`ticket-${"0000".substring(0, 4 - channelNumber.length) + channelNumber}`, {
              type: "text",
              parent: category.id,
              permissionOverwrites: [{
                  id: message.guild.id,
                  deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
              }, {
                  id: user.id,
                  allow: ["VIEW_CHANNEL", "SEND_MESSAGES"]
              }, {
                  id: client.user.id,
                  allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS"]
              }, {
                  id: "719179096818581544",
                  allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_CHANNELS"]
              }]
          });

      channel.send(`${user},`, new Discord.MessageEmbed()
          .setDescription("puedes ir describiendo lo que necesitas en un momento te atendemos.")
          .setColor(0x0EB923)
          .setTimestamp());
  }
});
//2

client.on("guildMemberAdd", async member => {

    if (!member.guild.channels.cache.find(channel => channel.name.includes("HUMANS"))) {
        var humanos = await member.guild.channels.create('HUMANS: ' + member.guild.members.cache.filter(x => !x.user.bot).size, { type: 'voice' })
    } else member.guild.channels.cache.find(channel => channel.name.includes("HUMANS")).edit({ name: "HUMANS: " + member.guild.members.cache.filter(x => !x.user.bot).size })

    if (!member.guild.channels.cache.find(channel => channel.name.includes("BOTS"))) {
        var bots = await member.guild.channels.create('BOTS: ' + member.guild.members.cache.filter(x => x.user.bot).size, { type: 'voice' })
    } else member.guild.channels.cache.find(channel => channel.name.includes("BOTS")).edit({ name: "BOTS: " + member.guild.members.cache.filter(x => x.user.bot).size })

    if (!member.guild.channels.cache.find(channel => channel.name.includes("TOTAL"))) {
        var total = await member.guild.channels.create('TOTAL: ' + member.guild.memberCount, { type: 'voice' })
    } else member.guild.channels.cache.find(channel => channel.name.includes("TOTAL")).edit({ name: "TOTAL: " + member.guild.memberCount })

    if (!guildDB.tiene(`${member.guild.id}.welcome`)) return;
    let welcome = await guildDB.obtener(`${member.guild.id}.welcome`);
    if (!member.guild.channels.cache.get(welcome.channel)) return;
    let channel = member.guild.channels.cache.get(welcome.channel);

    channel.send(new Discord.MessageEmbed().setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setDescription(welcome.message)
        .setTimestamp()
        .setFooter("Bievenido y esperamos que disfrutes")
        .setColor(0x0000CD))

})

client.on("guildMemberRemove", async member => {

    if (!member.guild.channels.cache.find(channel => channel.name.includes("HUMANS"))) {
        var humanos = await member.guild.channels.create('HUMANS: ' + member.guild.members.cache.filter(x => !x.user.bot).size, { type: 'voice' })
    } else member.guild.channels.cache.find(channel => channel.name.includes("HUMANS")).edit({ name: "HUMANS: " + member.guild.members.cache.filter(x => !x.user.bot).size })

    if (!member.guild.channels.cache.find(channel => channel.name.includes("BOTS"))) {
        var bots = await member.guild.channels.create('BOTS: ' + member.guild.members.cache.filter(x => x.user.bot).size, { type: 'voice' })
    } else member.guild.channels.cache.find(channel => channel.name.includes("BOTS")).edit({ name: "BOTS: " + member.guild.members.cache.filter(x => x.user.bot).size })

    if (!member.guild.channels.cache.find(channel => channel.name.includes("TOTAL"))) {
        var total = await member.guild.channels.create('TOTAL: ' + member.guild.memberCount, { type: 'voice' })
    } else member.guild.channels.cache.find(channel => channel.name.includes("TOTAL")).edit({ name: "TOTAL: " + member.guild.memberCount })

    if (!guildDB.tiene(`${member.guild.id}.leave`)) return;
    let leave = await guildDB.obtener(`${member.guild.id}.leave`);
    if (!member.guild.channels.cache.get(leave.channel)) return;
    let channel = member.guild.channels.cache.get(leave.channel);

    channel.send(new Discord.MessageEmbed().setAuthor(member.user.tag, member.user.displayAvatarURL())
        .setDescription(leave.message)
        .setTimestamp()
        .setFooter("Nos vemos pronto")
        .setColor(0xDC143C))


})

  

client.login('NzE5MDEwNzM5NTMyMDcwOTIy.XtxM_Q.l2DTngAWsTJfi4orS1Q_xHipKr0');