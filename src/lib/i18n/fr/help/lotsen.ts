import type { Shape } from '../../format'
import type { lotsen as de } from '../../de/help/lotsen'

/** Guides — textes des visites guidées. Chemins, ancres, scènes et ordre se trouvent dans `lotsen.ts`. Français. */
export const lotsen = {
  tours: {
    einrichtung: {
      title: 'Première configuration',
      subtitle: 'Le chemin guidé d’un établissement vide jusqu’au premier check-in',
    },
    uebersicht: {
      title: 'La vue d’ensemble des chambres',
      subtitle: 'L’écran de la réception : lire les couleurs, check-in, check-out, priorités',
    },
    anfragen: {
      title: 'Demandes',
      subtitle: 'Le tableau de la réception : ce que les clients ont commandé et comment le cocher',
    },
    zimmer: {
      title: 'Chambres et étages',
      subtitle: 'Créer des étages entiers d’un coup, corriger des numéros, mettre des chambres hors service',
    },
    regeln: {
      title: 'Établissement et règles',
      subtitle: 'Fuseau horaire, ménage quotidien, heure limite du check-out, longueur du code PIN — les règles de l’établissement',
    },
    gastzugang: {
      title: 'Accès clients',
      subtitle: 'QR code fixe par chambre avec code PIN ou accès personnel par séjour — affiches comprises',
    },
    aushang: {
      title: 'Affiches et feuilles d’arrivée',
      subtitle: 'Ce qui s’imprime : affiche de chambre, feuille d’arrivée, carte d’accès — et leur durée de validité',
    },
    personal: {
      title: 'Personnel',
      subtitle: 'Ménage, réception et managers — créer, mettre fin à l’accès, imprimer les cartes d’accès',
    },
    services: {
      title: 'Catalogue de services',
      subtitle: 'Le catalogue de services : ce que les clients peuvent commander sur le portail',
    },
    reinigung: {
      title: 'Le tableau de suivi du ménage',
      subtitle: 'Simulation : connexion, service, étages, curseurs — ce que l’agent d’étage voit sur son téléphone',
    },
    gast: {
      title: 'Ce que voit le client',
      subtitle: 'Simulation : le portail client sur un téléphone — ménage, « pas avant », renonciation, Ne pas déranger, services',
    },
    auswertung: {
      title: 'Statistiques',
      subtitle: 'Temps de travail à partir des pointages, anomalies et moments où les clients souhaitent le ménage',
    },
    konto: {
      title: 'Offre et facturation',
      subtitle: 'Ce que coûte le compte, comment les chambres sont comptées, où trouver le moyen de paiement et les factures',
    },
  },

  steps: {
    'einrichtung.start': {
      title: 'Bienvenue dans RoSe',
      body: 'Dans les prochaines minutes, nous configurons votre établissement : les chambres, les règles de l’établissement, l’accès de vos clients au portail, le personnel et les services. Vous pouvez vous arrêter à tout moment et reprendre plus tard — la progression découle de ce qui est réellement configuré, pas de cases cochées.',
      tun: 'Continuez avec le bouton « Suivant » en bas à droite. Vous pouvez faire une pause à tout moment — un bandeau sur la vue d’ensemble indique ce qui manque et vous ramène dans la configuration.',
    },
    'zimmer.anlegen': {
      title: 'Tout commence par les chambres',
      body: 'Sans chambres, pas de check-in, pas de tableau de suivi du ménage et pas d’affiches. Ici, vous créez des étages entiers d’un coup — inutile de tout saisir un par un.',
    },
    'zimmer.modus': {
      title: 'Deux façons de créer beaucoup de chambres',
      body: '« Étages un par un » crée les numéros saisis sur un seul étage — idéal quand chaque étage est différent. « Étages identiques » répète la même plage de numéros sur plusieurs étages.',
    },
    'zimmer.nummern': {
      title: 'Numéros en liste ou en plage',
      body: '« 101-110 » crée dix chambres, « 201, 202, 205 » exactement trois. Les zéros initiaux sont conservés — « 01-10 » donne 01 à 10, et non 1 à 10.',
      tun: 'Saisissez une plage : sous le champ, vous voyez aussitôt quelles chambres seront créées.',
    },
    'zimmer.bestand': {
      title: 'Une faute de frappe ? Aucun problème',
      body: 'Chambres, étages et bâtiments sont cliquables — la fenêtre propose partout la même chose : modifier, mettre hors service, supprimer. La modification change le numéro, l’étage et le bâtiment sans perdre l’historique ni les relevés de travail ; « hors service » est la voie douce pour les rénovations. La suppression n’a lieu qu’après un avertissement chiffré.',
    },
    'regeln.zeitzone': {
      title: 'D’abord le fuseau horaire',
      body: 'Toutes les heures de cette page s’appliquent dans ce fuseau horaire. Si le mauvais est réglé, le ménage quotidien devient dû à la mauvaise heure, et les limites de journée des statistiques sont décalées elles aussi.',
    },
    'regeln.routine': {
      title: 'Ménage à la demande uniquement — ou quotidien',
      body: 'Par défaut, le ménage quotidien est désactivé : les chambres sont nettoyées quand le client le demande ou après le check-out. Cela économise eau, lessive et temps de travail. Si vous l’activez, les chambres occupées apparaissent d’elles-mêmes sur le tableau de suivi du ménage à l’heure choisie, à partir du lendemain de l’arrivée.',
    },
    'regeln.checkout': {
      title: '« Check-out jusqu’à » est l’heure au plus tôt du ménage quotidien',
      body: 'Tant que RoSe ne sait pas si le client part aujourd’hui, le ménage quotidien n’est pas dû avant cette heure. Ainsi, aucune chambre de départ n’est nettoyée avant le check-out puis une seconde fois. Si une date de départ est saisie pour le séjour, l’heure normale s’applique les jours précédents, et le jour du départ, le ménage quotidien n’a pas lieu.',
    },
    'regeln.speichern': {
      title: 'N’oubliez pas d’enregistrer',
      body: 'Les règles s’appliquent à tout dès l’enregistrement. Les séjours en cours et les demandes déjà faites continuent sans changement. Dès que vous modifiez quelque chose, une barre avec Enregistrer et Annuler les modifications apparaît aussi en bas de l’écran — inutile de faire défiler jusqu’ici.',
      tun: 'Enregistrez une fois, même sans rien modifier. C’est seulement alors que l’établissement retient le fuseau horaire et que l’étape compte comme vérifiée dans la configuration.',
    },
    'gastzugang.wahl': {
      title: 'Deux chemins vers le portail client',
      body: 'Avec le QR code fixe par chambre, un code imprimé une seule fois se trouve dans la chambre et chaque séjour reçoit son propre code PIN — deux facteurs. Avec l’accès personnel, chaque séjour reçoit son propre lien sans code PIN, qui expire au check-out : plus pratique, mais quiconque voit la feuille a accès.',
    },
    'gastzugang.speichern': {
      title: 'Changer n’a aucun effet sur les séjours en cours',
      body: 'La méthode est enregistrée avec le séjour au check-in, et n’est pas relue à chaque accès. Les accès déjà remis continuent de fonctionner jusqu’au check-out ; seul le check-in suivant applique la nouvelle méthode. Pas de date de bascule, pas de conversion des données existantes.',
      tun: 'Confirmez votre choix avec ce bouton — même si vous gardez la valeur par défaut. C’est seulement alors que l’étape compte comme faite dans la configuration.',
    },
    'personal.reinigung': {
      title: 'Les agents d’étage n’ont pas besoin d’adresse e-mail',
      body: 'Un agent d’étage reçoit un nom d’utilisateur et un code PIN — rien de plus. Le nom affiché apparaît sur le tableau et sur la carte ; la connexion se fait avec le nom d’utilisateur : qui saisit le nom affiché à la connexion est refusé. Les deux ne valent que dans cet établissement — le même nom d’utilisateur peut exister dans un autre établissement.',
    },
    'personal.liste': {
      title: 'Mettre fin à l’accès plutôt que supprimer',
      body: 'Quand quelqu’un part, mettez fin à son accès : la connexion est bloquée immédiatement, une session ouverte prend fin elle aussi, et le relevé de travail reste complet. Si la personne revient, l’accès est réactivé — la carte d’accès continue de fonctionner. La suppression définitive existe aussi, mais pour le ménage elle emporte les pointages ; la fenêtre indique au préalable ce qui disparaît.',
    },
    'services.anlegen': {
      title: 'Un service est un élément de construction',
      body: 'Le service figure en haut — « Blanchisserie », « Service technique » — avec en dessous les options que le client choisit. Deux cases déterminent le déroulement : « urgent » fait clignoter en rouge la cloche sur la tuile de la chambre et le compteur dans la navigation. « Signalement » est destiné aux pannes — ces demandes appartiennent à la chambre, pas au séjour, et restent donc ouvertes après le check-out.',
      tun: 'Cochez « Signalement » pour tout ce qui peut tomber en panne — le service technique est le cas type.',
    },
    'services.liste': {
      title: 'Les prix figurent sur le récapitulatif au check-out',
      body: 'Un service sans options peut avoir lui-même un prix, sinon chaque option ; le client le voit en faisant sa demande. Au check-out, la fenêtre de la chambre affiche le total des services fournis — il vaut donc la peine de tenir les prix à jour ici même. Sans prix, une demande ne figure sur aucun récapitulatif, et les signalements n’y figurent pas même avec un prix : ce ne sont pas des services rendus au client. RoSe ne réserve et n’encaisse rien, il additionne seulement.',
      tun: 'Saisissez un prix sur le service ou sur une option — dès la demande suivante, elle figure sur le récapitulatif au check-out.',
    },
    'einrichtung.ende': {
      title: 'C’est fait — et voici la suite',
      body: 'Votre établissement est configuré. Sous « Aide », vous retrouverez toujours tous les guides, ainsi qu’un aperçu de ce qui manque encore. Chaque guide peut être lancé individuellement, aussi souvent que vous le souhaitez. Si quelque chose ne fonctionne pas ou vous manque, écrivez-nous via « Signaler un problème » — en haut de cette page ou en bas du panneau derrière le « ? ».',
    },
    'uebersicht.kpi': {
      title: 'La situation en une ligne',
      body: 'Les chiffres du haut montrent l’état de l’établissement d’un coup d’œil — occupées, prêtes, à nettoyer, « Ne pas déranger », en cours. Ils se mettent à jour d’eux-mêmes dès qu’un client ou un agent d’étage modifie quelque chose.',
    },
    'uebersicht.etage': {
      title: 'Classées par étage',
      body: 'Chaque étage forme un bloc, l’étage le plus haut en premier. Si un agent d’étage est pointé à l’étage, son nom apparaît dans l’en-tête — vous voyez ainsi où l’on travaille sans avoir à demander.',
    },
    'uebersicht.kachel': {
      title: 'La couleur est l’état',
      body: 'La barre au-dessus du numéro dit tout : vert = prête, bleu = occupée, ambre = ménage demandé ou ménage quotidien dû, orange = check-out effectué, rose = « Ne pas déranger ». Violet et drapeau signifient prioritaire, un anneau rouge clignotant une demande de service urgente. Les petits symboles en dessous donnent la raison.',
      tun: 'Survolez une tuile avec la souris — l’info-bulle décrit l’état en clair.',
    },
    'uebersicht.dialog': {
      title: 'Un clic ouvre la chambre',
      body: 'La fenêtre contient le check-in et le check-out, le code PIN du client à lire, la feuille d’arrivée à imprimer, la date de départ, la priorité et l’historique des 30 derniers jours. Le check-in tient en un clic ; la date de départ est facultative et peut être ajoutée à tout moment.',
      tun: 'Cliquez donc sur une chambre — le guide reste ouvert.',
    },
    'uebersicht.checkout': {
      title: 'Au check-out, le montant s’affiche',
      body: 'Si le client a commandé des services payants, la fenêtre met en évidence ce qui reste à encaisser avant votre confirmation — avec « Détails » sous forme de récapitulatif imprimable : chambre, période, postes avec heures, total. Pas de nom de client, pas de facture. Si rien de payant n’a été commandé, il n’y a qu’une remarque et le check-out se fait comme d’habitude.',
      tun: 'Le check-out clôt les demandes ouvertes comme « non effectuées » — cochez auparavant, dans le même encadré, ce qui a réellement été fourni. Plus tard, vous retrouvez le récapitulatif via l’historique de la chambre : l’entrée « Check-out » porte le lien.',
    },
    'kopf.hilfe': {
      title: 'L’aide — et « Signaler un problème »',
      body: 'Le « ? » ouvre l’explication à côté de chaque page. En bas de ce panneau se trouve « Signaler un problème » : pour une erreur, une formulation peu claire, une question ou une idée, avec une capture d’écran si vous le souhaitez. Notre réponse arrive ici, dans RoSe, sous « Mes tickets » ; un point rouge sur le « ? » vous indique qu’elle est là. Transmettez de la même façon ce que remarquent les clients ou l’équipe d’étage.',
      tun: 'Cliquez sur le « ? » et jetez un œil au panneau — rien ne vous oblige à signaler quoi que ce soit.',
    },
    'anfragen.zaehler': {
      title: 'Tout ce que demandent les clients',
      body: 'Les demandes du portail client arrivent ici. Le même nombre apparaît en pastille sur « Demandes » dans la navigation — il clignote en rouge dès qu’au moins une demande concerne un service urgent, et la tuile de la chambre concernée reçoit une cloche.',
    },
    'anfragen.liste': {
      title: 'Ce que contient une demande',
      body: 'Numéro de chambre, service, options choisies avec prix, remarque libre du client et ancienneté de la demande. Les nouvelles demandes apparaissent d’elles-mêmes — la page se met à jour par la même connexion en direct que les tableaux.',
    },
    'anfragen.erledigt': {
      title: 'La coche décide du montant',
      body: 'Une demande est ouverte ou close ; il n’y a ni « en cours » ni attribution. À la clôture, la différence compte : « Effectuée » signifie que le service a été fourni — et la demande figure avec son montant sur le récapitulatif au check-out. Ce qui est encore ouvert à ce moment-là, RoSe le clôt comme « non effectuée » : mentionné, mais pas dans le total. Les signalements font exception : une panne reste ouverte jusqu’à ce que quelqu’un la coche — même après le check-out, et le check-in suivant affiche un avertissement.',
      tun: 'Cochez tout de suite une demande effectuée — sinon elle manque au total à la fin.',
    },
    'anfragen.verlauf': {
      title: 'Les demandes closes restent traçables',
      body: 'Les demandes closes passent dans la liste repliée en dessous, avec heure et nom ; les demandes non effectuées y sont signalées. Elles apparaissent aussi dans l’historique de la chambre — pratique lorsqu’un client demande plus tard si sa demande est bien arrivée.',
    },
    'zimmer.bereich': {
      title: 'Bâtiment et étage',
      body: 'Le bâtiment est facultatif et ne sert qu’aux établissements qui ont réellement des ailes séparées. Il influe toutefois sur l’unicité : les numéros de chambre ne doivent être uniques que par bâtiment — « 101 » peut exister dans le bâtiment principal et dans l’annexe.',
    },
    'zimmer.praefix': {
      title: 'Préfixer le numéro d’étage',
      body: 'Si chaque étage utilise la même plage de numéros, vous avez besoin de cette case : l’étage 2 et « 05 » donnent « 205 ». Sans elle, les numéros entrent en collision et seul le premier étage serait créé — la page vous prévient avant.',
    },
    'zimmer.absenden': {
      title: 'D’abord l’aperçu, puis le clic',
      body: 'Au-dessus du bouton, vous voyez combien de chambres seront créées et comment elles s’appelleront. Rien n’est écrit avant votre clic — essayez autant que vous voulez avant.',
    },
    'regeln.logo': {
      title: 'Votre logo sur les impressions',
      body: 'L’affiche de chambre et la feuille d’arrivée portent votre logo en haut à gauche ; sans logo, le nom de l’établissement y figure. PNG, JPG ou SVG, 1 Mo maximum. Deux pièges : une image trop petite paraît floue à 55 mm, et un logo clair prévu pour des fonds sombres est invisible sur du papier blanc — c’est pourquoi l’aperçu l’affiche sur fond blanc.',
    },
    'regeln.checkin': {
      title: '« Check-in à partir de » pilote les départs',
      body: 'Les chambres de départ doivent être prêtes à cette heure. Le tableau de suivi du ménage travaille avec cette heure : plus il reste de départs ouverts et plus le check-in approche, plus il attire les agents d’étage vers les étages avec des départs — à peine les jours calmes, nettement les jours chargés. Une priorité définie par la réception passe toujours en premier.',
    },
    'regeln.aufschub': {
      title: '« Pas avant » — le client reporte',
      body: 'Le client souhaite le ménage, mais pas avant une certaine heure, parce qu’il veut faire la grasse matinée. Jusque-là, la chambre ne compte pas comme ouverte sur le tableau. Choisissez la limite de sorte que le ménage tienne encore dans le service ensuite : ménage jusqu’à 15:00 signifie 13:00.',
    },
    'regeln.personenbezug': {
      title: 'Par agent d’étage ou en équipe uniquement',
      body: 'Si, dans votre établissement, le travail de chaque agent d’étage ne peut pas ou ne doit pas être mesuré, choisissez « Équipe uniquement » : les statistiques n’affichent alors que le total de l’établissement, l’historique de la chambre indique « Équipe d’étage », et les pointages perdent leur personne à la fin du service — lors du changement, tous les pointages existants aussi. Vous pouvez revenir en arrière, mais les noms des pointages anonymisés ne reviennent pas. Avec un seul agent d’étage en service, la protection reste de toute façon formelle.',
    },
    'regeln.fenster': {
      title: 'Demandes de ménage seulement à certaines heures',
      body: 'En dehors de la plage, le client ne peut pas envoyer de demande et voit à la place vos horaires de ménage. « Ne pas déranger » et le retrait d’une demande restent toujours possibles — sinon quelqu’un resterait coincé avec une demande dont il ne peut pas se défaire.',
    },
    'regeln.pin': {
      title: 'Longueur du code PIN et fins oubliées',
      body: 'La longueur du code PIN s’applique aux codes PIN clients nouvellement créés ; les séjours en cours gardent le leur. La seconde valeur règle les fins oubliées : si un ménage commencé n’est pas terminé, la chambre se rouvre d’elle-même après ce délai — et l’historique note que le délai a été dépassé.',
    },
    'regeln.adresse': {
      title: 'L’adresse de votre établissement',
      body: 'Les clients et les agents d’étage se connectent à cette adresse. Elle fait partie des deux connexions, car les numéros de chambre et les noms d’utilisateur ne sont uniques qu’au sein de l’établissement. Les QR codes imprimés restent valables après un changement — seules les adresses saisies à la main d’après d’anciennes feuilles d’arrivée ne correspondront plus.',
    },
    'gastzugang.sprachen': {
      title: 'Langues de l’établissement',
      body: 'Le portail client affiche à chaque client la langue de son téléphone, s’il la propose. Sinon, votre langue de repli s’applique. Les feuilles imprimées expliquent le portail avec des images de ses boutons — le texte est dans la langue de repli et, si vous le souhaitez, dans une deuxième langue. Imprimer davantage de langues sur papier aide moins que la place que cela coûte.',
      tun: 'La langue principale est celle dans laquelle vous créez les contenus. La langue de repli est aussi la première langue des impressions et de l’e-mail d’accès — la deuxième n’apparaît que sur l’impression.',
    },
    'gastzugang.aushang': {
      title: 'Les affiches de chambre',
      body: 'Avec la méthode par code PIN, chaque chambre a besoin de son affiche : A4 pour cadres, chevalets ou classeurs, ou quatre cartes compactes par page à découper. Imprimée une fois, valable en permanence. Avec l’accès personnel, les affiches sont masquées : elles mèneraient à une saisie de code PIN que personne ne peut utiliser.',
    },
    'aushang.karte': {
      title: 'Une affiche par chambre',
      body: 'L’affiche va dans la chambre — sur un chevalet, dans un cadre ou dans le classeur : QR code, numéro de chambre, nom de l’établissement. Le client scanne le QR code et saisit seulement son code PIN. Le code appartient à la chambre, pas au séjour — il reste valable pour tous les clients et ne s’imprime qu’une seule fois.',
    },
    'aushang.knopf': {
      title: 'D’abord créer, puis imprimer',
      body: 'Les chambres sans code sont regroupées ici : le bouton crée d’un coup tous ceux qui manquent. Une fois qu’ils existent tous, il devient le bouton d’impression — une page par chambre, pour que chaque affiche puisse être utilisée séparément. Les chambres nouvellement créées nécessitent donc un second passage.',
    },
    'aushang.erneuern': {
      title: 'Renouveler rend l’ancienne affiche inutilisable',
      body: 'Si une affiche disparaît ou qu’un code doit être retiré pour une autre raison, « Renouveler le code » en crée un nouveau — et l’ancienne affiche cesse de fonctionner dès ce moment. C’est pourquoi seuls le titulaire du compte et les managers peuvent le faire, et cela ne concerne toujours qu’une seule chambre.',
    },
    'aushang.hinweis': {
      title: 'Uniquement avec la méthode du QR code fixe par chambre',
      body: 'Si votre établissement utilise l’accès personnel par séjour, ces affiches mènent à une saisie de code PIN que les nouveaux clients ne peuvent pas utiliser — elles n’ont alors rien à faire dans les chambres. La page le signale en haut.',
    },
    'aushang.blatt': {
      title: 'La feuille d’arrivée naît au check-in',
      body: 'Contrairement à l’affiche de chambre, elle appartient à un seul séjour. Vous la trouvez dans la fenêtre de la chambre une fois le client enregistré : une feuille avec code PIN, QR code et un court guide qui suit les règles de votre établissement — si l’établissement nettoie chaque jour les chambres occupées, le texte le dit ; sinon, il invite le client à demander le ménage sur le portail. La même chose peut être envoyée par e-mail ; l’adresse n’est pas enregistrée.',
      tun: 'Cliquez sur une chambre occupée — le chemin vers la feuille d’arrivée se trouve dans la fenêtre.',
    },
    'aushang.login': {
      title: 'Cartes d’accès pour l’équipe d’étage',
      body: 'La troisième impression : une carte par agent d’étage, qui permet de se connecter au tableau sans rien saisir. Une carte nouvellement émise rend l’ancienne inutilisable — exactement la démarche à suivre en cas de perte. La carte survit à « Mettre fin à l’accès » et refonctionne après la réactivation.',
    },
    'personal.karte': {
      title: 'Cartes d’accès avec QR code',
      body: 'Au lieu de saisir un code PIN, les agents d’étage peuvent se connecter avec une carte imprimée — un scan, et c’est fait. Une carte nouvellement émise rend l’ancienne inutilisable ; c’est exactement la démarche à suivre si une carte disparaît.',
    },
    'personal.rezeption': {
      title: 'Comptes de la réception',
      body: 'La réception gère le quotidien : check-in et check-out, priorités, demandes, impression des feuilles d’arrivée et des cartes. Les paramètres, la configuration des chambres, les services et la gestion du personnel lui restent fermés.',
    },
    'personal.manager': {
      title: 'Managers — réservé au titulaire du compte',
      body: 'Un manager a les mêmes droits que vous dans l’établissement, mais pas d’accès au compte ni à la facturation. Une personne qui travaille dans plusieurs établissements est ajoutée par établissement — à partir de la deuxième fois sans nouveau compte. Le retrait ne concerne toujours que cet établissement.',
    },
    'services.beispiele': {
      title: 'Commencer avec des exemples',
      body: 'Tant qu’aucun service n’existe, vous pouvez reprendre deux services prêts à l’emploi et les adapter. Ce sont des services tout à fait normaux — renommez-les, complétez-les ou archivez-les à tout moment.',
    },
    'reinigung.login': {
      title: 'Connexion sans e-mail',
      body: 'Un agent d’étage a un nom d’utilisateur et un code PIN — ou scanne sa carte d’accès imprimée et est connecté immédiatement. Les deux ne valent que dans cet établissement — le même nom d’utilisateur peut exister ailleurs.',
    },
    'reinigung.schicht': {
      title: 'D’abord prendre son service, ensuite travailler',
      body: 'Aucun ménage ne peut commencer sans service commencé. La prise de service est aussi le premier pointage du relevé de travail — à partir de ces pointages, les statistiques calculent ensuite les temps de travail, de pause et de ménage.',
      tun: 'Tirez le curseur jusqu’au bout — il ne se déclenche qu’à 97 % de la course.',
    },
    'reinigung.etagen': {
      title: 'Des étages plutôt qu’une longue liste',
      body: 'Après la prise de service vient d’abord le niveau des étages, dans le même ordre fixe qu’à la réception. Chaque ligne indique ce qui reste ouvert, si une priorité attend et qui y travaille déjà.',
    },
    'reinigung.naechstes': {
      title: '« À suivre » est une recommandation, pas une attribution',
      body: 'Un seul étage porte le badge. Si une chambre prioritaire est ouverte quelque part, c’est cet étage — une décision de la réception passe en premier. Sinon, l’urgence ouverte la plus élevée divisée par le nombre d’agents d’étage présents plus un ; les départs pèsent d’autant plus que le check-in approche. Là où quelqu’un travaille déjà, le déplacement vaut moins la peine. Les étages sans travail ouvert sortent du calcul, et en cas d’égalité l’étage le plus bas l’emporte — la recommandation ne saute donc pas d’un étage à l’autre.',
    },
    'reinigung.kacheln': {
      title: 'Choisir un étage, c’est s’y pointer',
      body: 'Qui se pointe apparaît désormais sur cet étage — dans la vue d’ensemble de la réception et pour toute l’équipe. Les chambres grisées ne sont pas bloquées, elles n’ont simplement pas de tâche : libres, « Ne pas déranger », pas de ménage souhaité aujourd’hui, ou un ménage qui ne s’applique que plus tard.',
    },
    'reinigung.starten': {
      title: 'Démarrer par un curseur, pas par un bouton',
      body: 'Un appui sur la tuile ouvre la chambre. Le ménage démarre par un glissement qui doit commencer à la poignée et couvrir presque toute la course — un téléphone dans la poche d’un tablier ne doit pas démarrer de ménage.',
    },
    'reinigung.tuer': {
      title: 'Le client est là et ne veut pas maintenant ?',
      body: 'Inutile de démarrer quoi que ce soit : « Dans 30 min » ou « Dans 1 h » retire la chambre du tableau jusque-là — pour toute l’équipe, personne ne frappe entre-temps ; ensuite elle se rouvre d’elle-même. « Pas aujourd’hui » règle la question pour la journée. Si le client souhaite tout de même le ménage, il le demande sur le portail. Aucun des deux ne compte comme un ménage, mais tous deux apparaissent dans l’historique de la chambre.',
      tun: 'Essayez l’un des trois boutons — la tuile indique ensuite ce qui s’est passé.',
    },
    'reinigung.abschliessen': {
      title: 'Terminer — et ce qui se passe en cas d’oubli',
      body: 'Entre le début et la fin, la chambre apparaît « en cours » pour tout le monde. Si la fin est oubliée, la chambre se rouvre d’elle-même après le délai réglé, et l’historique note que le délai a été dépassé — au lieu qu’un processus à moitié fini reste là pour toujours.',
    },
    'reinigung.status': {
      title: 'Pause, autres tâches de nettoyage, fin de service',
      body: 'Tous les changements d’état se trouvent sur une page à part, pas sur le tableau — ainsi le bouton retour du téléphone fonctionne. Les pauses et les autres tâches de nettoyage sont des périodes au sein du service et ne peuvent chevaucher rien d’autre ; la fin de service clôt les deux. En dessous figure le bilan du jour de l’agent d’étage.',
    },
    'reinigung.verlassen': {
      title: 'Quitter un étage est un acte délibéré',
      body: 'Le retour se fait aussi par un curseur, de droite à gauche. Un appui maladroit ne doit faire sortir personne de l’étage — cela fausserait l’affichage de la localisation de l’équipe.',
    },
    'gast.zugang': {
      title: 'Pas de compte, pas d’application',
      body: 'Le client scanne l’affiche dans la chambre et saisit le code PIN de la feuille d’arrivée — ou ouvre le lien personnel reçu au check-in et est connecté sans code PIN. L’établissement choisit lequel des deux s’applique sous « Accès clients ».',
    },
    'gast.portal': {
      title: 'Un écran, rien de plus',
      body: 'Après la connexion, le client reste connecté sur son appareil — le code PIN ne lui est pas demandé une seconde fois. Le portail affiche l’établissement et la chambre en haut.',
    },
    'gast.reinigen': {
      title: 'Un appui suffit',
      body: '« Nettoyer ma chambre » enregistre la demande, et la chambre apparaît aussitôt sur le tableau de suivi du ménage et dans la vue d’ensemble de la réception. Un nouvel appui la retire. Rien de tout cela n’est un rendez-vous — l’équipe d’étage passe quand cela s’intègre dans sa tournée.',
      tun: 'Appuyez donc dessus ; la simulation réagit comme le vrai portail.',
    },
    'gast.aufschub': {
      title: '« Pas avant » — pour les lève-tard',
      body: 'Le client souhaite le ménage, mais pas avant une certaine heure. Jusque-là, la chambre ne compte pas comme ouverte sur le tableau, et la tuile affiche une horloge. L’établissement fixe jusqu’à quand on peut reporter — et le portail précise que la limite vient de l’établissement.',
    },
    'gast.aktiv': {
      title: 'Le client voit ce qu’il a déclenché',
      body: 'Une demande active reste visible, heure choisie comprise, et la carte d’état au-dessus indique au client où en sont les choses — prévu, à partir d’une certaine heure, en cours, déjà nettoyée aujourd’hui. Le moment exact du passage n’est volontairement pas affiché : sans logique d’attribution, RoSe ne pourrait pas tenir cette promesse.',
    },
    'gast.verzicht': {
      title: '« Pas de ménage aujourd’hui » — uniquement avec le ménage quotidien',
      body: 'Si l’établissement fait le ménage chaque jour, le client y renonce pour aujourd’hui d’un appui. Ce n’est pas la même chose que « Ne pas déranger » : la renonciation ne vaut que jusqu’à minuit, les services et la réception restent joignables, et le ménage reprend demain. Sur le tableau, la chambre devient grise avec une feuille. Si l’établissement ne fait le ménage qu’à la demande, le bouton n’existe pas — là, ne pas demander, c’est déjà renoncer.',
    },
    'gast.dnd': {
      title: '« Ne pas déranger » l’emporte sur tout',
      body: 'Tant qu’il est actif, personne ne frappe — pas même pour un service — et le ménage quotidien n’a pas lieu. Il reste valable jusqu’à ce que le client le désactive, la nuit comprise. Le désactiver est toujours possible — contrairement à la demande de ménage, « Ne pas déranger » n’est jamais bloqué par une plage horaire, sinon quelqu’un resterait coincé avec.',
    },
    'gast.services': {
      title: 'Les services du catalogue',
      body: 'Le client voit exactement les services que l’établissement a configurés, avec les prix à titre indicatif. Commander tient en un appui ; la demande arrive à la réception sous « Demandes ». Rien n’est facturé dans RoSe.',
    },
    'gast.bestellt': {
      title: 'Et ensuite, c’est fini',
      body: 'Les demandes ouvertes restent visibles pour le client jusqu’à ce que la réception les traite. Au check-out, code PIN, lien et connexion expirent immédiatement — le séjour reste anonyme, aucun nom n’a jamais été en jeu.',
    },
    'auswertung.zeitraum': {
      title: 'La période figure dans l’adresse',
      body: 'Du… au… sous forme de formulaire ordinaire qui inscrit la période dans l’adresse. Un état peut ainsi être mis en lien, transmis et imprimé — et à l’impression, le formulaire lui-même disparaît.',
    },
    'auswertung.kennzahlen': {
      title: 'Tout est calculé, rien n’est stocké',
      body: 'Les chiffres viennent des pointages des agents d’étage : début et fin de service, pauses, autres tâches de nettoyage, début et fin par chambre. Le « Temps de travail net » est le service sans les pauses ; le « Temps restant » est ce qui n’était ni chambre ni autres tâches de nettoyage — trajets et préparation.',
    },
    'auswertung.auffaellig': {
      title: 'Les pointages invraisemblables ne comptent pas dans les totaux',
      body: 'Un service de plus de 16 heures est une fin de service oubliée, une pause de plus de quatre heures une fin de pause oubliée, et un ménage sans fin ne compte pas comme travail effectué. Ces cas sont comptés ici au lieu d’être inclus — sinon un service ouvert traînerait le temps de travail pendant des jours et rendrait toutes les statistiques inutilisables.',
    },
    'auswertung.tabelle': {
      title: 'Par agent d’étage — anciens compris',
      body: 'Une personne dont l’accès a pris fin reste visible dans les statistiques ; le relevé de travail survit au départ. Un clic sur le nom ouvre le journal du jour avec les pointages un par un.',
    },
    'auswertung.nachfrage': {
      title: 'Quand le travail arrive',
      body: 'La seconde partie répond à une question de planification : à quelles heures les clients souhaitent-ils le ménage, quand font-ils leur check-out — et combien d’agents d’étage étaient en service à ce moment-là ? Le chiffre « Demandes sans personne en service » est la vraie indication. C’est pourquoi RoSe ne demande pas aux clients d’heures préférées : les données sont déjà là.',
    },
    'konto.plan': {
      title: 'Un prix, pas de formules',
      body: 'La facturation se fait par chambre et par mois calendaire, avec un montant minimum par compte — pas par établissement. Une chaîne paie donc la somme de ses chambres, et non trois fois le minimum. Toutes les fonctions sont incluses ; il n’y a rien vers quoi vous devriez passer plus tard.',
    },
    'konto.laufend': {
      title: 'Un décompte généreux, mais clair',
      body: 'Une chambre compte pour le mois dès qu’elle a été en service pendant celui-ci, même brièvement — mise hors service aujourd’hui, elle compte encore ; créée aujourd’hui aussi. Le nombre n’est donc définitif qu’en fin de mois, et le mois en cours est toujours un aperçu.',
    },
    'konto.monate': {
      title: 'Les mois clos sont figés',
      body: 'Une fois un mois terminé, son montant ne change plus — pas même si vous supprimez des chambres plus tard : avant chaque suppression, le nombre de chambres des mois concernés est enregistré.',
    },
    'konto.zahlungsweg': {
      title: 'Moyen de paiement et données de facturation',
      body: 'La carte ou le prélèvement SEPA sont enregistrés sans débit et prélevés lors du traitement mensuel ; si vous préférez payer sur facture, virez le montant aux coordonnées bancaires figurant sur la facture. Le destinataire de la facture, l’adresse et — dans l’UE hors d’Allemagne — le numéro de TVA intracommunautaire sont obligatoires, car sinon la taxe ne peut pas être calculée correctement.',
    },
    'konto.rechnungen': {
      title: 'Les factures arrivent le premier du mois',
      body: 'Pour le mois précédent, sous forme électronique, payables sous 14 jours. Chaque facture est disponible ici en PDF et sous forme de page de consultation. Le prestataire les conserve même après la suppression d’un compte — téléchargez les PDF auparavant ; ensuite, la page n’est plus accessible.',
    },
  },

  setup: {
    zimmer: {
      label: 'Chambres configurées',
      todo: 'Configurer les chambres',
      done: { one: '{count} chambre en service', other: '{count} chambres en service' },
      open: 'Sans chambres, pas de check-in ni de tableau de suivi du ménage',
    },
    regeln: {
      label: 'Règles de l’établissement vérifiées',
      todo: 'Vérifier les règles de l’établissement',
      done: 'Fuseau horaire réglé — ménage quotidien, heure limite du check-out et statistiques calculent correctement',
      open: 'Surtout le fuseau horaire — vérifiez-le une fois et enregistrez, même sans modification',
    },
    gastzugang: {
      label: 'Accès clients choisi',
      todo: 'Choisir l’accès clients',
      done: 'La méthode est définie — chaque check-in l’enregistre avec le séjour',
      open: 'QR code fixe par chambre avec code PIN ou accès personnel par séjour — confirmez le choix une fois, même la valeur par défaut',
    },
    personal: {
      label: 'Agent d’étage ajouté',
      todo: 'Ajouter un agent d’étage',
      done: { one: 'Un compte d’agent d’étage', other: '{count} comptes d’agents d’étage' },
      open: 'Sans compte, personne n’accède au tableau de suivi du ménage',
    },
    services: {
      label: 'Services configurés',
      todo: 'Configurer les services',
      done: { one: 'Un service dans le catalogue', other: '{count} services dans le catalogue' },
      open: 'Facultatif — sans services, le portail client n’affiche que le ménage et « Ne pas déranger »',
    },
    checkin: {
      label: 'Premier check-in',
      todo: 'Essayer le premier check-in',
      done: 'Le déroulement a été parcouru une fois',
      open: 'Cliquez sur une chambre, puis sur « Check-in » — le code PIN s’affiche aussitôt à l’écran',
    },
    zahlungsweg: {
      label: 'Moyen de paiement ajouté',
      todo: 'Ajouter un moyen de paiement',
      done: 'Les données de facturation et le moyen de paiement sont définis',
      open: 'Le premier mois est gratuit — vous pouvez ajouter le moyen de paiement à tout moment',
    },
  },
} satisfies Shape<typeof de>
