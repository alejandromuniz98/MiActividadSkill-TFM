const moment = require('moment-timezone'); // will help us do all the dates math while considering the timezone
const util = require('./util');
const axios = require('axios');
const constants = require('./constants');

module.exports = {

    //Método que hace una peticion GET al servidor
    getActivityData(){
        const url = constants.URL;

        async function getJsonResponse(url){
            const res = await axios.get(url);
            return res.data;
        }

        return getJsonResponse(url).then((result) => {
            return result;
        }).catch((error) => {
            return null;
        });
    },
    
    
    //Método que devuelve la última medicion del servidor
    getLastestData(response){
        let lastData;
        if (!response || !Object.keys(response).length > 0){
            return lastData;
        }
        lastData=response[response.length-1];
        return lastData;
    },
    
    //Metodo para sumar los datos de varios días
    getSumData(response){
        let SumDistancia=0
        let SumPasos=0
        let SumCalorias=0
        let FechaDiaria=0
        try{
        response.slice().reverse().forEach(element => {
            let FechaActual= new Date(element.fecha)
            FechaActual.setHours(0,0,0,0)
            if(FechaDiaria===0 || FechaDiaria.getTime()>FechaActual.getTime()){
                FechaDiaria=new Date(element.fecha)
                FechaDiaria.setHours(0,0,0,0)
                SumDistancia+=parseInt(element.distancia, 10)
                SumPasos+=parseInt(element.pasos, 10)
                SumCalorias+=parseInt(element.calorias, 10)
            }
         })
        }catch (Exception){console.log(Exception)}
        const NewResponse={
            distancia:SumDistancia,
            pasos:SumPasos,
            calorias:SumCalorias,
        }
        return NewResponse
    },
    
    //Método que devuelve las últimas pulsaciones diarias
    getlatestDailyPulsaciones(response){
        if (!response || !Object.keys(response).length > 0){
            return 0;
        }
        let SumPulsaciones=0
        let NumPulsaciones=0
        const lastDate=response[response.length-1].fecha;
        const lastDateFormat=new Date(lastDate)
        for(var i=response.length-1; i=>0; i--){
            const lastDateActual=response[i].fecha;
            const lastDateActualFormat=new Date(lastDateActual)
            if(lastDateActualFormat.getDate()===lastDateFormat.getDate()){
                if(parseInt(response[i].pulsaciones, 10)!==0){
                    SumPulsaciones+=parseInt(response[i].pulsaciones, 10)     
                    NumPulsaciones++
                }
            }
            else{
                break
            }
        }
        
        if(SumPulsaciones!==0){
            return Math.round(SumPulsaciones/NumPulsaciones)
        }
        return 0;
    },
    
    //Metodo para transformar una fecha en formato ISO8601 en string para usarlo en el speak
    TransformDateSpeak(date){
        let result=''
        for (var i = 1; i < date.length; i++) {
            if(date[i]==="T"){break}
            if(date[i]==="Y"){
                if(date[i-1]==="1" && parseInt(date[i-2]).toString()==="NaN"){result+=" año"}
                else{result+=" años "}
            }
            else if(date[i]==="M"){
                if(date[i-1]==="1"  && parseInt(date[i-2]).toString()==="NaN"){result+=" mes "}
                else{result+=" meses "}
            }
            else if(date[i]==="W"){
                if(date[i-1]==="1"  && parseInt(date[i-2]).toString()==="NaN"){result+=" semana "}
                else{result+=" semanas "}
            }
            else if(date[i]==="D"){
                if(date[i-1]==="1" && parseInt(date[i-2]).toString()==="NaN"){result+=" día "}
                else{result+=" días "}
            }
            else{result+=date[i]}
        }
            
        return result
    },
    
    //Método para obtener las mediciones filtradas en el tiempo
    getActivityDataInTime(FechaInicio,FechaFin){
        let url = constants.URL+"&fechaInicial="+FechaInicio+"&fechaFinal="+FechaFin
        console.log(url)
        async function getJsonResponse(url){
            const res = await axios.get(url);
            return res.data;
        }

        return getJsonResponse(url).then((result) => {
            return result;
        }).catch((error) => {
            return null;
        });
    },
    
    //Método para obtener un resumen de los datos filtrados en el tiempo
    getDataResume(response){
        let SumDistancia=0
        let SumPasos=0
        let SumCalorias=0
        let SumPulsaciones=0
        let NumPulsaciones=0
        let FechaDiaria=0 
        
        response.slice().reverse().forEach(element => {
            let FechaActual= new Date(element.fecha)
            FechaActual.setHours(0,0,0,0)
            if(FechaDiaria===0 || FechaDiaria.getTime()>FechaActual.getTime()){
                FechaDiaria=new Date(element.fecha)
                FechaDiaria.setHours(0,0,0,0)
                SumDistancia+=parseInt(element.distancia,10)
                SumPasos+=parseInt(element.pasos, 10)
                SumCalorias+=parseInt(element.calorias, 10)
            }

            if(parseInt(element.pulsaciones, 10)!==0){
                SumPulsaciones+=parseInt(element.pulsaciones, 10);
                NumPulsaciones++
            }

        })
        const NewResponse={
            distancia:SumDistancia,
            pasos:SumPasos,
            calorias:SumCalorias,
            pulsaciones:Math.round(SumPulsaciones/NumPulsaciones)
        }
        return NewResponse
    }
    

}