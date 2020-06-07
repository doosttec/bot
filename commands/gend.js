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
                if (giveaway.ended) return message.channel.send("Este sorteo ya a terminado")
                let channel = client.channels.cache.get(giveaway.channelID);
                let msg = await channel.messages.fetch(giveaway.messageID);
                if(!msg) return message.channel.send("No se a podido obtener el mensaje del sorteo.")
                let guild = channel.guild;
                let reaction = msg.reactions.cache.find((r) => r._emoji.name === '🎉');
                reaction.users = await reaction.users.fetch();
                if (reaction) {
                    let users = (reaction.users.filter((u) => !u.bot).filter((u) => u.id !== msg.client.id).filter((u) => guild.members.cache.get(u.id)));
                    console.log(users)
                    if (users.size > 0) {
                        let uWinners = users.random(giveaway.winners).filter((u) => u);
                        let winners = uWinners.map((w) => "<@" + w.id + ">").join(", ");
                        let embed = new MessageEmbed()
                            .addField("**GIVEAWAY** ", "El sorteo a terminado")
                            .addField("🏆 Ganador(es)", winners)
                            .setThumbnail("https://cdn.discordapp.com/emojis/597255448558829578.png?v=1")
                            .setColor('#7289da')
                        msg.edit(embed)
                        channel.send(`Congratulations ${winners} you win ${giveaway.prize}`)
                        giveawayDB.establecer(`${giveaway.giveawayID}.ended`, true)
                    } else {
                        let embed = new MessageEmbed()
                            .addField("**GIVEAWAY** ", "El sorteo a terminado")
                            .addField("🏆 NO GANADORES", "Este sorteo termino sin ningun ganador 😢")
                            .setThumbnail("https://cdn.discordapp.com/emojis/597255448558829578.png?v=1")
                            .setColor('#7289da')
                        msg.edit(embed)
                        giveawayDB.establecer(`${giveaway.giveawayID}.ended`, true)
                    }
                } else {
                    let embed = new MessageEmbed()
                        .addField("**GIVEAWAY** ", "El sorteo a terminado")
                        .addField("🏆 NO GANADORES", "Este sorteo termino sin ningun ganador 😢")
                        .setThumbnail("https://cdn.discordapp.com/emojis/597255448558829578.png?v=1")
                        .setColor('#7289da')
                    msg.edit(embed)
                    giveawayDB.establecer(`${giveaway.giveawayID}.ended`, true)
                }
            }
        }
    });
}