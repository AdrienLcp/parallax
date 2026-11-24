import { defineDictionary, defineTranslation } from '@adrienlcp/i18n'

export default defineDictionary({
  games: {
    sumo: { name: 'Sumo' }
  },
  home: {
    games: 'Jeux',
    open: 'Ouvrir la salle',
    title: 'Parallax'
  },
  legal: {
    host: {
      body: 'Le site est hébergé par :',
      heading: 'Hébergeur'
    },
    intro:
      'Qui édite ce site, ce qu’il conserve de vous, et comment le changer.',
    measurement: {
      body: 'Les visites sont comptées par un outil que j’ai construit, sans cookie. Une page vue enregistre l’adresse de la page, le site d’où vous venez, la langue et le thème de votre navigateur, et la largeur de sa fenêtre. Elle n’enregistre ni adresse IP, ni rien qui distingue un visiteur d’un autre.',
      counted: 'Vos visites sont comptées, anonymement.',
      exemption:
        'Cette mesure est dispensée de consentement selon les lignes directrices de la CNIL, et vous pouvez tout de même la refuser pour ce navigateur.',
      heading: 'Mesure d’audience',
      refused: 'Vos visites ne sont pas comptées dans ce navigateur.',
      refusedByBrowser:
        'Votre navigateur envoie le signal Global Privacy Control : vos visites ne sont jamais comptées.',
      retention: defineTranslation(
        'Chaque enregistrement est conservé {months:plural} au plus.',
        { plural: { months: { one: '{?} mois', other: '{?} mois' } } }
      ),
      saveFailed:
        'Votre navigateur n’a pas conservé ce choix. Réessayez, ou activez Global Privacy Control.',
      storageBlocked:
        'Ce navigateur bloque le stockage des sites : un refus ne peut pas y être conservé. Activer Global Privacy Control dans votre navigateur refuse la mesure sur tous les sites.',
      switch: 'Compter mes visites'
    },
    publisher: {
      address:
        'Éditeur non professionnel, je donne l’identité de l’hébergeur à la place d’une adresse postale (LCEN, article 6-III-2).',
      body: 'Ce site est édité par {name}, à titre de particulier et non de professionnel. Vous pouvez m’écrire depuis <contact>cette page de contact</contact>.',
      heading: 'Éditeur'
    },
    rights: {
      body: 'Le RGPD vous permet d’accéder à ce qui vous concerne, de le rectifier ou de l’effacer, et de vous opposer à son utilisation. Demandez-le depuis <contact>la page de contact</contact> ; je réponds sous un mois.',
      complaint:
        'Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la <authority>CNIL</authority>.',
      heading: 'Vos droits'
    },
    storage: {
      analyticsOptOut:
        'Votre refus de la mesure d’audience, si vous la désactivez plus bas.',
      device:
        'Ce site ne dépose aucun cookie. Ce qu’il retient reste dans votre navigateur, pour ce seul site, jusqu’à ce que vous l’effaciez :',
      heading: 'Ce que ce site conserve',
      server: 'Rien vous concernant n’est conservé sur un serveur.',
      theme: 'Le thème choisi, clair ou sombre.'
    },
    thirdParties: {
      body: 'Votre navigateur ne communique qu’avec ce site. Son hébergeur, Cloudflare, reçoit votre adresse IP à chaque requête, pour servir la page et protéger le site des abus.',
      heading: 'Qui d’autre reçoit vos données'
    },
    title: 'Mentions légales et confidentialité'
  },
  lobby: {
    fewest: '{fewest:number} joueurs minimum',
    name: 'Pseudo',
    ready: 'Prêt',
    readyCount: defineTranslation('{ready:plural} sur {present:number}', {
      plural: { ready: { one: '{?} prêt', other: '{?} prêts' } }
    })
  },
  play: {
    connecting: 'Connexion…',
    reconnecting: 'Reconnexion…',
    refused: {
      outdated: 'Page périmée',
      roomFull: 'Salle pleine',
      roomGone: 'Aucune salle ici',
      unexpected: 'Entrée refusée'
    },
    retry: 'Réessayer',
    room: 'Salle'
  },
  score: defineTranslation('{score:plural} sur {goal:number}', {
    plural: { score: { one: '{?} manche', other: '{?} manches' } }
  }),
  screen: {
    backToGames: {
      hold: 'Retour aux jeux (maintenir)',
      label: 'Jeux'
    },
    fullscreen: 'Plein écran',
    join: 'Scannez pour jouer',
    openFailed: 'La salle ne s’est pas ouverte.',
    players: '{fewest:number} à {most:number} joueurs',
    qr: 'QR code pour rejoindre la salle {code}',
    reconnecting: 'Reconnexion…',
    refused: 'La salle a refusé cet affichage.',
    replaced: 'Un autre affichage a pris la salle.',
    retry: 'Réessayer',
    roomCode: 'Code de la salle',
    seat: {
      absent: 'absent',
      free: 'Libre'
    },
    sound: 'Son',
    takeBack: 'Reprendre'
  },
  seat: {
    black: 'Noir',
    blue: 'Bleu',
    green: 'Vert',
    ivory: 'Ivoire',
    ochre: 'Ocre',
    red: 'Rouge'
  },
  shell: {
    footer: {
      credit: 'Réalisé par <author>{name}</author>',
      legal: 'Mentions légales et confidentialité',
      source: 'Code source'
    },
    skipLink: 'Aller au contenu'
  },
  sumo: {
    cue: {
      knockOut: 'Faites-les tomber dans la rigole',
      steer: 'Pilotez au pouce'
    },
    dash: 'Foncer',
    out: {
      pushedBy: 'par <seat>{name}</seat>',
      title: 'À la rigole'
    },
    standings: {
      ejected: '{seats:list} à la rigole',
      firstTo: defineTranslation('Premier à {rounds:plural}', {
        plural: { rounds: { one: '{?} manche', other: '{?} manches' } }
      }),
      inPlay: defineTranslation('{count:plural}', {
        plural: { count: { one: '{?} en lice', other: '{?} en lice' } }
      }),
      matchWon: '{seat} gagne la partie',
      round: 'Manche {number:number}',
      roundDrawn: 'Manche nulle',
      roundWon: '{seat} gagne la manche'
    },
    won: {
      match: 'Partie gagnée',
      round: 'Manche gagnée'
    }
  },
  tuning: {
    backdrop: 'Fond',
    backdrops: {
      custom: 'Couleur',
      felt: 'Feutre',
      grey: 'Gris',
      ivory: 'Ivoire',
      'lacquer-ink': 'Encre',
      slate: 'Ardoise',
      white: 'Blanc'
    },
    camera: 'Caméra',
    close: 'Fermer',
    download: 'Télécharger',
    drum: 'Tambour',
    fieldOfView: 'Champ',
    fill: 'Cadrage',
    header: 'En-tête',
    height: 'Hauteur',
    hud: 'Interface',
    light: 'Lumière',
    motion: 'Mouvement',
    orbit: 'Orbite',
    orbits: {
      always: 'Toujours',
      off: 'Non',
      waiting: 'Attente'
    },
    pitch: 'Inclinaison',
    qr: 'QR',
    reset: 'Réinitialiser',
    roster: 'Sièges',
    scene: 'Scène',
    shadow: 'Ombre',
    size: 'Taille',
    speed: 'Vitesse',
    sway: 'Balancement',
    title: 'Réglages',
    tops: 'Toupies'
  }
})
