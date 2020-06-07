const { MessageEmbed } = require("discord.js");
const ms = require("ms");
const db = require("megadb");
const giveawayDB = new db.crearDB("giveaways");

exports.run = async(client, message, args) => {

    if(!message.member.roles.cache.has("719005797451038731")) return message.channel.send(`No el rol requerido para para crear un sorteo.`);
    if (!args[0]) return message.channel.send(`Porfavor coloque la ID del mensaje del sorteo.`)
    let messageID = args[0];


    giveawayDB.datos().then(async x => {
        for (let y in x) {
            let giveaway = await giveawayDB.obtener(y);
            if (giveaway.messageID == messageID) {
                if(!giveaway.ended) return message.channel.send("Este sorteo aun no a terminado")
                let channel = client.channels.cache.get(giveaway.channelID);
                if (!channel) return message.channel.send("No se pudo obtener el canal, verifique la ID");
                let msg = await channel.messages.fetch(giveaway.messageID);
                let guild = message.guild;
                let reaction = msg.reactions.cache.find((r) => r._emoji.name === '🎉');
                let reactionUsers = await reaction.users.fetch();
                console.log(reactionUsers)
                let users = (reactionUsers.filter((u) => !u.bot).filter((u) => u.id !== message.client.id).filter((u) => guild.members.cache.get(u.id)));
                if (users.size < 1) {
                    return channel.send('-- OWO --')
                } else {
                    let uWinners = users.random(giveaway.winners).filter((u) => u);
                    let winners = uWinners.map((w) => "<@" + w.id + ">").join(", ");
                    channel.send(`Felicidades! Nuevo ganador(es) ${winners}`)
                    let embed = new MessageEmbed()
                        .addField("**GIVEAWAY** ", "El sorteo a terminado")
                        .addField("🏆 Ganador(es)", winners)
                        .setThumbnail("https://cdn.discordapp.com/emojis/597255448558829578.png?v=1")
                        .setColor('#7289da')
                    msg.edit(embed)
                }
                break;
            }
        }
    })
}