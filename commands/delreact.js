const megadb = require("megadb");
const reactions = new megadb.crearDB("reactions");

exports.run = async (client, message, args) => {
	if(!args[0]) return message.channel.send("Especifica la ID del mensaje")
	if(!reactions.tiene(`${message.guild.id}.reactions.${args[0]}`)) return message.channel.send(`No se a guardado la ID del mensaje en la base de datos`)
	reactions.eliminar(`${message.guild.id}.reactions.${args[0]}`);
	message.channel.send("Sistema de reaccion del mensaje eliminado,")
}