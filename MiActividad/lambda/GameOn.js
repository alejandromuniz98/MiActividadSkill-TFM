const sdk = require('@alexa-games/skills-gameon-sdk');
const constants = require('./constants');

//Conexión con el sdk de GameOn
const defaultClient = new sdk.SkillsGameOnApiClient();

//Creación de jugador
async function newPlayer() {
    let player = await defaultClient.initializeNewPlayer({
        gameApiKey: constants.GameOn.gameApiKey,
        appBuildType: constants.GameOn.appBuildType
    });
    return player
}

//Entrar en los 3 torneos
async function enterTournament(player) {
    await defaultClient.enterTournamentForPlayer({
        tournamentId: constants.GameOn.tournamentIdPasos,
        player: player
    });
    await defaultClient.enterTournamentForPlayer({
        tournamentId: constants.GameOn.tournamentIdCalorias,
        player: player
    });
    await defaultClient.enterTournamentForPlayer({
        tournamentId: constants.GameOn.tournamentIdDistancia,
        player: player
    });
}

//Entrar en los 3 partidos
async function enterMatch(player) {
    await defaultClient.enterMatchForPlayer({
        matchId: constants.GameOn.matchIdPasos,
        player: player
    });
    await defaultClient.enterMatchForPlayer({
        matchId: constants.GameOn.matchIdCalorias,
        player: player
    });
    await defaultClient.enterMatchForPlayer({
        matchId: constants.GameOn.matchIdDistancia,
        player: player
    });
}

//Obtener los datos del jugador en GameOn
async function refreshPlayerSession(player) {
        player = await defaultClient.refreshPlayerSession({
        gameApiKey: constants.GameOn.gameApiKey,
        appBuildType: constants.GameOn.appBuildType,
        player: player
    });
    return player;
}

//Subir una puntuación de un jugador a un partido
async function submitScoreForPlayer(player,puntuacion,partido) {
    try{
    await defaultClient.submitScoreForPlayer({
        matchId: partido,
        submitScoreRequest: { score: puntuacion },
        player: player,
        ensureMatchEntered: true
    });
    }catch (Exception){console.log(Exception)}
}

//Obtener la puntuación de un jugador en un partido
async function getPlayerScore(player,partido) {
    return await defaultClient.getPlayerScore(
        partido,
        player);
}

//Obtener la clasificación de un partido
async function getMatchLeaderboardForPlayer(player,partido) {
    return await defaultClient.getMatchLeaderboardForPlayer({
        matchId: partido,
        player: player,
        currentPlayerNeighbors: 15});
}



module.exports = {
    newPlayer,
    enterMatch,
    enterTournament,
    submitScoreForPlayer,
    refreshPlayerSession,
    getPlayerScore,
    getMatchLeaderboardForPlayer
}