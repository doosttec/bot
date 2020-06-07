const { MessageEmbed } = require("discord.js")

exports.run = async(client, message, args) => {
	if (!message.member.hasPermission("MANAGE_GUILD")) return message.channel.send(`No tienes los suficientes para usar este comando.`);
    if (args[0] === "generar") {
        message.delete();
        let array = ["TICKETS RECLAMOS", "TICKET VIP"]
        let array2 = ["📩", "📨"]
        for (let i = 0; i <= 1; i++) {
            let msg = await message.channel.send(new MessageEmbed()
                .setTitle(array[i])
                .setDescription(`reclama tu premio reacciona aqui abajo ${array2[i]}`)
                .setColor(0x6666ff));
            msg.react(array2[i]);
        }
        return;
    }

    if (!message.member.hasPermission("MANAGE_GUILD")) return message.channel.send(`No tienes los suficientes para usar este comando.`);
    if (args[0] === "genera") {
        message.delete();
        let array = ["Cotizar Mi Server", "Cotizar Mi Bot"]
        let array2 = ["📩", "📨"]
        for (let i = 0; i <= 1; i++) {
            let msg = await message.channel.send(new MessageEmbed()
                .setTitle(array[i])
                .setDescription(`para cotizar reacciona aqui abajo ${array2[i]}`)
                .setColor(0x6666ff));
            msg.react(array2[i]);
        }
        return;
    }


    if (!["add", "remove"].includes(args[0])) return message.channel.send("Necesitas especificar una opción entre `add` o `remove`.");
    let member = message.guild.members.resolve(args[1]) || message.mentions.members.first();
    let ticketChannel = message.mentions.channels.first() || message.channel;
    if (!member) return message.channel.send("Menciona un miembro válido o coloca su ID para agregarlo al ticket.");
    ticketChannel.createOverwrite(member.id, {
        SEND_MESSAGES: args[0] === "add" ? true : false,
        VIEW_CHANNEL: args[0] === "add" ? true : false
    });
    message.channel.send(new MessageEmbed()
        .setDescription(`${member} ha sido añadido al ticket ${ticketChannel}.`)
        .setColor(args[0] === "add" ? 0x66ff66 : 0xff6666)
        .setTimestamp());
}