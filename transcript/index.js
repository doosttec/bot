const { minify } = require("html-minifier");
const Mustache = require("mustache");
const fs = require("fs");

function parseInfo(channel) {
    return {
        channelName: channel.name,
        guildName: channel.guild.name,
        guildIcon: channel.guild.iconURL()
    };
}

function parseMarkdown(content, message) {
    return content
        .replace(/^>\s.+/gi, (q) => `<div class="quote">${q.slice(2)}</div>`)
        .replace(/^>>>\s[\s\S]+/gi, (q) => `<div class="quote">${q.slice(4)}</div>`)
        .replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi, (u) => `<a href="${u}">${u}</a>`)
        .replace(/<(@!?|#|@&)\d{16,20}>/gi, (m) => {
            let mention = message.guild.members.resolve(m.match(/\d{16,20}/gi)[0]);
            if (m[1] === "#")
                mention = message.client.channels.resolve(m.match(/\d{16,20}/gi)[0]);
            else if (m.substring(1, 3) === "@&")
                mention = message.guild.roles.resolve(m.match(/\d{16,20}/gi)[0]);
            if (!mention)
                mention = `deleted-${m[1] === "#" ? "channel" : (m.substring(1, 3) === "@&" ? "role" : "channel")}`;
            else mention = m[1] === "#" ? mention.name : (m.substring(1, 3) === "@&" ? mention.name : mention.displayName);
            return `<span class="mention">${m[1]}${mention}</span>`;
        })
        .replace(/\|\|[\s\S]+\|\|/gi, (s) => `<div class="spoiler">${s.match(/((?!\|\|).)+/gi)[0]}</div>`)
        .replace(/\`[\s\S]+\`/gi, (c) => `<div class="pre pre--inline">${c.match(/((?!\`).)+/gi)[0]}</div>`)
        .replace(/\`\`\`[\s\S]+\`\`\`/gi, (c) => `<div class="pre pre--multiline">${c.match(/((?!\`\`\`).)+/gi)[0]}</div>`)
        .replace(/\*\*[\s\S]+\*\*/gi, (b) => `<strong>${b.match(/((?!\*\*).)+/gi)[0]}</strong>`)
        .replace(/(\*|_)[\s\S]+(\*|_)/gi, (i) => `<em>${i.match(/((?!\*).)+/gi)[0]}</em>`)
        .replace(/<a?:[a-zA-Z_\-]{3,32}:\d{16,20}>/gi, (e) => `<img class="emoji ${(/(<a?:[a-zA-Z_\-]{3,32}:\d{16,20}>\s?)+/gi).test(content) ? "emoji--large" : "emoji--small"}" alt="${e.match(/[a-zA-Z_\-]{3,32}/gi)[0]}" title="${e.match(/[a-zA-Z_\-]{3,32}/gi)[0]}" src="https://cdn.discordapp.com/emojis/${e.match(/\d{16,20}/gi)[0]}.${e[2] === "a" ? "gif" : "png"}">`);
}

function parseGroup(messages) {
    function parseAuthor(member) {
        return {
            tag: member.user.tag,
            bot: member.user.bot,
            id: member.id,
            displayName: member.displayName,
            displayAvatar: member.user.displayAvatarURL(),
            displayColor: member.displayColor === 0 ? "fff" : member.displayColor.toString(16)
        };
    }

    function parseEmbed(embed, message) {
        return {
            color: embed.color.toString(16),
            description: parseMarkdown(embed.description, message),
            fields: embed.fields
        };
    }

    function parseReaction(reaction) {
        return {
            emoji: reaction.emoji.toString(),
            url: reaction.emoji.url,
            count: reaction.count
        };
    }

    function parseMessage(message) {
        return {
            id: message.id,
            contentParsed: parseMarkdown(message.content, message),
            attachments: message.attachments.filter((a) => [".png", ".gif", ".webp"].some((f) => a.url.endsWith(f))).map((a) => a.url),
            embeds: message.embeds.map((e) => parseEmbed(e, message)),
            reactions: message.reactions.cache.map((r) => parseReaction(r)),
            edited: message.editedAt ? message.editedAt.toLocaleString() : false
        };
    }

    return {
        author: parseAuthor(messages[0].member),
        messages: messages.map((m) => parseMessage(m)),
        timestamp: messages[0].createdAt.toLocaleString()
    };
}

function groupMessages(messages) {
    let groups = [];
    messages.forEach((msg, i) => {
        if (groups.some((g) => g.includes(msg))) return;
        let to = 0;
        try {
            messages.slice(i).forEach((mssg, ii) => {
                if (mssg.author.id === msg.author.id
                    && (mssg.createdAt - msg.createdAt) < 42e4)
                    to++;
                else throw Error;
            });
        } catch { }
        groups.push(messages.filter((m) => messages.indexOf(m) >= i && messages.indexOf(m) < (i + to)));
    });
    return groups;
}

module.exports = function (messages) {
    if (messages.length < 1) return "No messages";
    return minify(Mustache.render(fs.readFileSync(__dirname + "/template.html", "utf8"), {
        info: parseInfo(messages[0].channel),
        messagesGroup: groupMessages(messages).map((m) => parseGroup(m)),
        messagesRaw: messages
    }), {
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
        removeComments: true,
        useShortDoctype: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        collapseInlineTagWhitespace: true
    });
}
