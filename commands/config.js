const db = require("megadb");
const guildDB = new db.crearDB("guildDB");

exports.run = async(client, message, args) => {
	if (!message.member.permissions.has("MANAGE_GUILD")) return message.channel.send("No tienes permisos para esto.")
    if (args[0] == "welcome") {
    	let channel = message.mentions.channels.first();
    	if(!channel) return message.channel.send("Mencione el canal donde se enviara el mensaje de bienvenida.")
        let texto = args.slice(2).join(" ")
        if (!texto) return message.channel.send("Ingresa un texto para la bienvenida.")

        guildDB.set(`${message.guild.id}.welcome`, { channel: channel.id, message: texto })
        message.channel.send("Mensaje de bienvenida establecido")
    } else if (args[0] == "leave") {
    	let channel = message.mentions.channels.first();
    	if(!channel) return message.channel.send("Mencione el canal donde se enviara el mensaje de despedida.")
        let texto = args.slice(2).join(" ")
        if (!texto) return message.channel.send("Ingresa un texto para la despedida.")

        guildDB.set(`${message.guild.id}.leave`, { channel: channel.id, message: texto })
        message.channel.send("Mensaje de bienvenida establecido")
    } else return message.channel.send("Escoja configurar el `welcome` o el `leave`\n`Uso:`" + process.env.prefix + "config <welcome|leave> #channel <mensaje>")
}