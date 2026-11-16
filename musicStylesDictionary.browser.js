// musicStylesDictionary.js
// Dictionnaire d'Authenticité Culturelle & Signatures Sonores pour le Moteur Audio IA Nzembo
// Optimisé pour les tags de style et les métatags de structure narrative musicale selon le genre

var MUSIC_STYLES_DICTIONARY = {
  "rumba_congolaise": {
    name: "Rumba congolaise",
    bpm: "92-98 BPM",
    mandatoryTags: "congolese rumba, soukous sebene, intricate acoustic guitar, sensual rhythm, congas, warm bassline, african melodic harmony",
    forbiddenTags: "No heavy electronic synths, no amapiano log drums, no trap 808s",
    vocalStyle: "sensual romantic melodic vocals, rich harmonies, expressive sebene cheers",
    sunoStylePrompt: "Congolese rumba, intricate sebene guitar, warm bass, congas, sensual vocal harmonies, romantic African groove",
    structureType: "rumba",
    buildLyrics: function({ recipient, relationship, occasionName, userMessage, keywords, primaryLang, secondaryLang, isDuo }) {
      if (typeof window !== 'undefined' && typeof window.generatePlaceholderLyrics === 'function') {
        return window.generatePlaceholderLyrics(occasionName, 'rumba_congolaise', recipient, userMessage, primaryLang, relationship, secondaryLang, keywords);
      }
      const v1Tag = isDuo ? '[Verse 1 | Introductif - Voix Féminine Douce]' : '[Verse 1 | Ambiance Romantique Douce]';
      const refTag = isDuo ? '[Chorus | Refrain Harmonique Polyphonique]' : '[Chorus | Refrain Poétique et Mélodieux]';
      const v2Tag = isDuo ? '[Verse 2 | Voix Masculine Chaleureuse]' : '[Verse 2 | Narration et Compliments]';
      const sebeneTag = '[Bridge | Sebene - Accélération Guitare Solo Congolaise, Animation & Atalaku]';
      const outroTag = '[Outro | Clameur Finale, Dédicaces & Fondu Mélodique]';

      return `${v1Tag}
Moto pamba te akoki kokabola biso, bolingo eza ya solo,
Lelo mokolo oyo ya monene, mitema na biso etondi na esengo mpo na ${recipient}.
${userMessage}
Tala ndenge mokili mobimba ezali kokumisa yo lelo !

${refTag}
${occasionName} kitoko mpo na yo ${recipient} bolingo na biso !
Ngolu, boboto mpe kimia ezala na yo mikolo nionso,
Tozali koyembela yo nzembo ya esengo mpe ya bolingo ya seko !

${v2Tag}
Mersi mpo na bondeko, mpo na motema malamu opesaka biso mikolo nionso,
${keywords ? 'Makanisi ya motema : ' + keywords + '.\n' : ''}Tika nzambe apambola yo, nzela na yo etonda na kongenga,
Nzembo oyo ebatama na motema na yo libela na libela !

${sebeneTag}
Awa sikoyo sebene ekoti ! Guitare solo ya Fally na Koffi !
Bana mboka binela ${recipient} ! Tala makolo ndenge ezali kobina !
Savonner, bima na piste, sekele ya esengo eza lelo !

${outroTag}
Esengo ya seko, mpo na yo ${recipient} ! Bolingo ya libela !`;
    }
  },

  "afrobeat": {
    name: "Afrobeat",
    bpm: "108-115 BPM",
    mandatoryTags: "afrobeat, west african groove, fela kuti brass section, rhythmic electric guitar, energetic congas, groovy drums",
    forbiddenTags: "No slow ambient pads, no country instruments",
    vocalStyle: "rhythmic groovy vocals, call and response chorus, energetic dynamic delivery",
    sunoStylePrompt: "Afrobeat, vibrant brass section, syncopated guitars, energetic polyrhythms, call and response chorus",
    structureType: "afrobeat",
    buildLyrics: function({ recipient, relationship, occasionName, userMessage, keywords, primaryLang, secondaryLang, isDuo }) {
      return `[Intro | Afrobeat Horns & Percussion Groove]
Yeah! Listen to the sound! Today we celebrate our superstar ${recipient}!

[Verse 1 | Groovy Rhythmic Flow]
From the morning light till the sun goes down,
Good vibes and heavy horns taking over the town!
${userMessage}
Everybody make way, we dey celebrate ${recipient} today!

[Pre-Chorus | Build-up Brass]
Can you feel the energy rising high?
Put your hands up reaching for the sky!

[Chorus | Call & Response Choral Hook]
Call: Everybody sing for ${recipient}!
Response: Yeah! Na our person, celebrate!
Call: Make joy, peace and blessings rain down!
Response: Na so we see am, blessings all around!

[Verse 2 | Dancefloor Pulse]
${keywords ? 'Big words from the heart: ' + keywords + '.\n' : ''}No bad vibes allowed, only happiness and greatness,
Thank you for your love, your energy is boundless!

[Outro | Horns Climax & Fela Style Groove]
Keep moving, keep shining, forever blessed ${recipient}!`;
    }
  },

  "amapiano": {
    name: "Amapiano",
    bpm: "112 BPM",
    mandatoryTags: "amapiano, deep log drum, south african house, warm sliding bass, jazz piano chords, gentle shakers",
    forbiddenTags: "No aggressive distortion, no rock guitar",
    vocalStyle: "smooth airy soulful vocals, ethereal harmonies, chill spoken vibe",
    sunoStylePrompt: "Amapiano, deep log drums, lush jazz piano keys, rolling percussion, soulful airy vocals",
    structureType: "amapiano",
    buildLyrics: function({ recipient, relationship, occasionName, userMessage, keywords, primaryLang, secondaryLang, isDuo }) {
      return `[Intro | Soft Ambient Keys & Gentle Shakers]
Yanos sound... Smooth feelings... For you, ${recipient}...

[Verse 1 | Soulful Spoken Melody]
L'ambiance est feutrée, les regards s'illuminent sous les étoiles,
Une mélodie chaleureuse pour célébrer ton histoire et lever le voile.
${userMessage}

[Pre-Chorus | Filter Sweep & Bass Rise]
Le tempo s'installe, la basse commence à glisser...
Écoute le souffle de notre amour partagé...

[Drop | Heavy Sliding Log Drums & Piano Chords]
[Chorus | Ethereal Airy Vocals]
Esengo, amani, bonheur pour ${recipient},
Dansons doucement au rythme du log drum,
Que chaque instant résonne comme un doux rêve !

[Verse 2 | Whispered Soulful Harmony]
${keywords ? 'Souvenirs précieux : ' + keywords + '.\n' : ''}Merci pour ta présence bienveillante et ta sagesse,
Chaque pas à tes côtés est une richesse.

[Outro | Fading Log Drum & Rhodes Keys]
Amapiano vibes... Peace, love and grace to you ${recipient}...`;
    }
  },

  "ndombolo": {
    name: "Ndombolo",
    bpm: "128 BPM",
    mandatoryTags: "ndombolo, fast congolese soukous, rapid sebene electric guitar, high energy dance drums, heavy bass groove",
    forbiddenTags: "No slow tempo, no acoustic folk instruments",
    vocalStyle: "high energy festive vocals, atalaku dance animation, rapid hype shouts",
    sunoStylePrompt: "Ndombolo, high-speed Congolese sebene guitar, energetic dance percussion, festive atalaku animations",
    structureType: "ndombolo",
    buildLyrics: function({ recipient, relationship, occasionName, userMessage, keywords, primaryLang, secondaryLang, isDuo }) {
      return `[Intro | Fast Hi-Hats & Kick Drum Build]
Alerte générale ! Tout le monde debout pour ${recipient} !

[Verse 1 | Fast Paced Chant]
Mokolo ya lelo eza mokolo ya fête monene,
Tozali awa mpo na kopesa yo lokumu na nkembo !
${userMessage}

[Chorus | High Energy Hook]
Bina ndombolo mpo na ${recipient} !
Kitisa, mata, sepelela lelo !
Esengo na motema, bolingo ya libela !

[Sebene 1 | Fast Sebene Guitar Solo]
Tala guitare ndenge ezali kolela !
Atalaku : Tokos ! Fimbu chicotte ! Bima libanda !

[Verse 2 | Rapid Animation]
${keywords ? keywords + ' ! ' : ''}Bana mboka banso bayei kokumisa ${recipient} !
Nzambe apambola yo, nzela na yo efungwama !

[Outro | Explosive Dance Finish]
Esengo eleki ! Bravo ${recipient} !`;
    }
  },

  "coupe_decale": {
    name: "Coupe-Décalé",
    bpm: "130 BPM",
    mandatoryTags: "coupe-decale, ivorian street party, electronic dance synths, heavy upbeat drums, club bass",
    forbiddenTags: "No classical piano, no slow jazz chords",
    vocalStyle: "hype festive vocal delivery, street shout-outs, energetic club vibe",
    sunoStylePrompt: "Coupé-Décalé, bouncy dance beats, upbeat electronic synths, festive party vocal chants",
    structureType: "coupe_decale",
    buildLyrics: function({ recipient, relationship, occasionName, userMessage, keywords, primaryLang, secondaryLang, isDuo }) {
      return `[Intro | Club Horns & Bouncy Beat]
C'est le moment du show ! En direct d'Abidjan pour ${recipient} !

[Verse 1 | Concept & Dédicaces]
Positionnez-vous, l'ambiance commence fort !
On est venus pour gâter le coin en l'honneur de ${recipient} !
${userMessage}

[Chorus | Catchy Party Hook]
Décalé, coupé, célébrons ${recipient} !
Félicitations, joie et succès illimité !
Mettez le respect, la star est parmi nous !

[Dance Break | Heavy Synths & Percussion Drop]
Kpangor ! Atalaku clubbing ! On monte le son !

[Verse 2 | Street Hype]
${keywords ? 'Dédicace spéciale : ' + keywords + '.\n' : ''}La bénédiction et la prospérité sont déjà activées !

[Outro | Celebration Cheers]
C'est gâté pour ${recipient} ! Merci la famille !`;
    }
  },

  "rb_soul": {
    name: "R&B / Soul",
    bpm: "85 BPM",
    mandatoryTags: "contemporary r&b, soul, rhodes electric piano, lush vocal harmonies, smooth bassline, slow jam drums",
    forbiddenTags: "No fast club beats, no log drums",
    vocalStyle: "rich emotional vocal runs, sensual falsetto, smooth vibrato, deep soulful expression",
    sunoStylePrompt: "Contemporary R&B soul, warm Rhodes piano, lush backing harmonies, smooth melodic groove",
    structureType: "rb_soul",
    buildLyrics: function({ recipient, relationship, occasionName, userMessage, keywords, primaryLang, secondaryLang, isDuo }) {
      return `[Intro | Warm Rhodes Electric Piano & Vocal Ad-libs]
Ooh yeah... Dedicated to the one and only ${recipient}...

[Verse 1 | Smooth Melodic Storytelling]
Quand la nuit s'installe et que le calme reprend sa place,
C'est la lumière de ton sourire qui doucement m'embrasse.
${userMessage}
Aujourd'hui, chaque seconde t'est consacrée.

[Pre-Chorus | Rising Falsetto & Lush Backing Vocals]
Can you hear the rhythm of my heart?
From the very moment we start...

[Chorus | Emotional Vocal Climax]
This song is for you, ${recipient}, my cherished one,
May your life be blessed like the morning sun.
Through every storm and every sunny sky,
Our bond will always stay up high !

[Verse 2 | Intimate Soulful Cadence]
${keywords ? 'Words written in gold: ' + keywords + '.\n' : ''}Thank you for your honesty, your tender touch and grace,
No one in this world could ever take your place.

[Bridge | Vocal Runs & Modulation]
Higher and higher, let our harmonies elevate your soul !

[Outro | Gentle Piano Fade & Whispered Harmonies]
Forever grateful, forever by your side... ${recipient}...`;
    }
  },

  "acoustique_soul": {
    name: "Acoustique / Soul",
    bpm: "88 BPM",
    mandatoryTags: "acoustic soul, intimate fingerpicked acoustic guitar, warm upright bass, gentle percussion, organic feel",
    forbiddenTags: "No heavy synthesizers, no club drops",
    vocalStyle: "intimate close-mic vocals, textured, warm, heartfelt and expressive",
    sunoStylePrompt: "Acoustic soul, warm fingerpicking acoustic guitar, gentle organic percussion, intimate heartfelt vocals",
    structureType: "acoustique_soul",
    buildLyrics: function({ recipient, relationship, occasionName, userMessage, keywords, primaryLang, secondaryLang, isDuo }) {
      return `[Intro | Delicate Acoustic Guitar Fingerpicking]

[Verse 1 | Raw Intimate Vocal]
Quelques notes simples sur des cordes de bois,
Une voix sincère qui ne s'élève que pour toi.
${userMessage}
Ce jour t'appartient, ${recipient}.

[Chorus | Heartfelt Melodic Chorus]
Que la paix accompagne chacun de tes pas,
Que la joie demeure et ne s'éteigne pas.
Un hommage épuré, tissé d'amour et de vérité,
Pour célébrer ton être en toute simplicité.

[Verse 2 | Warm Upright Bass & Soft Congas]
${keywords ? keywords + ' - ' : ''}Les moments précieux ne demandent pas de grands discours,
Seulement la fidélité et la chaleur d'un vrai amour.

[Outro | Gentle Acoustic Guitar Harmonics]
De tout cœur, pour toi ${recipient}...`;
    }
  },

  "gospel_urbain": {
    name: "Gospel Urbain",
    bpm: "98 BPM",
    mandatoryTags: "urban gospel, powerful choir backing vocals, hammond organ, uplifting modern beat, piano chords",
    forbiddenTags: "No dark trap beats, no aggressive club synths",
    vocalStyle: "powerful passionate lead vocals, massive harmonic choir, soaring emotional delivery",
    sunoStylePrompt: "Urban gospel, soaring choral harmonies, Hammond organ, uplifting melodic groove, passionate vocals",
    structureType: "gospel",
    buildLyrics: function({ recipient, relationship, occasionName, userMessage, keywords, primaryLang, secondaryLang, isDuo }) {
      return `[Intro | Hammond Organ & Piano Preludium]
Alléluia ! Aujourd'hui nous élevons nos voix d'un seul cœur pour ${recipient} !

[Verse 1 | Lead Vocals & Soft Choral Harmonies]
La grâce infinie et la faveur divine reposent sur ta vie,
En ce jour béni, les anges et les cœurs sont réunis.
${userMessage}

[Pre-Chorus | Choir Crescendo]
Prépare ton cœur à recevoir l'abondance,
Dieu renouvelle ta force et ton espérance !

[Chorus | Powerful Mass Choir Explosion]
Béni(e) sois-tu, ${recipient}, au nom du Très-Haut !
Que la paix et la gloire comblent tes journées,
La joie du Seigneur est ta force pour toujours !

[Verse 2 | Testimonial & Declarations]
${keywords ? 'Paroles de foi : ' + keywords + '.\n' : ''}Merci pour ta fidélité, ton humilité et ton cœur généreux,
Tu es une bénédiction pour nous tous sous les cieux.

[Bridge | Full Climax & Modulating Choral Chants]
Victoire ! Élévation ! Bénédictions infinies !

[Outro | Soaring Vocal Ad-lib & Organ Chords]
Amen ! Que la grâce t'accompagne toujours, ${recipient} !`;
    }
  },

  "makossa": {
    name: "Makossa",
    bpm: "115 BPM",
    mandatoryTags: "makossa, cameroonian groove, slap bassline, bright brass horns, funky rhythmic guitar",
    forbiddenTags: "No trap beats, no autotune mumble",
    vocalStyle: "joyful rhythmic singing, energetic festive cadence, melodious chorus",
    sunoStylePrompt: "Makossa, punchy slap bass, bright brass section, festive Cameroonian rhythm, catchy melodic vocals",
    structureType: "afrobeat"
  },
  "bikutsi": {
    name: "Bikutsi",
    bpm: "135 BPM",
    mandatoryTags: "bikutsi, 6/8 polyrhythm, fast muted electric guitar, heavy traditional balafon, driving percussion",
    forbiddenTags: "No slow ambient chords, no smooth 4/4 beats",
    vocalStyle: "intense energetic vocals, rapid cadence, raw festive strength",
    sunoStylePrompt: "Bikutsi, driving 6/8 polyrhythms, rapid damp guitar lines, traditional balafon, energetic African chants",
    structureType: "ndombolo"
  },
  "reggae_dancehall": {
    name: "Reggae / Dancehall",
    bpm: "96 BPM",
    mandatoryTags: "dancehall reggae, deep sub bass, offbeat skank guitar, energetic tropical riddim, rimshot drums",
    forbiddenTags: "No classical orchestral instruments",
    vocalStyle: "melodic singjay style, dynamic toasting, uplifting conscious vibes",
    sunoStylePrompt: "Modern dancehall reggae, deep sub bassline, crisp offbeat guitar skank, energetic melodic vocals",
    structureType: "afrobeat"
  },
  "zouk_kizomba": {
    name: "Zouk / Kizomba",
    bpm: "92 BPM",
    mandatoryTags: "zouk kizomba, sensual slow rhythm, warm synth pads, gentle acoustic guitar, romantic tropical beat",
    forbiddenTags: "No fast aggressive drums, no rock elements",
    vocalStyle: "soft sensual whispering vocals, warm tropical harmonies, intimate romantic flow",
    sunoStylePrompt: "Sensual Zouk Kizomba, smooth romantic groove, warm synth chords, soft passionate vocal delivery",
    structureType: "rumba"
  },
  "afro_trap": {
    name: "Afro-Trap",
    bpm: "118 BPM",
    mandatoryTags: "afro-trap, punchy 808 bass, african melodic synths, bouncy trap hi-hats, energetic rhythm",
    forbiddenTags: "No slow folk guitars, no jazz piano",
    vocalStyle: "energetic rap flow mixed with melodic sung auto-tune hooks, hard-hitting rhythmic delivery",
    sunoStylePrompt: "Afro-trap, punchy 808 bass, bouncy African melodic synths, fast hi-hats, catchy melodic rap",
    structureType: "coupe_decale"
  },
  "pop_moderne": {
    name: "Pop Moderne",
    bpm: "116 BPM",
    mandatoryTags: "modern pop, infectious synth hooks, crisp acoustic guitar, clean radio production, driving dance pop beat",
    forbiddenTags: "No muddy lo-fi, no heavy metal guitars",
    vocalStyle: "catchy radio-ready vocals, polished harmonies, anthemic memorable chorus",
    sunoStylePrompt: "Modern dance pop, infectious radio-ready synths, uplifting acoustic rhythm, anthemic vocal hook",
    structureType: "afrobeat"
  },
  "hip_hop_rap": {
    name: "Hip-Hop / Rap",
    bpm: "90 BPM",
    mandatoryTags: "hip hop, boom bap drum groove, soul sample chops, deep bassline, crisp snare",
    forbiddenTags: "No fast trance synths, no acoustic country guitar",
    vocalStyle: "confident articulate rap flow, rhythmic cadence, punchy storytelling rhymes",
    sunoStylePrompt: "Classic hip-hop, soulful sample chops, punchy boom bap drums, deep bass, confident rhythmic flow",
    structureType: "afrobeat"
  },
  "trap_drill": {
    name: "Trap / Drill",
    bpm: "140 BPM",
    mandatoryTags: "drill trap, sliding 808 bass, dark minor piano melodies, skippy rapid hi-hats, aggressive drums",
    forbiddenTags: "No slow acoustic ballads, no joyful brass",
    vocalStyle: "dark rhythmic cadence, aggressive punchy flow, intense low-register delivery",
    sunoStylePrompt: "Dark trap drill, heavy sliding 808s, haunting piano loop, fast skippy hi-hats, intense rap delivery",
    structureType: "afrobeat"
  },
  "bongo_flava": {
    name: "Bongo Flava",
    bpm: "104 BPM",
    mandatoryTags: "bongo flava, east african tanzanian groove, sweet melodic electric guitar, afro-pop drums, smooth bass",
    forbiddenTags: "No heavy distortion, no fast techno synths",
    vocalStyle: "sweet emotional vocal delivery, romantic melodies, gentle expressive vibrato",
    sunoStylePrompt: "Bongo Flava, sweet Tanzanian afro-pop guitar, smooth rhythmic groove, sweet emotional vocal melodies",
    structureType: "rumba"
  },
  "jazz_blues": {
    name: "Jazz / Blues",
    bpm: "82 BPM",
    mandatoryTags: "jazz blues, smoky electric guitar, warm upright bass, acoustic piano, brushed drums, brass saxophone",
    forbiddenTags: "No electronic club drops, no auto-tune",
    vocalStyle: "soulful expressive singing, raspy blues phrasing, dynamic vocal warmth",
    sunoStylePrompt: "Smoky jazz blues, warm saxophone lead, acoustic grand piano, upright bass, brushed drums, soulful vocals",
    structureType: "acoustique_soul"
  },
  "lo_fi": {
    name: "Lo-Fi",
    bpm: "80 BPM",
    mandatoryTags: "lo-fi chillhop, vintage vinyl crackle, mellow rhodes keys, dusty relaxed boom bap drums, warm tape saturated bass",
    forbiddenTags: "No loud aggressive vocals, no EDM drops",
    vocalStyle: "laid-back soft vocals, cozy intimate whisper, relaxed nostalgic mood",
    sunoStylePrompt: "Lo-fi chillhop, dusty Rhodes piano chords, vinyl crackle, relaxed mellow drums, warm intimate nostalgic vibe",
    structureType: "amapiano"
  }
};

// Helper pour résoudre un style par ID, clé ou libellé
var getMusicStyleConfig = function(styleKeyOrLabel) {
  if (!styleKeyOrLabel) return MUSIC_STYLES_DICTIONARY["rumba_congolaise"];
  const key = String(styleKeyOrLabel).trim().toLowerCase();

  if (MUSIC_STYLES_DICTIONARY[key]) {
    return MUSIC_STYLES_DICTIONARY[key];
  }

  const aliasMap = {
    "rumba": "rumba_congolaise",
    "rumba congolaise": "rumba_congolaise",
    "rumba_congolaise": "rumba_congolaise",
    "ndombolo": "ndombolo",
    "afrobeat": "afrobeat",
    "coupe decale": "coupe_decale",
    "coupé-décalé": "coupe_decale",
    "coupe-decale": "coupe_decale",
    "coupe_decale": "coupe_decale",
    "amapiano": "amapiano",
    "rb": "rb_soul",
    "r&b": "rb_soul",
    "r&b / soul": "rb_soul",
    "rnb": "rb_soul",
    "acoustique": "acoustique_soul",
    "acoustique / soul": "acoustique_soul",
    "gospel": "gospel_urbain",
    "gospel urbain": "gospel_urbain",
    "makossa": "makossa",
    "bikutsi": "bikutsi",
    "reggae": "reggae_dancehall",
    "dancehall": "reggae_dancehall",
    "reggae / dancehall": "reggae_dancehall",
    "zouk": "zouk_kizomba",
    "kizomba": "zouk_kizomba",
    "zouk / kizomba": "zouk_kizomba",
    "afrotrap": "afro_trap",
    "afro-trap": "afro_trap",
    "rap & afro-trap": "afro_trap",
    "hip hop": "hip_hop_rap",
    "hip-hop": "hip_hop_rap",
    "hip-hop / rap": "hip_hop_rap",
    "trap": "trap_drill",
    "drill": "trap_drill",
    "trap / drill": "trap_drill",
    "bongo": "bongo_flava",
    "bongo flava": "bongo_flava",
    "jazz": "jazz_blues",
    "blues": "jazz_blues",
    "jazz / blues": "jazz_blues",
    "lofi": "lo_fi",
    "lo-fi": "lo_fi",
    "lo-fi hip-hop": "lo_fi",
    "pop": "pop_moderne",
    "pop moderne": "pop_moderne"
  };

  if (aliasMap[key] && MUSIC_STYLES_DICTIONARY[aliasMap[key]]) {
    return MUSIC_STYLES_DICTIONARY[aliasMap[key]];
  }

  for (const styleId in MUSIC_STYLES_DICTIONARY) {
    const s = MUSIC_STYLES_DICTIONARY[styleId];
    if (s.name.toLowerCase() === key || key.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(key)) {
      return s;
    }
  }

  return MUSIC_STYLES_DICTIONARY["rumba_congolaise"];
}

// Support pour environnement navigateur global (vanilla JS)
if (typeof window !== "undefined") {
  window.MUSIC_STYLES_DICTIONARY = MUSIC_STYLES_DICTIONARY;
  window.getMusicStyleConfig = getMusicStyleConfig;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { MUSIC_STYLES_DICTIONARY, getMusicStyleConfig };
}
