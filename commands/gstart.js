const { MessageEmbed } = require("discord.js");
const ms = require("ms");
const db = require("megadb");
const giveawayDB = new db.crearDB("giveaways");

exports.run = async(client, message, args) => {

    if(!message.member.roles.cache.has("719005797451038731")) return message.channel.send(`No el rol requerido para para crear un sorteo.`);
    if (!args[0]) return message.channel.send(`Coloca el tiempo que durara el sorteo\n\`Uso\`: ${process.env.prefix}gstart <tiempo> <numero de ganadores> <premio>\n\`Ejemplo\`: ${process.env.prefix}gstart 10m 1w Un premio aletorio`);
    if (!args[1]) return message.channel.send(`Coloque el numero de ganadores que habra\n\`Uso\`: ${process.env.prefix}gstart <tiempo> <numero de ganadores> <premio>\n\`Ejemplo\`: ${process.env.prefix}gstart 10m 1w Un premio aletorio`);
    if (!args[2] || args[2].length <= 1) return message.channel.send(`Coloque cual sera el premio del sorteo\n\`Uso\`: ${process.env.prefix}gstart <tiempo> <numero de ganadores> <premio>\n\`Ejemplo\`: ${process.env.prefix}gstart 10m 1w Un premio aletorio`);

    let winners = args[1];
    if (args[1].includes('w')) {
        winners = winners.replace('w', '')
    } else {
        return message.channel.send(`Formato de ganadores invalido, recuerde poner: **<numero de ganadores>w**`);
    }

    let endAt = Date.now() + ms(args[0]);
    let remaining = endAt - Date.now();
    let embed = new MessageEmbed()
        .addField("**GIVEAWAY** ", "Reaccion en el :tada: para participar en el sorteo")
        .addField("Premio", args.slice(2).join(' '))
        .addField("Tiempo restante", ms(remaining, { long: true }))
        .setThumbnail("https://cdn.discordapp.com/emojis/597255448558829578.png?v=1")
        .setColor('#7289da')
        .setFooter(`${winners} Ganador(es)`)
    message.channel.send(embed).then(msg => {
        msg.react('🎉')
        let getGiveawayID = makeGiveawayID(10);
        giveawayDB.establecer(getGiveawayID, {
            messageID: msg.id,
            channelID: message.channel.id,
            guildID: message.channel.guild.id,
            giveawayID: getGiveawayID,
            prize: args.slice(2).join(' '),
            time: ms(args[0]),
            createdAt: Date.now(),
            winners: winners
        })
    })

}

function makeGiveawayID(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}