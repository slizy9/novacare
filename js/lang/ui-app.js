/* NOVACARE — translations for js/app.js */
(() => {
  const D = {};
  const a = (en, es, pt, fr) => { D[en] = { es, pt, fr }; };

  /* ---------- top bar, navigation ---------- */
  a("NovaCare — Health Monitoring System", "NovaCare — Sistema de monitoreo de salud", "NovaCare — Sistema de monitoramento de saúde", "NovaCare — Système de suivi de santé");
  a("Back to the mission lobby", "Volver al inicio de la misión", "Voltar ao início da missão", "Retour à l’accueil de la mission");
  a("System Online", "Sistema en línea", "Sistema online", "Système en ligne");
  a("Offline mode", "Modo sin conexión", "Modo offline", "Mode hors ligne");
  a("Environment and mission settings", "Entorno y ajustes de la misión", "Ambiente e ajustes da missão", "Environnement et réglages de la mission");
  a("Reminders", "Recordatorios", "Lembretes", "Rappels");
  a("Reminders, {n} pending", "Recordatorios, {n} pendientes", "Lembretes, {n} pendentes", "Rappels, {n} en attente");
  a("Switch to light mode", "Cambiar a modo claro", "Mudar para o modo claro", "Passer au mode clair");
  a("Switch to dark mode", "Cambiar a modo oscuro", "Mudar para o modo escuro", "Passer au mode sombre");
  a("Mission day — changes at midnight", "Día de misión: cambia a medianoche", "Dia da missão: muda à meia-noite", "Jour de mission : change à minuit");
  a("Guest — data stays on this device", "Invitado: los datos se quedan en este dispositivo", "Convidado: os dados ficam neste dispositivo", "Invité : les données restent sur cet appareil");
  a("Signed in as {s}", "Sesión iniciada como {s}", "Conectado como {s}", "Connecté en tant que {s}");
  a("Sign out", "Cerrar sesión", "Sair", "Se déconnecter");
  a("Create or join a mission first", "Primero crea o únete a una misión", "Primeiro crie ou entre em uma missão", "Créez ou rejoignez d’abord une mission");
  a("{s} (press {n})", "{s} (presiona {n})", "{s} (tecle {n})", "{s} (touche {n})");
  a("{n} active emergencies", "{n} emergencias activas", "{n} emergências ativas", "{n} urgences actives");
  a("Mission settings", "Ajustes de la misión", "Ajustes da missão", "Réglages de la mission");
  a("Home", "Inicio", "Início", "Accueil");
  a("My health", "Mi salud", "Minha saúde", "Ma santé");
  a("Crew", "Tripulación", "Tripulação", "Équipage");
  a("Mission", "Misión", "Missão", "Mission");
  a("Insights", "Análisis", "Análises", "Analyses");
  a("How you are today and what to do next", "Cómo estás hoy y qué hacer después", "Como você está hoje e o que fazer em seguida", "Comment vous allez aujourd’hui et quoi faire ensuite");
  a("Your readings, routine and medical profile", "Tus mediciones, rutina y perfil médico", "Suas medições, rotina e perfil médico", "Vos mesures, votre routine et votre profil médical");
  a("Your crewmates, their allergies and the ship inventory", "Tus compañeros, sus alergias y el inventario de la nave", "Seus colegas, suas alergias e o inventário da nave", "Vos équipiers, leurs allergies et l’inventaire du vaisseau");
  a("Mission status, the log, and switching missions", "Estado de la misión, el registro y cambio de misión", "Status da missão, o registro e troca de missão", "État de la mission, journal et changement de mission");
  a("Who is doing well and who needs help", "Quién está bien y quién necesita ayuda", "Quem está bem e quem precisa de ajuda", "Qui va bien et qui a besoin d’aide");
  a("Overview", "Resumen", "Resumo", "Aperçu");
  a("Today", "Hoy", "Hoje", "Aujourd’hui");
  a("Vitals", "Signos vitales", "Sinais vitais", "Constantes");
  a("Hazards", "Riesgos", "Riscos", "Risques");
  a("Medical profile", "Perfil médico", "Perfil médico", "Profil médical");

  /* ---------- small components ---------- */
  a("○ No data", "○ Sin datos", "○ Sem dados", "○ Aucune donnée");
  a("Target: {n} {s} or more", "Objetivo: {n} {s} o más", "Meta: {n} {s} ou mais", "Cible : {n} {s} ou plus");
  a("Target: up to {n} {s}", "Objetivo: hasta {n} {s}", "Meta: até {n} {s}", "Cible : jusqu’à {n} {s}");
  a("Target: {n}–{n} {s}", "Objetivo: {n}–{n} {s}", "Meta: {n}–{n} {s}", "Cible : {n}–{n} {s}");
  a("Target: {s}", "Objetivo: {s}", "Meta: {s}", "Cible : {s}");
  a("Your first entry sets the baseline", "Tu primer registro fija la base", "Seu primeiro registro define a base", "Votre première saisie fixe la référence");
  a("No readings in this period yet.", "Aún no hay mediciones en este periodo.", "Ainda não há medições neste período.", "Aucune mesure sur cette période.");
  a("MD {n}: {n} {s} — {s}", "MD {n}: {n} {s} — {s}", "MD {n}: {n} {s} — {s}", "MD {n} : {n} {s} — {s}");
  a("{s} over time", "{s} a lo largo del tiempo", "{s} ao longo do tempo", "{s} au fil du temps");
  a("Target range", "Rango objetivo", "Faixa da meta", "Plage cible");
  a("Watch range", "Rango de vigilancia", "Faixa de atenção", "Plage de surveillance");
  a("Hover a point for its value", "Pasa el cursor sobre un punto para ver su valor", "Passe o cursor sobre um ponto para ver o valor", "Survolez un point pour voir sa valeur");
  a("Mission ready", "Lista para la misión", "Pronto para a missão", "Prêt pour la mission");
  a("Keep watch", "Vigila", "Fique atento", "À surveiller");
  a("Needs attention", "Necesita atención", "Precisa de atenção", "Nécessite de l’attention");
  a("Act now", "Actúa ya", "Aja agora", "Agissez maintenant");
  a("No data yet", "Sin datos aún", "Sem dados ainda", "Pas encore de données");
  a("readiness", "preparación", "prontidão", "aptitude");

  /* ---------- lobby ---------- */
  a("Welcome aboard. Create your own mission or join one to start tracking your health with a crew.", "Bienvenido a bordo. Crea tu propia misión o únete a una para seguir tu salud con una tripulación.", "Bem-vindo a bordo. Crie sua própria missão ou entre em uma para acompanhar sua saúde com uma tripulação.", "Bienvenue à bord. Créez votre mission ou rejoignez-en une pour suivre votre santé avec un équipage.");
  a("Mission day {n} of {n}", "Día de misión {n} de {n}", "Dia da missão {n} de {n}", "Jour de mission {n} sur {n}");
  a("Day", "Día", "Dia", "Jour");
  a("of {n}", "de {n}", "de {n}", "sur {n}");
  a("{n} day to go", "{n} día restante", "{n} dia restante", "{n} jour restant");
  a("{n} days to go", "{n} días restantes", "{n} dias restantes", "{n} jours restants");
  a("Last day", "Último día", "Último dia", "Dernier jour");
  a("Your personal space. Log check-ins and explore every section — join or create a mission any time from the Mission tab.", "Tu espacio personal. Registra chequeos y explora cada sección; únete a una misión o crea una cuando quieras desde la pestaña Misión.", "Seu espaço pessoal. Faça check-ins e explore cada seção; entre em uma missão ou crie uma quando quiser pela aba Missão.", "Votre espace personnel. Faites vos bilans et explorez chaque section ; rejoignez ou créez une mission à tout moment depuis l’onglet Mission.");
  a("Choose a mission", "Elegir una misión", "Escolher uma missão", "Choisir une mission");
  a("Check-in done", "Chequeo hecho", "Check-in feito", "Bilan fait");
  a("Quick status due", "Estado rápido pendiente", "Status rápido pendente", "Point rapide à faire");
  a("{n} new recommendation to read", "{n} recomendación nueva por leer", "{n} recomendação nova para ler", "{n} nouvelle recommandation à lire");
  a("{n} new recommendations to read", "{n} recomendaciones nuevas por leer", "{n} recomendações novas para ler", "{n} nouvelles recommandations à lire");
  a("Nothing else to fill in right now", "Nada más que completar por ahora", "Nada mais para preencher agora", "Rien d’autre à remplir pour l’instant");
  a("How do you feel?", "¿Cómo te sientes?", "Como você está se sentindo?", "Comment vous sentez-vous ?");
  a("See", "Ver", "Ver", "Voir");
  a("Edit", "Editar", "Editar", "Modifier");
  a("No check-in today", "Sin chequeo hoy", "Sem check-in hoje", "Pas de bilan aujourd’hui");
  a("You can still do it any time", "Aún puedes hacerlo cuando quieras", "Você ainda pode fazer a qualquer hora", "Vous pouvez encore le faire à tout moment");
  a("Start check-in", "Iniciar chequeo", "Iniciar check-in", "Commencer le bilan");
  a("Do today’s check-in?", "¿Hacemos el chequeo de hoy?", "Fazer o check-in de hoje?", "Faire le bilan du jour ?");
  a("About a minute · one screen", "Cerca de un minuto · una pantalla", "Cerca de um minuto · uma tela", "Environ une minute · un écran");
  a("Not today", "Hoy no", "Hoje não", "Pas aujourd’hui");
  a("Start", "Empezar", "Começar", "Commencer");
  a("Good morning", "Buenos días", "Bom dia", "Bonjour");
  a("Good afternoon", "Buenas tardes", "Boa tarde", "Bon après-midi");
  a("Good evening", "Buenas noches", "Boa noite", "Bonsoir");
  a("Your health", "Tu salud", "Sua saúde", "Votre santé");
  a("Add info", "Agregar datos", "Adicionar dados", "Ajouter des infos");
  a("Check-in done · add more", "Chequeo hecho · agrega más", "Check-in feito · adicione mais", "Bilan fait · ajoutez-en");
  a("Today’s check-in · about a minute", "Chequeo de hoy · cerca de un minuto", "Check-in de hoje · cerca de um minuto", "Bilan du jour · environ une minute");
  a("How do you feel", "Cómo te sientes", "Como você se sente", "Comment vous sentez-vous");
  a("Quick status is due", "Es hora del estado rápido", "Está na hora do status rápido", "Le point rapide est à faire");
  a("Quick status · {n} seconds", "Estado rápido · {n} segundos", "Status rápido · {n} segundos", "Point rapide · {n} secondes");
  a("Questions", "Preguntas", "Perguntas", "Questions");
  a("Voice or text, works offline", "Voz o texto, funciona sin conexión", "Voz ou texto, funciona offline", "Voix ou texte, fonctionne hors ligne");
  a("Heart rate", "Frecuencia cardíaca", "Frequência cardíaca", "Fréquence cardiaque");
  a("Blood pressure", "Presión arterial", "Pressão arterial", "Tension artérielle");
  a("Oxygen (SpO₂)", "Oxígeno (SpO₂)", "Oxigênio (SpO₂)", "Oxygène (SpO₂)");
  a("Sleep", "Sueño", "Sono", "Sommeil");
  a("Blood oxygen", "Oxígeno en sangre", "Oxigênio no sangue", "Oxygène sanguin");
  a("Temperature", "Temperatura", "Temperatura", "Température");
  a("Stress", "Estrés", "Estresse", "Stress");
  a("Not logged", "Sin registrar", "Não registrado", "Non saisi");
  a("{s} · MD {n}", "{s} · MD {n}", "{s} · MD {n}", "{s} · MD {n}");
  a("{s} · follow-up", "{s} · seguimiento", "{s} · acompanhamento", "{s} · suivi");
  a("{s}, open trend", "{s}, abrir tendencia", "{s}, abrir tendência", "{s}, ouvrir la tendance");
  a("You today", "Tú hoy", "Você hoje", "Vous aujourd’hui");
  a("Log a check-in to get your readiness score.", "Haz un chequeo para obtener tu puntuación de preparación.", "Faça um check-in para obter sua pontuação de prontidão.", "Faites un bilan pour obtenir votre score d’aptitude.");
  a("No active concerns", "Sin problemas activos", "Sem preocupações ativas", "Aucune alerte active");
  a("{n} mSv this mission", "{n} mSv esta misión", "{n} mSv nesta missão", "{n} mSv cette mission");
  a("Crew on track", "Tripulación en buen camino", "Tripulação no caminho certo", "Équipage en bonne voie");
  a("Active emergencies", "Emergencias activas", "Emergências ativas", "Urgences actives");
  a("Supplies low or out", "Suministros bajos o agotados", "Suprimentos baixos ou esgotados", "Stocks bas ou épuisés");
  a("Switch", "Cambiar", "Trocar", "Changer");
  a("Mission status", "Estado de la misión", "Status da missão", "État de la mission");
  a("Guest", "Invitado", "Convidado", "Invité");
  a("No mission yet", "Aún sin misión", "Ainda sem missão", "Pas encore de mission");
  a("Use every section on your own, or join a mission to share your status with a crew on this device.", "Usa cada sección por tu cuenta, o únete a una misión para compartir tu estado con una tripulación en este dispositivo.", "Use cada seção por conta própria, ou entre em uma missão para compartilhar seu status com uma tripulação neste dispositivo.", "Utilisez chaque section seul, ou rejoignez une mission pour partager votre état avec un équipage sur cet appareil.");
  a("Browse missions", "Ver misiones", "Ver missões", "Parcourir les missions");
  a("How NovaCare works", "Cómo funciona NovaCare", "Como o NovaCare funciona", "Comment fonctionne NovaCare");
  a("Three things — that’s all you need.", "Tres cosas: es todo lo que necesitas.", "Três coisas: é tudo que você precisa.", "Trois choses : c’est tout ce qu’il vous faut.");
  a("Got it", "Entendido", "Entendi", "Compris");
  a("Check in once a day", "Haz un chequeo al día", "Faça um check-in por dia", "Faites un bilan par jour");
  a("About a minute: how you feel and your vitals. NovaCare tells you if anything needs attention.", "Cerca de un minuto: cómo te sientes y tus signos vitales. NovaCare te avisa si algo requiere atención.", "Cerca de um minuto: como você se sente e seus sinais vitais. O NovaCare avisa se algo precisar de atenção.", "Environ une minute : comment vous vous sentez et vos constantes. NovaCare vous prévient si quelque chose demande attention.");
  a("Check in", "Hacer chequeo", "Fazer check-in", "Faire le bilan");
  a("Press Help when you need it", "Pulsa Ayuda cuando la necesites", "Toque em Ajuda quando precisar", "Appuyez sur Aide si besoin");
  a("The red Help button is on every screen. Your whole crew is alerted at once.", "El botón rojo de Ayuda está en todas las pantallas. Toda tu tripulación recibe el aviso al instante.", "O botão vermelho de Ajuda está em todas as telas. Toda a sua tripulação é avisada de uma vez.", "Le bouton rouge Aide est sur chaque écran. Tout votre équipage est alerté d’un coup.");
  a("Fill in your medical profile", "Completa tu perfil médico", "Preencha seu perfil médico", "Remplissez votre profil médical");
  a("Allergies and medication — your crew sees them in an emergency.", "Alergias y medicación: tu tripulación las ve en una emergencia.", "Alergias e medicação: sua tripulação vê em uma emergência.", "Allergies et médicaments : votre équipage les voit en cas d’urgence.");
  a("Fill in", "Completar", "Preencher", "Remplir");

  /* ---------- mission tab ---------- */
  a("Mission sections", "Secciones de la misión", "Seções da missão", "Sections de la mission");
  a("Log", "Registro", "Registro", "Journal");
  a("Missions", "Misiones", "Missões", "Missions");
  a("Active", "Activa", "Ativa", "Active");
  a("{n} mSv/day · {s}", "{n} mSv/día · {s}", "{n} mSv/dia · {s}", "{n} mSv/jour · {s}");
  a("Created by you", "Creada por ti", "Criada por você", "Créée par vous");
  a("Joined with a code", "Te uniste con un código", "Você entrou com um código", "Rejointe avec un code");
  a("Open mission status", "Abrir estado de la misión", "Abrir status da missão", "Ouvrir l’état de la mission");
  a("Switch to this mission", "Cambiar a esta misión", "Trocar para esta missão", "Passer à cette mission");
  a("Copy the code to share it with your crew", "Copia el código para compartirlo con tu tripulación", "Copie o código para compartilhar com sua tripulação", "Copiez le code pour le partager avec votre équipage");
  a("Leave", "Salir", "Sair", "Quitter");
  a("Join {s}", "Unirse a {s}", "Entrar em {s}", "Rejoindre {s}");
  a("The shared crew. Visitors who open NovaCare as a guest will see you on it (never your medical history).", "La tripulación compartida. Los visitantes que abran NovaCare como invitados te verán en ella (nunca tu historial médico).", "A tripulação compartilhada. Visitantes que abrirem o NovaCare como convidados verão você nela (nunca seu histórico médico).", "L’équipage partagé. Les visiteurs qui ouvrent NovaCare en invité vous y verront (jamais vos antécédents médicaux).");
  a("Create a mission", "Crear una misión", "Criar uma missão", "Créer une mission");
  a("Name it, pick where it happens and get a code to share with your crew.", "Ponle nombre, elige dónde ocurre y obtén un código para compartir con tu tripulación.", "Dê um nome, escolha onde acontece e receba um código para compartilhar com sua tripulação.", "Nommez-la, choisissez où elle se passe et obtenez un code à partager avec votre équipage.");
  a("Join with a code", "Unirse con un código", "Entrar com um código", "Rejoindre avec un code");
  a("Enter the code a crewmate shared to join their mission.", "Escribe el código que te dio un compañero para unirte a su misión.", "Digite o código que um colega compartilhou para entrar na missão dele.", "Saisissez le code d’un équipier pour rejoindre sa mission.");
  a("Switch between your missions, create a new one or join one", "Cambia entre tus misiones, crea una nueva o únete a una", "Alterne entre suas missões, crie uma nova ou entre em uma", "Passez d’une mission à l’autre, créez-en une ou rejoignez-en une");
  a("Optional for guests: create your own mission or join one to work with a crew", "Opcional para invitados: crea tu misión o únete a una para trabajar con una tripulación", "Opcional para convidados: crie sua missão ou entre em uma para trabalhar com uma tripulação", "Facultatif pour les invités : créez votre mission ou rejoignez-en une pour travailler avec un équipage");
  a("create your own mission or join one to work with a crew", "crea tu misión o únete a una para trabajar con una tripulación", "crie sua missão ou entre em uma para trabalhar com uma tripulação", "créez votre mission ou rejoignez-en une pour travailler avec un équipage");
  a("Your missions", "Tus misiones", "Suas missões", "Vos missions");
  a("{n} mission · each one keeps its own readings, crew and ship inventory.", "{n} misión · cada una guarda sus propias mediciones, tripulación e inventario de la nave.", "{n} missão · cada uma guarda suas próprias medições, tripulação e inventário da nave.", "{n} mission · chacune garde ses mesures, son équipage et son inventaire du vaisseau.");
  a("{n} missions · each one keeps its own readings, crew and ship inventory.", "{n} misiones · cada una guarda sus propias mediciones, tripulación e inventario de la nave.", "{n} missões · cada uma guarda suas próprias medições, tripulação e inventário da nave.", "{n} missions · chacune garde ses mesures, son équipage et son inventaire du vaisseau.");
  a("None yet — create one or join a mission from the list below.", "Aún ninguna: crea una o únete a una misión de la lista de abajo.", "Nenhuma ainda: crie uma ou entre em uma missão da lista abaixo.", "Aucune pour l’instant : créez-en une ou rejoignez une mission de la liste ci-dessous.");
  a("{n} days planned", "{n} días planificados", "{n} dias planejados", "{n} jours prévus");
  a("Created by {s}", "Creada por {s}", "Criada por {s}", "Créée par {s}");
  a("a crew member", "un miembro de la tripulación", "um membro da tripulação", "un membre de l’équipage");
  a("Join", "Unirse", "Entrar", "Rejoindre");
  a("All missions", "Todas las misiones", "Todas as missões", "Toutes les missions");
  a("Missions created by people on NovaCare. Join one to see its crew and ship inventory.", "Misiones creadas por personas en NovaCare. Únete a una para ver su tripulación e inventario de la nave.", "Missões criadas por pessoas no NovaCare. Entre em uma para ver sua tripulação e inventário da nave.", "Missions créées par des utilisateurs de NovaCare. Rejoignez-en une pour voir son équipage et l’inventaire du vaisseau.");
  a("Missions created by people on NovaCare. Join one to see its crew and ship inventory. As a guest, a mission you join stays on this device.", "Misiones creadas por personas en NovaCare. Únete a una para ver su tripulación e inventario de la nave. Como invitado, la misión a la que te unas se queda en este dispositivo.", "Missões criadas por pessoas no NovaCare. Entre em uma para ver sua tripulação e inventário da nave. Como convidado, a missão em que você entrar fica neste dispositivo.", "Missions créées par des utilisateurs de NovaCare. Rejoignez-en une pour voir son équipage et l’inventaire du vaisseau. En invité, la mission rejointe reste sur cet appareil.");
  a("No other missions yet. Create one and it will show up here for everyone.", "Aún no hay otras misiones. Crea una y aparecerá aquí para todos.", "Ainda não há outras missões. Crie uma e ela aparecerá aqui para todos.", "Pas d’autres missions pour l’instant. Créez-en une et elle apparaîtra ici pour tous.");

  /* ---------- personal overview ---------- */
  a("Change your profile photo", "Cambia tu foto de perfil", "Altere sua foto de perfil", "Changez votre photo de profil");
  a("Change", "Cambiar", "Alterar", "Changer");
  a("Add photo", "Agregar foto", "Adicionar foto", "Ajouter une photo");
  a("Mission day {n}", "Día de misión {n}", "Dia da missão {n}", "Jour de mission {n}");
  a("Key Vitals", "Signos clave", "Sinais principais", "Constantes clés");
  a("Health", "Salud", "Saúde", "Santé");
  a("Routine", "Rutina", "Rotina", "Routine");
  a("Body Status", "Estado del cuerpo", "Estado do corpo", "État du corps");
  a("Tap a label on the scan to see that body system.", "Toca una etiqueta del escáner para ver ese sistema del cuerpo.", "Toque em um rótulo do scan para ver esse sistema do corpo.", "Touchez une étiquette du scan pour voir ce système du corps.");
  a("NASA research on {s}", "Investigación de la NASA sobre {s}", "Pesquisa da NASA sobre {s}", "Recherche de la NASA sur {s}");
  a("{n} studies in NASA’s Open Science Data Repository, {n} with human data. The {n} most relevant, astronaut studies first.", "{n} estudios en el repositorio abierto de datos científicos de la NASA, {n} con datos humanos. Los {n} más relevantes, primero los de astronautas.", "{n} estudos no repositório aberto de dados científicos da NASA, {n} com dados humanos. Os {n} mais relevantes, estudos com astronautas primeiro.", "{n} études dans le dépôt de données scientifiques ouvert de la NASA, {n} avec des données humaines. Les {n} plus pertinentes, études d’astronautes d’abord.");
  a("{n} studies in NASA’s Open Science Data Repository. The {n} most relevant, astronaut studies first.", "{n} estudios en el repositorio abierto de datos científicos de la NASA. Los {n} más relevantes, primero los de astronautas.", "{n} estudos no repositório aberto de dados científicos da NASA. Os {n} mais relevantes, estudos com astronautas primeiro.", "{n} études dans le dépôt de données scientifiques ouvert de la NASA. Les {n} plus pertinentes, études d’astronautes d’abord.");
  a("Source: NASA OSDR Biological Data API · snapshot {s} · available offline. Opening a study needs a link to Earth.", "Fuente: API de datos biológicos NASA OSDR · copia del {s} · disponible sin conexión. Abrir un estudio requiere enlace con la Tierra.", "Fonte: API de dados biológicos NASA OSDR · cópia de {s} · disponível offline. Abrir um estudo exige link com a Terra.", "Source : API de données biologiques NASA OSDR · instantané du {s} · disponible hors ligne. Ouvrir une étude nécessite une liaison avec la Terre.");
  a("{s}’s health", "Salud de {s}", "Saúde de {s}", "Santé de {s}");
  a("Mission day {n} · {n} measurement due", "Día de misión {n} · {n} medición pendiente", "Dia da missão {n} · {n} medição pendente", "Jour de mission {n} · {n} mesure à faire");
  a("Mission day {n} · {n} measurements due", "Día de misión {n} · {n} mediciones pendientes", "Dia da missão {n} · {n} medições pendentes", "Jour de mission {n} · {n} mesures à faire");
  a("Mission day {n} · everything is logged for today", "Día de misión {n} · todo registrado por hoy", "Dia da missão {n} · tudo registrado por hoje", "Jour de mission {n} · tout est saisi pour aujourd’hui");
  a("Personal sections", "Secciones personales", "Seções pessoais", "Sections personnelles");
  a("Trend", "Tendencia", "Tendência", "Tendance");
  a("View {s} trend", "Ver tendencia de {s}", "Ver tendência de {s}", "Voir la tendance : {s}");
  a("Mission day {n} has started", "Ha empezado el día de misión {n}", "O dia da missão {n} começou", "Le jour de mission {n} a commencé");

  /* ---------- photo ---------- */
  a("Choose an image file", "Elige un archivo de imagen", "Escolha um arquivo de imagem", "Choisissez un fichier image");
  a("Profile photo saved — your crew will see it", "Foto de perfil guardada: tu tripulación la verá", "Foto de perfil salva: sua tripulação vai vê-la", "Photo de profil enregistrée : votre équipage la verra");
  a("That image could not be opened", "No se pudo abrir esa imagen", "Não foi possível abrir essa imagem", "Impossible d’ouvrir cette image");
  a("Profile photo removed", "Foto de perfil eliminada", "Foto de perfil removida", "Photo de profil supprimée");

  /* ---------- vitals, routine, hazards ---------- */
  a("Tap any card for its trend, how to measure it and why it matters in space.", "Toca cualquier tarjeta para ver su tendencia, cómo medirla y por qué importa en el espacio.", "Toque em qualquer cartão para ver a tendência, como medir e por que importa no espaço.", "Touchez une carte pour voir sa tendance, comment la mesurer et pourquoi elle compte dans l’espace.");
  a("due", "pendiente", "pendente", "à faire");
  a("Not measured", "Sin medir", "Não medido", "Non mesuré");
  a("Log", "Registrar", "Registrar", "Saisir");
  a("MD {n}: {n} of {n} tasks", "MD {n}: {n} de {n} tareas", "MD {n}: {n} de {n} tarefas", "MD {n} : {n} tâches sur {n}");
  a("Today's routine — MD {n}", "Rutina de hoy — MD {n}", "Rotina de hoje — MD {n}", "Routine du jour — MD {n}");
  a("{n} of {n} done", "{n} de {n} hechas", "{n} de {n} feitas", "{n} sur {n} faites");
  a("Logged", "Registrado", "Registrado", "Saisi");
  a("Log now ›", "Registrar ›", "Registrar ›", "Saisir ›");
  a("Done", "Hecho", "Feito", "Fait");
  a("Mark done", "Marcar como hecho", "Marcar como feito", "Marquer fait");
  a("Tasks with “Log now” complete themselves when you record the measurement.", "Las tareas con «Registrar» se completan solas al guardar la medición.", "As tarefas com “Registrar” se concluem sozinhas ao salvar a medição.", "Les tâches avec « Saisir » se terminent seules quand vous enregistrez la mesure.");
  a("Your health record", "Tu historial de salud", "Seu histórico de saúde", "Votre dossier de santé");
  a("How complete it is — a complete record is what lets NovaCare catch problems early", "Qué tan completo está: un historial completo permite que NovaCare detecte problemas a tiempo", "Quão completo está: um histórico completo permite ao NovaCare detectar problemas cedo", "Son niveau de complétude : un dossier complet permet à NovaCare de repérer tôt les problèmes");
  a("check-ins", "chequeos", "check-ins", "bilans");
  a("follow-ups", "seguimientos", "acompanhamentos", "suivis");
  a("discharged", "dados de alta", "com alta", "clôturés");
  a("Care milestones", "Hitos de cuidado", "Marcos de cuidado", "Étapes de soins");
  a("{n} of {n}", "{n} de {n}", "{n} de {n}", "{n} sur {n}");
  a("Last {n} days", "Últimos {n} días", "Últimos {n} dias", "{n} derniers jours");
  a("routine completed", "rutina completada", "rotina concluída", "routine terminée");
  a("Not measured yet", "Aún sin medir", "Ainda não medido", "Pas encore mesuré");
  a("{n} measurement to watch", "{n} medición por vigilar", "{n} medição para acompanhar", "{n} mesure à surveiller");
  a("{n} measurements to watch", "{n} mediciones por vigilar", "{n} medições para acompanhar", "{n} mesures à surveiller");
  a("Everything it tracks is in range", "Todo lo que mide está en rango", "Tudo o que acompanha está na faixa", "Tout ce qu’il suit est dans la plage");
  a("{s} · {n} mSv a day · {s}", "{s} · {n} mSv al día · {s}", "{s} · {n} mSv por dia · {s}", "{s} · {n} mSv par jour · {s}");
  a("Evacuation: {s} · Exercise prescription: {n} min a day", "Evacuación: {s} · Ejercicio prescrito: {n} min al día", "Evacuação: {s} · Exercício prescrito: {n} min por dia", "Évacuation : {s} · Exercice prescrit : {n} min par jour");
  a("The five hazards of spaceflight", "Los cinco riesgos del vuelo espacial", "Os cinco riscos do voo espacial", "Les cinq risques du vol spatial");
  a("Open one to see what NovaCare measures to catch it early, and what you can do. Most urgent first.", "Abre uno para ver qué mide NovaCare para detectarlo a tiempo y qué puedes hacer. Lo más urgente primero.", "Abra um para ver o que o NovaCare mede para detectá-lo cedo e o que você pode fazer. O mais urgente primeiro.", "Ouvrez-en un pour voir ce que NovaCare mesure pour le repérer tôt et ce que vous pouvez faire. Le plus urgent d’abord.");
  a("Mission dose so far:", "Dosis de la misión hasta ahora:", "Dose da missão até agora:", "Dose de la mission à ce jour :");
  a("{n} of {n} mSv ({n}% of the career limit).", "{n} de {n} mSv ({n}% del límite de carrera).", "{n} de {n} mSv ({n}% do limite de carreira).", "{n} sur {n} mSv ({n} % de la limite de carrière).");
  a("What NovaCare measures", "Qué mide NovaCare", "O que o NovaCare mede", "Ce que NovaCare mesure");
  a("What you can do:", "Qué puedes hacer:", "O que você pode fazer:", "Ce que vous pouvez faire :");
  a("What it can cause:", "Qué puede causar:", "O que pode causar:", "Ce que cela peut causer :");
  a("Sources: NASA Human Research Program (five hazards, human system risks, SANS), NASA spaceflight radiation standard (600 mSv career limit), MSL-RAD and Chang'E-4 LND dose-rate measurements.", "Fuentes: Programa de Investigación Humana de la NASA (cinco riesgos, riesgos para los sistemas humanos, SANS), norma de radiación en vuelo espacial de la NASA (límite de carrera de {n} mSv), mediciones de tasa de dosis de MSL-RAD y Chang'E-4 LND.", "Fontes: Programa de Pesquisa Humana da NASA (cinco riscos, riscos aos sistemas humanos, SANS), norma de radiação em voo espacial da NASA (limite de carreira de {n} mSv), medições de taxa de dose do MSL-RAD e Chang'E-4 LND.", "Sources : Programme de recherche humaine de la NASA (cinq risques, risques pour les systèmes humains, SANS), norme de rayonnement en vol spatial de la NASA (limite de carrière de {n} mSv), mesures de débit de dose MSL-RAD et Chang'E-4 LND.");

  /* ---------- measurement modals ---------- */
  a("Decrease", "Disminuir", "Diminuir", "Diminuer");
  a("Increase", "Aumentar", "Aumentar", "Augmenter");
  a("Decrease {s}", "Disminuir {s}", "Diminuir {s}", "Diminuer {s}");
  a("Increase {s}", "Aumentar {s}", "Aumentar {s}", "Augmenter {s}");
  a("Last: {s}", "Última: {s}", "Última: {s}", "Dernière : {s}");
  a("Check this number", "Revisa este número", "Confira este número", "Vérifiez ce chiffre");
  a("{s} · last: {n} {s} on MD {n}", "{s} · última: {n} {s} en MD {n}", "{s} · última: {n} {s} em MD {n}", "{s} · dernière : {n} {s} en MD {n}");
  a("{s} · last: {n} on MD {n}", "{s} · última: {n} en MD {n}", "{s} · última: {n} em MD {n}", "{s} · dernière : {n} en MD {n}");
  a("That number looks impossible — check the reading and the unit ({s}).", "Ese número parece imposible: revisa la medición y la unidad ({s}).", "Esse número parece impossível: confira a medição e a unidade ({s}).", "Ce chiffre semble impossible : vérifiez la mesure et l’unité ({s}).");
  a("· {s} — you will get steps after saving", "· {s}: recibirás los pasos al guardar", "· {s}: você receberá os passos ao salvar", "· {s} : vous aurez les étapes après l’enregistrement");
  a("· {s}", "· {s}", "· {s}", "· {s}");
  a("Daily check-in", "Chequeo diario", "Check-in diário", "Bilan quotidien");
  a("Log reading", "Registrar medición", "Registrar medição", "Saisir une mesure");
  a("Daily check-in · {n} of {n}", "Chequeo diario · {n} de {n}", "Check-in diário · {n} de {n}", "Bilan quotidien · {n} sur {n}");
  a("Log reading · {n} of {n}", "Registrar medición · {n} de {n}", "Registrar medição · {n} de {n}", "Saisir une mesure · {n} sur {n}");
  a("Close", "Cerrar", "Fechar", "Fermer");
  a("How to measure", "Cómo medir", "Como medir", "Comment mesurer");
  a("Skip", "Omitir", "Pular", "Passer");
  a("Cancel", "Cancelar", "Cancelar", "Annuler");
  a("Save and continue", "Guardar y seguir", "Salvar e continuar", "Enregistrer et continuer");
  a("Save", "Guardar", "Salvar", "Enregistrer");
  a("Daily check-in · MD {n}", "Chequeo diario · MD {n}", "Check-in diário · MD {n}", "Bilan quotidien · MD {n}");
  a("How are you today?", "¿Cómo estás hoy?", "Como você está hoje?", "Comment allez-vous aujourd’hui ?");
  a("You", "Tú", "Você", "Vous");
  a("Anything bothering you?", "¿Algo te molesta?", "Algo incomoda você?", "Quelque chose vous gêne ?");
  a("Optional", "Opcional", "Opcional", "Facultatif");
  a("Same as last time", "Igual que la última vez", "Igual à última vez", "Comme la dernière fois");
  a("More", "Más", "Mais", "Plus");
  a("{n} optional · {s}", "{n} opcionales · {s}", "{n} opcionais · {s}", "{n} facultatifs · {s}");
  a("Vitals measured by", "Signos vitales medidos por", "Sinais vitais medidos por", "Constantes mesurées par");
  a("Top (systolic)", "Alta (sistólica)", "Alta (sistólica)", "Haute (systolique)");
  a("Bottom (diastolic)", "Baja (diastólica)", "Baixa (diastólica)", "Basse (diastolique)");
  a("Fill what you have. Empty fields are skipped.", "Completa lo que tengas. Los campos vacíos se omiten.", "Preencha o que tiver. Campos vazios são ignorados.", "Remplissez ce que vous avez. Les champs vides sont ignorés.");
  a("Later", "Más tarde", "Mais tarde", "Plus tard");
  a("Save check-in", "Guardar chequeo", "Salvar check-in", "Enregistrer le bilan");
  a("{s}, last {n}", "{s}, última {n}", "{s}, última {n}", "{s}, dernière {n}");
  a("Extreme", "Extremo", "Extremo", "Extrême");
  a("Marked", "Marcado", "Acentuado", "Marqué");
  a("Blurry", "Borrosa", "Embaçada", "Floue");
  a("Slight", "Leve", "Leve", "Léger");
  a("Backed by NASA research", "Respaldado por investigación de la NASA", "Baseado em pesquisa da NASA", "Appuyé par la recherche de la NASA");
  a("Backed by NASA research · {n} OSDR studies", "Respaldado por investigación de la NASA · {n} estudios OSDR", "Baseado em pesquisa da NASA · {n} estudos OSDR", "Appuyé par la recherche de la NASA · {n} études OSDR");
  a("Evidence", "Evidencia", "Evidências", "Preuves");
  a("{n} studies in NASA’s Open Science Data Repository relate to this measurement. Most relevant:", "{n} estudios del repositorio abierto de datos científicos de la NASA se relacionan con esta medición. Los más relevantes:", "{n} estudos do repositório aberto de dados científicos da NASA se relacionam com esta medição. Os mais relevantes:", "{n} études du dépôt de données scientifiques ouvert de la NASA concernent cette mesure. Les plus pertinentes :");
  a("Reference ranges are simplified general adult clinical values. Source data: NASA OSDR Biological Data API, snapshot {s}.", "Los rangos de referencia son valores clínicos generales simplificados para adultos. Datos de origen: API de datos biológicos NASA OSDR, copia del {s}.", "As faixas de referência são valores clínicos gerais simplificados para adultos. Dados de origem: API de dados biológicos NASA OSDR, cópia de {s}.", "Les plages de référence sont des valeurs cliniques générales simplifiées pour adultes. Source : API de données biologiques NASA OSDR, instantané du {s}.");

  /* ---------- done, detail ---------- */
  a("Check-in complete", "Chequeo completado", "Check-in concluído", "Bilan terminé");
  a("Saved", "Guardado", "Salvo", "Enregistré");
  a("{n} reading added to your record", "{n} medición agregada a tu historial", "{n} medição adicionada ao seu histórico", "{n} mesure ajoutée à votre dossier");
  a("{n} readings added to your record", "{n} mediciones agregadas a tu historial", "{n} medições adicionadas ao seu histórico", "{n} mesures ajoutées à votre dossier");
  a("{n} reading added to your record · check-in {n} days running", "{n} medición agregada a tu historial · chequeo {n} días seguidos", "{n} medição adicionada ao seu histórico · check-in há {n} dias seguidos", "{n} mesure ajoutée à votre dossier · bilan {n} jours de suite");
  a("{n} readings added to your record · check-in {n} days running", "{n} mediciones agregadas a tu historial · chequeo {n} días seguidos", "{n} medições adicionadas ao seu histórico · check-in há {n} dias seguidos", "{n} mesures ajoutées à votre dossier · bilan {n} jours de suite");
  a("{n} new recommendation", "{n} recomendación nueva", "{n} recomendação nova", "{n} nouvelle recommandation");
  a("{n} new recommendations", "{n} recomendaciones nuevas", "{n} recomendações novas", "{n} nouvelles recommandations");
  a("Sent to your notifications (the bell). Open it when you are ready.", "Enviada a tus notificaciones (la campana). Ábrela cuando estés listo.", "Enviada às suas notificações (o sino). Abra quando estiver pronto.", "Envoyée à vos notifications (la cloche). Ouvrez-la quand vous êtes prêt.");
  a("Sent to your notifications (the bell). Open them when you are ready.", "Enviadas a tus notificaciones (la campana). Ábrelas cuando estés listo.", "Enviadas às suas notificações (o sino). Abra quando estiver pronto.", "Envoyées à vos notifications (la cloche). Ouvrez-les quand vous êtes prêt.");
  a("{n} other still in follow-up", "{n} más sigue en seguimiento", "{n} outro ainda em acompanhamento", "{n} autre encore en suivi");
  a("{n} others still in follow-up", "{n} más siguen en seguimiento", "{n} outros ainda em acompanhamento", "{n} autres encore en suivi");
  a("Everything is in range. Nice work.", "Todo está en rango. Buen trabajo.", "Tudo está na faixa. Bom trabalho.", "Tout est dans la plage. Bon travail.");
  a("Open now", "Abrir ahora", "Abrir agora", "Ouvrir maintenant");
  a("Measured every day", "Se mide cada día", "Medido todos os dias", "Mesuré chaque jour");
  a("Measured every {n} days", "Se mide cada {n} días", "Medido a cada {n} dias", "Mesuré tous les {n} jours");
  a("Measured every day · due now", "Se mide cada día · pendiente ahora", "Medido todos os dias · agora", "Mesuré chaque jour · à faire maintenant");
  a("Measured every {n} days · due now", "Se mide cada {n} días · pendiente ahora", "Medido a cada {n} dias · agora", "Mesuré tous les {n} jours · à faire maintenant");
  a("{n} days", "{n} días", "{n} dias", "{n} jours");
  a("All", "Todo", "Tudo", "Tout");
  a("Why it matters", "Por qué importa", "Por que importa", "Pourquoi c’est important");
  a("In space", "En el espacio", "No espaço", "Dans l’espace");
  a("Recent readings", "Mediciones recientes", "Medições recentes", "Mesures récentes");
  a("None yet.", "Ninguna aún.", "Nenhuma ainda.", "Aucune pour l’instant.");

  /* ---------- settings ---------- */
  a("Settings", "Ajustes", "Ajustes", "Réglages");
  a("Emergencies", "Emergencias", "Emergências", "Urgences");
  a("Alerts reach your crew", "Las alertas llegan a tu tripulación", "Os alertas chegam à sua tripulação", "Les alertes parviennent à votre équipage");
  a("Yes", "Sí", "Sim", "Oui");
  a("No", "No", "Não", "Non");
  a("Everyone on {s} gets your calls for help.", "Todos en {s} reciben tus llamadas de ayuda.", "Todos em {s} recebem seus pedidos de ajuda.", "Tous les membres de {s} reçoivent vos appels à l’aide.");
  a("Notifications", "Notificaciones", "Notificações", "Notifications");
  a("Not available", "No disponible", "Indisponível", "Non disponible");
  a("Blocked in the browser", "Bloqueadas en el navegador", "Bloqueadas no navegador", "Bloquées dans le navigateur");
  a("Turn off", "Desactivar", "Desativar", "Désactiver");
  a("Turn on", "Activar", "Ativar", "Activer");
  a("On — emergencies sound and show even with NovaCare in the background.", "Activas: las emergencias suenan y se muestran aunque NovaCare esté en segundo plano.", "Ativas: as emergências tocam e aparecem mesmo com o NovaCare em segundo plano.", "Activées : les urgences sonnent et s’affichent même avec NovaCare en arrière-plan.");
  a("Turn on so a crewmate’s emergency reaches you with the app closed.", "Actívalas para que la emergencia de un compañero te llegue con la app cerrada.", "Ative para que a emergência de um colega chegue até você com o app fechado.", "Activez-les pour recevoir l’urgence d’un équipier même app fermée.");
  a("Test the alarm", "Probar la alarma", "Testar o alarme", "Tester l’alarme");
  a("Play", "Reproducir", "Reproduzir", "Lancer");
  a("Check the sound and vibration of an emergency.", "Verifica el sonido y la vibración de una emergencia.", "Confira o som e a vibração de uma emergência.", "Vérifiez le son et la vibration d’une urgence.");
  a("Alert my crew if I do not answer", "Avisar a mi tripulación si no respondo", "Avisar minha tripulação se eu não responder", "Alerter mon équipage si je ne réponds pas");
  a("After a critical reading NovaCare asks if you are OK, and calls your crew after {n} seconds without an answer.", "Tras una medición crítica, NovaCare te pregunta si estás bien y avisa a tu tripulación después de {n} segundos sin respuesta.", "Após uma medição crítica, o NovaCare pergunta se você está bem e avisa sua tripulação após {n} segundos sem resposta.", "Après une mesure critique, NovaCare vous demande si tout va bien et appelle votre équipage après {n} secondes sans réponse.");
  a("Your medical profile", "Tu perfil médico", "Seu perfil médico", "Votre profil médical");
  a("Allergies", "Alergias", "Alergias", "Allergies");
  a("None recorded", "Ninguna registrada", "Nenhuma registrada", "Aucune enregistrée");
  a("Your crew sees this in an emergency.", "Tu tripulación lo ve en una emergencia.", "Sua tripulação vê isto em uma emergência.", "Votre équipage le voit en cas d’urgence.");
  a("Blood type · medication · conditions", "Grupo sanguíneo · medicación · afecciones", "Tipo sanguíneo · medicação · condições", "Groupe sanguin · médicaments · affections");
  a("Empty — one minute, and it can save your life.", "Vacío: un minuto, y puede salvarte la vida.", "Vazio: um minuto, e pode salvar sua vida.", "Vide : une minute, et cela peut vous sauver la vie.");
  a("Saved", "Guardado", "Salvo", "Enregistré");
  a("Mission name", "Nombre de la misión", "Nome da missão", "Nom de la mission");
  a("Code for your crew", "Código para tu tripulación", "Código para sua tripulação", "Code pour votre équipage");
  a("Copy the code", "Copiar el código", "Copiar o código", "Copier le code");
  a("Crewmates join with this code.", "Los compañeros se unen con este código.", "Os colegas entram com este código.", "Les équipiers rejoignent avec ce code.");
  a("Mission day", "Día de misión", "Dia da missão", "Jour de mission");
  a("Started {s}. A new day starts at midnight.", "Empezó el {s}. Un día nuevo empieza a medianoche.", "Começou em {s}. Um novo dia começa à meia-noite.", "Commencée le {s}. Un nouveau jour commence à minuit.");
  a("Planned length", "Duración prevista", "Duração prevista", "Durée prévue");
  a("Planned length in days", "Duración prevista en días", "Duração prevista em dias", "Durée prévue en jours");
  a("days", "días", "dias", "jours");
  a("Location", "Ubicación", "Local", "Lieu");
  a("Leave this mission", "Salir de esta misión", "Sair desta missão", "Quitter cette mission");
  a("You are not on a mission.", "No estás en ninguna misión.", "Você não está em nenhuma missão.", "Vous n’êtes dans aucune mission.");
  a("Create or join one", "Crea una o únete a una", "Crie uma ou entre em uma", "Créez-en une ou rejoignez-en une");
  a("Check-ins", "Chequeos", "Check-ins", "Bilans");
  a("“How do you feel?” every", "«¿Cómo te sientes?» cada", "“Como você está?” a cada", "« Comment vous sentez-vous ? » toutes les");
  a("How often", "Con qué frecuencia", "Com que frequência", "Fréquence");
  a("{n} hours", "{n} horas", "{n} horas", "{n} heures");
  a("Only after your daily check-in.", "Solo después de tu chequeo diario.", "Somente após seu check-in diário.", "Seulement après votre bilan quotidien.");
  a("Data & sync", "Datos y sincronización", "Dados e sincronização", "Données et synchro");
  a("Sync", "Sincronizar", "Sincronizar", "Synchro");
  a("Sync now", "Sincronizar ahora", "Sincronizar agora", "Synchroniser");
  a("Works without Earth", "Funciona sin la Tierra", "Funciona sem a Terra", "Fonctionne sans la Terre");
  a("{n} of {n} checks passed", "{n} de {n} pruebas superadas", "{n} de {n} testes aprovados", "{n} tests sur {n} réussis");
  a("Test again", "Probar de nuevo", "Testar de novo", "Tester à nouveau");
  a("Run the test", "Hacer la prueba", "Fazer o teste", "Lancer le test");
  a("Medical records, medication rules, protocols and analysis all run on this device — tested with no link. The link to Earth is only used to sync and update.", "Los historiales médicos, las reglas de medicación, los protocolos y el análisis funcionan en este dispositivo; probado sin enlace. El enlace con la Tierra solo sirve para sincronizar y actualizar.", "Prontuários, regras de medicação, protocolos e análises funcionam neste dispositivo; testado sem link. O link com a Terra serve apenas para sincronizar e atualizar.", "Dossiers médicaux, règles de médication, protocoles et analyses fonctionnent sur cet appareil ; testé sans liaison. La liaison avec la Terre ne sert qu’à synchroniser et mettre à jour.");
  a("Medical records, medication rules, protocols and analysis all run on this device. The link to Earth is only used to sync and update.", "Los historiales médicos, las reglas de medicación, los protocolos y el análisis funcionan en este dispositivo. El enlace con la Tierra solo sirve para sincronizar y actualizar.", "Prontuários, regras de medicação, protocolos e análises funcionam neste dispositivo. O link com a Terra serve apenas para sincronizar e atualizar.", "Dossiers médicaux, règles de médication, protocoles et analyses fonctionnent sur cet appareil. La liaison avec la Terre ne sert qu’à synchroniser et mettre à jour.");
  a("Checks that the medical functions work on this device alone, with no link to Earth.", "Verifica que las funciones médicas funcionan solo con este dispositivo, sin enlace con la Tierra.", "Verifica se as funções médicas funcionam só com este dispositivo, sem link com a Terra.", "Vérifie que les fonctions médicales marchent sur cet appareil seul, sans liaison avec la Terre.");
  a("For your flight surgeon", "Para tu médico de vuelo", "Para seu médico de voo", "Pour votre médecin de vol");
  a("Health report", "Informe de salud", "Relatório de saúde", "Rapport de santé");
  a("Raw data", "Datos en bruto", "Dados brutos", "Données brutes");
  a("Account & display", "Cuenta y pantalla", "Conta e tela", "Compte et affichage");
  a("Profile photo", "Foto de perfil", "Foto de perfil", "Photo de profil");
  a("Remove", "Quitar", "Remover", "Retirer");
  a("Your crew sees it on your card.", "Tu tripulación la ve en tu ficha.", "Sua tripulação vê no seu cartão.", "Votre équipage la voit sur votre fiche.");
  a("Your name", "Tu nombre", "Seu nome", "Votre nom");
  a("Role", "Rol", "Função", "Rôle");
  a("Fixed when the account was created.", "Se fija al crear la cuenta.", "Definida ao criar a conta.", "Fixé à la création du compte.");
  a("Dark mode", "Modo oscuro", "Modo escuro", "Mode sombre");
  a("Easier on the eyes during the sleep cycle.", "Más suave para la vista durante el ciclo de sueño.", "Mais suave para os olhos durante o ciclo de sono.", "Plus doux pour les yeux pendant le cycle de sommeil.");
  a("Leave guest mode", "Salir del modo invitado", "Sair do modo convidado", "Quitter le mode invité");
  a("Exit", "Salir", "Sair", "Quitter");
  a("Training & demo", "Entrenamiento y demo", "Treinamento e demo", "Entraînement et démo");
  a("For demonstrations only. These replace the readings of the open mission.", "Solo para demostraciones. Esto reemplaza las mediciones de la misión abierta.", "Somente para demonstrações. Isto substitui as medições da missão aberta.", "Pour les démonstrations uniquement. Ceci remplace les mesures de la mission ouverte.");
  a("Load {n}-day demo", "Cargar demo de {n} días", "Carregar demo de {n} dias", "Charger la démo de {n} jours");
  a("Erase readings", "Borrar mediciones", "Apagar medições", "Effacer les mesures");

  /* ---------- sync ---------- */
  a("On this device", "En este dispositivo", "Neste dispositivo", "Sur cet appareil");
  a("Synced", "Sincronizado", "Sincronizado", "Synchronisé");
  a("Syncing…", "Sincronizando…", "Sincronizando…", "Synchronisation…");
  a("Pending", "Pendiente", "Pendente", "En attente");
  a("No signal", "Sin señal", "Sem sinal", "Pas de signal");
  a("Sign in to sync", "Inicia sesión para sincronizar", "Entre para sincronizar", "Connectez-vous pour synchroniser");
  a("Sync error", "Error de sincronización", "Erro de sincronização", "Erreur de synchro");
  a("Local mode: no cloud database configured. Data stays in this browser.", "Modo local: no hay base de datos en la nube configurada. Los datos se quedan en este navegador.", "Modo local: nenhum banco de dados na nuvem configurado. Os dados ficam neste navegador.", "Mode local : aucune base cloud configurée. Les données restent dans ce navigateur.");
  a("All data is saved in the NOVACARE database.", "Todos los datos están guardados en la base de datos de NOVACARE.", "Todos os dados estão salvos no banco de dados do NOVACARE.", "Toutes les données sont enregistrées dans la base NOVACARE.");
  a("Uploading to the NOVACARE database.", "Subiendo a la base de datos de NOVACARE.", "Enviando para o banco de dados do NOVACARE.", "Envoi vers la base NOVACARE.");
  a("Saved on this device, waiting to upload.", "Guardado en este dispositivo, esperando para subir.", "Salvo neste dispositivo, aguardando envio.", "Enregistré sur cet appareil, en attente d’envoi.");
  a("No connection. Everything is saved on this device and will upload when the link is back.", "Sin conexión. Todo está guardado en este dispositivo y se subirá cuando vuelva el enlace.", "Sem conexão. Tudo está salvo neste dispositivo e será enviado quando o link voltar.", "Pas de connexion. Tout est enregistré sur cet appareil et sera envoyé quand la liaison reviendra.");
  a("You signed in without signal. Enter your password once to resume cloud sync.", "Iniciaste sesión sin señal. Escribe tu contraseña una vez para reanudar la sincronización.", "Você entrou sem sinal. Digite sua senha uma vez para retomar a sincronização.", "Vous vous êtes connecté sans signal. Saisissez votre mot de passe une fois pour reprendre la synchro.");
  a("The database rejected the upload. Data is safe on this device; tap to retry.", "La base de datos rechazó la subida. Los datos están a salvo en este dispositivo; toca para reintentar.", "O banco de dados recusou o envio. Os dados estão seguros neste dispositivo; toque para tentar de novo.", "La base a refusé l’envoi. Les données sont en sécurité sur cet appareil ; touchez pour réessayer.");
  a("Sync: {s}. {s}", "Sincronización: {s}. {s}", "Sincronização: {s}. {s}", "Synchro : {s}. {s}");
  a("Guest mode — your data stays on this device", "Modo invitado: tus datos se quedan en este dispositivo", "Modo convidado: seus dados ficam neste dispositivo", "Mode invité : vos données restent sur cet appareil");
  a("Guest mode: your data stays on this device", "Modo invitado: tus datos se quedan en este dispositivo", "Modo convidado: seus dados ficam neste dispositivo", "Mode invité : vos données restent sur cet appareil");
  a("Resume sync", "Reanudar sincronización", "Retomar sincronização", "Reprendre la synchro");
  a("You signed in while there was no signal. The connection is back — enter your password once so your readings can upload to the NOVACARE database.", "Iniciaste sesión sin señal. La conexión volvió: escribe tu contraseña una vez para que tus mediciones suban a la base de datos de NOVACARE.", "Você entrou sem sinal. A conexão voltou: digite sua senha uma vez para que suas medições sejam enviadas ao banco de dados do NOVACARE.", "Vous vous êtes connecté sans signal. La connexion est revenue : saisissez votre mot de passe une fois pour envoyer vos mesures à la base NOVACARE.");
  a("Password for {s}", "Contraseña de {s}", "Senha de {s}", "Mot de passe de {s}");

  /* ---------- sign-in ---------- */
  a("Health Monitoring System", "Sistema de monitoreo de salud", "Sistema de monitoramento de saúde", "Système de suivi de santé");
  a("Prototype — sample data is simulated, not from a real astronaut.", "Prototipo — los datos de ejemplo son simulados, no de un astronauta real.", "Protótipo — os dados de exemplo são simulados, não de um astronauta real.", "Prototype — les données d’exemple sont simulées, pas celles d’un vrai astronaute.");
  a("Back to sign in", "Volver a iniciar sesión", "Voltar para entrar", "Retour à la connexion");
  a("Check your email", "Revisa tu correo", "Verifique seu e-mail", "Vérifiez vos e-mails");
  a("If", "Si", "Se", "Si");
  a("has an account, a link to choose a new password is on its way. Open it on this device.", "tiene una cuenta, va en camino un enlace para elegir una contraseña nueva. Ábrelo en este dispositivo.", "tiver uma conta, um link para escolher uma nova senha está a caminho. Abra-o neste dispositivo.", "a un compte, un lien pour choisir un nouveau mot de passe est en route. Ouvrez-le sur cet appareil.");
  a("Nothing after a few minutes? Check spam, or ask again.", "¿Nada tras unos minutos? Revisa el spam o pide otro.", "Nada após alguns minutos? Verifique o spam ou peça de novo.", "Rien après quelques minutes ? Vérifiez les spams ou redemandez.");
  a("Send again", "Enviar de nuevo", "Enviar de novo", "Renvoyer");
  a("Forgot your password?", "¿Olvidaste tu contraseña?", "Esqueceu sua senha?", "Mot de passe oublié ?");
  a("Enter the email of your account and we’ll send you a link to choose a new one.", "Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.", "Digite o e-mail da sua conta e enviaremos um link para escolher uma nova senha.", "Saisissez l’e-mail de votre compte et nous vous enverrons un lien pour en choisir un nouveau.");
  a("Email", "Correo", "E-mail", "E-mail");
  a("Send reset link", "Enviar enlace", "Enviar link", "Envoyer le lien");
  a("Choose a new password", "Elige una contraseña nueva", "Escolha uma nova senha", "Choisissez un nouveau mot de passe");
  a("New password", "Contraseña nueva", "Nova senha", "Nouveau mot de passe");
  a("New password (at least {n} characters)", "Contraseña nueva (mínimo {n} caracteres)", "Nova senha (mínimo de {n} caracteres)", "Nouveau mot de passe ({n} caractères minimum)");
  a("Confirm password", "Confirmar contraseña", "Confirmar senha", "Confirmer le mot de passe");
  a("Confirm new password", "Confirmar contraseña nueva", "Confirmar nova senha", "Confirmer le nouveau mot de passe");
  a("Save and sign in", "Guardar e iniciar sesión", "Salvar e entrar", "Enregistrer et se connecter");
  a("Create account", "Crear cuenta", "Criar conta", "Créer un compte");
  a("Full name", "Nombre completo", "Nome completo", "Nom complet");
  a("User (email)", "Usuario (correo)", "Usuário (e-mail)", "Utilisateur (e-mail)");
  a("Pick your role carefully: it is fixed once your account is created. After signing up you create a mission or join one from the lobby.", "Elige tu rol con cuidado: queda fijo al crear la cuenta. Tras registrarte, creas una misión o te unes a una desde el inicio.", "Escolha sua função com cuidado: ela fica fixa após criar a conta. Depois de se cadastrar, você cria uma missão ou entra em uma pelo início.", "Choisissez bien votre rôle : il est fixé à la création du compte. Après l’inscription, vous créez une mission ou en rejoignez une depuis l’accueil.");
  a("Password", "Contraseña", "Senha", "Mot de passe");
  a("Password (at least {n} characters)", "Contraseña (mínimo {n} caracteres)", "Senha (mínimo de {n} caracteres)", "Mot de passe ({n} caractères minimum)");
  a("Keep me signed in", "Mantener sesión iniciada", "Manter conectado", "Rester connecté");
  a("Forgot password?", "¿Olvidaste la contraseña?", "Esqueceu a senha?", "Mot de passe oublié ?");
  a("Sign In", "Iniciar sesión", "Entrar", "Se connecter");
  a("or", "o", "ou", "ou");
  a("Enter as guest", "Entrar como invitado", "Entrar como convidado", "Entrer en invité");
  a("Emergency? Instructions now, no sign-in", "¿Emergencia? Instrucciones ya, sin iniciar sesión", "Emergência? Instruções agora, sem entrar", "Urgence ? Instructions immédiates, sans connexion");
  a("Already have an account?", "¿Ya tienes cuenta?", "Já tem uma conta?", "Vous avez déjà un compte ?");
  a("Sign in", "Inicia sesión", "Entre", "Connectez-vous");
  a("No account?", "¿Sin cuenta?", "Sem conta?", "Pas de compte ?");
  a("Register", "Regístrate", "Cadastre-se", "Inscrivez-vous");
  a("Show password", "Mostrar contraseña", "Mostrar senha", "Afficher le mot de passe");
  a("Hide password", "Ocultar contraseña", "Ocultar senha", "Masquer le mot de passe");
  a("◌ Local mode — accounts are stored on this device only. Add your database in js/config.js.", "◌ Modo local: las cuentas se guardan solo en este dispositivo. Agrega tu base de datos en js/config.js.", "◌ Modo local: as contas ficam salvas somente neste dispositivo. Adicione seu banco de dados em js/config.js.", "◌ Mode local : les comptes sont stockés sur cet appareil uniquement. Ajoutez votre base dans js/config.js.");
  a("○ No signal — creating an account needs a connection.", "○ Sin señal: crear una cuenta requiere conexión.", "○ Sem sinal: criar uma conta exige conexão.", "○ Pas de signal : créer un compte nécessite une connexion.");
  a("○ No signal — you can still sign in with an account that has signed in on this device before.", "○ Sin señal: aún puedes entrar con una cuenta que ya inició sesión en este dispositivo.", "○ Sem sinal: você ainda pode entrar com uma conta que já entrou neste dispositivo.", "○ Pas de signal : vous pouvez encore vous connecter avec un compte déjà connecté sur cet appareil.");
  a("● Connected to the NOVACARE database. After your first sign-in here, you can also sign in without signal.", "● Conectado a la base de datos de NOVACARE. Tras tu primer inicio de sesión aquí, también podrás entrar sin señal.", "● Conectado ao banco de dados do NOVACARE. Após seu primeiro acesso aqui, você também poderá entrar sem sinal.", "● Connecté à la base NOVACARE. Après votre première connexion ici, vous pourrez aussi vous connecter sans signal.");
  a("Account created — confirm it from your email, then sign in", "Cuenta creada: confírmala desde tu correo y luego inicia sesión", "Conta criada: confirme pelo seu e-mail e depois entre", "Compte créé : confirmez-le depuis vos e-mails, puis connectez-vous");
  a("Signed in without signal — data saves on this device", "Sesión iniciada sin señal: los datos se guardan en este dispositivo", "Conectado sem sinal: os dados são salvos neste dispositivo", "Connecté sans signal : les données sont enregistrées sur cet appareil");
  a("Welcome aboard, {s}", "Bienvenido a bordo, {s}", "Bem-vindo a bordo, {s}", "Bienvenue à bord, {s}");
  a("Welcome back, {s}", "Te damos la bienvenida de nuevo, {s}", "Bem-vindo de volta, {s}", "Content de vous revoir, {s}");

  /* ---------- help button, takeover, alerts ---------- */
  a("Help requested", "Ayuda solicitada", "Ajuda solicitada", "Aide demandée");
  a("Help", "Ayuda", "Ajuda", "Aide");
  a("Help requested — open to send another request", "Ayuda solicitada: abre para enviar otra petición", "Ajuda solicitada: abra para enviar outro pedido", "Aide demandée : ouvrez pour envoyer une autre demande");
  a("Ask your crew for help", "Pide ayuda a tu tripulación", "Peça ajuda à sua tripulação", "Demandez de l’aide à votre équipage");
  a("Crewmate needs help now ·", "Un compañero necesita ayuda ya ·", "Um colega precisa de ajuda agora ·", "Un équipier a besoin d’aide maintenant ·");
  a("A crewmate asks for a hand ·", "Un compañero pide una mano ·", "Um colega pede uma mão ·", "Un équipier demande un coup de main ·");
  a("{s} needs help", "{s} necesita ayuda", "{s} precisa de ajuda", "{s} a besoin d’aide");
  a("{s} could use a hand", "{s} necesita una mano", "{s} precisa de uma mão", "{s} a besoin d’un coup de main");
  a("Emergency: {s}", "Emergencia: {s}", "Emergência: {s}", "Urgence : {s}");
  a("{s} · raised by {s}", "{s} · avisó {s}", "{s} · acionada por {s}", "{s} · signalée par {s}");
  a("{s} · raised by {s} — “{s}”", "{s} · avisó {s}: «{s}»", "{s} · acionada por {s}: “{s}”", "{s} · signalée par {s} : « {s} »");
  a("Allergies:", "Alergias:", "Alergias:", "Allergies :");
  a("Go help", "Ir a ayudar", "Ir ajudar", "Aller aider");
  a("Open protocol", "Abrir protocolo", "Abrir protocolo", "Ouvrir le protocole");
  a("I’ve seen it", "Ya lo vi", "Já vi", "J’ai vu");
  a("+{n} more call for help", "+{n} llamada de ayuda más", "+{n} pedido de ajuda a mais", "+{n} appel à l’aide de plus");
  a("+{n} more calls for help", "+{n} llamadas de ayuda más", "+{n} pedidos de ajuda a mais", "+{n} appels à l’aide de plus");
  a("Any task you were doing is kept — you can go back to it after.", "Lo que estabas haciendo se conserva: puedes volver después.", "O que você estava fazendo foi mantido: você pode voltar depois.", "Ce que vous faisiez est conservé : vous pourrez y revenir ensuite.");
  a("Open NovaCare", "Abrir NovaCare", "Abrir o NovaCare", "Ouvrir NovaCare");
  a("{s} is asking for help", "{s} pide ayuda", "{s} está pedindo ajuda", "{s} demande de l’aide");
  a("Emergency: {s} — {s}", "Emergencia: {s} — {s}", "Emergência: {s} — {s}", "Urgence : {s} — {s}");
  a("✓ Help request from {s} resolved", "✓ Petición de ayuda de {s} resuelta", "✓ Pedido de ajuda de {s} resolvido", "✓ Demande d’aide de {s} résolue");
  a("✓ Emergency resolved: {s} — {s}", "✓ Emergencia resuelta: {s} — {s}", "✓ Emergência resolvida: {s} — {s}", "✓ Urgence résolue : {s} — {s}");
  a("✓ Help request delivered to your crew", "✓ Petición de ayuda entregada a tu tripulación", "✓ Pedido de ajuda entregue à sua tripulação", "✓ Demande d’aide transmise à votre équipage");
  a("✓ Emergency delivered — your crew has been alerted", "✓ Emergencia entregada: tu tripulación fue avisada", "✓ Emergência entregue: sua tripulação foi avisada", "✓ Urgence transmise : votre équipage a été alerté");
  a("Alert not delivered yet — retrying. {s}", "Alerta aún sin entregar: reintentando. {s}", "Alerta ainda não entregue: tentando de novo. {s}", "Alerte pas encore transmise : nouvel essai. {s}");
  a("Alarm test", "Prueba de alarma", "Teste de alarme", "Test d’alarme");
  a("This is how a call for help sounds", "Así suena una llamada de ayuda", "É assim que soa um pedido de ajuda", "Voici le son d’un appel à l’aide");
  a("Crew member", "Miembro de la tripulación", "Membro da tripulação", "Membre de l’équipage");

  /* the alert reach messages, per kind of alert */
  const kinds = {
    alert: { es: ["esta alerta", "tu alerta"], pt: ["este alerta", "seu alerta"], fr: ["cette alerte", "votre alerte"] },
    "help request": { es: ["esta solicitud de ayuda", "tu solicitud de ayuda"], pt: ["este pedido de ajuda", "seu pedido de ajuda"], fr: ["cette demande d’aide", "votre demande d’aide"] },
    emergency: { es: ["esta emergencia", "tu emergencia"], pt: ["esta emergência", "sua emergência"], fr: ["cette urgence", "votre urgence"] },
  };
  const msgs = [
    ["Guest mode: this {k} stays on this device. Sign in and join the same mission to alert your crew.", 0,
      "Modo invitado: {k} se queda en este dispositivo. Inicia sesión y únete a la misma misión para avisar a tu tripulación.",
      "Modo convidado: {k} fica neste dispositivo. Entre e participe da mesma missão para avisar sua tripulação.",
      "Mode invité : {k} reste sur cet appareil. Connectez-vous et rejoignez la même mission pour alerter votre équipage."],
    ["Local mode: this {k} is only shown on this device.", 0,
      "Modo local: {k} solo se muestra en este dispositivo.",
      "Modo local: {k} aparece apenas neste dispositivo.",
      "Mode local : {k} n’apparaît que sur cet appareil."],
    ["You are not on a mission, so nobody can receive this {k}. Join your crew’s mission first.", 0,
      "No estás en una misión, así que nadie puede recibir {k}. Primero únete a la misión de tu tripulación.",
      "Você não está em uma missão, então ninguém pode receber {k}. Entre primeiro na missão da sua tripulação.",
      "Vous n’êtes dans aucune mission, donc personne ne peut recevoir {k}. Rejoignez d’abord la mission de votre équipage."],
    ["No signal — your {k} is saved and goes out as soon as the link is back", 1,
      "Sin señal: {k} se guarda y saldrá en cuanto vuelva el enlace",
      "Sem sinal: o envio de {k} ocorrerá assim que o link voltar",
      "Pas de signal : l’envoi de {k} partira dès que la liaison reviendra"],
    ["Sending your {k} to the crew…", 1,
      "Enviando {k} a la tripulación…",
      "Enviando {k} para a tripulação…",
      "Envoi de {k} à l’équipage…"],
  ];
  Object.entries(kinds).forEach(([kind, v]) => msgs.forEach(([en, i, es, pt, fr]) => {
    a(en.replace("{k}", kind), es.replace("{k}", v.es[i]), pt.replace("{k}", v.pt[i]), fr.replace("{k}", v.fr[i]));
  }));

  /* medical summary line in settings: blood type · medications · conditions */
  const parts = {
    es: ["{n} medicamento", "{n} medicamentos", "{n} afección", "{n} afecciones"],
    pt: ["{n} medicamento", "{n} medicamentos", "{n} condição", "{n} condições"],
    fr: ["{n} médicament", "{n} médicaments", "{n} affection", "{n} affections"],
  };
  const en4 = ["{n} medication", "{n} medications", "{n} condition", "{n} conditions"];
  [false, true].forEach((blood) => [0, 1, 2].forEach((m) => [0, 1, 2].forEach((c) => {
    if (!m && !c) return;
    const idx = [m ? (m === 1 ? 0 : 1) : -1, c ? (c === 1 ? 2 : 3) : -1].filter((x) => x >= 0);
    const join = (arr) => (blood ? ["{s}", ...arr] : arr).join(" · ");
    a(join(idx.map((i) => en4[i])), join(idx.map((i) => parts.es[i])), join(idx.map((i) => parts.pt[i])), join(idx.map((i) => parts.fr[i])));
  })));

  /* ---------- toasts, confirms and recorded notes ---------- */
  a("Everything is already logged for today.", "Todo está ya registrado por hoy.", "Tudo já está registrado por hoje.", "Tout est déjà saisi pour aujourd’hui.");
  a("{n} filled with your last readings — change any that differ", "{n} completados con tus últimas mediciones: cambia los que difieran", "{n} preenchidos com suas últimas medições: altere os que forem diferentes", "{n} remplis avec vos dernières mesures : modifiez ceux qui diffèrent");
  a("No earlier readings to copy yet", "Aún no hay mediciones anteriores para copiar", "Ainda não há medições anteriores para copiar", "Pas encore de mesures précédentes à copier");
  a("{n} reading saved", "{n} medición guardada", "{n} medição salva", "{n} mesure enregistrée");
  a("{n} readings saved", "{n} mediciones guardadas", "{n} medições salvas", "{n} mesures enregistrées");
  a("Critical reading: {s}. Are you OK? Answer, or I will alert your crew in {n} seconds.", "Medición crítica: {s}. ¿Estás bien? Responde, o avisaré a tu tripulación en {n} segundos.", "Medição crítica: {s}. Você está bem? Responda, ou avisarei sua tripulação em {n} segundos.", "Mesure critique : {s}. Tout va bien ? Répondez, sinon j’alerterai votre équipage dans {n} secondes.");
  a("Automatic alert: critical reading ({s}) and no answer for {n} s", "Alerta automática: medición crítica ({s}) y sin respuesta durante {n} s", "Alerta automático: medição crítica ({s}) e sem resposta por {n} s", "Alerte automatique : mesure critique ({s}) et pas de réponse depuis {n} s");
  a("I have alerted your crew. Help is coming.", "He avisado a tu tripulación. La ayuda viene en camino.", "Avisei sua tripulação. A ajuda está a caminho.", "J’ai alerté votre équipage. L’aide arrive.");
  a("Reading aloud is not available in this browser", "La lectura en voz alta no está disponible en este navegador", "A leitura em voz alta não está disponível neste navegador", "La lecture à voix haute n’est pas disponible dans ce navigateur");
  a("This follow-up is closed", "Este seguimiento está cerrado", "Este acompanhamento está encerrado", "Ce suivi est clôturé");
  a("Did the recommended steps", "Hice los pasos recomendados", "Fez os passos recomendados", "A suivi les étapes recommandées");
  a("Recorded — NovaCare will check at your next measurement", "Registrado: NovaCare lo verificará en tu próxima medición", "Registrado: o NovaCare vai conferir na sua próxima medição", "Enregistré : NovaCare vérifiera à votre prochaine mesure");
  a("Measured again", "Medido de nuevo", "Medido de novo", "Mesuré à nouveau");
  a("Discharge review: {s}", "Revisión de alta: {s}", "Revisão de alta: {s}", "Revue de clôture : {s}");
  a("Asked the Crew Medical Officer to review the discharge", "Se pidió al oficial médico de la tripulación que revise el alta", "Pediu-se ao oficial médico da tripulação que revise a alta", "A demandé à l’officier médical de l’équipage de revoir la clôture");
  a("Sent — the Crew Medical Officer reviews it from your card on their device", "Enviado: el oficial médico de la tripulación lo revisa desde tu ficha en su dispositivo", "Enviado: o oficial médico da tripulação revisa a partir do seu cartão no dispositivo dele", "Envoyé : l’officier médical de l’équipage le revoit depuis votre fiche sur son appareil");
  a("Discharge “{s}”? Signed as {s}. NovaCare opens a new case if it comes back.", "¿Dar de alta «{s}»?\n\nFirmado como {s}. NovaCare abre un caso nuevo si vuelve.", "Dar alta de “{s}”?\n\nAssinado como {s}. O NovaCare abre um novo caso se voltar.", "Clôturer « {s} » ?\n\nSigné en tant que {s}. NovaCare ouvre un nouveau cas s’il revient.");
  a("Discharged — it stays in your record and the mission log", "Alta dada: queda en tu historial y en el registro de la misión", "Alta dada: fica no seu histórico e no registro da missão", "Clôturé : cela reste dans votre dossier et le journal de la mission");
  a("Discharge “{s}” for {s}? Signed as {s}. It closes on their device the next time it syncs.", "¿Dar de alta «{s}» a {s}?\n\nFirmado como {s}. Se cierra en su dispositivo la próxima vez que sincronice.", "Dar alta de “{s}” para {s}?\n\nAssinado como {s}. Fecha no dispositivo dele na próxima sincronização.", "Clôturer « {s} » pour {s} ?\n\nSigné en tant que {s}. Cela se clôt sur son appareil à la prochaine synchro.");
  a("Discharge signed for {s} — it reaches their device with the next sync", "Alta firmada para {s}: llega a su dispositivo con la próxima sincronización", "Alta assinada para {s}: chega ao dispositivo dele na próxima sincronização", "Clôture signée pour {s} : elle arrive sur son appareil à la prochaine synchro");
  a("Recorded — NovaCare will check whether it helped", "Registrado: NovaCare verificará si ayudó", "Registrado: o NovaCare vai verificar se ajudou", "Enregistré : NovaCare vérifiera si cela a aidé");
  a("Reading confirmed — it now counts", "Medición confirmada: ahora cuenta", "Medição confirmada: agora conta", "Mesure confirmée : elle compte désormais");
  a("Tell your crew about this? “{s}” Everyone on your mission gets a non-urgent request to check on you.", "¿Avisar a tu tripulación de esto?\n\n«{s}»\n\nTodos en tu misión reciben una petición no urgente para ver cómo estás.", "Avisar sua tripulação sobre isto?\n\n“{s}”\n\nTodos na sua missão recebem um pedido não urgente para ver como você está.", "Prévenir votre équipage ?\n\n« {s} »\n\nTous les membres de votre mission reçoivent une demande non urgente de prendre de vos nouvelles.");
  a("Testing the onboard systems…", "Probando los sistemas de a bordo…", "Testando os sistemas de bordo…", "Test des systèmes de bord…");
  a("Good — the alert to your crew was cancelled", "Bien: la alerta a tu tripulación se canceló", "Ótimo: o alerta para sua tripulação foi cancelado", "Bien : l’alerte à votre équipage a été annulée");
  a("Good. Measure again to confirm the reading", "Bien. Mide de nuevo para confirmar la medición", "Ótimo. Meça de novo para confirmar a medição", "Bien. Mesurez à nouveau pour confirmer la mesure");
  a("Nice — logged for today. Small steps add up.", "Bien: registrado por hoy. Los pequeños pasos suman.", "Ótimo: registrado por hoje. Pequenos passos somam.", "Bravo : saisi pour aujourd’hui. Les petits pas comptent.");
  a("Emergency resolved — what was done is in the mission log", "Emergencia resuelta: lo hecho está en el registro de la misión", "Emergência resolvida: o que foi feito está no registro da missão", "Urgence résolue : ce qui a été fait est dans le journal de la mission");
  a("Syncing with the NovaCare database…", "Sincronizando con la base de datos de NovaCare…", "Sincronizando com o banco de dados do NovaCare…", "Synchronisation avec la base NovaCare…");
  a("Seen — the alert stays in the red bar until it is resolved", "Visto: la alerta sigue en la barra roja hasta que se resuelva", "Visto: o alerta fica na barra vermelha até ser resolvido", "Vu : l’alerte reste dans la barre rouge jusqu’à sa résolution");
  a("Only crew members can resolve a crew member’s emergency", "Solo los miembros de la tripulación pueden resolver la emergencia de otro miembro", "Somente membros da tripulação podem resolver a emergência de outro membro", "Seuls les membres de l’équipage peuvent résoudre l’urgence d’un équipier");
  a("Tap again to resolve", "Toca de nuevo para resolver", "Toque de novo para resolver", "Touchez encore pour résoudre");
  a("Request cancelled — your crew sees that you are OK", "Petición cancelada: tu tripulación ve que estás bien", "Pedido cancelado: sua tripulação vê que você está bem", "Demande annulée : votre équipage voit que tout va bien");
  a("Resolved for the whole crew", "Resuelto para toda la tripulación", "Resolvido para toda a tripulação", "Résolu pour tout l’équipage");
  a("Exploring as a guest — data stays on this device", "Explorando como invitado: los datos se quedan en este dispositivo", "Explorando como convidado: os dados ficam neste dispositivo", "Exploration en invité : les données restent sur cet appareil");
  a("Listening…", "Escuchando…", "Ouvindo…", "Écoute…");
  a("Voice input is not available in this browser", "La entrada de voz no está disponible en este navegador", "A entrada de voz não está disponível neste navegador", "La saisie vocale n’est pas disponible dans ce navigateur");
  a("{n} medical items added to the ship inventory", "{n} artículos médicos agregados al inventario de la nave", "{n} itens médicos adicionados ao inventário da nave", "{n} articles médicaux ajoutés à l’inventaire du vaisseau");
  a("{n} medical items added to the ship inventory, {n} updated", "{n} artículos médicos agregados al inventario de la nave, {n} actualizados", "{n} itens médicos adicionados ao inventário da nave, {n} atualizados", "{n} articles médicaux ajoutés à l’inventaire du vaisseau, {n} mis à jour");
  a("{s} removed", "{s} eliminado", "{s} removido", "{s} retiré");
  a("Remove {s} from the ship inventory?", "¿Quitar {s} del inventario de la nave?", "Remover {s} do inventário da nave?", "Retirer {s} de l’inventaire du vaisseau ?");
  a("{n} starter items added — adjust them to match your ship", "{n} artículos iniciales agregados: ajústalos a tu nave", "{n} itens iniciais adicionados: ajuste-os à sua nave", "{n} articles de départ ajoutés : adaptez-les à votre vaisseau");
  a("Guest mode: everything stays on this device. Sign in with an account to share with your crew.", "Modo invitado: todo se queda en este dispositivo. Inicia sesión con una cuenta para compartir con tu tripulación.", "Modo convidado: tudo fica neste dispositivo. Entre com uma conta para compartilhar com sua tripulação.", "Mode invité : tout reste sur cet appareil. Connectez-vous avec un compte pour partager avec votre équipage.");
  a("You joined mission {s}", "Te uniste a la misión {s}", "Você entrou na missão {s}", "Vous avez rejoint la mission {s}");
  a("You joined {s}", "Te uniste a {s}", "Você entrou em {s}", "Vous avez rejoint {s}");
  a("Switched to mission {s}", "Cambiaste a la misión {s}", "Você trocou para a missão {s}", "Vous êtes passé à la mission {s}");
  a("Switched to {s}", "Cambiaste a {s}", "Você trocou para {s}", "Vous êtes passé à {s}");
  a("Sign out of NOVACARE?", "¿Cerrar sesión en NOVACARE?", "Sair do NOVACARE?", "Se déconnecter de NOVACARE ?");
  a("Sign out of NOVACARE? Guest data stays on this device: choose “Continue as guest” again to pick up where you left off.", "¿Cerrar sesión en NOVACARE?\n\nLos datos de invitado se quedan en este dispositivo: elige «Continuar como invitado» otra vez para retomar donde lo dejaste.", "Sair do NOVACARE?\n\nOs dados de convidado ficam neste dispositivo: escolha “Continuar como convidado” de novo para retomar de onde parou.", "Se déconnecter de NOVACARE ?\n\nLes données d’invité restent sur cet appareil : choisissez à nouveau « Continuer en invité » pour reprendre où vous en étiez.");
  a("Sign out of NOVACARE? Some readings have not uploaded yet. They stay saved on this device and will upload the next time you sign in with signal.", "¿Cerrar sesión en NOVACARE?\n\nAlgunas mediciones aún no se han subido. Siguen guardadas en este dispositivo y se subirán la próxima vez que inicies sesión con señal.", "Sair do NOVACARE?\n\nAlgumas medições ainda não foram enviadas. Continuam salvas neste dispositivo e serão enviadas na próxima vez que você entrar com sinal.", "Se déconnecter de NOVACARE ?\n\nCertaines mesures n’ont pas encore été envoyées. Elles restent enregistrées sur cet appareil et seront envoyées à votre prochaine connexion avec signal.");
  a("Signed out", "Sesión cerrada", "Você saiu", "Déconnecté");
  a("Leave {s}? Your readings for this mission are removed from this account and your crewmates stop seeing you. You can join again later with the code {s}.", "¿Salir de {s}?\n\nTus mediciones de esta misión se eliminan de esta cuenta y tus compañeros dejan de verte. Puedes volver a unirte más tarde con el código {s}.", "Sair de {s}?\n\nSuas medições desta missão são removidas desta conta e seus colegas deixam de ver você. Você pode entrar de novo depois com o código {s}.", "Quitter {s} ?\n\nVos mesures de cette mission sont retirées de ce compte et vos équipiers ne vous voient plus. Vous pourrez la rejoindre plus tard avec le code {s}.");
  a("You left {s} — now on {s}", "Saliste de {s}: ahora estás en {s}", "Você saiu de {s}: agora está em {s}", "Vous avez quitté {s} : vous êtes maintenant sur {s}");
  a("You left {s}", "Saliste de {s}", "Você saiu de {s}", "Vous avez quitté {s}");
  a("Code {s} copied — share it with your crew", "Código {s} copiado: compártelo con tu tripulación", "Código {s} copiado: compartilhe com sua tripulação", "Code {s} copié : partagez-le avec votre équipage");
  a("Mission code: {s}", "Código de la misión: {s}", "Código da missão: {s}", "Code de la mission : {s}");
  a("No problem — “Add info” is there whenever you want it", "Sin problema: «Agregar datos» está ahí cuando lo quieras", "Sem problema: “Adicionar dados” está lá quando você quiser", "Pas de souci : « Ajouter des infos » est là quand vous voulez");
  a("{s} done", "{s} hecho", "{s} feito", "{s} fait");
  a("Replace current data with the {n}-day demo mission?", "¿Reemplazar los datos actuales con la misión demo de {n} días?", "Substituir os dados atuais pela missão demo de {n} dias?", "Remplacer les données actuelles par la mission démo de {n} jours ?");
  a("Demo mission loaded", "Misión demo cargada", "Missão demo carregada", "Mission démo chargée");
  a("Erase all your readings for this mission? The mission, its day and your crew stay as they are. This cannot be undone.", "¿Borrar todas tus mediciones de esta misión?\n\nLa misión, su día y tu tripulación se quedan como están. No se puede deshacer.", "Apagar todas as suas medições desta missão?\n\nA missão, seu dia e sua tripulação permanecem como estão. Isso não pode ser desfeito.", "Effacer toutes vos mesures de cette mission ?\n\nLa mission, son jour et votre équipage restent tels quels. Cette action est irréversible.");
  a("Readings erased — log a check-in when you are ready", "Mediciones borradas: haz un chequeo cuando estés listo", "Medições apagadas: faça um check-in quando estiver pronto", "Mesures effacées : faites un bilan quand vous êtes prêt");
  a("Thanks — all good. Next quick status in {n} h", "Gracias, todo bien. Próximo estado rápido en {n} h", "Obrigado, tudo bem. Próximo status rápido em {n} h", "Merci, tout va bien. Prochain point rapide dans {n} h");
  a("Notifications on — NovaCare will remind you", "Notificaciones activadas: NovaCare te lo recordará", "Notificações ativadas: o NovaCare vai lembrar você", "Notifications activées : NovaCare vous le rappellera");
  a("Notifications were not allowed", "Las notificaciones no se permitieron", "As notificações não foram permitidas", "Les notifications n’ont pas été autorisées");
  a("Notifications off — reminders stay under the bell", "Notificaciones desactivadas: los recordatorios quedan bajo la campana", "Notificações desativadas: os lembretes ficam sob o sino", "Notifications désactivées : les rappels restent sous la cloche");
  a("Reminder snoozed for an hour", "Recordatorio pospuesto una hora", "Lembrete adiado por uma hora", "Rappel reporté d’une heure");
  a("Mission day {n} — crew data and mission status updated", "Día de misión {n}: datos de la tripulación y estado de la misión actualizados", "Dia da missão {n}: dados da tripulação e status da missão atualizados", "Jour de mission {n} : données de l’équipage et état de la mission mis à jour");
  a("Password changed — you are signed in", "Contraseña cambiada: ya iniciaste sesión", "Senha alterada: você já está conectado", "Mot de passe changé : vous êtes connecté");
  a("Give the mission a name.", "Ponle un nombre a la misión.", "Dê um nome à missão.", "Donnez un nom à la mission.");
  a("Item updated", "Artículo actualizado", "Item atualizado", "Article mis à jour");
  a("Item added to the ship inventory", "Artículo agregado al inventario de la nave", "Item adicionado ao inventário da nave", "Article ajouté à l’inventaire du vaisseau");
  a("Medical profile saved", "Perfil médico guardado", "Perfil médico salvo", "Profil médical enregistré");
  a("Sync resumed", "Sincronización reanudada", "Sincronização retomada", "Synchro reprise");
  a("Mission renamed", "Misión renombrada", "Missão renomeada", "Mission renommée");
  a("That file is too large — upload a CSV list under 500 KB", "Ese archivo es demasiado grande: sube una lista CSV de menos de 500 KB", "Esse arquivo é grande demais: envie uma lista CSV com menos de 500 KB", "Ce fichier est trop volumineux : envoyez une liste CSV de moins de 500 Ko");
  a("{n} item added, {n} updated", "{n} artículo agregado, {n} actualizados", "{n} item adicionado, {n} atualizados", "{n} article ajouté, {n} mis à jour");
  a("{n} items added, {n} updated", "{n} artículos agregados, {n} actualizados", "{n} itens adicionados, {n} atualizados", "{n} articles ajoutés, {n} mis à jour");
  a("No items found — use columns: name, category, quantity, unit, minimum, note", "No se encontraron artículos: usa las columnas name, category, quantity, unit, minimum, note", "Nenhum item encontrado: use as colunas name, category, quantity, unit, minimum, note", "Aucun article trouvé : utilisez les colonnes name, category, quantity, unit, minimum, note");
  a("Status update every {n} hours", "Estado rápido cada {n} horas", "Status rápido a cada {n} horas", "Point rapide toutes les {n} heures");
  a("Location: {s}", "Ubicación: {s}", "Local: {s}", "Lieu : {s}");
  a("On — NovaCare alerts your crew if you do not answer", "Activado: NovaCare avisa a tu tripulación si no respondes", "Ativado: o NovaCare avisa sua tripulação se você não responder", "Activé : NovaCare alerte votre équipage si vous ne répondez pas");
  a("Off — NovaCare will not alert the crew by itself", "Desactivado: NovaCare no avisará a la tripulación por sí solo", "Desativado: o NovaCare não avisará a tripulação por conta própria", "Désactivé : NovaCare n’alertera pas l’équipage de lui-même");

  I18N.add(D);
})();
