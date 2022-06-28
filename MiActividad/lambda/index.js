const Alexa = require('ask-sdk-core');
const MisHandlers = require('./handlers')
const util = require('./util');
const interceptors = require('./interceptors');



exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        MisHandlers.ClasificacionIntentHandler,
        MisHandlers.ResumenActividadIntentHandler,
        MisHandlers.LaunchRequestHandler,
        MisHandlers.ActividadIntentHandler,
        MisHandlers.HelpIntentHandler,
        MisHandlers.CancelAndStopIntentHandler,
        MisHandlers.FallbackIntentHandler)
    .addRequestInterceptors(
        interceptors.LoadAttributesRequestInterceptor)
    .addResponseInterceptors(
        interceptors.SaveAttributesResponseInterceptor)
    .withPersistenceAdapter(util.getPersistenceAdapter())
    .addErrorHandlers(
        MisHandlers.ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();