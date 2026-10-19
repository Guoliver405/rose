import type { HilfeThemaText } from '@/lib/hilfe'

/**
 * Aide contextuelle — textes des thèmes (le « ? » sur chaque page). Français.
 * Structure, symboles de légende et cibles des liens identiques à
 * `de/help/topics.ts` ; seuls les textes sont traduits.
 */
export const topics = {
  uebersicht: {
    title: 'La vue d’ensemble des chambres',
    subtitle: 'Couleurs et symboles des tuiles, check-in et check-out, priorité, historique',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'La vue d’ensemble est l’écran de la réception. Elle montre toutes les chambres regroupées par étage, avec l’état de chacune en un coup d’œil. Un clic sur une chambre ouvre une fenêtre avec check-in, check-out, code PIN, feuille d’arrivée, date de départ, priorité et historique.',
          'Elle se met à jour d’elle-même dès qu’un client appuie sur un bouton, qu’un agent d’étage commence un ménage ou que quelqu’un modifie quelque chose sur un autre écran. Vous n’avez jamais besoin de recharger.',
        ],
      },
      {
        art: 'legende',
        titel: 'La barre au-dessus du numéro',
        hinweis: 'Si plusieurs états s’appliquent, celui qui figure le plus haut l’emporte.',
        eintraege: [
          { zeichen: { art: 'balken', id: 'priority' } },
          { zeichen: { art: 'balken', id: 'checkout' } },
          { zeichen: { art: 'balken', id: 'wanted' } },
          { zeichen: { art: 'balken', id: 'dnd' } },
          { zeichen: { art: 'balken', id: 'occupied' } },
          { zeichen: { art: 'balken', id: 'ready' } },
          { zeichen: { art: 'balken', id: 'deactivated' } },
        ],
      },
      {
        art: 'legende',
        titel: 'Les symboles sur la tuile',
        hinweis: 'Plusieurs symboles à la fois, c’est normal — par exemple occupée, ménage demandé et une demande ouverte. L’info-bulle de la tuile dit tout en toutes lettres.',
        eintraege: [
          { zeichen: { art: 'symbol', id: 'occupied' } },
          { zeichen: { art: 'symbol', id: 'departure' } },
          { zeichen: { art: 'symbol', id: 'dnd' } },
          { zeichen: { art: 'symbol', id: 'clean' } },
          { zeichen: { art: 'symbol', id: 'deferred' } },
          { zeichen: { art: 'symbol', id: 'declined' } },
          { zeichen: { art: 'symbol', id: 'routine' } },
          { zeichen: { art: 'symbol', id: 'checkout' } },
          { zeichen: { art: 'symbol', id: 'priority' } },
          { zeichen: { art: 'symbol', id: 'cleaning' } },
          { zeichen: { art: 'symbol', id: 'orders' } },
          { zeichen: { art: 'symbol', id: 'urgent' } },
          { zeichen: { art: 'symbol', id: 'deactivated' } },
        ],
      },
      {
        art: 'legende',
        titel: 'Bordure et en-tête d’étage',
        eintraege: [
          { zeichen: { art: 'ring', id: 'urgent' } },
          { zeichen: { art: 'ring', id: 'priority' } },
          {
            zeichen: { art: 'icon', id: 'users', ton: 'neutral' },
            label: 'Nom dans l’en-tête d’étage',
            text: 'Un agent d’étage s’est enregistré sur cet étage. Vous voyez où l’on travaille sans avoir à demander.',
          },
          {
            zeichen: { art: 'pille', text: '3', ton: 'attention' },
            label: 'Nombre sur « Demandes » dans la navigation',
            text: 'Autant de demandes sont ouvertes. Il clignote en rouge dès que l’une d’elles concerne un service urgent.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Pourquoi une chambre est-elle orange après le check-out au lieu de passer directement au vert ?',
            antwort: 'RoSe n’affiche que ce qui a réellement été signalé : le check-out dit « ménage à faire », et seule la fin du ménage par un agent d’étage — ou votre « Marquer le ménage comme fait » dans la fenêtre — dit « prête ». RoSe ne devine pas si quelqu’un est passé entre-temps.',
          },
          {
            frage: 'Je dois faire le check-in d’un client, mais la chambre n’est pas prête. Est-ce possible ?',
            antwort: 'Oui. La fenêtre vous avertit et vous laisse tout de même faire le check-in. Le même avertissement apparaît si un signalement est ouvert (par exemple un défaut signalé) — vous le savez au moins avant que le client ne soit dans la chambre.',
          },
          {
            frage: 'Où est le code PIN, et que dois-je dire au client ?',
            antwort: 'Après le check-in, le code PIN s’affiche en grand dans la fenêtre — il suffit de le lire au client, avec la feuille d’arrivée à imprimer ou à envoyer par e-mail. Si votre établissement utilise un accès personnel par séjour, il n’y a pas de code PIN : le client reçoit son propre QR code ou lien, qui expire au check-out.',
          },
          {
            frage: 'Dois-je saisir une date de départ au check-in ?',
            antwort: 'Non — la valeur par défaut est « ouvert », le check-in reste donc un seul clic. Si vous la saisissez, le ménage quotidien est suspendu le jour du départ et la tuile affiche la valise. Vous pouvez la compléter ou la prolonger à tout moment dans la fenêtre. Une date dépassée (hier) est considérée comme inconnue, pour qu’un oubli de mise à jour ne désactive pas durablement le ménage quotidien.',
          },
          {
            frage: 'Quand dois-je définir une priorité ?',
            antwort: 'Pour les réclamations et les cas particuliers, définissez une priorité manuellement ; elle n’est jamais définie automatiquement. La chambre remonte sur le tableau du ménage et l’étage est signalé par un voyant violet. La priorité disparaît d’elle-même quand le ménage est terminé.',
          },
          {
            frage: 'Que se passe-t-il exactement au check-out ?',
            antwort: 'Code PIN, lien et session du client cessent immédiatement de fonctionner, et la chambre passe à « ménage à faire ». Les demandes de service ouvertes de ce séjour sont clôturées comme « non effectuées » — cochez auparavant, dans le même encadré, ce qui a réellement été fourni. Les signalements (défauts) restent ouverts. Si le client a commandé quelque chose de payant, le total s’affiche dans la fenêtre avant votre confirmation.',
          },
          {
            frage: 'Où retrouver le récapitulatif plus tard ?',
            antwort: 'Dans l’historique de la chambre, l’entrée « Check-out » renvoie au récapitulatif. Ce n’est pas une facture : il ne contient ni nom du client, ni numéro de facture, ni détail de la TVA. Il indique le montant à encaisser.',
          },
          {
            frage: 'Que contient l’historique ?',
            antwort: 'Les 30 derniers jours de la chambre : actions du client (toujours simplement « Client », jamais une identité), ménages avec noms, check-in et check-out avec la personne à la réception, demandes de service. « Ménage non terminé (délai dépassé) » y figure aussi — l’historique est la trace du travail et l’outil en cas de réclamation.',
          },
          {
            frage: 'Pourquoi la tuile affiche-t-elle « Ménage à partir de 11:00 » sans apparaître sur le tableau ?',
            antwort: 'Le ménage devient possible à cette heure-là. Soit le client a choisi « pas avant » sur le portail, soit il a demandé à l’agent d’étage, à la porte, de repasser plus tard. L’historique de la chambre indique lequel. D’ici là, la chambre n’est disponible pour le ménage sur aucun des deux tableaux ; elle s’ouvre d’elle-même à l’heure indiquée. Jusqu’à quand les clients peuvent reporter sur le portail se règle sous Établissement et règles.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Demandes',
            hinweis: 'Ce qui se cache derrière la cloche et le nombre',
            ziel: { art: 'thema', id: 'anfragen' },
          },
          {
            label: 'Affiches et feuilles d’arrivée',
            hinweis: 'La feuille d’arrivée au check-in',
            ziel: { art: 'thema', id: 'aushang' },
          },
          {
            label: 'Ce que voit le client',
            hinweis: 'La simulation du portail client',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  anfragen: {
    title: 'Demandes',
    subtitle: 'Le tableau de la réception : ouvertes, effectuées, non effectuées — et ce que cela signifie pour le récapitulatif',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Les demandes du portail client arrivent ici, les plus anciennes en premier. Une demande est ouverte ou clôturée — il n’y a pas d’état « en cours » ni d’attribution à une personne ; le tableau est le même pour tout le monde à la réception.',
          'Les nouvelles demandes apparaissent d’elles-mêmes, sans recharger.',
        ],
      },
      {
        art: 'legende',
        titel: 'Symboles sur le tableau',
        eintraege: [
          {
            zeichen: { art: 'pille', text: 'urgent', ton: 'critical', icon: 'siren' },
            label: 'Urgent',
            text: 'Le service est marqué « urgent » dans le catalogue de services. La demande a une bordure rouge clignotante, la tuile de la chambre une cloche clignotante, et le nombre dans la navigation clignote.',
          },
          {
            zeichen: { art: 'pille', text: 'non effectuée', ton: 'outline' },
            label: 'Non effectuée',
            text: 'La demande était encore ouverte au check-out et a été clôturée sans que personne ne l’ait traitée. Elle reste visible et figure sans montant sur le récapitulatif — sinon disparaîtrait quelque chose dont le client pourrait encore parler.',
          },
          {
            zeichen: { art: 'pille', text: 'Effectuée', ton: 'positive', icon: 'check' },
            label: 'Effectuée',
            text: 'Le service a été fourni. Si la demande comporte un prix, elle figure sur le récapitulatif au check-out. L’heure et votre nom sont enregistrés.',
          },
          {
            zeichen: { art: 'symbol', id: 'orders' },
            text: 'Voici à quoi ressemble une demande ouverte sur la tuile de la chambre dans la vue d’ensemble.',
          },
          { zeichen: { art: 'symbol', id: 'urgent' } },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'J’ai appuyé sur « Effectuée » par erreur. Puis-je annuler ?',
            antwort: 'Non — il n’y a volontairement pas de retour en arrière ; la coche est un événement avec une heure et un nom. La demande figure alors avec son montant sur le récapitulatif ; réglez ce point avec le client au check-out.',
          },
          {
            frage: 'Pourquoi une demande a-t-elle disparu après le check-out ?',
            antwort: 'Elle n’a pas disparu : elle a été clôturée comme « non effectuée » et figure sous « Clôturées récemment ». Les demandes appartiennent au séjour, pas à la chambre — sinon le tableau montrerait demain une demande pour une chambre vide.',
          },
          {
            frage: 'Qu’est-ce qu’un « Signalement », et pourquoi reste-t-il ouvert ?',
            antwort: 'Une option du service dans le catalogue de services, prévue pour les défauts : ces demandes appartiennent à la chambre, pas au séjour. Elles survivent au check-out, ne figurent sur aucun récapitulatif (même avec un prix), et le check-in suivant avertit à leur sujet — un robinet cassé ne cesse pas d’exister parce que le client part.',
          },
          {
            frage: 'Puis-je attribuer une demande à quelqu’un de l’équipe ?',
            antwort: 'Non, volontairement. RoSe ne fait pas de planification du personnel ; quiconque est à la réception voit le même tableau. Qui traite une demande la coche — un tableau de réception n’a pas besoin de plus de coordination.',
          },
          {
            frage: 'Combien de temps les demandes clôturées restent-elles visibles ?',
            antwort: 'Les 20 demandes les plus récentes s’affichent repliées sous les demandes ouvertes. Au-delà, chaque demande reste consultable 30 jours dans l’historique de la chambre et, si elle comportait un prix, sur le récapitulatif du séjour.',
          },
          {
            frage: 'Le client dit avoir commandé, mais rien n’apparaît ici.',
            antwort: 'Vérifiez dans l’historique de la chambre si une demande est arrivée. Les causes les plus fréquentes : le client a annulé avant l’envoi, ou il a utilisé une tuile sous « Liens utiles », comme un service de livraison de repas — elle mène vers un site externe et ne crée pas de demande.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Catalogue de services',
            hinweis: 'Le catalogue : prix, « urgent », « Signalement »',
            ziel: { art: 'thema', id: 'services' },
          },
          {
            label: 'Vue d’ensemble des chambres',
            hinweis: 'Cocher aussi dans la fenêtre de la chambre',
            ziel: { art: 'thema', id: 'uebersicht' },
          },
        ],
      },
    ],
  },
  zimmer: {
    title: 'Chambres et étages',
    subtitle: 'Créer, corriger, mettre hors service, supprimer — et ce qui part avec à chaque fois',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Les chambres se créent étage par étage : numéros en liste (« 201, 202, 205 ») ou en plage (« 101-110 »), éventuellement précédés du numéro d’étage. Sous le formulaire, vous voyez à l’avance ce qui sera créé — rien n’est enregistré avant votre clic.',
          'Chambres, étages et bâtiments ouvrent la même fenêtre avec les trois mêmes options : modifier, mettre hors service, supprimer.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'À quoi sert le bâtiment ?',
            antwort: 'Uniquement aux établissements dotés d’ailes réellement séparées. Il agit sur l’unicité : les numéros de chambre doivent être uniques par bâtiment, « 101 » peut donc exister dans le bâtiment principal et dans l’annexe. Sans ailes, laissez le champ vide.',
          },
          {
            frage: 'Quand utiliser « Préfixer le numéro d’étage » ?',
            antwort: 'Quand chaque étage utilise la même plage de numéros : l’étage 2 et « 05 » donnent « 205 ». Sans cette case, les numéros entrent en conflit dès le deuxième étage — la page vous avertit à l’avance.',
          },
          {
            frage: 'Un numéro est faux. Supprimer et recréer ?',
            antwort: 'Non — modifiez-le. Numéro, étage et bâtiment se changent sans perdre l’historique, les séjours ni les traces de travail ; tout appartient à la chambre, pas à son numéro. La suppression est réservée aux chambres créées par erreur et sans historique.',
          },
          {
            frage: 'Hors service ou supprimer ?',
            antwort: 'Pour des travaux ou une fermeture temporaire, nous recommandons de mettre la chambre « Hors service » : aucun check-in n’y est possible, elle n’apparaît ni sur le tableau du ménage ni sur les affiches, et tout son historique est conservé. Un clic la remet en service, et le numéro de chambre reste réservé. Supprimer une chambre est définitif et libère le numéro.',
          },
          {
            frage: 'Qu’est-ce qui part avec la suppression ?',
            antwort: 'La fenêtre l’indique en chiffres à l’avance : séjours, demandes de service avec leur total, entrées d’historique, et les affiches de la chambre cessent de fonctionner. Les pointages du ménage subsistent et perdent seulement le lien avec la chambre — les statistiques restent complètes. Une chambre occupée ne peut pas être supprimée ; une zone avec historique exige de saisir son nom.',
          },
          {
            frage: 'Une chambre hors service compte-t-elle pour la facturation ?',
            antwort: 'Pour le mois en cours oui, si elle a été en service pendant ce mois, même brièvement ; à partir du premier mois complet hors service, non. Avant chaque suppression, le nombre de chambres des mois clos est figé — une chambre supprimée ne manque donc jamais rétroactivement dans une facture.',
          },
          {
            frage: 'Nouvelles chambres, mais pas d’affiche ?',
            antwort: 'Uniquement avec le QR code fixe par chambre : l’affiche est créée par chambre. Après avoir créé des chambres, ouvrez une fois les affiches de chambre (en bas de la page Accès clients) — le bouton qui s’y trouve crée d’un coup les codes manquants.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Affiches et feuilles d’arrivée',
            hinweis: 'Créer les codes des nouvelles chambres',
            ziel: { art: 'thema', id: 'aushang' },
          },
          {
            label: 'Offre et facturation',
            hinweis: 'Comment les chambres sont comptées',
            ziel: { art: 'thema', id: 'konto' },
          },
        ],
      },
    ],
  },
  regeln: {
    title: 'Établissement et règles',
    subtitle: 'Fuseau horaire, ménage quotidien, heure de check-out, report, plage horaire, code PIN, délai, adresse, logo, avis, devise',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Les règles s’appliquent à tout dès l’enregistrement. Les séjours en cours, les demandes déjà faites et les codes PIN déjà remis continuent sans changement — rien n’est converti rétroactivement.',
          'Rien n’est enregistré automatiquement. Dès qu’une modification est faite, une barre « Modifications non enregistrées » avec Enregistrer et Annuler apparaît en bas de l’écran — si vous quittez la page avant d’enregistrer, une confirmation vous est demandée.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Pourquoi le fuseau horaire est-il si important ?',
            antwort: 'Toutes les heures de cette page s’y rapportent. Avec un mauvais fuseau horaire, le ménage quotidien devient dû à la mauvaise heure, la plage horaire est décalée, « nettoyée aujourd’hui » se réinitialise la nuit à la mauvaise heure, et les limites de journée des statistiques sont fausses.',
          },
          {
            frage: 'Nettoyer chaque jour les chambres occupées — oui ou non ?',
            antwort: 'Désactivé par défaut : les chambres sont nettoyées à la demande du client et après le check-out. Cela économise eau, lessive et temps de travail, et fait partie de la promesse de durabilité. Activé, les chambres occupées apparaissent d’elles-mêmes sur le tableau à partir du lendemain de l’arrivée, à l’heure choisie — sauf avec « Ne pas déranger », « Pas de ménage aujourd’hui », le jour du départ, et si la chambre a déjà été nettoyée aujourd’hui. Si le client a lui-même fait une demande, c’est sa demande qui compte.',
          },
          {
            frage: 'À quoi sert « Check-out jusqu’à » ?',
            antwort: 'Tant que RoSe ne sait pas si le client part aujourd’hui, le ménage quotidien n’est pas dû avant cette heure. Ainsi, aucune chambre de départ n’est nettoyée avant le check-out puis une seconde fois. Si une date de départ est saisie pour le séjour, l’heure normale s’applique les jours précédents, et le ménage quotidien est suspendu le jour du départ. La feuille d’arrivée indique l’heure qui s’applique sans date de départ.',
          },
          {
            frage: 'À quoi sert « Check-in à partir de » ?',
            antwort: 'Les chambres de départ doivent être prêtes à cette heure-là. Le tableau du ménage compare le travail des départs ouverts au temps restant jusqu’au check-in et aux agents d’étage en service. Plus c’est serré, plus il recommande les étages avec des départs, et il propose même de changer d’étage en cours de route. Une priorité définie par la réception passe toujours en premier.',
          },
          {
            frage: '« Pas avant » — comment choisir la limite ?',
            antwort: 'Le client souhaite le ménage, mais pas avant une certaine heure. Il peut choisir des heures pleines entre maintenant et votre limite. Fixez-la de sorte que le ménage tombe encore dans le service : ménage jusqu’à 15:00 signifie une limite à 13:00. Vous pouvez aussi la désactiver — le portail ne propose alors aucune heure et la demande s’applique immédiatement.',
          },
          {
            frage: 'Pourquoi une plage horaire pour les demandes de ménage ?',
            antwort: 'En dehors de la plage, le client ne peut pas envoyer de demande et voit vos horaires de ménage. Cela ne concerne que la demande : « Ne pas déranger » et l’annulation restent possibles à tout moment, et les demandes déjà faites continuent. Une plage qui passe minuit (22:00–06:00) est correctement prise en compte.',
          },
          {
            frage: 'Que se passe-t-il si l’on oublie de terminer un ménage ?',
            antwort: 'Si un ménage commencé n’est pas terminé, la chambre se rouvre d’elle-même après le délai, et l’historique affiche « Ménage non terminé (délai dépassé, nom) ». Le délai doit être nettement supérieur au ménage réel le plus long — 90 minutes par défaut.',
          },
          {
            frage: 'Changer la longueur du code PIN — qu’advient-il des séjours en cours ?',
            antwort: 'Rien. La longueur ne s’applique qu’aux codes PIN nouvellement créés ; chaque séjour en cours garde le sien. Par défaut, six chiffres ; plus court est plus pratique, plus long plus sûr — en plus du blocage après cinq tentatives erronées.',
          },
          {
            frage: 'Notre établissement ne facture pas en euros — est-ce possible ?',
            antwort: 'Oui. Sous « Devise des prix des services », vous choisissez la devise dans laquelle vous saisissez les prix dans le catalogue de services ; clients, réception et récapitulatif de check-out l’affichent alors ainsi. Chaque demande retient sa devise, les anciennes demandes restent donc telles quelles. Les prix existants ne sont pas convertis lors du changement. Le changement n’est possible que si aucun client n’est enregistré.',
          },
          {
            frage: 'Où les clients voient-ils le lien vers les avis ?',
            antwort: 'À deux endroits : à partir du deuxième jour du séjour, en ligne discrète tout en bas du portail client, et après le check-out sur une page de remerciement qui s’affiche pendant une semaine si le client rouvre le portail. Le bouton nomme la plateforme si elle se déduit du lien (Google, Tripadvisor, Booking.com, HolidayCheck). RoSe ne demande volontairement pas d’abord si le client est satisfait : n’envoyer que les clients satisfaits vers les avis est interdit par Google.',
          },
          {
            frage: 'Puis-je changer l’adresse de l’établissement ?',
            antwort: 'Oui, le nom court dans l’adresse peut être modifié. Les QR codes imprimés restent valables, car ils portent leur propre clé. Seuls ceux qui ont saisi l’adresse à la main ou qui ont une ancienne feuille d’arrivée avec l’adresse écrite en toutes lettres n’arrivent plus à destination — les pages de connexion pour les clients et le ménage se trouvent sous le nouveau nom.',
          },
          {
            frage: 'Que change « Activités du ménage : équipe uniquement » ?',
            antwort: 'Les statistiques n’affichent alors que le total de l’établissement (somme des services), sans tableau « Par agent d’étage » ni journal quotidien ; l’historique de la chambre affiche « Équipe d’étage » au lieu d’un nom. Les pointages perdent leur personne à la fin du service, au plus tard après 24 heures — lors du changement, tous les pointages existants aussi. Le réglage peut être rétabli, mais les noms des pointages anonymisés ne peuvent pas être restaurés. Ce qui reste : quand chaque chambre a été nettoyée, combien de services ont eu lieu, et les affichages en direct pour la coordination (qui est sur quel étage en ce moment). Si un seul agent d’étage est en service, l’attribution est de toute façon évidente — aucun réglage n’y peut rien.',
          },
          {
            frage: 'Quelles sont les exigences pour le logo ?',
            antwort: 'PNG, JPG ou SVG jusqu’à 1 Mo. Il apparaît sur l’affiche de chambre et la feuille d’arrivée en 55 × 16 mm maximum ; en dessous d’environ 400 px de largeur, il y paraît flou. L’aperçu est sur fond blanc — sinon un logo clair prévu pour des fonds sombres serait invisible sur papier. Sans logo, les feuilles affichent le nom de l’établissement.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Accès clients',
            hinweis: 'Code PIN ou lien personnel, langues des feuilles',
            ziel: { art: 'thema', id: 'gastzugang' },
          },
          {
            label: 'Ce que voit le client',
            hinweis: 'Fonctionnement du report et de la plage horaire sur le portail',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  gastzugang: {
    title: 'Accès clients',
    subtitle: 'QR code fixe par chambre avec code PIN ou accès personnel par séjour, langues des feuilles, affiches de chambre',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Il existe deux façons d’accéder au portail client, au choix de chaque établissement. Avec un QR code fixe par chambre, un code est imprimé une fois et placé dans la chambre, et chaque séjour reçoit son propre code PIN. Avec l’accès personnel, chaque séjour reçoit son propre code ou lien, sans code PIN ; il expire au check-out.',
          'Méthode et langues ne prennent effet qu’à l’enregistrement. Si quelque chose a changé, une barre « Modifications non enregistrées » en bas de l’écran enregistre ou annule les deux sections ensemble. Seule la confirmation de la valeur par défaut se fait avec le bouton sous les deux cartes.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Quelle méthode nous convient ?',
            antwort: 'Choisissez QR code fixe + code PIN si vous pouvez placer une affiche dans chaque chambre et souhaitez un accès à deux facteurs (le code dans la chambre et le code PIN de la réception). Choisissez l’accès personnel si les affiches ne sont pas pratiques ou pas souhaitées. C’est plus confortable pour les clients, mais quiconque voit la feuille peut accéder au portail pour ce séjour. La page compare les deux en détail.',
          },
          {
            frage: 'Qu’advient-il des séjours en cours si je change ?',
            antwort: 'Rien. La méthode est enregistrée avec le séjour au check-in. Les codes PIN et liens déjà remis fonctionnent jusqu’au check-out ; seul le check-in suivant suit la nouvelle méthode. Il n’y a ni date de bascule ni rien à convertir.',
          },
          {
            frage: 'Pourquoi n’y a-t-il pas de code PIN de secours avec l’accès personnel ?',
            antwort: 'Un code PIN que personne ne connaît serait un second accès sans aucun avantage — et une faille de plus. Le séjour a exactement l’accès que le client a en main.',
          },
          {
            frage: 'Le client souhaite recevoir l’accès par e-mail.',
            antwort: 'Dans la fenêtre de la chambre, la feuille d’arrivée peut être envoyée par e-mail. L’adresse n’est pas enregistrée ; le séjour reste anonyme. L’e-mail contient le lien, pas une image de QR code — beaucoup de messageries n’affichent pas les images intégrées. Sous le bouton, vous voyez si l’e-mail a été distribué ou refusé — et pourquoi.',
          },
          {
            frage: 'Pourquoi seulement une ou deux langues sur papier ?',
            antwort: 'Les feuilles expliquent le portail avec des images de ses boutons ; le texte est dans une langue principale et, au besoin, une seconde. Plus de langues n’aident guère : pour chacune sur la feuille, beaucoup d’autres manquent — et la feuille devient un formulaire. Qui ne lit aucune des deux accède au portail par les images et le QR code — il y voit sa langue si le portail la propose, sinon il traduit avec son téléphone. La première langue est la langue de repli de l’établissement — tout client dont le portail ne propose pas la langue du téléphone la voit aussi sur le portail client — et c’est aussi la langue de l’e-mail d’accès.',
          },
          {
            frage: 'Où sont passées les affiches de chambre ?',
            antwort: 'Elles se trouvent en bas de cette page — uniquement avec la méthode du code PIN. Avec l’accès personnel, elles mèneraient à une saisie de code PIN que les nouveaux clients ne peuvent pas utiliser du tout ; avec la méthode du code PIN, la réception y accède par sa tuile dans les paramètres.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Affiches et feuilles d’arrivée',
            hinweis: 'Formats, validité, impression',
            ziel: { art: 'thema', id: 'aushang' },
          },
          {
            label: 'Ce que voit le client',
            hinweis: 'La simulation du portail',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  aushang: {
    title: 'Affiches et feuilles d’arrivée',
    subtitle: 'Affiche de chambre, feuille d’arrivée, carte d’accès : d’où elles viennent, combien de temps elles sont valables, ce qui les invalide',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Trois types d’impressions naissent à des endroits différents : une affiche par chambre (sous Accès clients ou « Affiches de chambre »), une feuille d’arrivée par séjour (dans la fenêtre de la chambre après le check-in) et une carte d’accès par agent d’étage (sous Personnel).',
          'L’affiche de chambre et la feuille d’arrivée sont la même feuille en deux formats — A4 ou quatre cartes compactes par page — et ne diffèrent que par le bloc d’accès : code fixe avec « Vous recevez votre code PIN à l’arrivée » contre l’accès de ce séjour.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'A4 ou compact ?',
            antwort: 'A4 pour les cadres, présentoirs et pochettes ; compact (92 × 130 mm, quatre par page à découper) pour les affichettes de porte et la réception. Le choix dépend de l’occasion et n’est pas enregistré. Le QR code est dimensionné pour la distance de lecture : 55 mm en A4, 42 mm en compact.',
          },
          {
            frage: 'Pourquoi n’y a-t-il pas d’heure de ménage sur l’affiche de chambre ?',
            antwort: 'L’affiche de chambre reste en place durablement. Une règle imprimée devient obsolète sans bruit dès que l’établissement change ses règles de ménage — 200 affiches sont alors fausses. Règle et horaires figurent uniquement sur la feuille d’arrivée, créée à neuf à chaque check-in.',
          },
          {
            frage: 'L’impression sort sans couleurs.',
            antwort: 'Les navigateurs n’impriment pas les couleurs d’arrière-plan par défaut. Les feuilles sont conçues pour que la couleur n’apparaisse que dans les lignes et des teintes claires avec un texte foncé, elles restent donc lisibles en niveaux de gris. Pour imprimer en couleur, activez « Graphiques d’arrière-plan » dans la boîte de dialogue d’impression.',
          },
          {
            frage: 'Une affiche de chambre a disparu.',
            antwort: '« Renouveler le code » crée un nouveau code pour cette chambre et invalide l’ancienne affiche. Seuls le titulaire du compte et les managers peuvent le faire, et cela ne concerne qu’une chambre. Imprimez ensuite la nouvelle affiche.',
          },
          {
            frage: 'L’e-mail d’accès arrive dans les indésirables du client.',
            antwort: 'Chez certains fournisseurs de messagerie, les nouveaux expéditeurs finissent plus souvent dans les indésirables au début — ce n’est pas la faute de l’établissement. Demandez au client de regarder là. Si une adresse est refusée, la raison s’affiche sous le bouton ; une faute de frappe dans l’adresse est la plus fréquente. L’impression reste toujours la solution.',
          },
          {
            frage: 'Une carte d’accès est perdue.',
            antwort: 'Délivrez-en une nouvelle sous Personnel : nouveau code PIN et nouveau code en une seule étape, et l’ancienne carte cesse de fonctionner. La carte survit à « Mettre fin à l’accès » et refonctionne après réactivation.',
          },
          {
            frage: 'Pourquoi ne trouvé-je pas les affiches de chambre ?',
            antwort: 'Votre établissement utilise l’accès personnel par séjour. Il n’y a alors pas de code fixe par chambre, et le client reçoit sa feuille au check-in depuis la fenêtre de la chambre.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Accès clients',
            hinweis: 'Méthode et langues des feuilles',
            ziel: { art: 'thema', id: 'gastzugang' },
          },
          {
            label: 'Personnel',
            hinweis: 'Délivrer des cartes d’accès',
            ziel: { art: 'thema', id: 'personal' },
          },
        ],
      },
    ],
  },
  personal: {
    title: 'Personnel',
    subtitle: 'Ménage, réception, managers — comptes, invitations, cartes d’accès, fin d’accès et suppression',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Trois types de personnel au même endroit. Les agents d’étage reçoivent un nom d’utilisateur et un code PIN (sans e-mail) ainsi qu’une carte d’accès ; la réception et les managers sont invités par e-mail et définissent eux-mêmes leur mot de passe. Les trois suivent le même principe : mettre fin à l’accès (réversible) ou supprimer définitivement (avec les conséquences chiffrées).',
        ],
      },
      {
        art: 'legende',
        titel: 'Boutons de la ligne',
        eintraege: [
          {
            zeichen: { art: 'icon', id: 'printer', ton: 'neutral' },
            label: 'Imprimer la carte',
            text: 'La carte d’accès de l’agent d’étage avec QR code et identifiants — un scan, et la connexion est faite.',
          },
          {
            zeichen: { art: 'icon', id: 'idcard', ton: 'neutral' },
            label: 'Nouvelle carte',
            text: 'Nouveau code PIN et nouveau QR code en une seule étape ; l’ancienne carte cesse immédiatement de fonctionner. La solution en cas de perte ou de code PIN oublié.',
          },
          {
            zeichen: { art: 'icon', id: 'pencil', ton: 'neutral' },
            label: 'Modifier',
            text: 'Nom affiché ; pour le ménage, aussi le nom d’utilisateur.',
          },
          {
            zeichen: { art: 'icon', id: 'userminus', ton: 'caution' },
            label: 'Mettre fin à l’accès',
            text: 'Connexion bloquée immédiatement, une session ouverte se termine aussi. Rien n’est perdu ; « Réactiver » annule l’opération.',
          },
          {
            zeichen: { art: 'icon', id: 'trash', ton: 'critical' },
            label: 'Supprimer définitivement',
            text: 'La fenêtre indique à l’avance ce qui part avec. Pour les agents d’étage avec historique, il faut saisir le nom d’utilisateur.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'L’agent d’étage est refusé avec le bon code PIN.',
            antwort: 'Presque toujours, le nom affiché figure dans le champ « Nom d’utilisateur ». La connexion utilise le nom d’utilisateur court indiqué sur la carte d’accès sous « Identifiants ». Deuxième cause : l’accès a pris fin — la page de connexion le dit alors.',
          },
          {
            frage: 'Code PIN oublié ?',
            antwort: 'Délivrez une nouvelle carte d’accès : cela crée un nouveau code PIN et un nouveau QR code en une seule étape ; l’ancienne carte cesse de fonctionner. Il n’existe aucun moyen de « consulter » un code PIN.',
          },
          {
            frage: 'L’invitation n’est pas arrivée.',
            antwort: 'Sous le bouton d’envoi, vous voyez l’état de distribution : remis, distribué ou refusé — avec la raison donnée par le serveur destinataire. Le plus souvent, c’est une faute de frappe dans l’adresse. Après un refus, l’adresse peut être débloquée et l’e-mail renvoyé ; et il y a « Afficher le lien d’invitation » pour transmettre le lien par messagerie ou sur papier. Il faut attendre une minute entre deux e-mails à la même personne.',
          },
          {
            frage: 'Mettre fin à l’accès ou supprimer ?',
            antwort: 'Mettre fin, presque toujours. La trace du travail reste complète, les statistiques continuent de montrer la personne, et le retour se fait en un clic. Pour les agents d’étage, la suppression emporte les pointages — d’où la saisie du nom d’utilisateur comme garde-fou. Pour la réception et les managers, le compte de connexion subsiste dès que des opérations y sont rattachées ; la fenêtre le dit à l’avance.',
          },
          {
            frage: 'Que peut faire la réception, et que peut faire un manager ?',
            antwort: 'Réception : check-in et check-out, priorités, demandes, impression des feuilles d’arrivée, cartes et affiches, mot de passe personnel. Pas : paramètres, chambres, services, personnel, « Renouveler le code ». Manager : les mêmes droits que le titulaire du compte dans l’établissement, mais sans accès au compte ni à la facturation. Seul le titulaire du compte nomme les managers.',
          },
          {
            frage: 'Une personne doit s’occuper de plusieurs établissements.',
            antwort: 'Ajoutez-la dans chaque établissement. À partir de la deuxième fois, vous la choisissez parmi les managers existants du compte, sans nouveau compte. « Mettre fin à l’accès » ne concerne que l’établissement en question.',
          },
          {
            frage: 'Pourquoi les agents d’étage n’ont-ils pas besoin d’adresse e-mail ?',
            antwort: 'Ils se connectent avec nom d’utilisateur et code PIN ou avec leur carte ; une boîte mail serait un obstacle sans utilité. Le nom d’utilisateur n’est unique que dans cet établissement — le même peut exister dans un autre établissement.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Le tableau du ménage',
            hinweis: 'Ce que voit l’agent d’étage après la connexion',
            ziel: { art: 'thema', id: 'reinigung' },
          },
          {
            label: 'Statistiques',
            hinweis: 'Temps de travail à partir des pointages',
            ziel: { art: 'thema', id: 'auswertung' },
          },
        ],
      },
    ],
  },
  services: {
    title: 'Catalogue de services',
    subtitle: 'Le catalogue de services : services, options, prix, « urgent », « Signalement »',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Un service ne demande que peu d’informations : un nom (« Blanchisserie ») et les options parmi lesquelles le client choisit, chacune éventuellement avec un prix. Deux options pilotent le déroulement, rien d’autre — pas de catégories, pas de responsabilités.',
        ],
      },
      {
        art: 'legende',
        titel: 'Les deux options',
        eintraege: [
          {
            zeichen: { art: 'pille', text: 'urgent', ton: 'critical', icon: 'siren' },
            label: 'Urgent — à quel point c’est visible',
            text: 'Les demandes correspondantes clignotent en rouge : sur la tuile de la chambre, sur la page « Demandes » et en nombre dans la navigation. Pour tout ce qui ne peut pas attendre.',
          },
          {
            zeichen: { art: 'pille', text: 'Signalement', ton: 'neutral' },
            label: 'Signalement — à qui il appartient',
            text: 'La demande appartient à la chambre, pas au séjour : elle reste ouverte après le check-out, ne figure sur aucun récapitulatif, et le check-in suivant avertit à son sujet. Pour les défauts — la maintenance est le cas type.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'À quoi sert un prix ?',
            antwort: 'Le client le voit en faisant sa demande, et au check-out le service fourni figure avec son prix sur le récapitulatif. Sans prix, une option ne figure sur aucun récapitulatif — ce qui ne coûte rien n’a pas besoin d’être vérifié. RoSe ne comptabilise ni n’encaisse rien ; il additionne.',
          },
          {
            frage: 'Comment les clients obtiennent-ils les services dans leur langue ?',
            antwort: 'Vous créez chaque service dans votre langue principale. Sous le service, des pastilles de langue indiquent dans quelles langues du portail client il est déjà traduit — un appui sur une langue ouvre les champs pour le nom, la description et les options, avec le texte source sous chacun. Traduisez sans hésiter avec l’outil de votre choix. Si une traduction manque, le client voit le texte source, jamais un champ vide. La réception voit toujours les demandes dans la langue principale. Les services d’exemple sont déjà traduits.',
          },
          {
            frage: 'Je renomme un service. Cela modifie-t-il les anciennes demandes ?',
            antwort: 'Non. Nom, options et prix sont figés au moment de la demande ; les anciennes demandes et les récapitulatifs restent tels quels. L’option « Signalement », en revanche, agit aussi immédiatement sur les demandes ouvertes — elle décide d’un comportement, pas du contenu d’un justificatif.',
          },
          {
            frage: 'Archiver ou supprimer ?',
            antwort: 'Archiver. Le service disparaît du portail, et les anciennes demandes sont conservées en entier. Les services d’exemple sont des services tout à fait normaux et s’archivent de la même manière.',
          },
          {
            frage: 'Un service peut-il permettre plusieurs options à la fois ?',
            antwort: 'Oui — le client choisit autant d’options qu’il veut et peut ajouter une remarque. Une demande, c’est un service avec les options choisies.',
          },
          {
            frage: 'Le client voit-il aussi les services sans options ?',
            antwort: 'Oui, il choisit alors le service dans son ensemble — en le commandant ou en le signalant, par exemple pour la maintenance, qui n’a pas besoin d’options.',
          },
          {
            frage: 'Qu’est-ce qu’un « Lien » ?',
            antwort: 'Une tuile du portail client qui renvoie vers un site externe, comme une application de pourboires pour l’équipe d’étage, un service de livraison de repas ou un service de taxi. Un lien ne crée pas de demande, rien n’apparaît donc sur la page Demandes ni sur le récapitulatif du séjour. Des modèles préremplissent le formulaire ; adaptez l’adresse à votre compte ou à votre ville. Le portail ne fait que renvoyer vers le service externe ; son contenu relève du fournisseur.',
          },
          {
            frage: 'Le client peut-il donner un pourboire personnellement à l’agent d’étage ?',
            antwort: 'Pas via RoSe. Le portail client n’affiche aucun nom, et un lien vaut pour tout l’établissement — les applications de pourboires répartissent au sein de l’équipe. Le régime fiscal des pourboires versés par une application dépend du mode de paiement de l’application, pas de RoSe.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Demandes',
            hinweis: 'Ce que deviennent les demandes',
            ziel: { art: 'thema', id: 'anfragen' },
          },
          {
            label: 'Ce que voit le client',
            hinweis: 'La demande du point de vue du client',
            ziel: { art: 'thema', id: 'gast' },
          },
        ],
      },
    ],
  },
  reinigung: {
    title: 'Le tableau du ménage',
    subtitle: 'Couleurs, états, curseurs, étages — ce que l’agent d’étage voit sur son téléphone et pourquoi',
    bloecke: [
      {
        art: 'legende',
        titel: 'La barre au-dessus du numéro',
        hinweis: 'Il n’y a pas de vert « prête » sur le tableau du ménage — le vert y signifie « en cours ».',
        eintraege: [
          { zeichen: { art: 'balken', id: 'priority' } },
          { zeichen: { art: 'balken', id: 'working' } },
          { zeichen: { art: 'balken', id: 'checkout' } },
          { zeichen: { art: 'balken', id: 'wanted' } },
          { zeichen: { art: 'balken', id: 'neutral' } },
        ],
      },
      {
        art: 'legende',
        titel: 'Les symboles sur la tuile',
        eintraege: [
          { zeichen: { art: 'symbol', id: 'occupied' } },
          { zeichen: { art: 'symbol', id: 'departure' } },
          { zeichen: { art: 'symbol', id: 'dnd' } },
          { zeichen: { art: 'symbol', id: 'clean' } },
          { zeichen: { art: 'symbol', id: 'deferred' } },
          { zeichen: { art: 'symbol', id: 'declined' } },
          { zeichen: { art: 'symbol', id: 'routine' } },
          { zeichen: { art: 'symbol', id: 'checkout' } },
          { zeichen: { art: 'symbol', id: 'priority' } },
          { zeichen: { art: 'symbol', id: 'cleaning' } },
        ],
      },
      {
        art: 'legende',
        titel: 'Barre d’état et étages',
        eintraege: [
          {
            zeichen: { art: 'pille', text: 'En service depuis 07:02', ton: 'positive' },
            label: 'En service',
            text: 'Le service est en cours ; des ménages peuvent être commencés.',
          },
          {
            zeichen: { art: 'pille', text: 'Pause', ton: 'caution' },
            label: 'Pause',
            text: 'Une période à l’intérieur du service ; aucun ménage n’est possible pendant ce temps. La fin de la pause reprend le service.',
          },
          {
            zeichen: { art: 'pille', text: 'Autre nettoyage', ton: 'attention' },
            label: 'Autre nettoyage',
            text: 'Couloirs, hall, salle du petit-déjeuner — du travail sans chambre, sous forme de période. Commencer le ménage d’une chambre y met fin automatiquement.',
          },
          {
            zeichen: { art: 'pille', text: 'Pas en service', ton: 'neutral' },
            label: 'Pas en service',
            text: 'Avant le début et après la fin du service. Le tableau n’affiche rien à faire.',
          },
          {
            zeichen: { art: 'pille', text: 'À suivre', ton: 'action', icon: 'target', blink: true },
            label: 'À suivre',
            text: 'Une recommandation, pas une affectation : d’abord un étage avec une priorité ouverte ; sinon l’étage dont l’urgence ouverte, divisée par le nombre d’agents d’étage présents plus un, est la plus élevée. Les départs pèsent davantage à mesure que le check-in approche. En cas d’égalité, l’étage inférieur est proposé, pour que la recommandation ne saute pas d’un étage à l’autre.',
          },
          {
            zeichen: { art: 'pille', text: 'Prio', ton: 'accent', icon: 'flag' },
            label: 'Prio sur l’étage',
            text: 'Un ménage prioritaire attend sur l’étage ; la ligne clignote en violet.',
          },
          {
            zeichen: { art: 'pille', text: 'Priorité ouverte', ton: 'accent', icon: 'siren', blink: true },
            label: 'Voyant dans la barre d’état',
            text: 'Une priorité est ouverte sur un autre étage. Simple affichage, pas un bouton — on change d’étage avec le curseur.',
          },
          {
            zeichen: { art: 'icon', id: 'users', ton: 'neutral' },
            label: 'Noms sur l’étage',
            text: 'Qui, dans l’équipe, s’y est enregistré. Le nom apparaît aussi dans la vue d’ensemble de la réception.',
          },
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Le curseur ne se déclenche pas.',
            antwort: 'Le geste doit commencer sur la poignée et parcourir presque toute la piste (97 %). Un appui n’importe où sur la piste ou un petit à-coup ne fait rien — c’est voulu : un téléphone dans la poche d’un tablier ne doit pas commencer un ménage. « Quitter l’étage » va de droite à gauche.',
          },
          {
            frage: 'Pourquoi une chambre est-elle grisée ?',
            antwort: 'Elle n’est pas bloquée, elle n’a simplement rien à faire : libre, occupée sans demande, « Ne pas déranger », pas de ménage souhaité aujourd’hui (feuille), ou un ménage qui ne vaut que plus tard (« à partir de 11:00 »). Elle reste visible pour que l’étage soit complet. À l’heure fixée, une demande reportée redevient ouverte d’elle-même.',
          },
          {
            frage: 'Le client est dans la chambre et ne veut pas de ménage maintenant — que fait l’agent d’étage ?',
            antwort: 'Toucher la chambre sans commencer : « Dans 30 min », « Dans 1 h » ou « Pas aujourd’hui ». « Dans 30 min » et « Dans 1 h » retirent la chambre du tableau jusqu’à cette heure — pour toute l’équipe, personne ne refrappe entre-temps —, puis elle redevient ouverte d’elle-même. « Pas aujourd’hui » règle la chambre pour aujourd’hui sans compter comme un ménage. Si le client veut tout de même le ménage, il le demande sur le portail ; la chambre est alors de nouveau ouverte.',
          },
          {
            frage: 'On a oublié de terminer.',
            antwort: 'Après le délai fixé par l’établissement (90 minutes par défaut), la chambre se rouvre d’elle-même ; l’historique affiche « Ménage non terminé (délai dépassé, nom) ». Le ménage ne compte alors pas comme fait dans les statistiques — le curseur de fin vaut donc toujours la peine.',
          },
          {
            frage: 'Que signifie « Ne pas déranger » levé 9:40 ?',
            antwort: 'Le client a désactivé « Ne pas déranger » aujourd’hui à 9:40, et la chambre n’a pas été nettoyée depuis. Le plus souvent, cela veut dire qu’il vient de partir. Le tableau compte donc la chambre comme une demande de ménage — l’occasion peut se refermer si le client revient et raccroche l’affichette, par exemple après le déjeuner.',
          },
          {
            frage: 'Le tableau propose de changer d’étage — pourquoi ?',
            antwort: 'Après chaque chambre, le tableau recalcule. Il propose de changer d’étage si une chambre avec une priorité ouverte se trouve ailleurs, ou si la charge d’un autre étage est nettement supérieure à celle de l’étage actuel — généralement parce que des départs y attendent et que le check-in approche. C’est rare les jours calmes. L’agent d’étage décide s’il change ; la commande de changement est un curseur, et qui reste sur l’étage actuel continue simplement à travailler.',
          },
          {
            frage: 'Pourquoi choisir d’abord un étage ?',
            antwort: 'Choisir un étage, c’est s’y enregistrer : l’équipe et la réception voient qui travaille où, et la recommandation « À suivre » en tient compte. Une erreur de toucher ne doit faire sortir personne de l’étage, c’est pourquoi le chemin du retour est un curseur.',
          },
          {
            frage: 'Une pause et un autre nettoyage peuvent-ils avoir lieu en même temps ?',
            antwort: 'Non — ce sont deux périodes à l’intérieur du service, qui ne peuvent chevaucher rien d’autre. Commencer une pause termine un autre nettoyage en cours, et finir son service termine les deux. Tous les changements se font sur la page « Statut », pas sur le tableau.',
          },
          {
            frage: 'Connexion refusée alors que le code PIN est correct.',
            antwort: 'Le champ contient le nom affiché au lieu du nom d’utilisateur court — celui-ci figure sur la carte d’accès sous « Identifiants ». Ou l’accès a pris fin ; la page le dit alors. Scanner la carte est le chemin sans saisie.',
          },
          {
            frage: 'Comment la réception sait-elle quel travail a été fait ?',
            antwort: 'Par les pointages : début et fin du service, pauses, autre nettoyage, début et fin par chambre. À partir de ceux-ci, les statistiques calculent les temps de travail et de ménage ; l’historique de la chambre montre chaque ménage avec un nom — en mode équipe, « Équipe d’étage ».',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Personnel',
            hinweis: 'Comptes, cartes d’accès, code PIN',
            ziel: { art: 'thema', id: 'personal' },
          },
          {
            label: 'Statistiques',
            hinweis: 'Ce que deviennent les pointages',
            ziel: { art: 'thema', id: 'auswertung' },
          },
          {
            label: 'Établissement et règles',
            hinweis: 'Ménage quotidien, limite de report, délai',
            ziel: { art: 'thema', id: 'regeln' },
          },
        ],
      },
    ],
  },
  gast: {
    title: 'Ce que voit le client',
    subtitle: 'Accès, blocage du code PIN, ménage et « pas avant », Ne pas déranger, demandes, check-out',
    bloecke: [
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Comment le client accède-t-il au portail ?',
            antwort: 'Avec la méthode du code PIN, de deux manières équivalentes : scanner le QR code de la chambre et saisir le code PIN, ou ouvrir l’adresse de l’établissement et saisir le numéro de chambre plus le code PIN (les deux figurent sur la feuille d’arrivée). Avec l’accès personnel, il ouvre son QR code ou son lien et est connecté sans code PIN. Ensuite, il reste connecté sur son appareil.',
          },
          {
            frage: 'Le client s’est bloqué lui-même.',
            antwort: 'Après cinq codes PIN erronés, le séjour est bloqué pendant 15 minutes — même pour le bon code PIN. Cela ne concerne que cette chambre, pas l’établissement. Ensuite, cela refonctionne ; le bon code PIN se trouve dans la fenêtre de la chambre. Faire un check-out puis un nouveau check-in n’est pas une bonne solution : le check-out clôture les demandes ouvertes et met la chambre en « ménage à faire ».',
          },
          {
            frage: 'Que fait « Nettoyer ma chambre » ?',
            antwort: 'La chambre apparaît immédiatement comme ouverte sur le tableau du ménage et dans votre vue d’ensemble. Il n’y a pas de rendez-vous ; l’équipe d’étage s’en occupe au fil de sa tournée. Un nouvel appui annule la demande. Avec « pas avant », le client choisit une heure pleine, et la chambre n’est pas disponible pour le ménage avant.',
          },
          {
            frage: 'Que dit la carte d’état au-dessus des boutons ?',
            antwort: 'Où en est le ménage pour le client, à partir des mêmes données que vos tableaux : « prévu » (demande, priorité ou ménage quotidien dû), « à partir de HH:MM » (report du client ou ménage quotidien pas encore dû), « en cours de ménage », « nettoyée aujourd’hui à HH:MM » ou « rien de prévu aujourd’hui » — avec la raison (jour d’arrivée, jour de départ, l’établissement ne nettoie qu’à la demande). « Nettoyée » ne compte qu’à partir du check-in de ce client ; le nom d’un agent d’étage n’apparaît jamais. La carte se met à jour toutes les 15 secondes.',
          },
          {
            frage: 'Pourquoi le client ne peut-il pas demander le ménage maintenant ?',
            antwort: 'L’établissement a défini une plage horaire ; en dehors de celle-ci, le client voit les horaires de ménage au lieu du bouton. « Ne pas déranger » et l’annulation restent toujours possibles.',
          },
          {
            frage: 'Que fait « Ne pas déranger » ?',
            antwort: 'Personne ne frappe, le ménage quotidien est suspendu, et la chambre est grisée sur le tableau — jusqu’à ce que le client le désactive. Lui seul peut le faire ; la réception le voit mais ne le lève pas.',
          },
          {
            frage: 'Le client paie-t-il sur le portail ?',
            antwort: 'Non. Il voit les prix à titre d’information et commande d’un seul appui ; la demande arrive chez vous sous « Demandes ». Au check-out, RoSe affiche le total de ce qui a été fourni — l’encaissement se fait à la réception comme d’habitude.',
          },
          {
            frage: 'Dans quelle langue est le portail ?',
            antwort: 'Dans la langue du téléphone du client, si le portail la propose — actuellement allemand et anglais ; le client peut changer en haut à droite. Si sa langue manque, la langue de repli de l’établissement s’applique (Accès clients → Langues). Le portail affiche les services dans la traduction que vous avez saisie dans le catalogue de services, sinon dans le texte source. Pour toutes les autres langues, les feuilles imprimées expliquent les boutons avec des images, et le client peut traduire l’écran avec son téléphone.',
          },
          {
            frage: 'Que sait RoSe du client ?',
            antwort: 'Rien. Un séjour, c’est une chambre, une période, un code PIN ou un lien — pas de nom, pas d’adresse. Une adresse saisie pour l’e-mail d’accès n’est pas enregistrée. Au check-out, code PIN, lien et connexion expirent.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Accès clients',
            hinweis: 'Code PIN ou lien personnel',
            ziel: { art: 'thema', id: 'gastzugang' },
          },
          {
            label: 'Établissement et règles',
            hinweis: 'Plage horaire, limite de report, longueur du code PIN',
            ziel: { art: 'thema', id: 'regeln' },
          },
        ],
      },
    ],
  },
  auswertung: {
    title: 'Statistiques',
    subtitle: 'Temps de travail, de pause et de ménage à partir des pointages, anomalies, demande par heure',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Tout ici est calculé, rien n’est stocké. La base, ce sont les pointages des agents d’étage (début et fin du service, pauses, autre nettoyage, début et fin par chambre), plus les actions des clients et les check-out. La période choisie figure dans l’adresse web, vous pouvez donc partager ou imprimer un état.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Que signifient temps de travail net et temps restant ?',
            antwort: 'Temps de travail net = temps de service moins les pauses. Temps restant = temps de travail net moins le ménage des chambres et l’autre nettoyage — autrement dit, le temps passé à se déplacer, à préparer ou à attendre. Un temps restant élevé indique généralement de longs trajets ou des temps morts entre les demandes.',
          },
          {
            frage: 'Qu’est-ce qui compte comme « anomalie » ?',
            antwort: 'Les services de plus de 16 heures (fin de service oubliée), les pauses de plus de quatre heures, les ménages sans fin ou plus longs que le délai de l’établissement. Ils sont comptés mais pas inclus — sinon un service resté ouvert traînerait le temps de travail pendant des jours.',
          },
          {
            frage: 'Pourquoi d’anciens agents d’étage apparaissent-ils encore dans le tableau ?',
            antwort: 'Parce que les traces du travail subsistent après un départ. Une personne dont l’accès a pris fin reste visible pour la période où elle a travaillé. Seule la suppression définitive retire ses pointages, c’est pourquoi elle exige de saisir le nom.',
          },
          {
            frage: 'Le « Marquer le ménage comme fait » de la réception compte-t-il ?',
            antwort: 'Il crée un enregistrement de ménage, pour que le ménage quotidien compte comme fait. Toutefois, le tableau « Par agent d’étage » ne comprend que les agents d’étage. Si la réception marque régulièrement des ménages comme faits, ceux-ci ne sont attribués à aucun agent d’étage dans les statistiques.',
          },
          {
            frage: 'Pourquoi le tableau « Par agent d’étage » manque-t-il ?',
            antwort: 'Sous Établissement et règles, l’établissement a choisi « Activités du ménage : équipe uniquement ». Les statistiques n’affichent alors que le total de l’établissement sur l’ensemble des services, et les pointages ne sont plus liés à une personne après la fin du service. Revenir en arrière ne vaut que pour l’avenir ; les pointages anonymisés restent anonymes.',
          },
          {
            frage: 'À quoi sert la section « Demande » ?',
            antwort: 'Elle montre, par heure et par jour de la semaine, quand les clients souhaitent le ménage et quand ils font le check-out — et combien d’agents d’étage étaient alors en service. « Demandes sans personne en service » est l’indication pour la planification. C’est pourquoi RoSe ne demande pas aux clients d’heure souhaitée : les données existent déjà.',
          },
          {
            frage: 'Dans quel fuseau les heures sont-elles calculées ?',
            antwort: 'Dans le fuseau horaire de l’établissement (Établissement et règles). S’il est faux, les limites de journée et les heures sont décalées du décalage horaire.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Le tableau du ménage',
            hinweis: 'D’où viennent les pointages',
            ziel: { art: 'thema', id: 'reinigung' },
          },
          {
            label: 'Personnel',
            hinweis: 'Mettre fin à l’accès plutôt que supprimer',
            ziel: { art: 'thema', id: 'personal' },
          },
        ],
      },
    ],
  },
  zugang: {
    title: 'Mon compte',
    subtitle: 'Adresse de connexion, nom affiché et mot de passe de la personne connectée',
    bloecke: [
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Où apparaît le nom affiché ?',
            antwort: 'Il apparaît dans l’en-tête du portail, dans l’historique de la chambre au check-in et au check-out, dans les demandes traitées et dans la liste du personnel. La modification s’applique partout à la fois.',
          },
          {
            frage: 'Pourquoi changer le mot de passe exige-t-il l’actuel ?',
            antwort: 'Parce que sinon, une session ouverte laissée sans surveillance à la réception suffirait pour bloquer quelqu’un.',
          },
          {
            frage: 'Mot de passe oublié ?',
            antwort: 'Déconnectez-vous et choisissez « Mot de passe oublié ? » sur la page de connexion. Le lien arrive par e-mail et peut s’ouvrir sur n’importe quel appareil. Si aucun e-mail n’arrive, le titulaire du compte ou un manager peut renvoyer le lien sous Personnel ; si la distribution a échoué, le lien peut aussi être affiché et transmis directement.',
          },
          {
            frage: 'Puis-je changer mon adresse e-mail ?',
            antwort: 'Oui, ici sous « Modifier l’adresse de connexion » — pour le titulaire du compte, les managers et la réception. Vous saisissez votre mot de passe actuel et la nouvelle adresse ; un lien de confirmation part vers la nouvelle adresse, et seul un clic sur ce lien effectue le changement. D’ici là, vous continuez à vous connecter avec l’ancienne adresse. Après le changement, l’ancienne adresse reçoit un avis.',
          },
          {
            frage: 'Qu’est-ce qui reste identique avec une nouvelle adresse de connexion ?',
            antwort: 'Tout sauf l’adresse e-mail : mot de passe, rôles dans tous les établissements, nom affiché et historique. Pour le titulaire du compte, les factures partent à la nouvelle adresse ; coordonnées de facturation, moyen de paiement et offre restent inchangés.',
          },
          {
            frage: 'J’ai reçu un avis de changement d’adresse, mais ce n’était pas moi.',
            antwort: 'Quelqu’un a alors utilisé votre mot de passe. Contactez immédiatement le titulaire du compte de votre établissement — pour la réception et les managers, il peut mettre fin à l’accès sous Personnel. Si le compte du titulaire lui-même est concerné, contactez-nous — l’adresse de contact figure dans les mentions légales.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Mot de passe oublié',
            ziel: { art: 'url', href: '/passwort-vergessen' },
          },
          {
            label: 'Personnel',
            hinweis: 'Créer des comptes et y mettre fin',
            ziel: { art: 'thema', id: 'personal' },
          },
        ],
      },
    ],
  },
  haeuser: {
    title: 'Établissements et compte',
    subtitle: 'La page des établissements : état par établissement, ajout d’un établissement, encadré du compte, suppression des données',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'La page des établissements est le point d’entrée des titulaires de compte et des managers : tous les établissements accessibles avec leur état (ménages ouverts, demandes), et en dessous, pour le titulaire du compte, l’encadré du compte et « Ajouter un établissement ». La réception ne voit jamais cette page — elle ne connaît qu’un seul établissement.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Je n’ai qu’un seul établissement. Pourquoi cette page ?',
            antwort: 'Parce que le compte se trouve ici : facturation, moyen de paiement, un deuxième établissement, suppression des données. Le lien « Établissements » dans l’en-tête de l’établissement mène toujours ici — même avec un seul établissement.',
          },
          {
            frage: 'Que voit un manager ici ?',
            antwort: 'Uniquement les établissements auxquels il a été ajouté. L’encadré du compte, « Ajouter un établissement » et « Supprimer des données » n’existent pas pour lui.',
          },
          {
            frage: 'Que signifie « Supprimer des données » ?',
            antwort: 'Supprimer complètement un établissement ou tout le compte — avec un aperçu chiffré et le nom à saisir pour confirmer ; c’est irréversible. Contrairement au travail quotidien, où les justificatifs subsistent volontairement, tout est effacé : historique, comptes de connexion et logo aussi. Seuls les justificatifs de facturation restent, car ils doivent être conservés. Supprimer le compte vaut aussi résiliation à la fin du mois : pour le mois en cours, une facture de clôture est établie lors de la suppression, et la fenêtre indique le montant à l’avance (rien pendant le mois gratuit).',
          },
          {
            frage: 'Que se passe-t-il si j’ajoute un autre établissement ?',
            antwort: 'Il est créé avec sa propre adresse, ses chambres, son personnel et ses règles. La facturation se fait par chambre sur tous les établissements du compte ; le montant minimum s’applique par compte, pas par établissement.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Offre et facturation',
            hinweis: 'Prix, comptage, moyen de paiement, factures',
            ziel: { art: 'thema', id: 'konto' },
          },
          {
            label: 'Conditions générales',
            ziel: { art: 'url', href: '/agb' },
          },
        ],
      },
    ],
  },
  konto: {
    title: 'Offre et facturation',
    subtitle: 'Prix par chambre, mois gratuit, comptage, montant minimum, moyen de paiement, factures',
    bloecke: [
      {
        art: 'text',
        absaetze: [
          'Un seul prix, pas de formules : par chambre et par mois civil, avec un montant minimum par compte. Toutes les fonctions sont incluses. L’affichage et la facture suivent la même règle.',
        ],
      },
      {
        art: 'fragen',
        eintraege: [
          {
            frage: 'Quel mois est gratuit ?',
            antwort: 'Le mois civil de l’inscription et, si l’inscription n’a pas eu lieu le premier du mois, aussi le suivant — donc toujours au moins un mois complet.',
          },
          {
            frage: 'Comment une chambre est-elle comptée ?',
            antwort: 'Elle compte pour le mois dès qu’elle a été en service pendant ce mois, même brièvement — mise hors service aujourd’hui, elle compte encore ; créée aujourd’hui aussi. Le mois en cours est donc toujours un aperçu ; les mois clos sont figés, même si vous supprimez des chambres plus tard.',
          },
          {
            frage: 'Pourquoi un montant minimum par compte et non par établissement ?',
            antwort: 'Une chaîne paie la somme de ses chambres, pas trois fois le minimum. Un compte sans aucune chambre facturable ne paie rien.',
          },
          {
            frage: 'Quels moyens de paiement existent ?',
            antwort: 'Carte ou prélèvement SEPA, enregistrés sans débit et prélevés lors du traitement mensuel — ou virement sur facture vers les coordonnées bancaires indiquées sur la facture, payable sous 14 jours. Destinataire et adresse de facturation sont obligatoires, sinon la taxe ne peut pas être calculée ; dans l’UE hors Allemagne, également le numéro de TVA intracommunautaire.',
          },
          {
            frage: 'Quand la facture arrive-t-elle, et où la trouver ?',
            antwort: 'Le premier du mois pour le mois précédent, en PDF et en page de consultation dans la carte « Factures ». À 0 €, aucune facture n’est établie. Le prestataire conserve les justificatifs même après la suppression d’un compte — téléchargez les PDF avant ; ensuite, vous n’avez plus accès à la page.',
          },
          {
            frage: 'Que signifie « Mode test — rien n’est prélevé » ?',
            antwort: 'Le traitement des paiements fonctionne encore en mode test du prestataire de paiement. Des factures sont établies, mais aucun argent ne circule. La mention disparaît avec le passage en exploitation réelle.',
          },
          {
            frage: 'Comment résilier ?',
            antwort: 'À la fin d’un mois civil — en supprimant le compte sous « Supprimer des données » sur la page des établissements, ou par écrit, par exemple par e-mail au prestataire. Le mois en cours est encore facturé : la suppression établit immédiatement une facture de clôture, prélevée via le moyen de paiement enregistré ; si elle reste ensuite ouverte (virement), la fenêtre affiche la page de paiement à la fin. Si elle ne peut pas être établie — par exemple parce que les coordonnées de facturation manquent —, le compte n’est pas supprimé. La suppression elle-même prend effet immédiatement : les données disparaissent ensuite. Mettre un établissement hors service ne suffit pas — les chambres hors service comptent encore pour le mois en cours.',
          },
        ],
      },
      {
        art: 'verweise',
        eintraege: [
          {
            label: 'Établissements et compte',
            hinweis: 'Ajouter un établissement, supprimer les données',
            ziel: { art: 'thema', id: 'haeuser' },
          },
          {
            label: 'Conditions générales',
            ziel: { art: 'url', href: '/agb' },
          },
        ],
      },
    ],
  },
} satisfies Record<string, HilfeThemaText>
