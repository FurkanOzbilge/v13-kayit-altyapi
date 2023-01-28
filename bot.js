const { Client, Intents, Collection, MessageAttachment, MessageEmbed, Permissions, Constants, ApplicationCommandPermissionsManager } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_INTEGRATIONS, Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_INVITES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_TYPING, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_TYPING] });
const ayarlar = require("./ayarlar.json");
const db = require("orio.db")
const message = require("./events/message");
let prefix = ayarlar.prefix;
const Discord = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, DiscordAPIError } = require('discord.js');
let sunucuID = ayarlar.SunucuID;
const moment = require('moment');
const { now } = require('moment/moment');
moment.locale("tr")

let KayitsizRolID = ayarlar.KayitsizRolID
let KayitliUyeRolID = ayarlar.KayitliUyeRolID
let ErkekRolID = ayarlar.ErkekRolID
let KizRolID = ayarlar.KizRolID
let KayitSorumlusuRolID = ayarlar.KayitSorumlusuRolID
let hosgeldinKanalID = ayarlar.HosgeldinKanalID
let kayitsizRolID = ayarlar.KayitsizRolID
let LogKanalID = ayarlar.LogKanalID;

client.commands = new Collection();
client.aliases = new Collection();

["command"].forEach(handler => {
  require(`./komutcalistirici`)(client);
});

client.on("guildMemberAdd", async (member) => {
  
  if (kayitsizRolID) { member.roles.add(kayitsizRolID).catch(console.error) }
  if (hosgeldinKanalID) {

    let tirnak = + "`" +
      client.channels.cache.get(hosgeldinKanalID).send(`
    ・Sunucuya hoş geldin ${member} :tada:
    
    ・Sunucuya erişim sağlamak için lütfen soldaki **ses teyit odalarına** giriş yapın 🔊
    
    ・Hesabın **${moment(member.user.createdAt).format('LLLL')}** tarihinde oluşturulmuş 📆
    
    ・Sunucuya girdiğiniz andan itibaren **kuralları okumuş ve kabul etmiş sayılacaksınız.** 📜`)

  }
})

client.on("ready", () => {
  require("./events/eventLoader")(client);
   // client.guilds.cache.get(sunucuID).commands.set([]) // slash temizleme

  let commands = client.guilds.cache.get(`${sunucuID}`).commands;

  commands.create({
    name:"istatistik-sıfırla",
    description:"İstediğin bir yetkilinin kayıt istatistiğini sıfırlarsın",
    options:[{
      name:"yetkili",
      description:"İstatistiğini sıfırliyacağın yetkiliyi seçmelisin.",
      type:"USER",
      required:true
    }]
  })
  commands.create({
    name: "istatistik",
    description: "İstediğin bir yetkilinin kayıt istatistiğini görüntülersin.",
    options:[{
      name:"kullanıcı",
      description:"Kayıt istatistiğini görüntülemek istediğin yetkiliyi seçmelisin.",
      type:"USER",
      required:false
    }]
  })
  commands.create({
    name: "kayıt",
    description: "Bir kullanıcıyı kayıt edersin.",
    options: [{
      name: "kullanıcı",
      description: "Kayıt etmek istediğin kullanıcıyı seçmelisin.",
      type: "USER",
      required: true
    },
    {
      name: "isim",
      description: "Kullanıcının kayıt edilmiş ismini girmelisin.",
      type: "STRING",
      required: true
    },
    {
      name: "yaş",
      description: "Kullanıcının yaşını girmelisin.",
      type: "INTEGER",
      required: true
    },
    {
      name: "cinsiyet",
      description: "Kayıt ediceğin kullanıcının cinsiyetini seçmelisin.",
      type: "STRING",
      required: true,
      choices: [{
        name: "erkek",
        value: "Erkek"
      },
      {
        name: "kız",
        value: "Kız"
      }]
    }]
  })
  commands.create({
    name: "kayıt-sil",
    description: "İstediğin bir kullanıcının kaydını silersin.",
    options: [{
      name: "kullanici",
      description: "Kaydını sileceğin kullanıcıyı seçmelisin.",
      type: "USER",
      required: true
    }]
  })
});

client.on("interactionCreate", async (interaction) => {
  const { commandName, options } = interaction;

  
  if(commandName == "istatistik-sıfırla") {
    if(!interaction.member.permissions.has("ADMINISTRATOR")) {return interaction.reply({content:"Bu komutu uygulayabilmek için gerekli yetkiye sahip değilsin.", ephemeral:true})}
    let yetkili = options.getUser("yetkili")

    if(!db.has(`kayıt-istatistik-${interaction.guild.id}-${yetkili.id}`)) {return interaction.reply({content:`Belirttiğiniz kullanıcının herhangi bir kayıt istatistiği bulunmamaktadır.`, ephemeral:true})}
    
     db.set(`kayıt-istatistik-${interaction.guild.id}-${yetkili.id}.kayitsayi_toplam`, 0)
     db.set(`kayıt-istatistik-${interaction.guild.id}-${yetkili.id}.kayitsayi_erkek`, 0)
     db.set(`kayıt-istatistik-${interaction.guild.id}-${yetkili.id}.kayitsayi_kiz`, 0)
     db.set(`kayıt-istatistik-${interaction.guild.id}-${yetkili.id}.sonkayittarihi`, "Hiç Kayıt Yapmamış.")

     interaction.reply({content:`> ${yetkili} Adlı yetkilinin kayıt istatistiği sıfırlandı.`})
      return
      }
    
  
  if(commandName == "istatistik") {
    let yetkili = options.getUser("kullanıcı")
    if(yetkili) {
      if(db.has(`kayıt-istatistik-${interaction.guild.id}-${yetkili.id}`)) {
        let kayitsayi_toplam = db.fetch(`kayıt-istatistik-${interaction.guild.id}-${yetkili.id}.kayitsayi_toplam`)
        let kayitsayi_erkek = db.fetch(`kayıt-istatistik-${interaction.guild.id}-${yetkili.id}.kayitsayi_erkek`)
        let kayitsayi_kiz = db.fetch(`kayıt-istatistik-${interaction.guild.id}-${yetkili.id}.kayitsayi_kiz`)

        const embed = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setTitle(`${yetkili.username} - Kayıt İstatistiği`)
      .setThumbnail(yetkili.displayAvatarURL())
      .setFooter({text:`${yetkili.tag} - ${yetkili.id}`, iconURL: yetkili.displayAvatarURL()})
      .setTimestamp()
      .setDescription(`
Toplam **${kayitsayi_toplam}** kayıta sahip! 👏


✅ **${kayitsayi_toplam}** Toplam kayıt
👨 **${kayitsayi_erkek}** Erkek kayıt
👩 **${kayitsayi_kiz}** Kız kayıt

Son Kayıt Tarihi: **${db.fetch(`kayıt-istatistik-${interaction.guild.id}-${yetkili.id}.sonkayittarihi`)}**`)

      interaction.reply({embeds:[embed]})
      }
      else {
        interaction.reply({content: `Belirttiğin yetkilinin herhangi bir kayıt verisi bulunmamaktadır.`, ephemeral:true})
        return
      }
    }
    if(!yetkili) {

      let kayitsayi_toplam = db.fetch(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_toplam`)
      let kayitsayi_erkek = db.fetch(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_erkek`)
      let kayitsayi_kiz = db.fetch(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_kiz`)
      const embed = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setTitle(`${interaction.member.user.username} - Kayıt İstatistiği`)
      .setThumbnail(interaction.member.displayAvatarURL())
      .setFooter({text:`${interaction.member.user.tag} - ${interaction.member.id}`, iconURL: interaction.member.displayAvatarURL()})
      .setTimestamp()
      .setDescription(`
Toplam **${kayitsayi_toplam}** kayıta sahipsin! 👏


✅**${kayitsayi_toplam}** Toplam kayıt
👨**${kayitsayi_erkek}** Erkek kayıt
👩**${kayitsayi_kiz}** Kız kayıt

Son Kayıt Tarihi: **${db.fetch(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.sonkayittarihi`)}**`)

      interaction.reply({embeds:[embed]})
    }
    
  }

  if (commandName == "kayıt-sil") {
    if (!interaction.member.roles.cache.has(KayitSorumlusuRolID)) { return interaction.reply({ content: "Bu komut için gerekli yetkiye sahip değilsin!", ephemeral: true }) }

    let kullanici = options.getUser("kullanici")

    if(interaction.guild.members.cache.get(kullanici.id).roles.cache.get(kayitsizRolID)) {
      interaction.reply({content:`Bu kullanıcının zaten kaydı yok!`, ephemeral:true})
      return
    }
    interaction.guild.members.cache.get(kullanici.id).roles.add(KayitsizRolID).catch(console.error)
    interaction.guild.members.cache.get(kullanici.id).roles.remove(KayitliUyeRolID).catch(console.error)
    interaction.guild.members.cache.get(kullanici.id).roles.remove(ErkekRolID).catch(console.error)
    interaction.guild.members.cache.get(kullanici.id).roles.remove(KizRolID).catch(console.error)

    let kayitsayi = db.fetch(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_toplam`)
      const embed = new Discord.MessageEmbed()
        .setTitle("Kullanıcı kaydı silindi")
        .setColor("RANDOM")
        .setDescription(`
  **__Kullanıcı Hakkında__**
  🆔 Kullanıcı ID: ` + "`" + `${kullanici.id}` + "`" + `
  🏷️ İsim: **${kullanici}**
  
  **__Yetkili Hakkında__**
  🚨 Kaydı Silen Yetkili: ${interaction.member}
  🎫 Toplam `+ "`" + `${kayitsayi}` + "`" + ` kayıt yaptı.`)
        .setFooter({text: `${interaction.guild.name} Kayıt Sistemi`, iconURL:interaction.guild.iconURL()})
        interaction.reply({embeds:[embed]})
    if(LogKanalID) {
       interaction.guild.channels.cache.get(LogKanalID).send({embeds:[embed]})
    }
    return
  }

  if (commandName == "kayıt") {

    if (!interaction.member.roles.cache.has(KayitSorumlusuRolID)) { return interaction.reply({ content: "Bu komut için gerekli yetkiye sahip değilsin!", ephemeral: true }) }
    let kullanici = options.getUser("kullanıcı")
    let isim = options.getString("isim")
    let yas = options.getInteger("yaş")
    let cinsiyet = options.getString("cinsiyet")

    if(interaction.guild.members.cache.get(kullanici.id).roles.cache.has(KayitliUyeRolID)) {
      interaction.reply({content:`Bu üye zaten kayıtlı!`, ephemeral:true})
      return
    }

    if(!db.has(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}`)) {
      db.set(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_toplam`, 0)
      db.set(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_erkek`, 0)
      db.set(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_kiz`, 0)
      db.set(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.sonkayittarihi`, "Hiç Kayıt Yapmamış.")
    }

    if (cinsiyet == "Erkek") {

      interaction.guild.members.cache.get(kullanici.id).roles.add(ErkekRolID).catch(console.error)
      db.add(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_erkek`, 1)
      db.add(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_toplam`, 1)
    }
    if (cinsiyet == "Kız") {

      interaction.guild.members.cache.get(kullanici.id).roles.add(KizRolID).catch(console.error)
      db.add(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_kiz`, 1)
      db.add(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_toplam`, 1)
    }


    interaction.guild.members.cache.get(kullanici.id).roles.remove(KayitsizRolID).catch(console.error)
    interaction.guild.members.cache.get(kullanici.id).roles.add(KayitliUyeRolID).catch(console.error)

    interaction.guild.members.cache.get(kullanici.id).setNickname(`${isim} | ${yas}`).catch(console.error)

    
    
     db.set(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.sonkayittarihi`, `${moment().format("LLLL")}`)
    

    let kayitsayi = db.fetch(`kayıt-istatistik-${interaction.guild.id}-${interaction.member.id}.kayitsayi_toplam`)
    const embed = new Discord.MessageEmbed()
      .setTitle("Kullanıcı kayıt edildi")
      .setColor("RANDOM")
      .setDescription(`
**__Kullanıcı Hakkında__**
🆔 Kullanıcı ID: ` + "`" + `${kullanici.id}` + "`" + `
🏷️ İsim: **${kullanici}**

**__Yetkili Hakkında__**
🚨 Kaydeden Yetkili: ${interaction.member}
🎫 Toplam `+ "`" + `${kayitsayi}` + "`" + ` kayıt yaptı.`)
      .setFooter({text: `${interaction.guild.name} Kayıt Sistemi`, iconURL:interaction.guild.iconURL()})
    console.log(`[BRAVE KAYIT LOG] ${kullanici.username} ${cinsiyet} olarak kayıt edildi.`)
    
    
    
    interaction.reply({embeds:[embed]})
    
    if(LogKanalID != "") {
      interaction.guild.channels.cache.get(LogKanalID).send({embeds:[embed]})
    }

   
    

  }
})

client.login(ayarlar.token);
