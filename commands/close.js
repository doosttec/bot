const { MessageEmbed, MessageAttachment } = require("discord.js");

exports.run = async(client, message, args) => {
	if (!message.member.hasPermission("MANAGE_GUILD")) return message.channel.send(`No tienes los suficientes para usar este comando.`);
    let ticketChannel = message.mentions.channels.first() || message.channel;
    if (!(/.+-\d+/gi).test(ticketChannel.name)) return message.channel.send(new MessageEmbed()
        .setDescription("Canal inválido para cerrar como ticket.")
        .setColor(0xff6666)
        .setTimestamp());
    await ticketChannel.send(new MessageEmbed()
        .setDescription("Cerrando ticket...")
        .setColor(0xffff66)
        .setTimestamp());
    ticketChannel.permissionOverwrites.forEach((p) => {
        if (p.id === client.user.id || p.id === message.guild.id) return;
        ticketChannel.createOverwrite(p.id, {
            SEND_MESSAGES: null,
            VIEW_CHANNEL: null
        });
    });
    let msgs = await ticketChannel.messages.fetch({ limit: 100 });
    ticketChannel.send(new MessageAttachment(Buffer.from(require("../transcript/")(msgs.array().sort((a, b) => a.createdAt - b.createdAt))), `${message.channel.name}.html`));
    ticketChannel.setName(`closed-${message.channel.name.split("-")[1]}`);
    message.channel.send(new MessageEmbed()
        .setDescription(`Se ha cerrado el ticket ${ticketChannel} correctamente.`)
        .setColor(0xffff66)
        .setTimestamp());
}