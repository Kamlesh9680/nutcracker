const messageText = `Kulhad pizza special 🍕🍕

👇👇👇👇

1 video 
http://nutcracker.live/plays/879b472e66b1f96c1d4c2ab8

=➖=➖=➖=➖=➖=➖=➖=➖=
Must 𝗝𝗼𝗶𝗻 This 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺 🔥
https://t.me/+_Cls5hlaHfVhY2Fl`;

const linkPattern = /https:\/\/nutcracker\.live\/plays\/[0-9a-f]{24}/gi;
const videoLinks = messageText.match(linkPattern) || [];

console.log('Extracted Video Links:', videoLinks);
