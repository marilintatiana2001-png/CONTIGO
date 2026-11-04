
/* ==========================================
   CONTIGO - MENSAJES DE BIENESTAR EMOCIONAL

   120 frases de apoyo
   45 preguntas de reflexión
   14 emociones

   Los mensajes cambian según la emoción.
   Evita repetir frases hasta recorrerlas.

   Con tus emociones, con tu historia, CONTIGO.
========================================== */

(function () {

    "use strict";

    // ======================================
    // 1. FRASES PARA CADA EMOCIÓN
    // ======================================

    const mensajes = {

        // ANSIEDAD
        "Ansiedad": [
            "No tienes que tener todas las respuestas hoy. A veces, encontrar un pequeño instante de tranquilidad es suficiente para comenzar.",

            "Tu mente puede estar llena de pensamientos, pero no tienes que seguirlos todos. También mereces momentos de pausa.",

            "No todo lo que te preocupa necesita resolverse en este instante. Date permiso de vivir este momento.",

            "Hay días en los que avanzar significa detenerse, observar el cielo y recordar que también mereces descansar.",

            "Tu valor no depende de cuánto puedas controlar. Incluso en medio de la incertidumbre, sigues siendo alguien valioso.",

            "No tienes que correr detrás de cada pensamiento. Puedes regalarte un momento para respirar cómodamente y volver a ti.",

            "La tranquilidad no siempre llega de inmediato. Está bien buscarla a tu ritmo, sin exigirte sentir algo diferente.",

            "Hoy elegiste dedicarte unos minutos. Ese gesto de cuidado merece reconocimiento, incluso si todavía tienes preocupaciones."
        ],

        // TRISTEZA
        "Tristeza": [
            "No todos los días tienen que ser luminosos. También las tardes grises forman parte del paisaje de nuestra vida.",

            "Está bien si hoy tu sonrisa necesita descansar. Tu valor permanece intacto incluso en los días difíciles.",

            "No tienes que esconder tus lágrimas para demostrar fortaleza. Sentir también es parte de ser humano.",

            "Hay una forma muy especial de valentía en permitirte sentir sin juzgarte por ello.",

            "Incluso cuando tu corazón está cansado, mereces recibir ternura, paciencia y compañía.",

            "No necesitas florecer todos los días. Hay temporadas para crecer y otras para descansar.",

            "Ojalá hoy puedas mirarte con la misma dulzura con la que cuidarías a alguien que amas.",

            "Que hoy sea difícil no significa que tengas que atravesarlo sin apoyo. Tu historia merece comprensión."
        ],

        // MIEDO
        "Miedo": [
            "La valentía no consiste en no sentir miedo, sino en reconocerlo sin dejar de tratarte con cariño.",

            "No necesitas conocer todo el camino. A veces basta con descubrir dónde puedes apoyar tu siguiente paso.",

            "Tus dudas no cancelan tus capacidades. Puedes aprender y avanzar a tu propio ritmo.",

            "Hay caminos que parecen enormes cuando los miramos completos. Permítete recorrerlos poco a poco.",

            "No tienes que demostrarle nada al mundo para merecer sentirte seguro.",

            "Incluso las personas más valientes necesitan momentos de compañía, orientación y descanso.",

            "Puedes sentir miedo y, al mismo tiempo, reconocer que mereces nuevas oportunidades.",

            "Está bien buscar una mano amiga cuando el camino parece desconocido. No todo tienes que enfrentarlo solo."
        ],

        // SOLEDAD
        "Soledad": [
            "Tu presencia tiene valor, incluso cuando el mundo parece estar demasiado ocupado para notarlo.",

            "Mereces vínculos donde puedas hablar sin miedo y permanecer en silencio sin sentirte incómodo.",

            "Que hoy te sientas solo no significa que debas atravesar cada dificultad sin compañía.",

            "Hay personas con las que todavía puedes construir conversaciones, recuerdos y pequeños lugares seguros.",

            "No necesitas cambiar quién eres para merecer cariño, respeto y conexiones sinceras.",

            "A veces, acercarse a alguien comienza con un mensaje sencillo. Puedes hacerlo cuando te sientas preparado.",

            "Tu historia merece ser escuchada. Tus pensamientos, tus alegrías y tus días difíciles también importan.",

            "No tienes que llenar cada silencio. También puedes aprender a acompañarte con amabilidad mientras buscas conexión."
        ],

        // ENOJO
        "Enojo": [
            "Tu enojo merece ser comprendido, pero no tiene que decidir por ti cómo actuar.",

            "Hacer una pausa antes de responder puede ser una manera poderosa de cuidarte y cuidar tus relaciones.",

            "Puedes reconocer que algo te lastimó sin permitir que esa experiencia determine todas tus decisiones.",

            "Sentir intensamente no te convierte en una mala persona. Tus emociones no definen todo lo que eres.",

            "No necesitas encontrar las palabras perfectas de inmediato. Puedes darte tiempo para comprender lo que necesitas.",

            "Poner límites con respeto también es una forma de amor propio.",

            "Hay fortaleza en elegir una respuesta consciente cuando algo despierta emociones difíciles.",

            "Puedes expresar lo que te incomoda sin dejar de reconocer tu dignidad y la de los demás."
        ],

        // FRUSTRACIÓN
        "Frustración": [
            "No todos los intentos terminan como esperamos. Aun así, cada experiencia puede enseñarnos algo sobre nuestro camino.",

            "Un resultado diferente al que imaginabas no borra el esfuerzo que hiciste.",

            "No necesitas hacerlo perfectamente para que valga la pena intentarlo.",

            "Los caminos también se construyen con pausas, cambios de dirección y nuevos comienzos.",

            "Que algo no haya funcionado hoy no significa que tus capacidades hayan desaparecido.",

            "A veces, un pequeño ajuste puede ser más útil que exigirte hacerlo todo de nuevo.",

            "Tus avances no necesitan parecerse a los de nadie más. Mereces reconocer tu propio proceso.",

            "Aprender a comenzar otra vez también es una habilidad. Puedes hacerlo sin castigarte por lo ocurrido."
        ],

        // CULPA
        "Culpa": [
            "Un error puede formar parte de tu historia, pero no define la totalidad de quien eres.",

            "Reconocer lo ocurrido es importante. También lo es permitirte aprender sin castigarte indefinidamente.",

            "Puedes responsabilizarte de tus decisiones y seguir siendo una persona digna de respeto.",

            "A veces, reparar comienza con escuchar, comprender y actuar de una manera diferente.",

            "No puedes cambiar cada momento del pasado, pero puedes reflexionar sobre cómo quieres actuar en adelante.",

            "La comprensión hacia ti mismo no elimina la responsabilidad. Puede ayudarte a asumirla de una manera más constructiva.",

            "No eres solamente aquello que lamentas. También eres tus aprendizajes, tus decisiones presentes y tus posibilidades.",

            "Trátate como tratarías a alguien que está intentando aprender sinceramente de una experiencia difícil."
        ],

        // VERGÜENZA
        "Vergüenza": [
            "No necesitas ocultar cada imperfección para merecer cariño y aceptación.",

            "Aquello que hoy te incomoda no tiene por qué convertirse en la definición de tu persona.",

            "Tu historia tiene momentos difíciles, aprendizajes y cualidades que también merecen ser reconocidas.",

            "No existe una versión perfecta de ti que debas alcanzar antes de sentirte suficiente.",

            "Mereces espacios donde puedas mostrarte con autenticidad, sin sentir que tienes que demostrar algo constantemente.",

            "Ser vulnerable no te hace menos valioso. A veces, compartir lo que sentimos abre caminos hacia la comprensión.",

            "Hablarte con crueldad no es la única forma de aprender. La amabilidad también puede acompañar el cambio.",

            "Puedes recordar un momento incómodo sin permitir que decida cuánto vales hoy."
        ],

        // ESTRÉS
        "Estrés": [
            "Tu vida es mucho más que una lista de pendientes. También mereces tiempo para disfrutar, descansar y simplemente existir.",

            "No tienes que resolver todas las tareas al mismo tiempo. Una cosa a la vez también es avanzar.",

            "Descansar no significa abandonar tus metas. Significa reconocer que tú también necesitas cuidado.",

            "Hay días en los que hacer menos es una decisión necesaria y responsable.",

            "Tu valor no se mide por tu productividad. Eres importante incluso cuando decides detenerte.",

            "Puedes organizar tus prioridades sin exigirte tener un día perfecto.",

            "Está bien pedir ayuda, cambiar un plan o reconocer que necesitas una pausa.",

            "No permitas que la urgencia de tantas cosas te haga olvidar que tu bienestar también merece un lugar."
        ],

        // ANGUSTIA
        "Angustia": [
            "No tienes que encontrar una solución para cada preocupación en este instante. Mereces apoyo mientras atraviesas lo que sientes.",

            "Hay momentos difíciles de explicar. No necesitas tener las palabras exactas para pedir compañía.",

            "Puedes darte permiso de ir despacio, reconocer tus necesidades y buscar un lugar donde te sientas escuchado.",

            "Aunque hoy sea difícil encontrar tranquilidad, eso no disminuye el valor de tus esfuerzos por cuidarte.",

            "No tienes que aparentar fortaleza todo el tiempo. También mereces que alguien te acompañe.",

            "Tu bienestar importa incluso cuando no sabes muy bien qué necesitas. Puedes descubrirlo poco a poco.",

            "A veces, lo más importante no es encontrar una respuesta inmediata, sino sentir que puedes hablar con alguien de confianza.",

            "Este momento merece paciencia. No tienes que exigirte sentirte mejor de inmediato."
        ],

        // DESESPERANZA
        "Desesperanza": [
            "Si hoy te cuesta encontrar motivos para sentir esperanza, no tienes que fingir lo contrario. Mereces comprensión y compañía.",

            "No necesitas cargar con todas tus dificultades sin ayuda. Buscar apoyo también es una decisión valiosa.",

            "Que ahora resulte difícil imaginar cambios no significa que debas afrontar este momento completamente solo.",

            "Puedes comenzar por algo muy pequeño: hablar con alguien, descansar o reconocer lo que necesitas.",

            "Tu dolor merece ser tomado en serio. También mereces espacios seguros donde puedas expresarlo.",

            "No tienes que demostrar optimismo para merecer cariño. Puedes ser escuchado exactamente como te sientes hoy.",

            "A veces, el siguiente paso no consiste en encontrar una solución, sino en permitir que alguien te acompañe.",

            "Tu historia importa. Si las cosas se sienten demasiado difíciles, acercarte a una persona de confianza puede ser un comienzo."
        ],

        // VACÍO EMOCIONAL
        "Vacío emocional": [
            "No siempre encontramos palabras para describir lo que sucede dentro de nosotros. Puedes darte tiempo para comprenderte.",

            "No necesitas sentir algo intenso para que tus experiencias tengan valor.",

            "A veces, conectar contigo comienza con observar un color, escuchar un sonido agradable o reconocer una necesidad sencilla.",

            "Está bien si hoy no sabes exactamente cómo te sientes. No tienes que encontrar una respuesta inmediata.",

            "Tu bienestar sigue importando incluso en los momentos en los que las emociones parecen lejanas.",

            "Puedes explorar pequeños momentos que te resulten agradables, sin exigirte una reacción especial.",

            "No todo necesita tener un significado profundo. También existen momentos valiosos en las cosas sencillas.",

            "Mereces paciencia mientras descubres qué cosas te ayudan a sentirte acompañado y conectado contigo."
        ],

        // INSEGURIDAD
        "Inseguridad": [
            "No necesitas compararte con nadie para reconocer las cualidades que te hacen especial.",

            "Tus dudas forman parte de tu experiencia, pero no tienen que convertirse en una medida de tu valor.",

            "Puedes aprender algo nuevo sin exigirte dominarlo desde el primer intento.",

            "Hay capacidades que descubrimos poco a poco, cuando nos permitimos explorar sin juzgarnos.",

            "No tienes que ser la persona más segura del lugar para merecer oportunidades y respeto.",

            "La confianza también puede construirse con pequeñas decisiones y experiencias cotidianas.",

            "Tu camino no necesita avanzar a la misma velocidad que el de otras personas.",

            "Mereces reconocer tus fortalezas sin minimizar lo que has aprendido y conseguido."
        ],

        // AGOBIO
        "Agobio": [
            "No tienes que cargar con todas las responsabilidades al mismo tiempo. Puedes comenzar por lo que sea posible hoy.",

            "Una montaña se recorre paso a paso. Está bien descansar antes de continuar.",

            "Cuando todo parece demasiado, elegir una sola tarea puede ayudarte a encontrar un punto de partida.",

            "No tienes que hacerlo todo solo. Compartir una preocupación también puede ser una forma de cuidarte.",

            "Está bien reconocer tus límites y modificar tus planes cuando lo necesitas.",

            "Tu bienestar merece un espacio entre las responsabilidades de cada día.",

            "A veces, el acto más amable contigo es dejar algo pendiente para poder descansar.",

            "No necesitas resolver toda tu vida hoy. Puedes concentrarte en aquello que tienes delante, poco a poco."
        ]
    };


    // ======================================
    // 2. FRASES GENERALES DE APOYO
    // ======================================

    const mensajesGenerales = [

        "No todos los avances hacen ruido. Algunos suceden en silencio, cuando decides dedicarte un momento de cuidado.",

        "Mereces hablarte con la misma ternura con la que acompañarías a alguien que amas.",

        "Tu historia sigue escribiéndose. No necesitas conocer todos sus capítulos para valorar el momento que estás viviendo.",

        "Hay belleza en los pequeños gestos: una pausa, una conversación sincera, una decisión tomada con cariño.",

        "No tienes que convertir cada día en una gran victoria. También hay valor en los momentos sencillos.",

        "Puedes cambiar de opinión, aprender, descansar y volver a comenzar. Tu camino no tiene que ser perfecto.",

        "Lo que sientes merece ser escuchado. Lo que necesitas también merece importancia.",

        "Hoy te regalaste unos minutos. Ojalá puedas reconocer ese gesto como una manera de acompañarte."
    ];


    // ======================================
    // 3. PREGUNTAS DE REFLEXIÓN
    // ======================================

    const reflexiones = {

        "Ansiedad": [
            "¿Qué pequeño detalle de este momento te gustaría recordar?",
            "¿Qué preocupación podrías dejar para más adelante?",
            "¿Qué gesto sencillo podría ayudarte a cuidarte hoy?"
        ],

        "Tristeza": [
            "¿Qué palabras bonitas te gustaría escuchar hoy?",
            "¿Qué pequeño gesto de cariño podrías regalarte?",
            "¿Con quién te gustaría compartir cómo te sientes?"
        ],

        "Miedo": [
            "¿Qué podría ayudarte a sentir mayor seguridad?",
            "¿Qué paso pequeño te gustaría intentar?",
            "¿A quién podrías acudir si necesitas compañía?"
        ],

        "Soledad": [
            "¿Hay alguien con quien te gustaría conversar?",
            "¿Qué tipo de compañía te hace sentir comprendido?",
            "¿Qué momento compartido recuerdas con cariño?"
        ],

        "Enojo": [
            "¿Qué necesidad puede haber detrás de tu enojo?",
            "¿Cómo podrías expresar lo que sientes con respeto?",
            "¿Qué te ayudaría a hacer una pausa antes de actuar?"
        ],

        "Frustración": [
            "¿Qué aprendizaje puedes reconocer en esta experiencia?",
            "¿Qué parte de tu esfuerzo merece reconocimiento?",
            "¿Qué podrías intentar de una manera diferente?"
        ],

        "Culpa": [
            "¿Qué aprendizaje te gustaría llevarte de lo ocurrido?",
            "¿Hay algo que puedas reparar o conversar?",
            "¿Cómo podrías tratarte con responsabilidad y comprensión?"
        ],

        "Vergüenza": [
            "¿Qué le dirías a un amigo que se sintiera igual?",
            "¿Qué cualidad tuya te gustaría reconocer?",
            "¿Qué podrías recordarte cuando aparezca la vergüenza?"
        ],

        "Estrés": [
            "¿Qué tarea puede esperar un poco?",
            "¿Qué necesitas para descansar mejor?",
            "¿Qué podrías hacer hoy sin exigirte demasiado?"
        ],

        "Angustia": [
            "¿Qué podría ayudarte a sentirte acompañado?",
            "¿Hay alguien con quien quisieras hablar?",
            "¿Qué necesitas en este momento?"
        ],

        "Desesperanza": [
            "¿Con quién podrías compartir lo que estás viviendo?",
            "¿Qué tipo de ayuda te gustaría recibir?",
            "¿Qué pequeño gesto de cuidado podría ser posible hoy?"
        ],

        "Vacío emocional": [
            "¿Qué actividad sencilla te gustaría explorar?",
            "¿Qué sensación agradable recuerdas?",
            "¿Qué necesitas, aunque todavía no sepas cómo expresarlo?"
        ],

        "Inseguridad": [
            "¿Qué capacidad tuya te gustaría reconocer?",
            "¿Qué has aprendido recientemente?",
            "¿Qué intentarías si pudieras tratarte con más comprensión?"
        ],

        "Agobio": [
            "¿Cuál es la primera tarea pequeña que podrías elegir?",
            "¿Qué responsabilidad podrías compartir?",
            "¿Qué podrías dejar pendiente para descansar?"
        ]
    };


    const reflexionesGenerales = [

        "¿Qué te gustaría recordar de este momento?",

        "¿Qué has descubierto sobre ti hoy?",

        "¿Qué gesto de cariño te gustaría regalarte?"
    ];


    // ======================================
    // 4. MENSAJES SIN REPETICIONES
    // ======================================

    const bolsas = new Map();

    const ultimasOpciones = new Map();


    function seleccionarSinRepetir(clave, opciones) {

        if (!Array.isArray(opciones) || opciones.length === 0) {
            return "";
        }

        let bolsa = bolsas.get(clave);

        // Si se agotaron, crear un nuevo ciclo
        if (!bolsa || bolsa.length === 0) {

            bolsa = [...opciones];

            // Mezclar aleatoriamente
            for (let i = bolsa.length - 1; i > 0; i--) {

                const j = Math.floor(
                    Math.random() * (i + 1)
                );

                [bolsa[i], bolsa[j]] = [
                    bolsa[j],
                    bolsa[i]
                ];
            }

            // Evitar repetir la última frase
            const ultima = ultimasOpciones.get(clave);

            if (
                bolsa.length > 1 &&
                bolsa[bolsa.length - 1] === ultima
            ) {

                [bolsa[0], bolsa[bolsa.length - 1]] = [
                    bolsa[bolsa.length - 1],
                    bolsa[0]
                ];
            }

            bolsas.set(clave, bolsa);
        }

        const elegida = bolsa.pop();

        ultimasOpciones.set(clave, elegida);

        return elegida;
    }


    // ======================================
    // 5. MOSTRAR MENSAJE FINAL
    // ======================================

    function mostrarMensajeFinal(emocionSeleccionada) {

        // Detectar emoción desde el HTML
        const emocion =
            emocionSeleccionada ||
            document.body.dataset.emocion ||
            "";

        // Obtener los elementos del cierre
        const fraseFinal =
            document.getElementById("frase-final");

        const preguntaReflexion =
            document.getElementById("pregunta-reflexion");

        // Seleccionar banco correspondiente
        const frasesPropias = mensajes[emocion] || [];

        let frase = "";

        // 80% mensajes según emoción
        // 20% mensajes generales
        const usarPersonalizadas =
            frasesPropias.length > 0 &&
            Math.random() < 0.80;

        if (usarPersonalizadas) {

            frase = seleccionarSinRepetir(
                "frases-" + emocion,
                frasesPropias
            );

        } else {

            frase = seleccionarSinRepetir(
                "frases-generales",
                mensajesGenerales
            );
        }

        // Seleccionar pregunta de reflexión
        const preguntas =
            reflexiones[emocion] ||
            reflexionesGenerales;

        const pregunta = seleccionarSinRepetir(
            "preguntas-" + emocion,
            preguntas
        );

        // Escribir frase en pantalla
        if (fraseFinal) {

            fraseFinal.textContent =
                "“" + frase + "”";
        }

        // Escribir pregunta en pantalla
        if (preguntaReflexion) {

            preguntaReflexion.textContent =
                pregunta;
        }

        return {
            emocion: emocion,
            frase: frase,
            pregunta: pregunta
        };
    }


    // ======================================
    // 6. COMPARTIR CON EL MOTOR INTERACTIVO
    // ======================================

    window.mostrarCierreContigo = mostrarMensajeFinal;

    console.log(
        "CONTIGO: Banco de frases y reflexiones cargado."
    );

})();
