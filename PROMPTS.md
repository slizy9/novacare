# Prompts de NovaCare

Los prompts más importantes que se usaron para crear NovaCare con Claude Code, del 14 al 15 de noviembre de 2026, en orden. Están copiados tal como se escribieron, con la ortografía original. Debajo de cada uno se dice qué produjo y el commit o la versión donde quedó.

No se incluyeron las confirmaciones cortas ("listo", "sí, súbelo", "sigue"), los mensajes para resolver errores ni ninguna clave o token.

---

## 1. La idea original

Este es el documento del equipo que define el producto. Se pegó para revisar que la página cumpliera con él y fue la base de todo lo que vino después.

> revisa que la web a partir de este promp: [documento abajo] mantenga la esencia y la base que queriamos con el prompt

> Es un sistema administrativo medico para registras, analizar datos y recomendar acciones de mejora. Para la parte de la terminal del usuario planeamos que tenga lo siguiente: Un registro que muestre "Log In". En el log in se inicia secion con un usuario y contraseña creado, seguidamente se una pagina con informacion general medica y que muestra modulos divididos en las categorias de: personal, crewmatr , mission status, análisis. Los cuales tienen sub categorías como en personal: Vitals, Routine, Hazards y status of their body. En cada uno de los modulos se muestra una imagen del sistema con el nombre del usuario, a su vez muestra la informacion mas importante de ese modulo, al lado de la informacion personal muestra las opciones: Add Info y Questions, donde esta la opcion de añadir manualmente la informacion y los resultados de los examenes medicos realizados (habria una opcion de que los resultados se suban automaticamente despues de los examenes), y donde se pueden realizar preguntas por voz o preguntas con respecto a la salud del usuario. en otra pestaña se muestran los resultados historicos con graficos, recommendiaciones, la rutina que se sigue, etc. La opcion de emergencia seria en caso de que alguien requiera asistencia, un usuario (llamemoslo usuario 1) se da cuenta de que el usuario 2 necesita asistencia medica pero no sabe exactamente que medicamento otorgar o si le va a dar alguna alergia, entonces se logea en "emergencia" escanea su propia Banda de radio frecuencia (para guardar la informacion de quien accedio), seguidamente se le muestra una lista de usuarios activos, usuario 1 selecciona el #2 (el que requiere asistencia) y pregunta por voz o escritura que hacer en esa situacion y que medicamentos otorgar.
>
> Ahora, la parte de informacion
> El docker tiene que ir cargado y entrenado con toda la informacion media necesaria de los tripulantes y de la mision. Tiene que ser capaz de enviar y recibir mensajes de la tierra, pero no ser dependiente de informacion externa (esta funcion es solo para la comunicacion y los registros, no necesariamente buscar ayuda ya que a largas distancias los mensajes pueden tardar minutos, horas o incluso dias). Tiene que actualizarse y guradar la informacion medica de los examenes realizados abordo. El docker debe estar entrenado con referencias, promedios, datos iniciales de los tripulantes (antes de la mision), y suficiente conocimiento para interpretar los datos correctamente. A su vez ser capas de adaptar su conocimiento y recomendaciones basado en la mision (ya que cada mision requiere cosas distintas)
>
> Nuestro diferenciante (por definir):
> queremos añadir una funcion autonoma para ser un metodo de ayuda si no hay nadie cerca, pero necesitamos definir el como, el metodo, las funciones prestablecidas, y los permisos que puede llagar a tener. y ser capas de funcionar en gravedad 0
>
> mundo real:
> nuestro impacto va más alla de solo un asistente de informacion medica para los tripulantes, si no que queremos que sea utilizado en el mundo. Algunos ejemplos podrian ser: hospitales, asilos, guarderias y escuelas, en las calles publicas (asistencia a personas que necesiten ayuda y no haya nadie cerca), espacios laborales, privados para el hogar para personas con alguna discapacidad o adulos mayores que viven solos.

---

## 2. Primera versión: misiones, nube y datos de la NASA

**Prompt 1: el lobby de misiones**

> apartir de esta carpeta que es una pagina web, haz que la pagina web tenga una eleccion entre pestanas mas fluida o atractiva, que haya una pestana que sea un main lobby para elegir entre diferentes misiones

Resultado: la navegación por pestañas y el lobby.

**Prompt 2: crear y unirse a misiones, e inventario de la nave**

> Add this uploaded photos and video interactive UI/UX into the prototype you made, with the different missions let them create new missions and join anothers by a code, also add a part in the crew where they can upload or update the items they dispose at the ship,

Resultado: crear una misión, unirse con un código y el inventario de la nave. Se pasaron fotos y un video de referencia.

**Prompt 3: un solo rol por persona y la API de la NASA**

> haz que las personas a la hora de registrarse solo puedan elegir un rol y en la interfaz https://visualization.osdr.nasa.gov/biodata/api/ usa esta api para lo que sirva

Resultado: un rol fijo por persona y los estudios reales de NASA OSDR por sistema del cuerpo (commit `442a952`). Ese mismo commit trae la conexión con Supabase. La base de datos se conectó en una sesión aparte, a partir de las instrucciones que se describen en la sección 9.

**Prompt 4: modo invitado y misiones reales**

> anade un boton para poder ingresar sin tener que registrar como entrar como invitado, aparte cambia que en la pagina las personas que se registran como nosotros solo salgan en las misiones que se registran y que al ingresar no esten de una vez metidos en nova y que todas las misiones que creen las personas salgan

Resultado: entrar como invitado, ninguna misión por defecto y un directorio con todas las misiones (`e016130`).

**Prompt 5: el lobby se centra en la persona**

> quita de esa parte lo de create an account y que sea solo si no tienen una sesion, y haz que el invitado si pueda ver todo sin necesitar una mision, haz que la prioridad en el lobby sea la informacion personal o muy resumida de la mision en general, quita lo de elegir una mision o muevelo a otra pestana como la de mission status

Resultado: el inicio muestra primero a la persona, y las misiones pasan a la pestaña Misión (`dcf9064`).

---

## 3. Preguntas, emergencias y perfil médico

**Prompt 6: emergencia conectada al inventario y alergias**

> empieza por questions y por emergencia pero en emergencia seria que con lo q hay ahora que uno describe la situacion, la web se conecte al inventario y con lo que hay en el inventario le diga que hacer y tambien crea un espacio donde el astronauta pueda definir o ya vengan definidas sus akergias o etc

Resultado: el asistente de Preguntas, el perfil médico y una emergencia que usa el inventario de la nave (`d68ef3c`).

**Prompt 7: diseño médico premium**

> antes de publicarlo cambia por completo la UI a algo mas medico premium con estilo minimalista y estetico

Resultado: rediseño clínico (`ab98c7c`).

**Prompt 8: chequeo más corto y todo con respaldo científico**

> en lo del check in haz que haya mas brevedad en las preguntas, que el boton sea un poco mas grande, haz que lo de los datos se basado en la api que te mande anteriormente de la nasa, cualqueir dato debe se respaldado por algun informe o investgacion

Resultado: el chequeo es más corto y cada indicador muestra su evidencia de la NASA (`5f73ef5`).

**Prompt 9: actualizaciones de estado periódicas**

> haz que de ese check in cada tanto tiempo los astronautas tengan que hacer un status update pero con preguntas de seguimiento y mas sencillas

Resultado: actualizaciones de estado con preguntas de seguimiento (`75ff5fe`).

**Prompt 10: pedir ayuda a toda la tripulación**

> haz que en el menu de personal y lobby haya un boton que sea para pedir ayuda y esa misma ayuda le salga a todos los otros miembros de mi tripulacion y tambien como que la ui ahora se ve como muy plana asi que utiliza ambas referencias para crear la ui y no la persona del fondo sino los colores y la idea que el tiro de pagina web

Resultado: el botón de ayuda que alerta a la tripulación y el diseño "Navy & Sand" (`089886e`).

---

## 4. Arquitectura: reglas, base de conocimiento y modelo local

**Prompt 11: Preguntas no puede inventar una dosis**

Este fue uno de los cambios más importantes. Corrigió la idea original de un "Docker entrenado".

> en la parte de las preguntas haz que sea capaz de responder a cualquier pregunta en la parte medica, de bienestar emocional, problemas de la nave y como solucionarlos o revisa esto:
>
> C1 "Docker entrenado" mezcla tres cosas distintas y deja a una IA recetando
> FALLA: Docker empaqueta software, no aprende. Si el plan dice que el contenedor "está entrenado" y responde qué medicamento dar, un juez lo lee como un chatbot que puede alucinar una dosis.
> SOLUCIÓN:
> * Motor de reglas (autoridad): umbrales, líneas base, alergias, interacciones, dosis por peso, inventario del botiquín.
> * Base de conocimiento local versionada: protocolos, rangos para microgravedad, perfil de misión, historial pre-vuelo. Se consulta por búsqueda (RAG), no se "entrena".
> * LLM local pequeño solo para lenguaje: explica resultados y responde preguntas citando la fuente. Si no hay fuente, responde "sin protocolo, escalar".
> * Todo corre en `docker-compose` en la terminal, sin internet.
>
> EN LA DEMO: Preguntar "¿le doy amoxicilina?" a un tripulante alérgico. El motor bloquea antes de que hable el LLM y la respuesta muestra la regla y la fuente.
>
> para que cumpla con todo lo importante

Resultado: las tres capas: el motor de reglas, la base de conocimiento con búsqueda BM25 y el modelo local opcional (`0129a34`).

**Prompt 12: recordatorios en vez de ventanas**

> haz que sea mucho mas facil para el usuario que todo funcione mejor para el y lo de las task que les salga una notificacion y nada mas les recuerde hacerla

Resultado: la campana de notificaciones y un solo botón "Siguiente" (`0cb5210`).

**Prompt 13: las cinco funciones del software**

> nuestro software cumple con las siguientes cosas: monitorea, interpreta, detecta anomalias y predice riesgos y recomienda acciones para proteger al astronauta

Resultado: la predicción de riesgos, con proyección de tendencias, dosis de radiación y pérdida de hueso (`b520019`).

---

## 5. Auditoría: los 7 problemas

**Prompt 14: los puntos de mejora del equipo**

Es el segundo documento clave del equipo. Detectó que la página se estaba quedando en "mostrar datos".

> para esta pagina web mira estos puntos de mejora:
>
> 1. Problema: NovaCare corre el riesgo de convertirse en una plataforma que únicamente muestra datos médicos [...] Solución: Implementar un sistema inteligente que [...] compare con el historial clínico, los valores iniciales y las condiciones específicas de cada astronauta [...] proporcionar recomendaciones médicas personalizadas, fundamentadas en protocolos clínicos validados [...]
> 2. Organización centrada en información y no en necesidades [...] priorizar acciones como consultar el estado de salud, registrar exámenes, realizar preguntas, revisar recomendaciones y solicitar asistencia médica.
> 3. Sistema de emergencias poco desarrollado [...] identificar al rescatista y al paciente, consultar alergias, antecedentes y medicamentos, recibir instrucciones basadas en protocolos autorizados y registrar las acciones realizadas. Las instrucciones críticas iniciales deben estar disponibles sin retrasos de autenticación.
> 4. Falta de autonomía médica real [...] arquitectura local mediante Docker [...] para operar sin Internet.
> 5. Falta de personalización según el astronauta y la misión [...] perfiles médicos individuales que incorporen información previa al lanzamiento [...]
> 6. Función autónoma de asistencia física sin definir [...] asistencia autónoma por niveles, comenzando con instrucciones médicas por voz, identificación de emergencias y alertas a otros tripulantes.
> 7. Falta de integración entre información, análisis y acciones [...] los exámenes actualicen automáticamente el expediente, el sistema analice los cambios, identifique posibles riesgos y presente recomendaciones justificadas [...] manteniendo un historial de decisiones y resultados.

**Prompt 15: mejorar la experiencia sin cambiar el diseño**

> vuelve a la version anterior, no hagas cambios en el ui sino mejora el ux

**Prompt 16: comparar con la idea original**

> haz que esto no salga asi directamente sino que salga como una notificacion para el astronauta, estamos buscando recomendaciones de mejora y tambien criticas del UX ya que necesitamos que sea practico. necesito que compares la pagina actual con la idea original, dime donde nos perdimos (cosas minimas como ubicacion de botones no importa, pero la idea central y el proposito si).
>
> incluye recomendaciones personalizadas basadas en protocolos médicos validados y seguimiento hasta dar de alta. todo ese cuadro de my health simplificalo por que es demasiada informacion que el astronauta no le va a poner atencion

**Prompt 17: un plan por fases**

> haz un plan para solucionar cada uno de los problemas sin cambiar la UI

Resultado de los prompts 15 a 17:
- **Fase 1** (`2dfefbb`): seguimiento hasta el alta, recomendaciones como notificaciones y protocolos aprobados por el oficial médico.
- **Fase 2** (`dd7a39e`): una sola fuente de hallazgos, los exámenes en el expediente y la preparación explicada.
- **Fase 3** (`d393391`): hitos de cuidado.

**Prompt 18: emergencias que cualquiera puede cancelar y que llegan a todos**

> esta parte en my healt muevela para que sea lo primero que veas en esa pestana, esa parte de your plan to imporve o la mueves o la desapareces o vez que hacer por que no nos gusta, la persona que inicio la emergencia no puede cancelar el request cambialo, tambien cuando la pagina esta en linea todos los astronautas de la mision les deberia salir que hay una encurso

**Prompt 19: gráficas en Análisis**

> empieza fase 3 y tambien haz que en esta pesataña de insights se incluyan graficos con informacion desplegable donde se muestran las mediciones y resultados medicos que se hacen los astronautas. y tambien organizar la informacion existente en una forma mas optima y sensilla para simplificar el UX. aplica la misma logica en "My health -- Hazards"

Resultado: astronautas desplegables con gráficas de 30 días, y Peligros organizado igual (`d393391`).

**Prompt 20: reiniciar las misiones y el inventario de la misión**

> reinicia todas las misiones activas al dia 1 y agrega un inventario con datos de lo que los astronautas llevan a 1 mision

Resultado: reinicio de misiones y el inventario inicial de cada misión (`793886b`).

---

## 6. Prueba como astronauta

**Prompt 21: probarla como un usuario real**

> entra a la pagina suponiendo que eres un astronauta y tenes alguna problema de salud o para probarla en general y da un feedback muy claro y objetivo

Resultado: alertas calibradas, síntomas en el chequeo y respuestas en español (`6ecf4dc`).

**Prompt 22: resumen de lo hecho**

> subelo pero antes mandame un resumen de todo lo que acabas de hacer para solucionar los 7 problemas

---

## 7. Preguntas más amplias, idiomas y la Tierra

**Prompt 23: responder todo tipo de preguntas**

> EN QUESTIONS, SI LE PREGUNTO QUE TENGO MIGRANA SALE QUE NO HAY UN PROTOCOLO PERO SI ME DUELE LA CABEZA SI SALE ALGO, HAZ QUE SEA CAPAZ DE RESPONDER TODO TIPO DE PREGUNTAS MEDICAS Y PISCOLOGICAS, A LA PARTE DE LOGIN EN DONDE SALE LA IMAGEN DEL ESPACIO CAMBIALO POR UN PLANETA TIERRA QUE ESTE GIRANDO

Resultado: más protocolos y sinónimos, y una Tierra girando en el inicio de sesión (`5275757`).

**Prompt 24: varios idiomas**

> haz que la aplicacion sea capaz de estar en diferentes idiomas y lel questions responda segun el idioma del cual sale la pregunta, tambien haz mucho mas extenso la capacidad de respuesta como por ejemplo si tengo gastritis no sabe responder o si estoy con muchos gases tampoco

Resultado: español, inglés, portugués y francés, y respuestas en el idioma de la pregunta.

---

## 8. Mente: el asistente psicológico

**Prompt 25: sesiones guiadas**

> revisa esta pagina y deja lo esencial y haz que sean como sesiones guiadas de manera que sirva como un acompanamiento psicologico, tambien revisa que en el celular puedan altenar entre modo claro y oscuro, revisa todos los idiomas por que cuando me meto a espanol sale como inspira y no se dice asi

**Prompt 26: espacios para expresarse**

> sintetiza esta parte de la salud mental para que funcione como un asistente psicologico, con sesiones guiadas y inclusive espacios donde se puedan expresar, haz que todos los botones esencial se puedan usar y que la foto de bruno siempre funcione

**Prompt 27: un solo diseño y botones confiables**

> usa la misma UI para todo y que las hitboxes de los botones funcionen a la perfeccion, reinicia las conversaciones y modela todo para que siga la misma estetica de la pagina en si

Resultado de los prompts 25 a 27: el asistente que conversa, 4 programas guiados, la Ventana a la Tierra, el diario privado y el pedido privado de hablar con el oficial médico (`5783030`, versión 41).

---

## 9. Instrucciones técnicas para sesiones aparte

Claude escribió estas instrucciones a partir de lo que pidió el equipo, para hacer dos tareas largas en sesiones separadas. Aquí van resumidas.

**Conectar la base de datos en la nube (Supabase)**

> Conecta la app NovaCare al proyecto de Supabase del usuario. Usa solo la clave pública, nunca la de servicio. Ejecuta `supabase/setup.sql`, que crea `profiles`, `missions`, `crew_status`, `alerts` e `inventory` con seguridad por fila (RLS). Revisa los avisos de seguridad. Pregunta antes de cambiar la configuración de autenticación. Prueba con una cuenta: el indicador debe decir Synced y los datos deben llegar a las tablas.

**Servidor de la nave, sin internet**

> Agrega un backend local de la nave, para que las alertas, el estado de la tripulación, las misiones y el inventario funcionen entre dispositivos sin internet. Agrega un servicio a `docker-compose.yml`, un interruptor `SHIP_SERVER_URL` en `js/config.js`, e inicio de sesión que no dependa de la nube. La página pública en novacare.earth debe seguir funcionando igual. Terminado significa: con `docker compose up -d` y dos navegadores en la red local, uno lanza una emergencia y el otro la recibe sin internet.

Resultado: `ship/server.js` y el servicio del servidor de la nave (`3d67285`).

---

## Lo que enseñan estos prompts

1. **Empezar con un documento de la idea**, con propósito, módulos, emergencias, autonomía e impacto. Fue la referencia para revisar todo lo demás.
2. **Pedir revisiones contra la idea original**, no solo funciones nuevas. Así se encontró que la página se estaba quedando en "mostrar datos".
3. **Corregir la arquitectura temprano.** Separar reglas, base de conocimiento y modelo de lenguaje evitó que una IA decidiera dosis.
4. **Pedir evidencia** ("cualquier dato debe ser respaldado por algún informe"). Así cada indicador quedó con su fuente de la NASA.
5. **Probar como usuario** ("entra suponiendo que eres un astronauta"). Esa prueba encontró errores que no se veían en el código.
6. **Separar diseño y experiencia** ("no hagas cambios en el UI, sino mejora el UX"), para no rehacer todo con cada mejora.
