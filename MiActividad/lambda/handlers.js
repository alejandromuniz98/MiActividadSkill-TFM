const Alexa = require('ask-sdk-core');
const util = require('./util');
const constants = require('./constants');
const logic = require('./logic');
const gameon= require('./GameOn');
const AWS = require("aws-sdk");
const axios = require('axios');
var moment = require('moment-timezone')


//Handler para iniciar la aplicación
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        //Definimos lo que va a decir Alexa
        const speakOutput = 'Bienvenido a mi actividad. Desde aqui podrás consultar los datos que ha recogido tu reloj. ¿Qué quieres que haga?. Si no sabes que hacer puedes pedirme ayuda.';
        
        //Construimos el APL que se va a mostrar
        const {Viewport} = handlerInput.requestEnvelope.context;
        const resolution = Viewport.pixelWidth + 'x' + Viewport.pixelHeight;
        handlerInput.responseBuilder.addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
                version: '1.1',
                document: constants.APL.launchDoc
        });
        
        //GameOn. Cargamos los datos del jugador de los sessionAttributesAttributes
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let player = sessionAttributes['player'];
        
        //Variable fecha para conseguir los datos obtenidos por el reloj hasta ayer
        var FechaActual= moment().tz("Europe/Madrid")
        let ActualDate= new Date(FechaActual)
        ActualDate.setHours(0,0,0,0)
        ActualDate= ActualDate.toISOString()

        //Si el usuario no esta guardado, lo creamos, lo registramos en los torneos y subimos las primeras puntuaciones
        if (typeof player === 'undefined') {
            player = await gameon.newPlayer();
            await gameon.enterTournament(player);
            await gameon.enterMatch(player);
            await gameon.submitScoreForPlayer(player,0,constants.GameOn.matchIdPasos)
            await gameon.submitScoreForPlayer(player,0,constants.GameOn.matchIdCalorias)
            await gameon.submitScoreForPlayer(player,0,constants.GameOn.matchIdDistancia)
        } 
        else {
            //Si el usuario esta guardado lo refrescamos
            player = await gameon.refreshPlayerSession(player);
            
            //Obtenemos la fecha de ultima actualizacion
            let lastUpdate = sessionAttributes['lastUpdate'];
            
            //Obtenemos los datos desde la ultima actualizacion hasta ayer
            const response= await logic.getActivityDataInTime(lastUpdate,ActualDate);
            const pendingData = logic.getSumData(response);
            
            //Guardamos las puntuaciones actuales
            const ActualputuacionPasos=await gameon.getPlayerScore(player,constants.GameOn.matchIdPasos)
            const ActualpuntuacionCalorias=await gameon.getPlayerScore(player,constants.GameOn.matchIdCalorias)
            const ActualpuntuacionDistancia=await gameon.getPlayerScore(player,constants.GameOn.matchIdDistancia)
            
            //Sumamos las puntuaciones actuales y las nuevas recogidas
            const putuacionPasos=ActualputuacionPasos.score + parseInt(pendingData.pasos)
            const puntuacionCalorias=ActualpuntuacionCalorias.score + parseInt(pendingData.calorias)
            const puntuacionDistancia=ActualpuntuacionDistancia.score + parseInt(pendingData.distancia)
            
            //Subimos las nuevas puntaciones
            await gameon.submitScoreForPlayer(player,putuacionPasos,constants.GameOn.matchIdPasos)
            await gameon.submitScoreForPlayer(player,puntuacionCalorias,constants.GameOn.matchIdCalorias)
            await gameon.submitScoreForPlayer(player,puntuacionDistancia,constants.GameOn.matchIdDistancia)
            
        }
        //Guardamos ayer como fecha de la ultima actualización
        sessionAttributes['lastUpdate']=ActualDate;
        sessionAttributes['player']=player;
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    }
};

//Handler para informar al usuario de los últimos datos recogidos
const ResumenActividadIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ResumenActividadIntent';
    },
    async handle(handlerInput) {
        let speakOutput = '';

        //Nos comunicamos con la API para obtener los datos
        const response= await logic.getActivityData();
        const lastestData = logic.getLastestData(response);
        const latestPasos=lastestData.pasos;
        const latestDistancia=lastestData.distancia;
        const latestCalorias=lastestData.calorias;
        const latestFecha=lastestData.fecha;
        
        //Transformamos el formato de la fecha para que sea entendible en el speakOutput
        const fechaformat=latestFecha[5]+latestFecha[6]+latestFecha[8]+latestFecha[9]
        
        //Obtenemos la media de las pulsaciones diarias
        const latestDailyPulsaciones=logic.getlatestDailyPulsaciones(response)
        let ActivityItems=''
        
        //Si no conseguimos obtener la media de las pulsaciones no las mostramos, en caso contrario si
        if(latestDailyPulsaciones===0){
            speakOutput = "¡Enhorabuena!. Los últimos datos registrados son del "+"<say-as interpret-as='date'>????"+fechaformat+"</say-as>"+
            ", en donde has hecho "+latestPasos+ " pasos, que te ha servido para recorrer "+latestDistancia/1000+" kilómetros."+
            " También has quemado "+latestCalorias+" calorías"
            
            ActivityItems=[
                    {
                        "secondaryText": "Pasos: "+latestPasos,
                        "imageSource": constants.Images.Pasos
                    },
                    {
                        "secondaryText": "Calorías: "+latestCalorias,
                        "imageSource": constants.Images.Calorias
                    },
                    {
                        "secondaryText": "Kilómetros: "+latestDistancia/1000,
                        "imageSource": constants.Images.Distancia
                    },
                    ]
        }else{
            speakOutput = "¡Enhorabuena!. Los últimos datos registrados son del "+"<say-as interpret-as='date'>????"+fechaformat+"</say-as>"+
            ", en donde has hecho "+latestPasos+ " pasos, que te ha servido para recorrer "+latestDistancia+" metros."+
            " También has quemado "+latestCalorias+" calorías y tus pulsaciones por minuto de media han sido de "+latestDailyPulsaciones;
            
            ActivityItems=[
                    {
                        "secondaryText": "Pasos: "+latestPasos,
                        "imageSource": constants.Images.Pasos
                    },
                    {
                        "secondaryText": "Calorías: "+latestCalorias,
                        "imageSource": constants.Images.Calorias
                    },
                    {
                        "secondaryText": "Kilómetros: "+latestDistancia/1000,
                        "imageSource": constants.Images.Distancia
                    },
                    {
                        "secondaryText": "Pulsaciones: "+latestDailyPulsaciones,
                        "imageSource": constants.Images.Pulsaciones
                    }
                    ]
        }
        
        //Si no tenemos no se ha recogido ni pasos, ni calorias, ni distancia, cambiamos el speakOutput
        if(parseInt(latestPasos, 10)===0 && parseInt(latestCalorias, 10)===0 && parseInt(latestDistancia, 10)===0){
            speakOutput="¡Vaya!. Hoy no he registrado ningún dato. Prueba a caminar un rato con el reloj puesto."
        } 
        
        //Generamos el APL con los datos obtenidos anteriormente para mostrarselo al usuario en la pantalla
        const {Viewport} = handlerInput.requestEnvelope.context;
        const resolution = Viewport.pixelWidth + 'x' + Viewport.pixelHeight;
        handlerInput.responseBuilder.addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
                version: '1.5',
                document: constants.APL.miActividadDoc,
                datasources: {
                    "DataList":{
                    "items": ActivityItems
                }
            }
        });
        
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

//Handler para consultar la clasificación de los torneos
const ClasificacionIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ClasificacionIntent';
    },
    async handle(handlerInput) {
        let speakOutput = '';
        
        //Cargamos los datos del jugador en una variable local
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let player = sessionAttributes['player'];
        
        const {requestEnvelope, responseBuilder} = handlerInput;
        const {intent} = requestEnvelope.request;
        
        //Obtenemos el tipo de torneo que el usuario ha dicho a través del Slot
        const RankingActividad = Alexa.getSlotValue(requestEnvelope, 'RankingActividad');
        let partido=""
        
        if(RankingActividad.toLowerCase()==='distancia'){
            partido=constants.GameOn.matchIdDistancia
        }
        if(RankingActividad.toLowerCase()==='pasos'){
            partido=constants.GameOn.matchIdPasos
        }
        if(RankingActividad.toLowerCase()==='calorias' ||RankingActividad.toLowerCase()==='calorías' ){
            partido=constants.GameOn.matchIdCalorias
        }
        
        //Consultamos la putuación y la posición del usuario en el partido
        const playerScore = await gameon.getPlayerScore(player,partido);
        speakOutput+="Ahora mismo vas en "+playerScore.rank+"ª posición.";
        
        //Obtenemos la clasificación del partido
        const leaderBoard = await gameon.getMatchLeaderboardForPlayer(player,partido);
        
        //Mostramos la clasificación actual del torneo en el APL. Mostraremos 4 jugadores
        let listItems;
        //Si el usuario esta en entre los 4 primeros, le mostraremos al usuario el top 4        
        if(playerScore.rank<=4){
             listItems=[{
                        "primaryText": leaderBoard.neighbors[0].rank +". "+constants.Usuarios[leaderBoard.neighbors[0].playerName]+" (" + leaderBoard.neighbors[0].playerName+")",
                        "secondaryText": leaderBoard.neighbors[0].score,
                        "imageThumbnailSource":constants.Images.Medalla,
                    },
                    {
                        "primaryText": leaderBoard.neighbors[1].rank +". "+constants.Usuarios[leaderBoard.neighbors[1].playerName]+" (" + leaderBoard.neighbors[1].playerName+")",
                        "secondaryText": leaderBoard.neighbors[1].score,
                    },
                    {
                        "primaryText": leaderBoard.neighbors[2].rank +". "+constants.Usuarios[leaderBoard.neighbors[2].playerName]+" (" + leaderBoard.neighbors[2].playerName+")",
                        "secondaryText": leaderBoard.neighbors[2].score,
                    },
                       {
                        "primaryText": leaderBoard.neighbors[3].rank +". "+constants.Usuarios[leaderBoard.neighbors[3].playerName]+" (" + leaderBoard.neighbors[3].playerName+")",
                        "secondaryText": leaderBoard.neighbors[3].score,
                    },
                ]
        }else{//Si el usuario no esta entre los 4 primeros, mostraremos el top 3 y luego la posición del usuario
            listItems=[{
                        "primaryText": leaderBoard.neighbors[0].rank +". "+constants.Usuarios[leaderBoard.neighbors[0].playerName]+" (" + leaderBoard.neighbors[0].playerName+")",
                        "secondaryText": leaderBoard.neighbors[0].score,
                        "imageThumbnailSource": constants.Images.Medalla
                    },
                    {
                        "primaryText": leaderBoard.neighbors[1].rank +". "+constants.Usuarios[leaderBoard.neighbors[1].playerName]+" (" + leaderBoard.neighbors[1].playerName+")",
                        "secondaryText": leaderBoard.neighbors[1].score,
                    },
                    {
                        "primaryText": leaderBoard.neighbors[2].rank +". "+constants.Usuarios[leaderBoard.neighbors[2].playerName]+" (" + leaderBoard.neighbors[2].playerName+")",
                        "secondaryText": leaderBoard.neighbors[2].score,
                    },
                    {
                        "primaryText": leaderBoard.currentPlayer.rank +". "+constants.Usuarios[leaderBoard.currentPlayer.playerName]+" (" + leaderBoard.currentPlayer.playerName+")",
                        "secondaryText": leaderBoard.currentPlayer.score
                    },
                ] 
        }
  
        //Generamos el APL
        const {Viewport} = handlerInput.requestEnvelope.context;
        const resolution = Viewport.pixelWidth + 'x' + Viewport.pixelHeight;
        handlerInput.responseBuilder.addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
                version: '1.5',
                document: constants.APL.clasificacionDoc,
                datasources: {
                    "textListData": {
                    "type": "object",
                    "listItems":listItems
                }
            }
        });

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

//Handler para consultar un dato recogido durante un periodo de tiempo.
const ActividadIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ActividadIntent';
    },
    async handle(handlerInput) {
        const {requestEnvelope, responseBuilder} = handlerInput;
        const {intent} = requestEnvelope.request;
        let speakOutput=''

        //Obtenemos el tipo de actividad y el tiempo (ISO8601) a través de los Slots
        const TipoActividad = Alexa.getSlotValue(requestEnvelope, 'TipoActividad');
        const Tiempo = Alexa.getSlotValue(requestEnvelope, 'Tiempo');
        
        //Obtenemos la fecha de inicio y de fin de la peticion en un formato adecuado
        const FechaFinTime= moment().tz("Europe/Madrid").add(1,'days')
        const FechaFin=FechaFinTime.format()
        const Duracion= moment.duration(Tiempo)
        let FechaInicioTime=moment().tz("Europe/Madrid").subtract(Duracion.years(),'years')
        FechaInicioTime=FechaInicioTime.subtract(Duracion.months(),'months')
        FechaInicioTime=FechaInicioTime.subtract(Duracion.days(),'days')
        const FechaInicio=FechaInicioTime.format()

        //Petición al servidor para obtener los datos filtrados en el tiempo
        try{
            const response= await logic.getActivityDataInTime(FechaInicio,FechaFin);
            const Data = logic.getDataResume(response);
        
            let valor='';
            let image='';
        
            if(TipoActividad.toLowerCase()==='distancia' || TipoActividad.toLowerCase()==='kilometros' || TipoActividad.toLowerCase()==='kilómetros'){
                valor='Distancia: '+Data.distancia+' metros'
                image=constants.Images.Distancia
                speakOutput='Has hecho '+Data.distancia+' metros en '+logic.TransformDateSpeak(Tiempo)
            }
            if(TipoActividad.toLowerCase()==='pasos'){
                valor='Pasos: '+Data.pasos
                image=constants.Images.Pasos
                speakOutput='Has hecho '+Data.pasos+' pasos en '+logic.TransformDateSpeak(Tiempo)
            }
            if(TipoActividad.toLowerCase()==='pulsaciones' || TipoActividad.toLowerCase()==='ritmo cardiaco' || TipoActividad.toLowerCase()==='ritmo cardíaco'){
                valor='Pulsaciones: '+Data.pulsaciones
                image=constants.Images.Pulsaciones
                speakOutput='Has tenido '+Data.pulsaciones+' pulsaciones por minuto de media en '+logic.TransformDateSpeak(Tiempo)
            }
            if(TipoActividad.toLowerCase()==='calorias' || TipoActividad.toLowerCase()==='calorías' ){
                valor='Calorías: '+Data.calorias
                image=constants.Images.Calorias
                speakOutput='Has quemado '+Data.calorias+' calorías en '+logic.TransformDateSpeak(Tiempo)
            }
        
            //Generamos el APL
            const {Viewport} = handlerInput.requestEnvelope.context;
            const resolution = Viewport.pixelWidth + 'x' + Viewport.pixelHeight;
            handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.5',
                    document: constants.APL.ActividadDoc,
                    datasources: {
                    "Data": {
                        "primaryText": valor,
                        "imageSource": image
                    }
                }
            });
        }catch (Exception){speakOutput="Vaya. No tengo datos registrados para lo que me has pedido"}
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Handler de ayuda
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Esta es la aplicación de Mi Actividad. Soy la encargada de guardar tus pulsaciones, tus pasos, tus calorías y la distancia que recorres. '
        +'Puedes probar a decirme. ¿Cuantos pasos he hecho en una semana? o ¿Cuantas calorías he quemado en 3 meses? o si deseas mostrar toda la información di: resumen de mi actividad. '
        +'También puedo recopilar esta misma informacion de otros dispositivos alexa para hacer un ranking y ver quien es la persona más deportista. '+
        'Para ello prueba a decir ranking o clasificación. ¿Qué quieres hacer?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    }
};

//Handler para parar o cancelar
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = '¡Nos vemos!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

//Handler para cuando no se ha entendido algo
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Lo siento, no te he entendio. Por favor, repítelo otra vez';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt()
            .getResponse();
    }
};

//Handler de error.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Lo siento, he tenido un problema con lo que me has preguntado. Por favor, repítelo otra vez';
        console.log('~~~~ Error handled: '+error);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};



module.exports = {
    LaunchRequestHandler,
    ResumenActividadIntentHandler,
    ClasificacionIntentHandler,
    ActividadIntentHandler,
    
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    ErrorHandler,
    
}

