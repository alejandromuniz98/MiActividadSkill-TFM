module.exports = {
    //URL de acceso a la API
    URL:"https://alejandro:TFMsmsung2022_@www.it.uniovi.es/hosesbackend/reloj.php?idDispositivo=8b9eba4397c4df00",
    
    //Documentos APL para mostrarselos visualmente al usuario
    APL: {
        launchDoc: require('./APL/launchScreen.json'),
        miActividadDoc: require('./APL/MiActividadScreen.json'),
        clasificacionDoc: require('./APL/ClasificacionScreen.json'),
        ActividadDoc: require('./APL/ActividadScreen.json')
    },
    
    //Constantes de GameOn
    GameOn: {
        gameApiKey : "8ced4596-914d-488b-a26e-f0e9c0b82b5a",
        appBuildType: "development",
        tournamentIdPasos:"285f44d6-d03c-4953-854a-057d9a7f570e",
        tournamentIdCalorias:"32373409-f2c6-491c-b411-1af8f72f7dce",
        tournamentIdDistancia:"0c53f755-bdc7-400f-9f6f-d20ae2c20120",
        matchIdPasos: "5b01ecb3-e34b-4101-bc9d-1caa79499880",
        matchIdCalorias: "6f27de11-2a14-4098-a0e7-e2cb666e2886",
        matchIdDistancia: "bac11140-0ddf-4fee-a34b-63bf20bef43d",
    },
    
    //Nombre de los usuarios que participan en los torneos
    Usuarios:{
        	player9633:"Alberto",
        	player7335:"Elena",
        	player8634:"David",
        	player6979:"Marcos",
        	player6517:"María",
        	player7737:"Miguel",
        	player4259:"Fran",
        	player4303:"Ana",
        	player7678:"Alex",
        	player6830:"Javier"
    },
    
    //Imágenes para usar en los APL
    Images:{
        Medalla:"https://cdn-icons-png.flaticon.com/512/744/744984.png",
        Pasos:"https://cdn-icons-png.flaticon.com/512/566/566499.png",
        Pulsaciones:"https://cdn-icons-png.flaticon.com/512/4349/4349145.png",
        Calorias:"https://cdn-icons-png.flaticon.com/512/4812/4812918.png",
        Distancia:"https://cdn-icons-png.flaticon.com/512/2937/2937036.png"
    }
    
}