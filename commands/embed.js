const { MessageEmbed } = require("discord.js")

exports.run = async(client, message, args) => {

	args = args.join(" ").split("|")

    message.delete()
    const embed = new MessageEmbed()
    	.setTitle(args[0])
        .setDescription(args[1])
        .setTimestamp()
        .setColor("#0x17B9AD")
    message.channel.send(embed)
}