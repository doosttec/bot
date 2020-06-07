const megadb = require("megadb");
const reactions = new megadb.crearDB("reactions");

exports.run = async(client, message, args) => {
    if (!message.member.permissions.has("MANAGE_GUILD")) return message.channel.send("No tienes permisos para esto.")
    let channel = message.mentions.channels.first();
    if (!channel) return message.channel.send("Mencione el canal donde esta el mensaje.");
    if (!args[1]) return message.channel.send("Coloque la ID del mensaje.");
    try {
        let msg = await channel.messages.fetch(args[1])
        if (!msg) return message.channel.send("No se a podido obtener ese mensaje. intente nuevamente")
        if (!reactions.tiene(`${message.guild.id}.reactions.${args[1]}`))
            reactions.establecer(`${message.guild.id}.reactions.${args[1]}`, { channelID: channel.id, emojis: [] })
        else return message.channel.send("ID de mensaje ya agregado")
        message.channel.send(`La configuracion a sido guardada, ya puede agregar reacciones usando \`addreact\`\n\`Uso\`: ${process.env.prefix}addreact <id del mensaje> <@Rol> <emoji>`)
    } catch (e) {
        message.channel.send("Invalid message ID")
    }
}