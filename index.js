const {Client, Events,GatewayIntentBits,EmbedBuilder} = require('discord.js')
const client =  new Client({intents : [GatewayIntentBits.MessageContent,GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.GuildMessageTyping]})

const {QuickDB}= require('quick.db')
const db = new QuickDB()
client.on(Events.ClientReady, ready => {
    console.log('ready')
})
function commas (text) {
    return '`'+ text + '`'
}
const limiter = new Map()
client.on(Events.MessageCreate,async msg => {
    const author = msg.author
    if(!msg.inGuild()) return;
    if ((await db.get('channel')) && msg.channelId != await db.get('channel')) return;
    if(!author) return;
    if(author.bot) return;
    const args = msg.content.split(' ')
    console.log(args)
    const embed = new EmbedBuilder({
        footer : {text : `requsted by ${author.username}`}
    })
    const prefix = await db.get('prefix') || '$'
    const command = args[0].replace(prefix,'')
    if (msg.mentions.users.first()?.id == client.user.id) return msg.reply('My current prefix is : `'+prefix+'`')
    if (command == 'points') return msg.reply(`Your current points is : ${commas(await db.table('points').get(msg.author.id) || 0)}`)
    else if (msg.content === 'د') {
        if (await db.table('daily').get(author.id) == true) return msg.reply('**انت مسجل الدخول بالفعل**')
        if((limiter.get(author.id) || 0) > new Date().getTime()) return msg.reply(`**تمهل رجاءًا تستطيع استعمال هذا الامر مجددًا خلال ${commas(Math.round((limiter.get(author.id) - new Date().getTime()) / 60 /1000))} دقائق**`)
        await db.table('points').add(author.id,1)
        .then(e=> {
            db.table('daily').set(author.id,true)
            msg.reply('**تم تسجيل دخولك**')
        })
        .catch(e=> msg.reply('**حدث خطأ**'))
    } 
    else if (msg.content == 'خ') {
        if (await db.table('daily').get(author.id) != true) return msg.reply('**لم تسجل دخولك**')
        await db.table('daily').set(author.id, false).then(e => msg.reply('**تم تسجيل خروجك**'))
        limiter.set(author.id, new Date().getTime() + 10 * 60 * 1000)
    }
    if (!msg.content.startsWith(prefix)) return;
    if (command == 'top') {
        var users = (await db.table('points').all()).sort((a,b)=> b.value - a.value)
        var count = 0;
        users = users.map(e => {
            count++
            return (`${commas(count)}. <@${e.id}> with ${e.value > 1 ? `${commas(e.value)} points` : `${commas(e.value)} point`}`)
        })
        console.log(users)
        msg.channel.send(users.join(`\n`))
    }
    else if (command == 'reset_dealy') {
        if (!msg.member.permissions.has('Administrator')) return;
        limiter.clear()
        msg.reply('**تم اعادة تعيين اوقات المهلة للاعضاء**')
    }
    else if (command == 'help') {
        let me = ``
        if (msg.member.permissions.has('Administrator')) me += `${commas(prefix + 'reset_dealy')} اعادة تعيين المهلة المحددة لتسجيل الدخول للاعضاء
        ${commas(prefix + 'channel')} تحديد قناة البوت\n`
        me += `${commas(prefix +'points')} معرفة كم نقطة لديك
        ${commas(prefix + 'top')} مشاهدة ترتيب اعلى نقاط
        ${commas('د')} تسجيل الدخول
        ${commas('خ')} تسجيل الخروج`
        embed.setDescription(me)
        msg.reply({embeds : [embed]})
    }
    else if (command == 'channel') {
        if (!msg.member.permissions.has('Administrator')) return;
        if(!msg.mentions.channels.first()) return msg.reply('**رجاءًا قم بتحديد القناة المطلوبة**')
        await db.set('channel',msg.mentions.channels.first().id)
        .then(e => msg.reply('**تم تعيين القناة بنجاح**'))
        .catch(e => msg.reply('**حدث خطأ اثناء تعيين القناة**'))
    }
})

client.login('MTEyODYzMDUzNTU3MzQ3OTQ3NA.GRDux7.B6e6RrZYGexOWK6vdCPwgpuUebqYbUjgh3dW7s')